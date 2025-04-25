from flask import Flask,request,jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras # Needed for dictionary cursor
import os
from dotenv import load_dotenv
import uuid
# --- JWT Imports ---
from flask_jwt_extended import create_access_token, jwt_required, JWTManager

load_dotenv()
app=Flask(__name__)

# --- JWT Configuration ---
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY") # Load secret key from .env
if not app.config["JWT_SECRET_KEY"]:
    raise ValueError("No JWT_SECRET_KEY set in environment variables")
jwt = JWTManager(app)

CORS(app)
def get_db_connection():
  try:
      conn=psycopg2.connect(
          dbname=os.getenv("DB_NAME"),
          user=os.getenv("DB_USER"),
          password=os.getenv("DB_PASSWORD"),
          host=os.getenv("DB_HOST"),
          port=os.getenv("DB_PORT")
      )
      return conn
  except Exception as e:
      print(f"Error connecting to database: {e}")
      return None
@app.route('/',methods=['GET'])
def home():
  return "🚖 Taxi Rental API is live!"

# manager rout
# register manager with SSN , Name , Email
@app.route('/api/managers/register', methods=['POST'])
def register_manager():
   data=request.get_json()
   name=data.get('name')
   ssn=data.get('ssn')
   email=data.get('email')


   if not name or not ssn or not email:
     return jsonify({"error": "Missing required fields (name, ssn, email)"}), 400

   conn=get_db_connection()
   if not conn:
     return jsonify({"error": "Database connection Failed"}), 500

   cur= conn.cursor()
   try:
      # Use correct table (MANAGER) and column (SSN, EMAIL) names (case-sensitive match with schema)
      cur.execute("SELECT SSN FROM MANAGER WHERE SSN=%s OR EMAIL=%s", (ssn, email))
      existing_manager=cur.fetchone()
      if existing_manager:
         return jsonify({"error": "Manager with this SSN or Email already exists"}), 409

      # Use correct table (MANAGER) and column (NAME, SSN, EMAIL) names
      cur.execute("INSERT INTO MANAGER (NAME, SSN, EMAIL) VALUES(%s, %s, %s)", (name, ssn, email))
      conn.commit()
      return jsonify({"message": "Manager registered successfully"}), 201
   except Exception as e:
      conn.rollback()
      print(f"Error during manager registration: {e}")
      return jsonify({"error": "Failed to register manager"}), 500
   finally:
      cur.close()
      conn.close()

@app.route('/api/managers/login', methods=['POST'])
def login_manager():
   data=request.get_json()
   ssn=data.get('ssn')
   if not ssn:
      return jsonify({"error": "Missing required field ssn"}), 400

   conn=get_db_connection()
   if not conn:
      return jsonify({"error": "Database connection failed"}), 500

   cur=conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

   try:
      # Use correct table (MANAGER) and column (SSN) names.
      # Select specific columns and alias them to lowercase for frontend compatibility.
      cur.execute("SELECT NAME AS name, SSN AS ssn, EMAIL AS email FROM MANAGER WHERE SSN=%s", (ssn,))
      manager=cur.fetchone()
      if manager:
        # The keys in manager_dict will now be lowercase ('name', 'ssn', 'email') due to aliasing
        manager_dict=dict(manager)
        # --- Generate JWT Token --- Use SSN as the identity
        access_token = create_access_token(identity=ssn)
        # --- Return token along with success message and manager info ---
        return jsonify(access_token=access_token, manager=manager_dict, message="Login successful"), 200
      else:
         return jsonify({"error": "Invalid ssn"}), 401
   except Exception as e:
      print(f"Error in manager login: {e}")
      return jsonify({"error": "Failed to process login"}), 500
   finally:
      cur.close()
      conn.close()
  ########################################################################
# --- Car Management Routes ---

@app.route('/api/managers/cars', methods=['POST'])
@jwt_required() # Protect this route
def add_car():
    # Authentication check is now handled by @jwt_required()
    # We can get the identity of the logged-in manager if needed:
    # from flask_jwt_extended import get_jwt_identity
    # current_manager_ssn = get_jwt_identity()
    # print(f"Request by manager SSN: {current_manager_ssn}")

    # TODO: Add authentication check to ensure only logged-in managers can access
    data = request.get_json()
    make = data.get('make')
    model = data.get('model')
    year_str = data.get('year') # Year might come as string

    if not make or not model or not year_str:
        return jsonify({"error": "Missing required fields (make, model, year)"}), 400

    try:
        year = int(year_str) # Convert year to integer
    except ValueError:
        return jsonify({"error": "Invalid year format, must be a number"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cur = conn.cursor()
    try:

        while True:
            car_id = uuid.uuid4().hex[:10].upper() # CARID is VARCHAR(10)
            cur.execute("SELECT CARID FROM CAR WHERE CARID = %s", (car_id,))
            if not cur.fetchone():
                break # Found a unique ID

        cur.execute(
            "INSERT INTO CAR (CARID, MAKE, MODEL, YEAR) VALUES (%s, %s, %s, %s)",
            (car_id, make, model, year)
        )
        # Note: This doesn't handle the MODEL table yet based on schema complexity
        conn.commit()
        return jsonify({"message": "Car added successfully", "carId": car_id}), 201

    except Exception as e:
        conn.rollback()
        print(f"Error adding car: {e}")
        # Check for specific errors, e.g., foreign key constraints if they exist
        return jsonify({"error": f"Failed to add car: {e}"}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/managers/cars/remove', methods=['POST'])
@jwt_required() # Protect this route
def remove_car():
    # Authentication check handled by @jwt_required()
    data = request.get_json()
    make = data.get('make')
    model = data.get('model')
    year_str = data.get('year')

    if not make or not model or not year_str:
        return jsonify({"error": "Missing required fields (make, model, year)"}), 400

    try:
        year = int(year_str)
    except ValueError:
        return jsonify({"error": "Invalid year format"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cur = conn.cursor()
    try:
        # Find the CARID of the first car matching the criteria
        cur.execute(
            "SELECT CARID FROM CAR WHERE MAKE = %s AND MODEL = %s AND YEAR = %s LIMIT 1",
            (make, model, year)
        )
        car_to_delete = cur.fetchone()

        if not car_to_delete:
            return jsonify({"error": "No car found matching the criteria"}), 404 # Not Found

        car_id_to_delete = car_to_delete[0]
        # Check MODEL table
        cur.execute("SELECT 1 FROM MODEL WHERE CARID = %s LIMIT 1", (car_id_to_delete,))
        if cur.fetchone():
            return jsonify({"error": "Cannot remove car: It is referenced in the MODEL table. Remove associated models first."}), 409 # Conflict

        # Check RENT table
        cur.execute("SELECT 1 FROM RENT WHERE CARID = %s LIMIT 1", (car_id_to_delete,))
        if cur.fetchone():
            return jsonify({"error": "Cannot remove car: It is referenced in the RENT table. Remove associated rents first."}), 409 # Conflict

        # Check DRIVES table
        cur.execute("SELECT 1 FROM DRIVES WHERE CARID = %s LIMIT 1", (car_id_to_delete,))
        if cur.fetchone():
            return jsonify({"error": "Cannot remove car: It is referenced in the DRIVES table. Remove associated driver assignments first."}), 409 # Conflict

        # If no constraints found, proceed with deletion
        cur.execute("DELETE FROM CAR WHERE CARID = %s", (car_id_to_delete,))
        conn.commit()

        if cur.rowcount > 0:
            return jsonify({"message": f"Car (CARID: {car_id_to_delete}) removed successfully"}), 200
        else:
            # This case should ideally not happen due to the check above, but as a fallback
            return jsonify({"error": "Car found but failed to remove"}), 500

    except Exception as e:
        conn.rollback()
        print(f"Error removing car: {e}")
        # Check if the error is a foreign key violation (useful for debugging)
        # e.g. if isinstance(e, psycopg2.errors.ForeignKeyViolation): ...
        return jsonify({"error": f"Failed to remove car: {e}"}), 500
    finally:
        cur.close()
        conn.close()

# --- Reports Routes --- (Protected Route)

@app.route('/api/managers/reports/top-clients', methods=['GET'])
@jwt_required()

########################################################################
# --- Driver Management Routes ---
def get_top_k_clients():
    k_str = request.args.get('k') # Get k from query parameters (?k=...) 

    if not k_str:
        return jsonify({"error": "Missing query parameter 'k'"}), 400
    
    try:
        k = int(k_str)
        if k <= 0:
             raise ValueError("k must be positive")
    except ValueError:
        return jsonify({"error": "Invalid value for 'k', must be a positive integer"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    # Use dictionary cursor to get results as dicts
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        # Query to count rents per client, order by count descending, limit by k
        # Joining RENT and CLIENT tables on EMAIL
        query = """
            SELECT c.NAME AS name, c.EMAIL AS email, COUNT(r.RENTID) AS rent_count
            FROM CLIENT c
            JOIN RENT r ON c.EMAIL = r.EMAIL
            GROUP BY c.NAME, c.EMAIL
            ORDER BY rent_count DESC
            LIMIT %s;
        """
        cur.execute(query, (k,))
        top_clients = cur.fetchall()

        # Convert Row objects to simple dictionaries
        clients_list = [dict(client) for client in top_clients]

        return jsonify({"clients": clients_list}), 200

    except Exception as e:
        print(f"Error fetching top clients: {e}")
        return jsonify({"error": f"Failed to fetch top clients: {e}"}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/managers/reports/model-rents', methods=['GET'])
@jwt_required()
def get_model_rent_counts():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        # Query to count rents per car model (Make, Model, Year)
        # Left Join CAR with RENT to include cars that have never been rented (count will be 0)
        query = """
            SELECT 
                c.MAKE AS make, 
                c.MODEL AS model, 
                c.YEAR AS year, 
                COUNT(r.RENTID) AS rent_count
            FROM CAR c
            LEFT JOIN RENT r ON c.CARID = r.CARID
            GROUP BY c.MAKE, c.MODEL, c.YEAR
            ORDER BY c.MAKE, c.MODEL, c.YEAR; 
        """
        cur.execute(query)
        model_counts = cur.fetchall()

        # Convert Row objects to simple dictionaries
        report_list = [dict(model) for model in model_counts]

        return jsonify({"model_rent_report": report_list}), 200

    except Exception as e:
        print(f"Error fetching model rent counts: {e}")
        return jsonify({"error": f"Failed to fetch model rent counts: {e}"}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/managers/drivers', methods=['POST'])
@jwt_required()
def add_driver():
    data = request.get_json()
    name = data.get('name')
    roadname = data.get('roadname')
    number = data.get('number')
    city = data.get('city')
    zipcode = data.get('zipcode') # Optional based on schema, but good practice

    if not name or not roadname or not number or not city:
        # Zipcode might be optional depending on needs, but let's require it here
        return jsonify({"error": "Missing required fields (name, roadname, number, city, zipcode)"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error":"Database connection faild"}), 500 #internal server error

    cur = conn.cursor()
    try:
        # Step 1: Upsert Address (Insert if not exists, do nothing if exists)
        # Use the correct ON CONFLICT clause based on the primary key (ROADNAME, NUMBER, CITY)
        address_upsert_query = """
            INSERT INTO ADDRESS (ROADNAME, NUMBER, CITY, ZIPCODE)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (ROADNAME, NUMBER, CITY) DO NOTHING;
        """
        cur.execute(address_upsert_query, (roadname, number, city, zipcode))

        # Step 2: Insert Driver (Corrected INSERT statement)
        driver_insert_query = """
            INSERT INTO DRIVER (NAME, ROADNAME, NUMBER, CITY)
            VALUES (%s, %s, %s, %s);
        """
        cur.execute(driver_insert_query, (name, roadname, number, city))

        conn.commit()
        return jsonify({"message": "Driver added successfully"}), 201

    except psycopg2.errors.UniqueViolation as e:
        conn.rollback()
        # Check if it's a violation on the DRIVER table (name)
        # Use the clearer error message from previous version
        if 'driver_pkey' in str(e).lower() or 'driver_name_key' in str(e).lower():
             return jsonify({"error": f"Driver with name '{name}' already exists"}), 409
        else:
             print(f"Unique violation error adding driver: {e}")
             return jsonify({"error": f"Failed to add driver due to unique constraint: {e}"}), 409

    except Exception as e:
        conn.rollback()
        # Use the clearer error message from previous version
        print(f"Error adding driver: {e}")
        return jsonify({"error": f"Failed to add driver: {e}"}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/managers/drivers/remove', methods=['POST'])
@jwt_required()
def remove_driver():
    data = request.get_json()
    name = data.get('name')

    if not name:
        return jsonify({"error": "Missing required field (name)"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cur = conn.cursor()
    try:
        # Check if driver exists first (Corrected error message)
        cur.execute("SELECT 1 FROM DRIVER WHERE NAME = %s", (name,))
        if not cur.fetchone():
            return jsonify({"error": f"Driver with name '{name}' not found"}), 404

        # Check Foreign Key constraints before deleting
        # Check RENT table (Corrected SQL syntax)
        cur.execute("SELECT 1 FROM RENT WHERE NAME = %s LIMIT 1", (name,))
        if cur.fetchone():
            return jsonify({"error": "Cannot remove driver: Referenced in RENT table."}), 409

        # Check REVIEW table (Added back the check)
        cur.execute("SELECT 1 FROM REVIEW WHERE NAME = %s LIMIT 1", (name,))
        if cur.fetchone():
            return jsonify({"error": "Cannot remove driver: Referenced in REVIEW table."}), 409

        # Check DRIVES table
        cur.execute("SELECT 1 FROM DRIVES WHERE NAME = %s LIMIT 1", (name,))
        if cur.fetchone():
            return jsonify({"error": "Cannot remove driver: Referenced in DRIVES table."}), 409

        # If no constraints, delete the driver
        cur.execute("DELETE FROM DRIVER WHERE NAME = %s", (name,))
        conn.commit()

        # Use clearer messages
        if cur.rowcount > 0:
            return jsonify({"message": f"Driver '{name}' removed successfully"}), 200
        else:
            return jsonify({"error": f"Driver '{name}' not found (post-check)"}), 404

    except Exception as e:
        conn.rollback()
        # Use clearer messages
        print(f"Error removing driver: {e}")
        return jsonify({"error": f"Failed to remove driver: {e}"}), 500
    finally:
        cur.close()
        conn.close()

########################################################################

if __name__=="__main__":
  app.run(debug=True, port=5000)

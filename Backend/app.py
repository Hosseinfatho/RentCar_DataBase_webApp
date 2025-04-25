from flask import Flask,request,jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras # Needed for dictionary cursor
import os
from dotenv import load_dotenv
import uuid
load_dotenv()
app=Flask(__name__)
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
        return jsonify({"message": "login_success", "manager": manager_dict}), 200
      else:
         return jsonify({"error": "Invalid ssn"}), 401
   except Exception as e:
      print(f"Error in manager login: {e}")
      return jsonify({"error": "Failed to process login"}), 500
   finally:
      cur.close()
      conn.close()
      
# --- Car Management Routes ---

@app.route('/api/managers/cars', methods=['POST'])
def add_car():
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
        # Generate a unique CARID (using first 10 chars of UUID hex)
        # Loop to ensure uniqueness, though collision is highly unlikely
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
def remove_car():
    # TODO: Add authentication check
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

        # --- IMPORTANT: Check for Foreign Key Constraints ---
        # Before deleting from CAR, we MUST check if this CARID is used in MODEL, RENT, or DRIVES tables.
        # Deleting it directly will cause a foreign key violation error if it's referenced.

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

if __name__=="__main__":
  app.run(debug=True, port=5000)

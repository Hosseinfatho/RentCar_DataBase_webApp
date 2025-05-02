from flask import Flask,request,jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras # Needed for dictionary cursor
import os
from dotenv import load_dotenv
import uuid
# --- JWT Imports ---
from flask_jwt_extended import create_access_token, jwt_required, JWTManager, get_jwt_identity
from datetime import date # Import date for type checking

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
    data = request.get_json()
    name = data.get('name')
    ssn = data.get('ssn')
    email = data.get('email')
    pincode = data.get('pincode') # Get the pincode again

    # Check for required fields, including pincode now
    if not name or not ssn or not email or not pincode:
        return jsonify({"error": "Missing required fields (name, ssn, email, pincode)"}), 400

    # --- Always check the pincode --- 
    if pincode != '1234':
        return jsonify({"error": "Invalid pincode for manager registration."}), 403 # Forbidden

    # --- Pincode is correct, proceed with database operations ---
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection Failed"}), 500

    cur = conn.cursor()
    try:
        # Removed the check for manager_exists (we allow multiple registrations)
        
        # Check if SSN or Email already exists
        cur.execute("SELECT SSN FROM MANAGER WHERE SSN=%s OR EMAIL=%s", (ssn, email))
        existing_ssn_email = cur.fetchone()
        if existing_ssn_email:
            return jsonify({"error": "Manager with this SSN or Email already exists"}), 409

        # Insert the new manager
        cur.execute("INSERT INTO MANAGER (NAME, SSN, EMAIL) VALUES(%s, %s, %s)", (name, ssn, email))
        conn.commit()
        # General success message is appropriate
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
        # --- Generate unique CARID --- 
        while True:
            car_id = uuid.uuid4().hex[:10].upper() # CARID is VARCHAR(10)
            cur.execute("SELECT CARID FROM CAR WHERE CARID = %s", (car_id,))
            if not cur.fetchone():
                break # Found a unique ID

        # --- Insert into CAR table --- 
        insert_car_query = "INSERT INTO CAR (CARID, MAKE, MODEL, YEAR) VALUES (%s, %s, %s, %s)"
        cur.execute(insert_car_query, (car_id, make, model, year))

        # --- Generate unique MODELID and insert into MODEL table --- 
        # Assuming MODEL table links CARID to a MODELID
        # If MODEL table has other required columns, this needs adjustment.
        while True:
            model_id = uuid.uuid4().hex[:12].upper() # Generate a potential MODELID (adjust length if needed)
            # Check if MODELID already exists (assuming MODELID is unique/primary key)
            cur.execute("SELECT MODELID FROM MODEL WHERE MODELID = %s", (model_id,))
            if not cur.fetchone():
                break # Found unique MODELID
        
        # Insert into MODEL table (assuming columns MODELID, CARID)
        insert_model_query = "INSERT INTO MODEL (MODELID, CARID) VALUES (%s, %s)" 
        cur.execute(insert_model_query, (model_id, car_id))
        
        # --- Commit transaction --- 
        conn.commit()
        # Return success message including the generated CARID
        return jsonify({"message": "Car and associated model added successfully", "carId": car_id, "modelId": model_id}), 201

    except Exception as e:
        conn.rollback()
        print(f"Error adding car/model: {e}")
        # Check for specific errors
        if isinstance(e, psycopg2.errors.ForeignKeyViolation):
             return jsonify({"error": f"Failed to add model due to foreign key constraint: {e}"}), 400
        # Add other specific error checks if needed
        return jsonify({"error": f"Failed to add car/model: {e}"}), 500
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

# --- Endpoint to get all car models (accessible by authenticated users) ---
@app.route('/api/cars/models', methods=['GET'])
@jwt_required() # Protect route
def get_all_car_models():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        # Query to get all car details, order them for consistency
        query = """
            SELECT CARID as id, MAKE as make, MODEL as model, YEAR as year 
            FROM CAR 
            ORDER BY MAKE, MODEL, YEAR;
        """
        cur.execute(query)
        cars = cur.fetchall()
        
        # Convert Row objects to simple dictionaries
        cars_list = [dict(car) for car in cars]
        
        return jsonify({"cars": cars_list}), 200

    except Exception as e:
        print(f"Error fetching all car models: {e}")
        return jsonify({"error": f"Failed to fetch car models: {e}"}), 500
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

@app.route('/api/managers/reports/clients-by-city-criteria', methods=['GET'])
@jwt_required()
def get_clients_by_city_criteria():
    city1 = request.args.get('city1')
    city2 = request.args.get('city2')

    if not city1 or not city2:
        return jsonify({"error": "Missing required query parameters: 'city1' and 'city2'"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        # Query to find clients living in city1 who rented with a driver from city2
        query = """
            SELECT DISTINCT c.NAME AS name, c.EMAIL AS email
            FROM CLIENT c
            WHERE
                EXISTS (
                    SELECT 1
                    FROM LIVES l
                    WHERE l.EMAIL = c.EMAIL AND l.CITY = %s 
                )
                AND EXISTS (
                    SELECT 1
                    FROM RENT r
                    JOIN DRIVER d ON r.NAME = d.NAME
                    WHERE r.EMAIL = c.EMAIL AND d.CITY = %s 
                )
            ORDER BY c.NAME;
        """
        cur.execute(query, (city1, city2))
        clients = cur.fetchall()

        # Convert Row objects to simple dictionaries
        clients_list = [dict(client) for client in clients]

        return jsonify({"clients": clients_list}), 200

    except Exception as e:
        print(f"Error fetching clients by city criteria: {e}")
        return jsonify({"error": f"Failed to fetch clients by city criteria: {e}"}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/managers/reports/problematic-drivers', methods=['GET'])
@jwt_required()
def get_problematic_drivers():
    target_city = 'Chicago' # Define the target city
    rating_threshold = 2.5  # Define the rating threshold
    min_rents = 2           # Define minimum distinct rents
    min_clients = 2         # Define minimum distinct clients

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        # Query to find problematic drivers based on the specified criteria
        query = """
            SELECT d.NAME AS name
            FROM DRIVER d
            LEFT JOIN ( -- Subquery to calculate average rating
                SELECT NAME, AVG(RATING) as avg_rating
                FROM REVIEW
                GROUP BY NAME
            ) AS avg_ratings ON d.NAME = avg_ratings.NAME
            WHERE
                d.CITY = %s -- Driver's address is in the target city
                AND avg_ratings.avg_rating < %s -- Average rating is below threshold
                AND EXISTS ( -- Subquery to check rent/client criteria
                    SELECT 1
                    FROM RENT r
                    JOIN CLIENT c ON r.EMAIL = c.EMAIL
                    JOIN LIVES l ON c.EMAIL = l.EMAIL
                    WHERE
                        r.NAME = d.NAME -- Rent associated with the current driver
                        AND l.CITY = %s -- Client associated with the rent lives in the target city
                    GROUP BY r.NAME -- Group by driver to apply HAVING clause correctly
                    HAVING
                        COUNT(DISTINCT r.RENTID) >= %s -- At least min_rents distinct rents for target city clients
                        AND COUNT(DISTINCT c.EMAIL) >= %s -- At least min_clients distinct target city clients involved
                )
            ORDER BY d.NAME;
        """
        cur.execute(query, (target_city, rating_threshold, target_city, min_rents, min_clients))
        drivers = cur.fetchall()

        # Extract just the names
        driver_names = [driver['name'] for driver in drivers]

        return jsonify({"problematic_drivers": driver_names}), 200

    except Exception as e:
        print(f"Error fetching problematic drivers: {e}")
        return jsonify({"error": f"Failed to fetch problematic drivers: {e}"}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/managers/reports/brand-stats', methods=['GET'])
@jwt_required()
def get_brand_stats_report():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        # Query using CTEs to calculate brand stats
        query = """
            WITH BrandDriverNames AS (
                -- Find distinct pairs of (brand, driver_name) for drivers who can drive that brand
                SELECT DISTINCT
                    c.MAKE AS brand,
                    d.NAME AS driver_name
                FROM CAR c
                JOIN MODEL m ON c.CARID = m.CARID
                JOIN DRIVES dr ON m.MODELID = dr.MODELID AND m.CARID = dr.CARID
                JOIN DRIVER d ON dr.NAME = d.NAME
            ),
            BrandAvgDriverRating AS (
                -- Calculate the average rating for each brand based on drivers associated with it
                SELECT
                    bdn.brand,
                    AVG(r.RATING) AS avg_rating
                FROM BrandDriverNames bdn
                JOIN REVIEW r ON bdn.driver_name = r.NAME
                GROUP BY bdn.brand
            ),
            BrandRentCount AS (
                -- Count the number of rents for each brand
                SELECT
                    c.MAKE AS brand,
                    COUNT(r.RENTID) AS rent_count
                FROM CAR c
                JOIN MODEL m ON c.CARID = m.CARID
                JOIN RENT r ON m.MODELID = r.MODELID AND m.CARID = r.CARID
                GROUP BY c.MAKE
            )
            -- Final query to combine results for all distinct brands
            SELECT
                all_brands.brand,
                COALESCE(badr.avg_rating, 0.0) AS average_driver_rating,
                COALESCE(brc.rent_count, 0) AS total_rents
            FROM (
                SELECT DISTINCT MAKE AS brand FROM CAR
            ) AS all_brands
            LEFT JOIN BrandAvgDriverRating badr ON all_brands.brand = badr.brand
            LEFT JOIN BrandRentCount brc ON all_brands.brand = brc.brand
            ORDER BY all_brands.brand;
        """
        cur.execute(query)
        brand_stats = cur.fetchall()

        # Convert Row objects to simple dictionaries
        report_list = [dict(brand) for brand in brand_stats]

        return jsonify({"brand_stats_report": report_list}), 200

    except Exception as e:
        print(f"Error fetching brand stats report: {e}")
        return jsonify({"error": f"Failed to fetch brand stats report: {e}"}), 500
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

@app.route('/api/managers/reports/driver-stats', methods=['GET'])
@jwt_required()
def get_driver_stats_report():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        # Query to get driver name, total rents, and average rating
        # Using LEFT JOINs to include drivers with no rents or no reviews
        query = """
            SELECT 
                d.NAME AS name,
                COALESCE(COUNT(DISTINCT r.RENTID), 0) AS total_rents, 
                COALESCE(AVG(v.RATING), 0.0) AS average_rating
            FROM DRIVER d
            LEFT JOIN RENT r ON d.NAME = r.NAME
            LEFT JOIN REVIEW v ON d.NAME = v.NAME
            GROUP BY d.NAME
            ORDER BY d.NAME;
        """
        # COALESCE is used to return 0 instead of NULL if a driver has no rents or reviews
        # AVG returns a numeric type, COALESCE ensures it's float 0.0 for consistency
        
        cur.execute(query)
        driver_stats = cur.fetchall()

        # Convert Row objects to simple dictionaries
        report_list = [dict(driver) for driver in driver_stats]

        return jsonify({"driver_stats_report": report_list}), 200

    except Exception as e:
        print(f"Error fetching driver stats report: {e}")
        return jsonify({"error": f"Failed to fetch driver stats report: {e}"}), 500
    finally:
        cur.close()
        conn.close()

########################################################################


# client api

#drvier api

@app.route('/api/drivers/login', methods=['POST'])
def login_driver():
    data=request.get_json()
    name=data.get('name') # Use 'name' for driver login
    if not name:
       return jsonify({"error": "Missing required field name"}), 400

    conn=get_db_connection()
    if not conn:
       return jsonify({"error": "Database connection failed"}), 500

    cur=conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    try:
       # Fetch driver name and their full address details
       # Join DRIVER and ADDRESS tables
       query = """
            SELECT d.NAME as name, a.ROADNAME as roadname, a.NUMBER as number, a.CITY as city, a.ZIPCODE as zipcode
            FROM DRIVER d
            JOIN ADDRESS a ON d.ROADNAME = a.ROADNAME AND d.NUMBER = a.NUMBER AND d.CITY = a.CITY
            WHERE d.NAME = %s
       """
       cur.execute(query, (name,))
       driver=cur.fetchone()
       
       if driver:
         driver_dict = dict(driver)
         # Use driver name as the identity for the token
         access_token = create_access_token(identity=name, additional_claims={"user_type": "driver"})
         return jsonify(access_token=access_token, driver=driver_dict, message="Login successful"), 200
       else:
          return jsonify({"error": "Invalid driver name"}), 401 # Unauthorized
    except Exception as e:
       print(f"Error in driver login: {e}")
       return jsonify({"error": "Failed to process login"}), 500
    finally:
       cur.close()
       conn.close()

@app.route('/api/drivers/address', methods=['PUT']) # Use PUT for update
@jwt_required()
def update_driver_address():
    driver_name = get_jwt_identity() # Get driver name from token
    data = request.get_json()

    new_roadname = data.get('roadname')
    new_number = data.get('number')
    new_city = data.get('city')
    new_zipcode = data.get('zipcode') # Include zipcode

    if not new_roadname or not new_number or not new_city or not new_zipcode:
        return jsonify({"error": "Missing required address fields (roadname, number, city, zipcode)"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cur = conn.cursor()
    try:
        # Step 1: Upsert the new address into the ADDRESS table
        # ON CONFLICT targets the primary key of ADDRESS
        upsert_address_query = """
            INSERT INTO ADDRESS (ROADNAME, NUMBER, CITY, ZIPCODE)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (ROADNAME, NUMBER, CITY) DO NOTHING;
        """
        cur.execute(upsert_address_query, (new_roadname, new_number, new_city, new_zipcode))

        # Step 2: Update the DRIVER table to reference the new address
        update_driver_query = """
            UPDATE DRIVER
            SET ROADNAME = %s, NUMBER = %s, CITY = %s
            WHERE NAME = %s;
        """
        cur.execute(update_driver_query, (new_roadname, new_number, new_city, driver_name))

        conn.commit()

        # Optionally, return the updated address details
        updated_address = {
            "roadname": new_roadname,
            "number": new_number,
            "city": new_city,
            "zipcode": new_zipcode
        }
        return jsonify({"message": "Address updated successfully", "address": updated_address}), 200

    except Exception as e:
        conn.rollback()
        print(f"Error updating driver address for {driver_name}: {e}")
        return jsonify({"error": f"Failed to update address: {e}"}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/drivers/drivable-models', methods=['POST'])
@jwt_required()
def declare_drivable_model():
    driver_name = get_jwt_identity()
    data = request.get_json()
    car_id = data.get('car_id') # Expecting CARID from frontend

    if not car_id:
        return jsonify({"error": "Missing required field: car_id"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cur = conn.cursor()
    try:
        # Step 1: Find the MODELID associated with the CARID
        # Assuming there's a direct mapping or a default MODELID per CARID in MODEL table
        cur.execute("SELECT MODELID FROM MODEL WHERE CARID = %s LIMIT 1", (car_id,))
        model_result = cur.fetchone()

        if not model_result:
            # If no model found for this car, maybe the car hasn't been fully setup in MODEL table?
            return jsonify({"error": f"No model details found for CARID {car_id}"}), 404
        
        model_id = model_result[0] # Extract MODELID

        # Step 2: Insert into DRIVES table
        insert_drives_query = """
            INSERT INTO DRIVES (NAME, MODELID, CARID)
            VALUES (%s, %s, %s);
        """
        cur.execute(insert_drives_query, (driver_name, model_id, car_id))
        conn.commit()
        
        return jsonify({"message": f"Model {car_id} declared as drivable successfully"}), 201

    except psycopg2.errors.UniqueViolation:
        conn.rollback() # Important to rollback after error
        # This means the driver already declared this model
        return jsonify({"error": f"Model {car_id} is already declared as drivable for this driver"}), 409 # Conflict

    except psycopg2.errors.ForeignKeyViolation as e:
        conn.rollback()
        # Could happen if driver_name or model_id/car_id doesn't exist (though JWT/previous check should prevent this)
        print(f"Foreign key violation declaring drivable model: {e}")
        return jsonify({"error": f"Invalid driver or model details: {e}"}), 400

    except Exception as e:
        conn.rollback()
        print(f"Error declaring drivable model for {driver_name}: {e}")
        return jsonify({"error": f"Failed to declare drivable model: {e}"}), 500
    finally:
        cur.close()
        conn.close()

########################################################################
# --- Client Management Routes ---

@app.route('/api/clients/register', methods=['POST'])
def register_client():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    addresses = data.get('addresses') # Expecting an array of address objects
    credit_cards = data.get('creditCards') # Expecting an array of card objects

    # --- Basic Validation ---
    if not name or not email:
        return jsonify({"error": "Missing required fields (name, email)"}), 400
    if not isinstance(addresses, list) or not addresses:
        return jsonify({"error": "Addresses field must be a non-empty array"}), 400
    if not isinstance(credit_cards, list) or not credit_cards:
        return jsonify({"error": "CreditCards field must be a non-empty array"}), 400

    # --- Deeper Validation (Example: Check address/card structure) ---
    for addr in addresses:
        if not all(k in addr for k in ('street', 'city', 'zip')):
             return jsonify({"error": f"Invalid address object structure: {addr}"}), 400
    for card in credit_cards:
         # Ensure billingAddress is present, even if other fields are simplified in frontend
         if not all(k in card for k in ('number', 'expiry', 'cvv', 'billingAddress')):
             return jsonify({"error": f"Invalid credit card object structure: {card}"}), 400


    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection Failed"}), 500

    cur = conn.cursor()
    try:
        # --- Check if Email already exists ---
        cur.execute("SELECT CLIENTID FROM CLIENT WHERE EMAIL = %s", (email,))
        if cur.fetchone():
            return jsonify({"error": "Client with this Email already exists"}), 409 # Conflict

        # --- Generate unique CLIENTID ---
        while True:
            client_id = str(uuid.uuid4()) # Assuming CLIENTID is UUID or VARCHAR large enough
            cur.execute("SELECT CLIENTID FROM CLIENT WHERE CLIENTID = %s", (client_id,))
            if not cur.fetchone():
                break

        # --- Insert Client ---
        cur.execute("INSERT INTO CLIENT (CLIENTID, NAME, EMAIL) VALUES (%s, %s, %s)",
                    (client_id, name, email))

        # --- Insert Addresses ---
        for addr in addresses:
            # Generate unique ADDRESSID (assuming it's needed and not auto-increment)
            # If ADDRESSID is auto-incrementing, remove this generation and the column from INSERT
            while True:
                address_id = str(uuid.uuid4()) # Or use appropriate generation
                cur.execute("SELECT ADDRESSID FROM ADDRESS WHERE ADDRESSID = %s", (address_id,))
                if not cur.fetchone():
                    break
            cur.execute(
                "INSERT INTO ADDRESS (ADDRESSID, CLIENTID, STREET, CITY, ZIP) VALUES (%s, %s, %s, %s, %s)",
                (address_id, client_id, addr['street'], addr['city'], addr['zip'])
            )

        # --- Insert Credit Cards ---
        for card in credit_cards:
            # Generate unique CARDID (assuming it's needed)
            while True:
                card_id = str(uuid.uuid4()) # Or use appropriate generation
                cur.execute("SELECT CARDID FROM CREDITCARD WHERE CARDID = %s", (card_id,))
                if not cur.fetchone():
                    break
            # TODO: Consider encrypting card number and CVV before storing
            cur.execute(
                "INSERT INTO CREDITCARD (CARDID, CLIENTID, NUMBER, EXPIRY, CVV, BILLING_ADDRESS) VALUES (%s, %s, %s, %s, %s, %s)",
                (card_id, client_id, card['number'], card['expiry'], card['cvv'], card['billingAddress'])
            )

        # --- Commit Transaction ---
        conn.commit()
        # TODO: Consider returning the created client ID or generating a JWT token for immediate login
        return jsonify({"message": "Client registered successfully", "clientId": client_id}), 201

    except Exception as e:
        conn.rollback() # Rollback in case of any error
        print(f"Error during client registration: {e}")
        # Check for specific database errors if helpful (e.g., unique constraint violation)
        return jsonify({"error": f"Failed to register client: {e}"}), 500
    finally:
        cur.close()
        conn.close()


@app.route('/api/clients/login', methods=['POST'])
def login_client():
    data = request.get_json()
    email = data.get('email')
    # In a real app, you'd also need a password!
    # password = data.get('password') # Assuming password was added during registration

    if not email: # or not password:
        return jsonify({"error": "Missing required fields (email)"}), 400 # Add password if using

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        # Fetch client by email
        # In a real app, you'd also check the hashed password:
        # cur.execute("SELECT CLIENTID, NAME, EMAIL, PASSWORD_HASH FROM CLIENT WHERE EMAIL = %s", (email,))
        cur.execute("SELECT CLIENTID, NAME, EMAIL FROM CLIENT WHERE EMAIL = %s", (email,))
        client = cur.fetchone()

        if client: # and check_password_hash(client['password_hash'], password): # Add password check
            client_data = dict(client)
            # Use CLIENTID as the identity for the JWT token
            access_token = create_access_token(identity=client_data['clientid'])
            # Return token and client info (excluding sensitive data like password hash)
            client_info_for_frontend = {
                "clientId": client_data["clientid"],
                "name": client_data["name"],
                "email": client_data["email"]
            }
            return jsonify(access_token=access_token, client=client_info_for_frontend, message="Login successful"), 200
        else:
            # Generic error for security (don't reveal if email exists but password is wrong)
            return jsonify({"error": "Invalid email or password"}), 401 # Unauthorized

    except Exception as e:
        print(f"Error during client login: {e}")
        return jsonify({"error": "Failed to process login"}), 500
    finally:
        cur.close()
        conn.close()

########################################################################
# --- Car Availability and Booking Routes ---

@app.route('/api/cars/available', methods=['GET'])
# Note: Consider adding @jwt_required() if only logged-in clients should see availability
def get_available_cars():
    target_date_str = request.args.get('date')

    if not target_date_str:
        return jsonify({"error": "Missing required query parameter: date"}), 400

    # --- Validate Date Format (YYYY-MM-DD) ---
    try:
        target_date = date.fromisoformat(target_date_str)
    except ValueError:
        return jsonify({"error": "Invalid date format. Please use YYYY-MM-DD."}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        # Query to find available car models based on the criteria
        # We need: CARID, MAKE, MODEL, YEAR, MODELID for booking later
        query = """
            SELECT DISTINCT
                c.CARID AS id, -- Use CARID as the primary identifier for a specific car
                c.MAKE AS make,
                c.MODEL AS model,
                c.YEAR AS year,
                m.MODELID AS modelId -- Include MODELID needed for booking/linking to DRIVES
            FROM CAR c
            JOIN MODEL m ON c.CARID = m.CARID
            WHERE
                -- Condition i: Car (via MODEL) is not rented on the target date
                m.MODELID NOT IN (
                    SELECT MODELID FROM RENT WHERE DATE = %s
                )
                AND
                -- Condition ii & iii combined: Exists at least one driver who can drive this model
                -- AND is not driving another car on the target date.
                EXISTS (
                    SELECT 1
                    FROM DRIVER dr
                    JOIN DRIVES d ON dr.NAME = d.NAME
                    WHERE
                        d.MODELID = m.MODELID -- Driver can drive this specific model
                        AND dr.NAME NOT IN ( -- Driver is not busy on the target date
                            SELECT NAME FROM RENT WHERE DATE = %s
                        )
                );
        """
        # Pass the target date twice, once for each subquery check
        cur.execute(query, (target_date, target_date))
        available_cars = cur.fetchall()

        # Convert Row objects to simple dictionaries
        available_models_list = [dict(car) for car in available_cars]

        # Return in the structure expected by frontend { available_models: [...] }
        return jsonify({"available_models": available_models_list}), 200

    except Exception as e:
        print(f"Error fetching available cars for date {target_date_str}: {e}")
        return jsonify({"error": f"Failed to fetch available cars: {e}"}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/clients/rents', methods=['POST'])
@jwt_required()
def book_rent():
    client_id = get_jwt_identity() # Get CLIENTID from JWT token
    data = request.get_json()

    model_id = data.get('modelId')
    rent_date_str = data.get('date')

    if not model_id or not rent_date_str:
        return jsonify({"error": "Missing required fields: modelId and date"}), 400

    # --- Validate Date Format ---
    try:
        rent_date = date.fromisoformat(rent_date_str)
    except ValueError:
        return jsonify({"error": "Invalid date format. Please use YYYY-MM-DD."}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        # --- Start Transaction --- (psycopg2 implicitly starts one on first command)

        # --- Step 1: Verify Model Exists and Get CARID ---
        cur.execute("SELECT CARID FROM MODEL WHERE MODELID = %s", (model_id,))
        model_info = cur.fetchone()
        if not model_info:
            return jsonify({"error": "Invalid model specified"}), 404 # Not Found
        car_id = model_info['carid']

        # --- Step 2: Verify Model is NOT already Rented on this Date ---
        cur.execute("SELECT 1 FROM RENT WHERE MODELID = %s AND DATE = %s", (model_id, rent_date))
        if cur.fetchone():
            return jsonify({"error": "This car model is already booked for the selected date"}), 409 # Conflict

        # --- Step 3: Find ONE Available Driver for this Model on this Date ---
        # Find a driver who can drive the model (MODELID, CARID) and is not busy
        find_driver_query = """
            SELECT dr.NAME
            FROM DRIVER dr
            JOIN DRIVES d ON dr.NAME = d.NAME
            WHERE
                d.MODELID = %s
                AND d.CARID = %s
                AND dr.NAME NOT IN (
                    SELECT NAME FROM RENT WHERE DATE = %s
                )
            LIMIT 1; -- Select only one arbitrary available driver
        """
        cur.execute(find_driver_query, (model_id, car_id, rent_date))
        available_driver = cur.fetchone()

        if not available_driver:
            # This case should ideally be prevented by the availability check, but double-check
            return jsonify({"error": "No available driver found for this model on the selected date"}), 409 # Conflict

        driver_name = available_driver['name']

        # --- Step 4: Generate unique RENTID ---
        while True:
            rent_id = str(uuid.uuid4()) # Assuming RENTID is UUID or similar
            cur.execute("SELECT RENTID FROM RENT WHERE RENTID = %s", (rent_id,))
            if not cur.fetchone():
                break

        # --- Step 5: Insert the Rent Record ---
        # Adjust column names (CLIENTID, DATE, NAME, MODELID, CARID) as per your RENT table schema
        insert_rent_query = """
            INSERT INTO RENT (RENTID, CLIENTID, DATE, NAME, MODELID, CARID)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cur.execute(insert_rent_query, (rent_id, client_id, rent_date, driver_name, model_id, car_id))

        # --- Commit Transaction ---
        conn.commit()

        return jsonify({ "message": f"Rent booked successfully! Rent ID: {rent_id}, Driver: {driver_name}" }), 201 # Created

    except Exception as e:
        conn.rollback() # Rollback transaction on any error
        print(f"Error during booking by client {client_id}: {e}")
        # Check for specific errors like foreign key violations if needed
        return jsonify({"error": f"Failed to book rent due to an internal error: {e}"}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/clients/rents', methods=['GET'])
@jwt_required()
def get_client_rents():
    client_id = get_jwt_identity() # Get CLIENTID from JWT token

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        # Query to fetch rents for the logged-in client
        # Join RENT with MODEL and CAR to get car details
        query = """
            SELECT 
                r.RENTID AS "rentId",         -- Alias to match frontend expectation
                r.DATE AS date,         -- Alias for date
                r.NAME AS driver,            -- Driver's name from RENT table
                CONCAT(c.YEAR, ' ', c.MAKE, ' ', c.MODEL) AS model -- Construct model string
            FROM RENT r
            JOIN MODEL m ON r.MODELID = m.MODELID AND r.CARID = m.CARID
            JOIN CAR c ON m.CARID = c.CARID
            WHERE r.CLIENTID = %s
            ORDER BY r.DATE DESC; -- Order by date, newest first
        """
        cur.execute(query, (client_id,))
        rents = cur.fetchall()

        # Convert Row objects to simple dictionaries
        rents_list = [dict(rent) for rent in rents]
        
        # Ensure dates are strings in YYYY-MM-DD format (psycopg2 DictCursor might handle this)
        # If dates are date objects, convert them:
        for rent_item in rents_list:
            if isinstance(rent_item['date'], date):
                rent_item['date'] = rent_item['date'].isoformat()

        # Return the list under the 'rents' key, as expected by frontend
        return jsonify({"rents": rents_list}), 200

    except Exception as e:
        print(f"Error fetching rents for client {client_id}: {e}")
        return jsonify({"error": f"Failed to fetch rents: {e}"}), 500
    finally:
        cur.close()
        conn.close()

########################################################################
# --- Client Review Route ---

@app.route('/api/clients/reviews', methods=['POST'])
@jwt_required()
def submit_review():
    client_id = get_jwt_identity() # Get CLIENTID from JWT token
    data = request.get_json()

    driver_name = data.get('driverName')
    rating = data.get('rating')
    comment = data.get('comment', '') # Optional comment, default to empty string

    # --- Input Validation ---
    if not driver_name:
        return jsonify({"error": "Missing required field: driverName"}), 400
    if rating is None: # Check for None specifically, as 0 could be misinterpreted
         return jsonify({"error": "Missing required field: rating"}), 400
    
    try:
        rating_int = int(rating)
        if not 1 <= rating_int <= 5:
            raise ValueError()
    except (ValueError, TypeError):
         return jsonify({"error": "Invalid rating. Must be an integer between 1 and 5."}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cur = conn.cursor()
    try:
        # --- Step 1: Check if Driver Exists ---
        cur.execute("SELECT 1 FROM DRIVER WHERE NAME = %s", (driver_name,))
        if not cur.fetchone():
            return jsonify({"error": f"Driver '{driver_name}' not found."}), 404

        # --- Step 2: Check if Client actually rented with this Driver ---
        cur.execute(
            "SELECT 1 FROM RENT WHERE CLIENTID = %s AND NAME = %s LIMIT 1", 
            (client_id, driver_name)
        )
        if not cur.fetchone():
            return jsonify({"error": "Forbidden: You cannot review a driver you have not rented with."}), 403

        # --- Step 3: Generate REVIEWID (if needed) and Insert Review ---
        # Assuming REVIEW table has columns: REVIEWID, CLIENTID, NAME (driver), RATING, COMMENT
        # Adjust column names based on your schema.
        # If REVIEWID is auto-generated (SERIAL), remove it from INSERT.
        while True:
             review_id = str(uuid.uuid4()) # Assuming REVIEWID is UUID or similar
             cur.execute("SELECT REVIEWID FROM REVIEW WHERE REVIEWID = %s", (review_id,))
             if not cur.fetchone():
                 break

        insert_review_query = """
            INSERT INTO REVIEW (REVIEWID, CLIENTID, NAME, RATING, COMMENT)
            VALUES (%s, %s, %s, %s, %s)
        """
        # Use rating_int here
        cur.execute(insert_review_query, (review_id, client_id, driver_name, rating_int, comment))

        # --- Commit Transaction ---
        conn.commit()

        return jsonify({"message": "Review submitted successfully!"}), 201 # Created

    except Exception as e:
        conn.rollback() # Rollback transaction on any error
        print(f"Error submitting review by client {client_id} for driver {driver_name}: {e}")
        # Consider more specific error handling (e.g., unique constraint if client reviewed same driver twice?)
        return jsonify({"error": f"Failed to submit review due to an internal error: {e}"}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/clients/rents/best-driver', methods=['POST'])
@jwt_required()
def book_rent_with_best_driver():
    client_id = get_jwt_identity() # Get CLIENTID from JWT token
    data = request.get_json()

    model_id = data.get('modelId')
    rent_date_str = data.get('date')

    if not model_id or not rent_date_str:
        return jsonify({"error": "Missing required fields: modelId and date"}), 400

    # --- Validate Date Format ---
    try:
        rent_date = date.fromisoformat(rent_date_str)
    except ValueError:
        return jsonify({"error": "Invalid date format. Please use YYYY-MM-DD."}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        # --- Start Transaction ---

        # --- Step 1: Verify Model Exists and Get CARID ---
        cur.execute("SELECT CARID FROM MODEL WHERE MODELID = %s", (model_id,))
        model_info = cur.fetchone()
        if not model_info:
            return jsonify({"error": "Invalid model specified"}), 404
        car_id = model_info['carid']

        # --- Step 2: Verify Model is NOT already Rented on this Date ---
        cur.execute("SELECT 1 FROM RENT WHERE MODELID = %s AND DATE = %s", (model_id, rent_date))
        if cur.fetchone():
            return jsonify({"error": "This car model is already booked for the selected date"}), 409

        # --- Step 3: Find the Available Driver with the HIGHEST Average Rating ---
        find_best_driver_query = """
            SELECT 
                dr.NAME, 
                COALESCE(AVG(rev.RATING), 0.0) AS avg_rating -- Use 0 if no reviews
            FROM DRIVER dr
            JOIN DRIVES d ON dr.NAME = d.NAME
            LEFT JOIN REVIEW rev ON dr.NAME = rev.NAME -- LEFT JOIN to include drivers with no reviews
            WHERE
                d.MODELID = %s
                AND d.CARID = %s
                AND dr.NAME NOT IN (
                    SELECT NAME FROM RENT WHERE DATE = %s
                )
            GROUP BY dr.NAME -- Group by driver to calculate AVG
            ORDER BY avg_rating DESC, dr.NAME -- Order by rating descending (then name for tie-breaking)
            LIMIT 1; -- Select the top one
        """
        cur.execute(find_best_driver_query, (model_id, car_id, rent_date))
        best_driver = cur.fetchone()

        if not best_driver:
            return jsonify({"error": "No available driver found for this model on the selected date"}), 409

        driver_name = best_driver['name']
        driver_rating = best_driver['avg_rating'] # For logging or potentially returning

        # --- Step 4: Generate unique RENTID ---
        while True:
            rent_id = str(uuid.uuid4())
            cur.execute("SELECT RENTID FROM RENT WHERE RENTID = %s", (rent_id,))
            if not cur.fetchone():
                break

        # --- Step 5: Insert the Rent Record ---
        insert_rent_query = """
            INSERT INTO RENT (RENTID, CLIENTID, DATE, NAME, MODELID, CARID)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cur.execute(insert_rent_query, (rent_id, client_id, rent_date, driver_name, model_id, car_id))

        # --- Commit Transaction ---
        conn.commit()

        # Include driver's name and maybe rating in the success message
        return jsonify({ 
            "message": f"Rent booked successfully with best driver ({driver_name}, Rating: {driver_rating:.2f})! Rent ID: {rent_id}"
        }), 201

    except Exception as e:
        conn.rollback()
        print(f"Error during booking with best driver by client {client_id}: {e}")
        return jsonify({"error": f"Failed to book rent with best driver due to an internal error: {e}"}), 500
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
     # Use environment variables for host and port if available, otherwise default
     host = os.getenv('FLASK_RUN_HOST', '127.0.0.1')
     port = int(os.getenv('FLASK_RUN_PORT', 5001)) # Changed default port to 5001
     # Consider adding debug=True for development, but remove for production
     # debug = os.getenv('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')
     app.run(host=host, port=port) # Add debug=debug if needed

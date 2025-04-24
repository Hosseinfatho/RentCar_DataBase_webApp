from flask import Flask,request,jsonify
from flask_cors import CORS
import psycopg2
import os
from dotenv import load_dotenv
load_dotenv()
app=Flask(__name__)
CORS(app)
def get_db_connection():
  return psycopg2.connect(
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT")
  )
@app.route('/',methods=['GET'])
def home():
  return "🚖 Taxi Rental API is live!"
if __name__=="__main__":
  app.run(debug=True)

# PostgreSQL Database Setup Guide

## Step 1: Start PostgreSQL Service

### Method 1: Using Services (Recommended)
1. Press `Win + R`
2. Type `services.msc` and press Enter
3. Find the service `postgresql-x64-XX` (or similar name)
4. Right-click and select **Start**

### Method 2: Using Command Prompt (as Administrator)
```cmd
net start postgresql-x64-XX
```
(Replace XX with your PostgreSQL version number)

---

## Step 2: Find PostgreSQL Installation Path

PostgreSQL is usually installed in one of these paths:
- `C:\Program Files\PostgreSQL\15\bin\`
- `C:\Program Files\PostgreSQL\14\bin\`
- `C:\Program Files\PostgreSQL\13\bin\`

---

## Step 3: Create Database

Run from Command Prompt or PowerShell (as Administrator):

```cmd
cd "C:\Program Files\PostgreSQL\15\bin"
createdb.exe -U postgres taxi_rental
```

Enter password when prompted: `Manasa@5`

---

## Step 4: Create Tables (Schema)

```cmd
psql.exe -U postgres -d taxi_rental -f "D:\UIC Spring 2025\CS 480\RentCar_DataBase_webApp\Schema\FinalProjectSchema.sql"
```

Enter password when prompted: `Manasa@5`

---

## Alternative Method: Using pgAdmin

1. Open **pgAdmin**
2. Connect to the server (password: `Manasa@5`)
3. Right-click on **Databases** → **Create** → **Database**
4. Database name: `taxi_rental`
5. Right-click on the database → **Query Tool**
6. Open the file `Schema\FinalProjectSchema.sql`
7. Copy the content and execute it (F5)

---

## Verify Connection

To test the connection:

```cmd
psql.exe -U postgres -d taxi_rental
```

Then run this command:
```sql
\dt
```

You should see a list of tables.

---

## Quick Setup Script (PowerShell - Run as Administrator)

If you know your PostgreSQL version, you can run:

```powershell
# Replace 15 with your PostgreSQL version
$PG_PATH = "C:\Program Files\PostgreSQL\15\bin"
$ENV:PGPASSWORD = "Manasa@5"

# Create database
& "$PG_PATH\createdb.exe" -U postgres taxi_rental

# Create schema
$SCHEMA_FILE = "D:\UIC Spring 2025\CS 480\RentCar_DataBase_webApp\Schema\FinalProjectSchema.sql"
& "$PG_PATH\psql.exe" -U postgres -d taxi_rental -f $SCHEMA_FILE
```

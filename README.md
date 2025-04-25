# RentCar_DataBase_webApp
 this WebApp created for using SQL model in rent car application for Database course CS480 university of illinois Chicago , Instructor Prof Starvous Sintos


postgreSQL Schema (in backend/db/schema.sql)
createdb -U postgres taxi_rental
psql -U postgres -d taxi_rental -f schema.sql

## Project Structure

*   `/Frontend`: Contains the React frontend application (built with Vite).
*   `/Backend`: Contains the Flask backend application (details TBD).
*   `/Frontend/public`: Static assets (like images) are served from here.
*   `/Frontend/src`: Main source code for the React app.
    *   `/Frontend/src/components`: Reusable React components (Managers, Clients, Drivers).

## Running the Frontend (Development - Vite)

1.  **Navigate to Frontend Directory:**
    ```bash
    cd Frontend
    ```

2.  **Install Dependencies:** (If you haven't already or after pulling changes)
    ```bash
    npm install
    ```

3.  **Start Development Server:**
    ```bash
    npm run dev
    ```
    This command uses Vite to build the app and serve it, usually at `http://localhost:5173`. Open this URL in your browser. The server will automatically update when you save changes to the source files.

## Running the Backend

(Instructions to be added)

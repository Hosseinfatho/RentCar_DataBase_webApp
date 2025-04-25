import React, { useState } from 'react';
import './component.css'; // Add a CSS import for component-specific styles

// Base URL for the backend API
const API_URL = 'http://localhost:5000/api'; // Assuming backend runs on port 5000

function Managers() {
  const [regName, setRegName] = useState('');
  const [regSsn, setRegSsn] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMessage, setRegMessage] = useState(''); // To show registration success/error

  //state for login
  const [loginSsn, setLoginSsn] = useState('');
  const [loginMessage, setLoginMessage] = useState(''); // To show login success/error
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [managerInfo, setManagerInfo] = useState(null); // Store logged in manager's info

  //state for add remove
  const [carMake, setCarMake] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carYear, setCarYear] = useState('');
  const [carMessage, setCarMessage] = useState(''); // To show car add/remove success/error

  //state for top-k
  const [kValue, setKValue] = useState('');
  const [topKClients, setTopKClients] = useState([]);
  const [topKMessage, setTopKMessage] = useState(''); // Optional: Message for top-k results


  const handleRegister = async (e) => {
    e.preventDefault();
    setRegMessage(''); // Clear previous messages
    console.log('Attempting to register Manager:', { name: regName, ssn: regSsn, email: regEmail });

    try {
      const response = await fetch(`${API_URL}/managers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: regName, ssn: regSsn, email: regEmail }),
      });

      const data = await response.json();

      if (response.ok) { // Status code 200-299
        setRegMessage('Registration successful! You can now login.');
        // Clear registration form
        setRegName('');
        setRegSsn('');
        setRegEmail('');
        // Optionally log the user in directly or prompt them to login
        // setIsLoggedIn(true); // Or keep false and let them log in separately
      } else {
        // Handle errors (e.g., duplicate SSN/email, validation errors)
        setRegMessage(`Registration failed: ${data.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Registration network error:', error);
      setRegMessage('Registration failed: Network error or server is down.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMessage(''); // Clear previous messages
    console.log('Attempting to login with SSN:', loginSsn);

    try {
      const response = await fetch(`${API_URL}/managers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ssn: loginSsn }),
      });

      const data = await response.json();

      if (response.ok) {
        setLoginMessage('Login successful!');
        setIsLoggedIn(true);
        setManagerInfo(data.manager); // Store manager info from backend
        setLoginSsn(''); // Clear login form
      } else {
        // Handle login errors (e.g., invalid SSN)
        setLoginMessage(`Login failed: ${data.error || response.statusText}`);
        setIsLoggedIn(false);
        setManagerInfo(null);
      }
    } catch (error) {
      console.error('Login network error:', error);
      setLoginMessage('Login failed: Network error or server is down.');
      setIsLoggedIn(false);
      setManagerInfo(null);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setManagerInfo(null);
    setLoginMessage('');
    setRegMessage('');
    setCarMessage(''); // Clear car messages on logout
    setTopKMessage(''); // Clear top-k messages on logout
    // Clear other form states if needed
    setCarMake('');
    setCarModel('');
    setCarYear('');
    setKValue('');
    setTopKClients([]);
  };

  const handleAddCarModel = async (e) => {
    e.preventDefault();
    setCarMessage(''); // Clear previous car messages
    console.log('Attempting to add car:', { make: carMake, model: carModel, year: carYear });

    if (!isLoggedIn) {
        setCarMessage("Error: You must be logged in to add cars.");
        return;
    }

    try {
      const response = await fetch(`${API_URL}/managers/cars`, { // Endpoint for adding cars
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add Authorization header if backend requires authentication
          // 'Authorization': `Bearer ${your_auth_token}`
        },
        body: JSON.stringify({ make: carMake, model: carModel, year: carYear }),
      });

      const data = await response.json();

      if (response.ok) { // Status 201 Created
        setCarMessage(`Car added successfully! (ID: ${data.carId})`);
        // Clear the form
        setCarMake('');
        setCarModel('');
        setCarYear('');
      } else {
        setCarMessage(`Failed to add car: ${data.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Add car network error:', error);
      setCarMessage('Failed to add car: Network error or server is down.');
    }
  };

  const handleRemoveCarModel = async (e) => {
    // Note: This function triggers on button click, not form submit by default
    e.preventDefault(); // Good practice to prevent any default action
    setCarMessage(''); // Clear previous car messages
    console.log('Attempting to remove car:', { make: carMake, model: carModel, year: carYear });

    if (!isLoggedIn) {
        setCarMessage("Error: You must be logged in to remove cars.");
        return;
    }
    if (!carMake || !carModel || !carYear) {
        setCarMessage("Error: Please fill in Make, Model, and Year to identify the car to remove.");
        return;
    }


    try {
      const response = await fetch(`${API_URL}/managers/cars/remove`, { // Endpoint for removing cars
        method: 'POST', // Using POST as it modifies data and takes parameters in body
        headers: {
          'Content-Type': 'application/json',
           // TODO: Add Authorization header if backend requires authentication
        },
        body: JSON.stringify({ make: carMake, model: carModel, year: carYear }),
      });

      const data = await response.json();

      if (response.ok) { // Status 200 OK
        setCarMessage(data.message || 'Car removed successfully!'); // Use message from backend
         // Optionally clear the form after successful removal
        // setCarMake('');
        // setCarModel('');
        // setCarYear('');
      } else {
         // Handle specific errors like 404 Not Found or 409 Conflict
         setCarMessage(`Failed to remove car: ${data.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Remove car network error:', error);
      setCarMessage('Failed to remove car: Network error or server is down.');
    }
  };

  const handelGetTopKClients = async (e) => {
    e.preventDefault();
    setTopKMessage(''); // Clear previous message
    setTopKClients([]); // Clear previous results
    console.log('getting top k clients', { k: kValue });

    if (!isLoggedIn) {
        setTopKMessage("Error: You must be logged in to view reports.");
        return;
    }
    if (!kValue || kValue <= 0) {
        setTopKMessage("Error: Please enter a valid positive number for K.");
        return;
    }

    // TODO: Replace with actual API Call to backend to get top K clients
    // Example:
    // try {
    //   const response = await fetch(`${API_URL}/managers/reports/top-clients?k=${kValue}`, {
    //     method: 'GET', // Assuming GET request
    //     headers: {
    //       // TODO: Add Authorization header if needed
    //     }
    //   });
    //   const data = await response.json();
    //   if (response.ok) {
    //     setTopKClients(data.clients);
    //     if (data.clients.length === 0) {
    //         setTopKMessage(`No client data found.`);
    //     }
    //   } else {
    //     setTopKMessage(`Failed to get top clients: ${data.error || response.statusText}`);
    //   }
    // } catch (error) {
    //   console.error('Top K clients network error:', error);
    //   setTopKMessage('Failed to get top clients: Network error or server is down.');
    // }

    // --- Placeholder Data ---
    setTopKMessage(''); // Clear error message if validation passed
    setTopKClients([
       { name: 'Hossein Fatho', email: 'Hossein.fatho@gmail.com' },
       { name: 'Yamman Nandolia', email: 'Yamman.Nandolia@gmail.com' },
       { name: 'Kaustubha Medikundam', email: 'Kaustubha.Medikundam@gmail.com' },
    ]);
    // --- End Placeholder ---
  };

  return (
    <div className="component-content">
      <div className="image-container">
        <img src="/images/manager.png" alt="Manager illustration" />
      </div>
      <h2>Managers</h2>

      {/* --- Login/Register Section --- */}
      {!isLoggedIn ? (
        <div className="action-section">
          <h3>Login / Register</h3>
          {/* Login Form */}
          <form onSubmit={handleLogin} className="sub-action">
            <h4>Login</h4>
            <div className="controls">
              <input
                type="text" // Consider type="password" if SSN should be masked, though it's usually not.
                placeholder="Enter SSN to login..."
                value={loginSsn}
                onChange={(e) => setLoginSsn(e.target.value)}
                required // Add basic HTML validation
              />
              <button type="submit">Login</button>
            </div>
            {loginMessage && <p className={`message ${loginMessage.includes('failed') ? 'error' : 'success'}`}>{loginMessage}</p>}
          </form>
          <hr />
          {/* Registration Form */}
          <form onSubmit={handleRegister} className="sub-action">
            <h4>Register New Manager</h4>
            <div className="controls stacked">
              <input type="text" placeholder="Name" value={regName} onChange={(e) => setRegName(e.target.value)} required />
              <input type="text" placeholder="SSN" value={regSsn} onChange={(e) => setRegSsn(e.target.value)} required />
              <input type="email" placeholder="Email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
              <button type="submit">Register</button>
            </div>
            {regMessage && <p className={`message ${regMessage.includes('failed') ? 'error' : 'success'}`}>{regMessage}</p>}
          </form>
        </div>
      ) : (
        // Show Manager Actions only if logged in
        <div>
          {/* Display logged in user info and Logout button */}
          <div style={{ textAlign: 'right', marginBottom: '10px', padding: '5px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
             Welcome, {managerInfo?.name || 'Manager'}! ({managerInfo?.email})
             <button onClick={handleLogout} style={{ marginLeft: '15px' }}>Logout</button>
          </div>

          {/* --- Car Management Section --- */}
          <div className="action-section">
            <h3>Manage Cars / Models</h3>
            <form onSubmit={handleAddCarModel} className="sub-action">
              <h4>Add/Remove Car Model</h4>
              <div className="controls stacked">
                <input type="text" placeholder="Make (e.g., Toyota)" value={carMake} onChange={(e) => setCarMake(e.target.value)} required />
                <input type="text" placeholder="Model (e.g., Camry)" value={carModel} onChange={(e) => setCarModel(e.target.value)} required />
                <input type="number" placeholder="Year" value={carYear} onChange={(e) => setCarYear(e.target.value)} required />
                <div> {/* Button group */}
                  <button type="submit">Add Model</button>
                  <button type="button" onClick={handleRemoveCarModel} style={{ marginLeft: '10px' }}>Remove Model</button>
                </div>
              </div>
            </form>
            {/* Display Car Management Messages */}
            {carMessage && <p className={`message ${carMessage.includes('Failed') || carMessage.includes('Error') ? 'error' : 'success'}`}>{carMessage}</p>}
          </div>

          {/* --- Top K Clients Section --- */}
          <div className="action-section">
            <h3>Client Reports</h3>
            <form onSubmit={handelGetTopKClients} className="sub-action">
              <h4>Top-K Clients by Rents</h4>
              <div className="controls">
                <input
                   type="number"
                   placeholder="Enter K"
                   value={kValue}
                   onChange={(e) => setKValue(e.target.value)}
                   min="1" // Basic validation
                   required
                 />
                <button type="submit">Get Top K</button>
              </div>
               {/* Display Top-K Messages/Errors */}
              {topKMessage && <p className="message error">{topKMessage}</p>}
            </form>
            {topKClients.length > 0 && (
              <div className="results">
                <h4>Top {kValue} Clients:</h4>
                <ul>
                  {topKClients.map((client, index) => (
                    <li key={index}>{client.name} ({client.email})</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* TODO: Add UI for other manager actions (3, 5, 6, 7, 8, 9) */}

        </div>
      )}
    </div>
  );
}

export default Managers; 
import React, { useState } from 'react';
import './component.css'; // Add a CSS import for component-specific styles

// Base URL for the backend API
const API_URL = 'http://localhost:5000/api'; // Assuming backend runs on port 5000

function Managers() {
  const [regName, setRegName] = useState('');
  const [regSsn, setRegSsn] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPinCode, setRegPinCode] = useState(''); // State for the registration pincode
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

  // --- States for Driver Management ---
  const [driverName, setDriverName] = useState('');
  const [driverRoadName, setDriverRoadName] = useState('');
  const [driverNumber, setDriverNumber] = useState('');
  const [driverCity, setDriverCity] = useState('');
  const [driverZipCode, setDriverZipCode] = useState('');
  const [driverMessage, setDriverMessage] = useState(''); // Message for driver ops

  // --- State for Model Rent Report ---
  const [modelRentReport, setModelRentReport] = useState([]);
  const [modelRentMessage, setModelRentMessage] = useState('');

  // --- State for Driver Stats Report ---
  const [driverStatsReport, setDriverStatsReport] = useState([]);
  const [driverStatsMessage, setDriverStatsMessage] = useState('');

  // --- State for City Criteria Report ---
  const [clientCity1, setClientCity1] = useState('');
  const [driverCity2, setDriverCity2] = useState('');
  const [cityCriteriaClients, setCityCriteriaClients] = useState([]);
  const [cityCriteriaMessage, setCityCriteriaMessage] = useState('');

  // --- State for Problematic Drivers Report ---
  const [problematicDrivers, setProblematicDrivers] = useState([]);
  const [problematicDriversMessage, setProblematicDriversMessage] = useState('');

  // --- State for Brand Stats Report ---
  const [brandStatsReport, setBrandStatsReport] = useState([]);
  const [brandStatsMessage, setBrandStatsMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegMessage('');
    // Include pincode in log message
    console.log('Attempting to register Manager:', { name: regName, ssn: regSsn, email: regEmail, pincode: '****' }); // Mask pincode in log

    try {
      const response = await fetch(`${API_URL}/managers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // --- Include pincode in the request body --- !!
        body: JSON.stringify({ name: regName, ssn: regSsn, email: regEmail, pincode: regPinCode }),
      });

      const data = await response.json();

      if (response.ok) { // Status 201 Created
        // Modify success message based on response or context if needed
        setRegMessage(data.message || 'Registration successful! You can now login.');
        setRegName('');
        setRegSsn('');
        setRegEmail('');
        setRegPinCode(''); // Clear pincode field
      } else {
         // Handle specific errors like 403 Forbidden (registration closed / invalid pincode)
         setRegMessage(`Registration failed: ${data.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Registration network error:', error);
      setRegMessage('Registration failed: Network error or server is down.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMessage('');
    console.log('Attempting to login with SSN:', loginSsn);

    try {
      const response = await fetch(`${API_URL}/managers/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssn: loginSsn }),
      });
      const data = await response.json();

      if (response.ok) {
        setLoginMessage('Login successful!');
        setIsLoggedIn(true);
        setManagerInfo(data.manager);
        // --- Store the token --- (Use localStorage to persist across sessions)
        localStorage.setItem('manager_access_token', data.access_token);
        setLoginSsn('');
      } else {
        setLoginMessage(`Login failed: ${data.error || response.statusText}`);
        setIsLoggedIn(false);
        setManagerInfo(null);
        localStorage.removeItem('manager_access_token'); // Ensure token is removed on failed login
      }
    } catch (error) {
      console.error('Login network error:', error);
      setLoginMessage('Login failed: Network error or server is down.');
      setIsLoggedIn(false);
      setManagerInfo(null);
      localStorage.removeItem('manager_access_token');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setManagerInfo(null);
    setLoginMessage('');
    setRegMessage('');
    setCarMessage('');
    setTopKMessage('');
    setDriverMessage(''); // Clear driver message on logout
    setModelRentMessage(''); // Clear model report message
    setDriverStatsMessage(''); // Clear driver stats message
    setCityCriteriaMessage(''); // Clear city criteria message
    setProblematicDriversMessage(''); // Clear problematic driver message
    setBrandStatsMessage(''); // Clear brand stats message
    // Clear form states
    setCarMake(''); setCarModel(''); setCarYear('');
    setKValue('');
    setDriverName(''); setDriverRoadName(''); setDriverNumber(''); setDriverCity(''); setDriverZipCode('');
    setClientCity1(''); setDriverCity2(''); // Clear city inputs
    // Clear report data
    setTopKClients([]);
    setModelRentReport([]); // Clear model report data
    setDriverStatsReport([]); // Clear driver stats data
    setCityCriteriaClients([]); // Clear city criteria data
    setProblematicDrivers([]); // Clear problematic driver data
    setBrandStatsReport([]); // Clear brand stats data
    setRegPinCode(''); // Clear pincode on logout
    localStorage.removeItem('manager_access_token');
  };

  const handleAddCarModel = async (e) => {
    e.preventDefault();
    setCarMessage('');
    console.log('Attempting to add car:', { make: carMake, model: carModel, year: carYear });

    // --- Get token from localStorage --- !!
    const token = localStorage.getItem('manager_access_token');
    if (!token) {
      setCarMessage("Error: Authentication token not found. Please login again.");
      setIsLoggedIn(false); // Force re-login if token is missing
      setManagerInfo(null);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/managers/cars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // --- Add Authorization header --- !!
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ make: carMake, model: carModel, year: carYear }),
      });

      const data = await response.json();

      if (response.ok) {
        setCarMessage(`Car added successfully! (ID: ${data.carId})`);
        setCarMake('');
        setCarModel('');
        setCarYear('');
      } else {
        // Check for specific auth errors (e.g., 401 Unauthorized, 422 Unprocessable Entity for expired/invalid token)
        if (response.status === 401 || response.status === 422) {
           setCarMessage(`Authentication error: ${data.msg || data.error || response.statusText}. Please login again.`);
           handleLogout(); // Log out user if token is invalid/expired
        } else {
           setCarMessage(`Failed to add car: ${data.error || response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Add car network error:', error);
      setCarMessage('Failed to add car: Network error or server is down.');
    }
  };

  const handleRemoveCarModel = async (e) => {
    e.preventDefault();
    setCarMessage('');
    console.log('Attempting to remove car:', { make: carMake, model: carModel, year: carYear });

    // --- Get token from localStorage --- !!
    const token = localStorage.getItem('manager_access_token');
    if (!token) {
      setCarMessage("Error: Authentication token not found. Please login again.");
      setIsLoggedIn(false);
      setManagerInfo(null);
      return;
    }

    if (!carMake || !carModel || !carYear) {
        setCarMessage("Error: Please fill in Make, Model, and Year to identify the car to remove.");
        return;
    }

    try {
      const response = await fetch(`${API_URL}/managers/cars/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // --- Add Authorization header --- !!
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ make: carMake, model: carModel, year: carYear }),
      });

      const data = await response.json();

      if (response.ok) {
        setCarMessage(data.message || 'Car removed successfully!');
      } else {
         if (response.status === 401 || response.status === 422) {
           setCarMessage(`Authentication error: ${data.msg || data.error || response.statusText}. Please login again.`);
           handleLogout();
        } else {
           setCarMessage(`Failed to remove car: ${data.error || response.statusText}`);
        }
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
    console.log('Requesting top k clients', { k: kValue });

    const token = localStorage.getItem('manager_access_token');
    if (!token) {
      setTopKMessage("Error: Authentication token not found. Please login again.");
      handleLogout(); // Logout if no token
      return;
    }
    if (!kValue || kValue <= 0) {
      setTopKMessage("Error: Please enter a valid positive number for K.");
      return;
    }

    try {
      // --- Actual API Call --- !!
      const response = await fetch(`${API_URL}/managers/reports/top-clients?k=${kValue}`, {
        method: 'GET', // Use GET method
        headers: {
          // --- Add Authorization header --- !!
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();

      if (response.ok) {
        if (data.clients && data.clients.length > 0) {
           setTopKClients(data.clients);
           setTopKMessage(''); // Clear any previous error message
        } else {
           setTopKClients([]);
           setTopKMessage(`No client rental data found.`);
        }
      } else {
        // Handle errors (including auth errors from backend)
        if (response.status === 401 || response.status === 422) {
            setTopKMessage(`Authentication error: ${data.msg || data.error || response.statusText}. Please login again.`);
            handleLogout();
        } else {
            setTopKMessage(`Failed to get top clients: ${data.error || response.statusText}`);
        }
         setTopKClients([]); // Clear results on error
      }
    } catch (error) {
      console.error('Top K clients network error:', error);
      setTopKMessage('Failed to get top clients: Network error or server is down.');
      setTopKClients([]); // Clear results on network error
    }
  };

  // --- Driver Management Handlers ---

  const handleAddDriver = async (e) => {
    e.preventDefault();
    setDriverMessage('');
    const token = localStorage.getItem('manager_access_token');
    if (!token) {
      setDriverMessage("Error: Authentication token not found. Please login again.");
      handleLogout();
      return;
    }

    const driverData = {
      name: driverName,
      roadname: driverRoadName,
      number: driverNumber,
      city: driverCity,
      zipcode: driverZipCode,
    };

    console.log('Attempting to add driver:', driverData);

    try {
      const response = await fetch(`${API_URL}/managers/drivers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(driverData),
      });
      const data = await response.json();

      if (response.ok) {
        setDriverMessage("Driver added successfully!");
        // Clear form
        setDriverName('');
        setDriverRoadName('');
        setDriverNumber('');
        setDriverCity('');
        setDriverZipCode('');
      } else {
        if (response.status === 401 || response.status === 422) {
          setDriverMessage(`Authentication error: ${data.msg || data.error || response.statusText}. Please login again.`);
          handleLogout();
        } else {
          setDriverMessage(`Failed to add driver: ${data.error || response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Add driver network error:', error);
      setDriverMessage('Failed to add driver: Network error or server is down.');
    }
  };

  const handleRemoveDriver = async (e) => {
    e.preventDefault();
    setDriverMessage('');
    const token = localStorage.getItem('manager_access_token');
    if (!token) {
      setDriverMessage("Error: Authentication token not found. Please login again.");
      handleLogout();
      return;
    }

    if (!driverName) {
        setDriverMessage("Error: Please enter the Name of the driver to remove.");
        return;
    }

    console.log('Attempting to remove driver:', driverName);

    try {
      const response = await fetch(`${API_URL}/managers/drivers/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: driverName }), // Only need name to remove
      });
      const data = await response.json();

      if (response.ok) {
        setDriverMessage(data.message || "Driver removed successfully!");
        // Optionally clear the name field
        // setDriverName('');
      } else {
        if (response.status === 401 || response.status === 422) {
          setDriverMessage(`Authentication error: ${data.msg || data.error || response.statusText}. Please login again.`);
          handleLogout();
        } else {
          setDriverMessage(`Failed to remove driver: ${data.error || response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Remove driver network error:', error);
      setDriverMessage('Failed to remove driver: Network error or server is down.');
    }
  };

  // --- Model Rent Report Handler ---
  const handleGenerateModelReport = async () => {
    setModelRentMessage(''); // Clear previous message
    setModelRentReport([]); // Clear previous report
    console.log('Requesting model rent report');

    const token = localStorage.getItem('manager_access_token');
    if (!token) {
      setModelRentMessage("Error: Authentication token not found. Please login again.");
      handleLogout();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/managers/reports/model-rents`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        if (data.model_rent_report && data.model_rent_report.length > 0) {
          setModelRentReport(data.model_rent_report);
        } else {
          setModelRentMessage("No car models found or no rental data available.");
        }
      } else {
        if (response.status === 401 || response.status === 422) {
          setModelRentMessage(`Authentication error: ${data.msg || data.error || response.statusText}. Please login again.`);
          handleLogout();
        } else {
          setModelRentMessage(`Failed to generate report: ${data.error || response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Model rent report network error:', error);
      setModelRentMessage('Failed to generate report: Network error or server is down.');
    }
  };

  // --- Driver Stats Report Handler ---
  const handleGenerateDriverReport = async () => {
    setDriverStatsMessage(''); // Clear previous message
    setDriverStatsReport([]); // Clear previous report
    console.log('Requesting driver stats report');

    const token = localStorage.getItem('manager_access_token');
    if (!token) {
      setDriverStatsMessage("Error: Authentication token not found. Please login again.");
      handleLogout();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/managers/reports/driver-stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        if (data.driver_stats_report && data.driver_stats_report.length > 0) {
          setDriverStatsReport(data.driver_stats_report);
        } else {
          setDriverStatsMessage("No driver data found.");
        }
      } else {
        if (response.status === 401 || response.status === 422) {
          setDriverStatsMessage(`Authentication error: ${data.msg || data.error || response.statusText}. Please login again.`);
          handleLogout();
        } else {
          setDriverStatsMessage(`Failed to generate report: ${data.error || response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Driver stats report network error:', error);
      setDriverStatsMessage('Failed to generate report: Network error or server is down.');
    }
  };

  // --- City Criteria Report Handler ---
  const handleGenerateCityCriteriaReport = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setCityCriteriaMessage('');
    setCityCriteriaClients([]);
    console.log('Requesting clients by city criteria', { city1: clientCity1, city2: driverCity2 });

    if (!clientCity1 || !driverCity2) {
      setCityCriteriaMessage("Error: Please enter both Client City (C1) and Driver City (C2).");
      return;
    }

    const token = localStorage.getItem('manager_access_token');
    if (!token) {
      setCityCriteriaMessage("Error: Authentication token not found. Please login again.");
      handleLogout();
      return;
    }

    try {
      const encodedCity1 = encodeURIComponent(clientCity1);
      const encodedCity2 = encodeURIComponent(driverCity2);

      const response = await fetch(`${API_URL}/managers/reports/clients-by-city-criteria?city1=${encodedCity1}&city2=${encodedCity2}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        if (data.clients && data.clients.length > 0) {
          setCityCriteriaClients(data.clients);
        } else {
          setCityCriteriaMessage(`No clients found matching the criteria (Client in ${clientCity1}, Driver in ${driverCity2}).`);
        }
      } else {
        if (response.status === 401 || response.status === 422) {
          setCityCriteriaMessage(`Authentication error: ${data.msg || data.error || response.statusText}. Please login again.`);
          handleLogout();
        } else {
          setCityCriteriaMessage(`Failed to generate report: ${data.error || response.statusText}`);
        }
      }
    } catch (error) {
      console.error('City criteria report network error:', error);
      setCityCriteriaMessage('Failed to generate report: Network error or server is down.');
    }
  };

  // --- Problematic Drivers Report Handler ---
  const handleGenerateProblematicDriversReport = async () => {
    setProblematicDriversMessage('');
    setProblematicDrivers([]);
    console.log('Requesting problematic drivers report');

    const token = localStorage.getItem('manager_access_token');
    if (!token) {
      setProblematicDriversMessage("Error: Authentication token not found. Please login again.");
      handleLogout();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/managers/reports/problematic-drivers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        if (data.problematic_drivers && data.problematic_drivers.length > 0) {
          setProblematicDrivers(data.problematic_drivers);
        } else {
          setProblematicDriversMessage("No problematic local drivers found based on the criteria.");
        }
      } else {
        if (response.status === 401 || response.status === 422) {
          setProblematicDriversMessage(`Authentication error: ${data.msg || data.error || response.statusText}. Please login again.`);
          handleLogout();
        } else {
          setProblematicDriversMessage(`Failed to generate report: ${data.error || response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Problematic drivers report network error:', error);
      setProblematicDriversMessage('Failed to generate report: Network error or server is down.');
    }
  };

  // --- Brand Stats Report Handler ---
  const handleGenerateBrandReport = async () => {
    setBrandStatsMessage('');
    setBrandStatsReport([]);
    console.log('Requesting brand stats report');

    const token = localStorage.getItem('manager_access_token');
    if (!token) {
      setBrandStatsMessage("Error: Authentication token not found. Please login again.");
      handleLogout();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/managers/reports/brand-stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        if (data.brand_stats_report && data.brand_stats_report.length > 0) {
          setBrandStatsReport(data.brand_stats_report);
        } else {
          setBrandStatsMessage("No car brand data found.");
        }
      } else {
        if (response.status === 401 || response.status === 422) {
          setBrandStatsMessage(`Authentication error: ${data.msg || data.error || response.statusText}. Please login again.`);
          handleLogout();
        } else {
          setBrandStatsMessage(`Failed to generate report: ${data.error || response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Brand stats report network error:', error);
      setBrandStatsMessage('Failed to generate report: Network error or server is down.');
    }
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
            <p style={{fontSize: '0.8em', color: 'gray'}}>Note: Registration requires a special pincode only for the very first manager.</p> {/* Add explanation */} 
            <div className="controls stacked">
              <input type="text" placeholder="Name" value={regName} onChange={(e) => setRegName(e.target.value)} required />
              <input type="text" placeholder="SSN" value={regSsn} onChange={(e) => setRegSsn(e.target.value)} required />
              <input type="email" placeholder="Email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
              {/* --- Add Pincode Input --- */} 
              <input 
                 type="password"  /* Use password type to mask input */ 
                 placeholder="Pincode (for first registration only)" 
                 value={regPinCode} 
                 onChange={(e) => setRegPinCode(e.target.value)} 
                 required 
               />
              <button type="submit">Register</button>
            </div>
            {regMessage && <p className={`message ${regMessage.includes('failed') || regMessage.includes('closed') || regMessage.includes('Invalid') ? 'error' : 'success'}`}>{regMessage}</p>}
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
                <h4>Top {kValue} Clients (by number of rents):</h4>
                <ul>
                  {topKClients.map((client, index) => (
                    // Display name, email, and optionally the rent_count from backend
                    <li key={index}>
                       {client.name} ({client.email})
                       {client.rent_count && ` - ${client.rent_count} rent(s)`} 
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* --- Driver Management Section --- */}
          <div className="action-section">
            <h3>Manage Drivers</h3>
            <form onSubmit={handleAddDriver} className="sub-action">
              <h4>Add New Driver</h4>
              <div className="controls stacked">
                <input type="text" placeholder="Driver Name" value={driverName} onChange={(e) => setDriverName(e.target.value)} required />
                <input type="text" placeholder="Road Name" value={driverRoadName} onChange={(e) => setDriverRoadName(e.target.value)} required />
                <input type="text" placeholder="Number" value={driverNumber} onChange={(e) => setDriverNumber(e.target.value)} required />
                <input type="text" placeholder="City" value={driverCity} onChange={(e) => setDriverCity(e.target.value)} required />
                <input type="text" placeholder="Zip Code" value={driverZipCode} onChange={(e) => setDriverZipCode(e.target.value)} required />
                 <button type="submit">Add Driver</button>
              </div>
            </form>
            {/* Form/Button for Removing Driver */} 
            <form onSubmit={handleRemoveDriver} className="sub-action" style={{marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px'}}>
                <h4>Remove Driver</h4>
                 <div className="controls">
                   {/* Use the same driverName state or a different one if preferred */} 
                  <input type="text" placeholder="Driver Name to Remove" value={driverName} onChange={(e) => setDriverName(e.target.value)} required />
                  <button type="submit">Remove Driver</button>
                 </div>
            </form>
             {/* Display Driver Management Messages */} 
            {driverMessage && <p className={`message ${driverMessage.includes('Failed') || driverMessage.includes('Error') ? 'error' : 'success'}`}>{driverMessage}</p>}
          </div>

          {/* --- Model Rent Report Section --- */}
          <div className="action-section">
            <h3>Car Model Rent Report</h3>
            <div className="sub-action">
               <button type="button" onClick={handleGenerateModelReport}>Generate Model Rent Report</button>
            </div>
            {/* Display Message */} 
            {modelRentMessage && <p className={`message ${modelRentMessage.includes('Failed') || modelRentMessage.includes('Error') ? 'error' : 'success'}`}>{modelRentMessage}</p>}
            {/* Display Report Data */} 
            {modelRentReport.length > 0 && (
              <div className="results" style={{marginTop: '10px'}}>
                <h4>Model Rent Counts:</h4>
                 {/* Optional: Use a table for better formatting */} 
                 <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                       <tr style={{borderBottom: '1px solid #ccc'}}>
                          <th style={{textAlign: 'left', padding: '5px'}}>Make</th>
                          <th style={{textAlign: 'left', padding: '5px'}}>Model</th>
                          <th style={{textAlign: 'left', padding: '5px'}}>Year</th>
                          <th style={{textAlign: 'right', padding: '5px'}}>Rent Count</th>
                       </tr>
                    </thead>
                    <tbody>
                    {modelRentReport.map((item, index) => (
                      <tr key={index} style={{borderBottom: '1px solid #eee'}}>
                         <td style={{padding: '5px'}}>{item.make}</td>
                         <td style={{padding: '5px'}}>{item.model}</td>
                         <td style={{padding: '5px'}}>{item.year}</td>
                         <td style={{textAlign: 'right', padding: '5px'}}>{item.rent_count}</td>
                      </tr>
                    ))}
                    </tbody>
                 </table>
                {/* Alternative: Simple list */}
                {/* <ul>
                  {modelRentReport.map((item, index) => (
                    <li key={index}>
                      {item.make} {item.model} ({item.year}) - Rents: {item.rent_count}
                    </li>
                  ))}
                </ul> */} 
              </div>
            )}
          </div>

          {/* --- Driver Stats Report Section --- */}
          <div className="action-section">
            <h3>Driver Performance Report</h3>
            <div className="sub-action">
               <button type="button" onClick={handleGenerateDriverReport}>Generate Driver Report</button>
            </div>
            {/* Display Message */} 
            {driverStatsMessage && <p className={`message ${driverStatsMessage.includes('Failed') || driverStatsMessage.includes('Error') ? 'error' : 'success'}`}>{driverStatsMessage}</p>}
            {/* Display Report Data */} 
            {driverStatsReport.length > 0 && (
              <div className="results" style={{marginTop: '10px'}}>
                <h4>Driver Stats:</h4>
                 <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                       <tr style={{borderBottom: '1px solid #ccc'}}>
                          <th style={{textAlign: 'left', padding: '5px'}}>Driver Name</th>
                          <th style={{textAlign: 'right', padding: '5px'}}>Total Rents</th>
                          <th style={{textAlign: 'right', padding: '5px'}}>Average Rating</th>
                       </tr>
                    </thead>
                    <tbody>
                    {driverStatsReport.map((driver, index) => (
                      <tr key={index} style={{borderBottom: '1px solid #eee'}}>
                         <td style={{padding: '5px'}}>{driver.name}</td>
                         <td style={{textAlign: 'right', padding: '5px'}}>{driver.total_rents}</td>
                         {/* Format average rating to 1 decimal place */} 
                         <td style={{textAlign: 'right', padding: '5px'}}>{parseFloat(driver.average_rating).toFixed(1)}</td>
                      </tr>
                    ))}
                    </tbody>
                 </table>
              </div>
            )}
          </div>

          {/* --- Client Report by City Criteria Section --- */}
          <div className="action-section">
            <h3>Client Report by City Criteria</h3>
             <form onSubmit={handleGenerateCityCriteriaReport} className="sub-action">
              <h4>Find Clients Living in C1 with Driver from C2</h4>
              <div className="controls stacked">
                <input type="text" placeholder="Client City (C1)" value={clientCity1} onChange={(e) => setClientCity1(e.target.value)} required />
                <input type="text" placeholder="Driver City (C2)" value={driverCity2} onChange={(e) => setDriverCity2(e.target.value)} required />
                 <button type="submit">Generate Report</button>
              </div>
            </form>
            {/* Display Message */} 
            {cityCriteriaMessage && <p className={`message ${cityCriteriaMessage.includes('Failed') || cityCriteriaMessage.includes('Error') ? 'error' : 'success'}`}>{cityCriteriaMessage}</p>}
            {/* Display Report Data */} 
            {cityCriteriaClients.length > 0 && (
              <div className="results" style={{marginTop: '10px'}}>
                <h4>Matching Clients:</h4>
                 <ul>
                    {cityCriteriaClients.map((client, index) => (
                      <li key={index}>
                         {client.name} ({client.email})
                      </li>
                    ))}
                 </ul>
              </div>
            )}
          </div>

          {/* --- Problematic Local Drivers Report Section --- */}
          <div className="action-section">
            <h3>Problematic Local Drivers Report</h3>
             <div className="sub-action">
               <p>Finds drivers in 'Chicago' with avg. rating &lt; 2.5 who drove &ge; 2 rents for &ge; 2 distinct clients from 'Chicago'.</p>
               <button type="button" onClick={handleGenerateProblematicDriversReport}>Generate Report</button>
            </div>
            {/* Display Message */} 
            {problematicDriversMessage && <p className={`message ${problematicDriversMessage.includes('Failed') || problematicDriversMessage.includes('Error') ? 'error' : 'success'}`}>{problematicDriversMessage}</p>}
            {/* Display Report Data */} 
            {problematicDrivers.length > 0 && (
              <div className="results" style={{marginTop: '10px'}}>
                <h4>Problematic Drivers:</h4>
                 <ul>
                    {problematicDrivers.map((driverName, index) => (
                      <li key={index}>
                         {driverName}
                      </li>
                    ))}
                 </ul>
              </div>
            )}
          </div>

          {/* --- Car Brand Performance Report Section --- */}
          <div className="action-section">
            <h3>Car Brand Performance Report</h3>
            <div className="sub-action">
               <p>Shows stats for each car brand: Average driver rating & Total rents.</p>
               <button type="button" onClick={handleGenerateBrandReport}>Generate Brand Report</button>
            </div>
            {/* Display Message */} 
            {brandStatsMessage && <p className={`message ${brandStatsMessage.includes('Failed') || brandStatsMessage.includes('Error') ? 'error' : 'success'}`}>{brandStatsMessage}</p>}
            {/* Display Report Data */} 
            {brandStatsReport.length > 0 && (
              <div className="results" style={{marginTop: '10px'}}>
                <h4>Brand Stats:</h4>
                 <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                       <tr style={{borderBottom: '1px solid #ccc'}}>
                          <th style={{textAlign: 'left', padding: '5px'}}>Brand (Make)</th>
                          <th style={{textAlign: 'right', padding: '5px'}}>Avg. Driver Rating</th>
                          <th style={{textAlign: 'right', padding: '5px'}}>Total Rents</th>
                       </tr>
                    </thead>
                    <tbody>
                    {brandStatsReport.map((brand, index) => (
                      <tr key={index} style={{borderBottom: '1px solid #eee'}}>
                         <td style={{padding: '5px'}}>{brand.brand}</td>
                         <td style={{textAlign: 'right', padding: '5px'}}>{parseFloat(brand.average_driver_rating).toFixed(1)}</td>
                         <td style={{textAlign: 'right', padding: '5px'}}>{brand.total_rents}</td>
                      </tr>
                    ))}
                    </tbody>
                 </table>
              </div>
            )}
          </div>

          {/*  other manager actions */}

        </div>
      )}
    </div>
  );
}

export default Managers; 
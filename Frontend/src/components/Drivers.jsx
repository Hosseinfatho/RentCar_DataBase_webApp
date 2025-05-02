import React, { useState, useEffect } from 'react'; // Import hooks
import './component.css'; // Add a CSS import for component-specific styles

// Reuse API_URL - ensure it's accessible here
const API_URL = 'http://localhost:5001/api'; 

function Drivers() {
  // State for Login
  const [loginName, setLoginName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentDriverInfo, setCurrentDriverInfo] = useState(null); // Store logged in driver data
  const [loginMessage, setLoginMessage] = useState(''); // For login feedback

  // State for Changing Address
  const [newAddress, setNewAddress] = useState('');
  const [addressMessage, setAddressMessage] = useState(''); // <-- Add state for address feedback

  // State for Car Models
  const [allCarModels, setAllCarModels] = useState([]); // List of all models
  const [drivableModels, setDrivableModels] = useState([]); // Models the logged-in driver can drive
  const [selectedModel, setSelectedModel] = useState(''); // Model to add/remove from drivable list
  const [modelDeclareMessage, setModelDeclareMessage] = useState(''); // <-- Add state for model declaration feedback

  // --- Updated Login Handler ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMessage(''); // Clear previous messages
    console.log('Attempting to login Driver:', loginName);

    if (!loginName) {
        setLoginMessage('Please enter your name.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/drivers/login`, { // Use the new endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: loginName }),
        });

        const data = await response.json();

        if (response.ok) {
            setLoginMessage(data.message || 'Login successful!');
            setIsLoggedIn(true);
            setCurrentDriverInfo(data.driver); // Store driver info from backend
            // --- Store the token --- 
            localStorage.setItem('driver_access_token', data.access_token);
            
            // Pre-fill address field with fetched address
            // Combine address parts for display/editing
            const fullAddress = `${data.driver.roadname || ''} ${data.driver.number || ''}, ${data.driver.city || ''}, ${data.driver.zipcode || ''}`.trim();
            setNewAddress(fullAddress);
            
            setLoginName(''); // Clear login form

            // Fetch models after successful login
            fetchAllCarModels(); 
            fetchDrivableModels(data.driver.name);
        } else {
            setLoginMessage(`Login failed: ${data.error || response.statusText}`);
            setIsLoggedIn(false);
            setCurrentDriverInfo(null);
            localStorage.removeItem('driver_access_token'); // Clear token on failure
        }
    } catch (error) {
        console.error('Driver login network error:', error);
        setLoginMessage('Login failed: Network error or server is down.');
        setIsLoggedIn(false);
        setCurrentDriverInfo(null);
        localStorage.removeItem('driver_access_token');
    }
  };

  // --- Add Logout Handler ---
  const handleLogout = () => {
      setIsLoggedIn(false);
      setCurrentDriverInfo(null);
      setLoginMessage('');
      setLoginName('');
      setNewAddress('');
      setAllCarModels([]);
      setDrivableModels([]);
      setSelectedModel('');
      // --- Remove the token --- 
      localStorage.removeItem('driver_access_token'); 
      console.log('Driver logged out');
  };

  // --- Updated Address Change Handler ---
  const handleAddressChange = async (e) => {
    e.preventDefault();
    setAddressMessage(''); // Clear previous message
    const token = localStorage.getItem('driver_access_token');

    if (!token) {
        setAddressMessage('Authentication error. Please login again.');
        return;
    }

    if (!newAddress) {
        setAddressMessage('Please enter the new address.');
        return;
    }

    // --- Simple Address Parsing --- 
    // Expects format like: "Street Name Number, City Name, Zip Code"
    // Example: "Elm Street 45, Springfield, 12345"
    const parts = newAddress.split(',').map(part => part.trim());
    let roadname, number, city, zipcode;

    if (parts.length === 3) {
        const firstPartSplit = parts[0].lastIndexOf(' ');
        if (firstPartSplit !== -1) {
            roadname = parts[0].substring(0, firstPartSplit).trim();
            number = parts[0].substring(firstPartSplit + 1).trim();
        } else {
           // Handle cases where street name might not have a number or format is unexpected
           // For simplicity, assign the whole first part to roadname if no space found
           roadname = parts[0];
           number = ''; // Or some default/error handling
        }
        city = parts[1];
        zipcode = parts[2];
    } else {
        setAddressMessage('Invalid address format. Please use: Street Name Number, City, Zip Code');
        return;
    }

    // Basic validation (optional but recommended)
    if (!roadname || !number || !city || !zipcode) {
        setAddressMessage('Could not parse address components. Please check format.');
        return;
    }
    // --- End Address Parsing ---

    console.log('Updating address for', currentDriverInfo?.name, 'to:', { roadname, number, city, zipcode });

    try {
        const response = await fetch(`${API_URL}/drivers/address`, { // Use the new PUT endpoint
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Add the JWT token
            },
            body: JSON.stringify({ roadname, number, city, zipcode }), // Send parsed components
        });

        const data = await response.json();

        if (response.ok) {
            setAddressMessage(data.message || 'Address updated successfully!');
            // Update currentDriverInfo state with the new address details from backend
            setCurrentDriverInfo({ 
                ...currentDriverInfo, 
                roadname: data.address.roadname,
                number: data.address.number,
                city: data.address.city,
                zipcode: data.address.zipcode
            });
            // Optionally clear the input field or update it to the newly confirmed address
            // setNewAddress(''); 
        } else {
            setAddressMessage(`Address update failed: ${data.error || response.statusText}`);
        }
    } catch (error) {
        console.error('Address update network error:', error);
        setAddressMessage('Address update failed: Network error or server is down.');
    }
  };

  // --- Car Model Functions ---
  const fetchAllCarModels = async () => {
    console.log('Fetching all car models from API...');
    const token = localStorage.getItem('driver_access_token');

    if (!token) {
        console.error('Cannot fetch car models: No authentication token found.');
        setAllCarModels([]);
        return; 
    }

    try {
        const response = await fetch(`${API_URL}/cars/models`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Data received from /api/cars/models:", data); // <-- Log received data
            // The backend returns list under 'cars' key, and uses 'id' directly
            setAllCarModels(data.cars || []); 
            console.log("allCarModels state updated to:", data.cars || []); // <-- Log updated state
        } else {
            console.error('Failed to fetch car models:', response.status, response.statusText);
            const errorData = await response.json().catch(() => ({}));
            console.error('Error details:', errorData);
            setAllCarModels([]);
        }
    } catch (error) {
        console.error('Network error fetching car models:', error);
        setAllCarModels([]);
    }
  };

  const fetchDrivableModels = (driverName) => {
    // TODO: Implement this function to fetch currently drivable models on login
    console.log('(Placeholder) Fetching drivable models for', driverName);
    // Simulate fetch - **Update to use CARID**
    setDrivableModels(['C001']); // Example placeholder
  };

  // --- Updated Declare Drivable Model Handler ---
  const handleDeclareModel = async (e) => {
    e.preventDefault();
    setModelDeclareMessage(''); // Clear previous message
    const token = localStorage.getItem('driver_access_token');

    if (!selectedModel) {
        setModelDeclareMessage('Please select a model first.');
        return;
    }
    if (!token) {
        setModelDeclareMessage('Authentication error. Please login again.');
        return;
    }
    // Optional: Check if already declared locally to prevent unnecessary API calls
    if (drivableModels.includes(selectedModel)) {
        setModelDeclareMessage('You have already declared this model.');
        return;
    }

    console.log('Declaring model', selectedModel, 'as drivable for', currentDriverInfo?.name);

    try {
        const response = await fetch(`${API_URL}/drivers/drivable-models`, { // Use the new POST endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Add JWT token
            },
            body: JSON.stringify({ car_id: selectedModel }), // Send the selected CARID
        });

        const data = await response.json();

        if (response.ok) {
            setModelDeclareMessage(data.message || 'Model declared successfully!');
            // Add the model to the local state only on successful backend confirmation
            setDrivableModels([...drivableModels, selectedModel]);
            setSelectedModel(''); // Clear selection after successful declaration
        } else {
            // Handle specific errors like conflict (409) or others
            setModelDeclareMessage(`Failed to declare model: ${data.error || response.statusText}`);
        }
    } catch (error) {
        console.error('Declare model network error:', error);
        setModelDeclareMessage('Failed to declare model: Network error or server is down.');
    }
  };

  const handleRemoveDrivableModel = (carId) => {
    // TODO: Implement API call for removing a drivable model
    console.log('(Placeholder) Removing model', carId, 'from drivable list for', currentDriverInfo?.name);
    // Optimistic UI update (remove immediately, revert on error if needed)
    setDrivableModels(drivableModels.filter(id => id !== carId));
  };

  // UseEffect to fetch models when component loads (if needed, e.g., for a dropdown)
  // useEffect(() => {
  //   fetchAllCarModels();
  // }, []);

  return (
    <div className="component-content"> {/* Add a wrapper for content below image */}
      <div className="image-container">
        <img src="/images/driver.png" alt="Driver illustration" />
      </div>
      <h2>Drivers</h2>

      {!isLoggedIn ? (
        // --- Login Section ---
        <div className="action-section">
          <h3>Driver Login</h3>
          <form onSubmit={handleLogin} className="sub-action">
            <div className="controls">
              <input 
                type="text" 
                placeholder="Enter your Name..." 
                value={loginName} 
                onChange={(e) => setLoginName(e.target.value)} 
                required
              />
              <button type="submit">Login</button>
            </div>
            {/* Display Login Message */}
            {loginMessage && <p className={`message ${loginMessage.includes('failed') ? 'error' : 'success'}`}>{loginMessage}</p>}
          </form>
        </div>
      ) : (
        // --- Logged In Driver Actions ---
        <div>
           {/* Updated Logout Button */}
           <div style={{ textAlign: 'right', marginBottom: '10px', padding: '5px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
             Welcome, {currentDriverInfo?.name}! 
             <button onClick={handleLogout} style={{ marginLeft: '15px' }}>Logout</button>
          </div>

           {/* --- Change Address Section --- */}
           <div className="action-section">
              <h3>Update Address</h3>
              <p>Current Address: {currentDriverInfo?.roadname} {currentDriverInfo?.number}, {currentDriverInfo?.city}, {currentDriverInfo?.zipcode}</p>
              <form onSubmit={handleAddressChange} className="sub-action">
                  <div className="controls stacked">
                      <input 
                        type="text" 
                        placeholder="Enter New Full Address (Street Name Number, City, Zip Code)" // Updated placeholder
                        value={newAddress} 
                        onChange={(e) => setNewAddress(e.target.value)} 
                        required
                      />
                      <button type="submit">Update Address</button>
                  </div>
                  {/* Display Address Update Message */}
                  {addressMessage && <p className={`message ${addressMessage.includes('failed') || addressMessage.includes('Invalid') || addressMessage.includes('error') ? 'error' : 'success'}`}>{addressMessage}</p>}
              </form>
           </div>

            {/* --- View All Models Section --- */}
            <div className="action-section">
              <h3>Available Car Models</h3>
              <div className="results sub-action">
                {allCarModels.length > 0 ? (
                  <ul>
                     {/* Use car.id (CARID) as key */}
                    {allCarModels.map(car => (
                      <li key={car.id}>{car.year} {car.make} {car.model}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Loading car models...</p> // Changed message
                )}
              </div>
            </div>

           {/* --- Declare Drivable Models Section --- */}
           <div className="action-section">
              <h3>Declare Drivable Models</h3>
              <form onSubmit={handleDeclareModel} className="sub-action">
                 <div className="controls">
                    <select 
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      required
                    >
                       <option value="">-- Select Model --</option>
                       {allCarModels.map(car => (
                         <option key={car.id} value={car.id}>
                           {car.year} {car.make} {car.model} (ID: {car.id})
                         </option>
                       ))}
                    </select>
                    <button type="submit">Declare Drivable</button>
                 </div>
                 {/* Display Model Declare Message */}
                 {modelDeclareMessage && <p className={`message ${modelDeclareMessage.includes('Failed') || modelDeclareMessage.includes('error') ? 'error' : 'success'}`}>{modelDeclareMessage}</p>}
              </form>
              {/* Display currently declared models */} 
              {drivableModels.length > 0 && (
                <div className="results sub-action">
                   <h4>Models You Can Drive:</h4>
                   <ul>
                      {drivableModels.map(carId => {
                         const modelInfo = allCarModels.find(m => m.id === carId);
                         return modelInfo ? (
                           <li key={carId}>
                             {modelInfo.year} {modelInfo.make} {modelInfo.model} (ID: {modelInfo.id})
                             <button 
                               onClick={() => handleRemoveDrivableModel(carId)} 
                               style={{ marginLeft: '10px', fontSize: '0.8em', padding: '2px 5px' }}
                             >
                               Remove
                             </button>
                           </li>
                         ) : null;
                      })}
                   </ul>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}

export default Drivers; 
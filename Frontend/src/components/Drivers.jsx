import React, { useState, useEffect } from 'react'; // Import hooks
import './component.css'; // Add a CSS import for component-specific styles

const API_URL = 'http://localhost:5000/api';

function Drivers() {
  // State for Login
  const [loginName, setLoginName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentDriverInfo, setCurrentDriverInfo] = useState(null); // Store logged in driver data

  // State for Changing Address
  const [newAddress, setNewAddress] = useState('');
  const [driverMessage, setDriverMessage] = useState(''); 

  // State for Car Models
  const [allCarModels, setAllCarModels] = useState([]); // List of all models
  const [drivableModels, setDrivableModels] = useState([]); // Models the logged-in driver can drive
  const [selectedModel, setSelectedModel] = useState(''); // Model to add/remove from drivable list

  // --- Placeholder Handlers ---
  const handleLogin = async (e) => {
    e.preventDefault();
    //  setLoginMessage('');
    console.log('Logging in Driver:', loginName);
     setDriverMessage(`trying`);
    try {
      const response = await fetch(`${API_URL}/drivers/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: loginName }),
      });
      const data = await response.json();

      if (response.ok) {
        setDriverMessage('Login successful!');
        setIsLoggedIn(true);
        // setManagerInfo(data.manager);
        // --- Store the token --- (Use localStorage to persist across sessions)
        localStorage.setItem('driver_access_token', data.access_token);
        // setLoginSsn('');
        setCurrentDriverInfo({ name: loginName, address: '123 Main St' }); // Simulate fetch
        setNewAddress('123 Main St'); // Pre-fill address field
        fetchAllCarModels(); // Fetch all models on login
        // fetchDrivableModels(loginName)
      } else {
        setDriverMessage(`Login failed: ${data.error || response.statusText}`);
        setIsLoggedIn(false);
        // setManagerInfo(null);
        localStorage.removeItem('driver_access_token'); // Ensure token is removed on failed login
      }
    } catch (error) {
      console.error('Login network error:', error);
      setDriverMessage('Login failed: Network error or server is down.');
      setIsLoggedIn(false);
      // setManagerInfo(null);
      localStorage.removeItem('driver_access_token');
    }    
    // On success, set login status and fetch driver info & models
    // setIsLoggedIn(true);
    ; // Fetch models this driver can drive
  };


  
  const parseAddress = (address) => {
    const parts = address.split(" ");
    if (parts.length < 4) return null;
  
    return {
      roadname: parts.slice(0, -3).join(" "),
      number: parts[parts.length - 3],
      city: parts[parts.length - 2],
      zipcode: parts[parts.length - 1]
    };
  };
  
  const handleAddressChange = async (e) => {
    e.preventDefault();
  
    const parsedAddress = parseAddress(newAddress);
    if (!parsedAddress) {
      setDriverMessage("Invalid address format!");
      return;
    }
  
    console.log("Parsed Address:", parsedAddress);
    setDriverMessage("Parsed Address:", parsedAddress);
  
    try {
      const response = await fetch(`${API_URL}/drivers/updateAddress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: currentDriverInfo?.name,
          new_city: parsedAddress.city,
          new_num: parsedAddress.number,
          new_road: parsedAddress.roadname,
          new_zip: parsedAddress.zipcode
        }),
      });
  
      const data = await response.json();
      if (response.ok) {
        console.log("Address updated successfully:", data.updated_address);
        setDriverMessage("Address updated successfully:", data.updated_address);
        setCurrentDriverInfo({ ...currentDriverInfo, ...parsedAddress });
      } else {
        console.error("Failed to update address:", data.error);
        setDriverMessage("Failed to update address:", data.error);
      }
    } catch (error) {
      console.error("Network error updating address:", error);
      setDriverMessage("Network error updating address:", error);
    }
  };

  // --- Car Model Functions ---
  const fetchAllCarModels = async () => {
    console.log("Fetching all car models...");
    
    try {
        const response = await fetch(`${API_URL}/models`);
        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
            setAllCarModels(data);
        } else {
            console.error("Invalid API response:", data);
            setAllCarModels([]); // Set an empty array if response is invalid
        }
    } catch (error) {
        console.error("Network error fetching car models:", error);
        setAllCarModels([]); // Set an empty array in case of error
    }
};
const fetchDrivableModels = async (driverName) => {
  console.log("Fetching drivable models for", driverName);

  try {
      const response = await fetch(`${API_URL}/models/no-drivers`);
      const modelsWithoutDrivers = await response.json();

      setDrivableModels(modelsWithoutDrivers); // Update state with filtered models
  } catch (error) {
      console.error("Error fetching models without drivers:", error);
  }
};
  // const fetchDrivableModels = (driverName) => {
  //   console.log('Fetching drivable models for', driverName);
  //   // TODO: API Call to backend to get models driverName can drive
  //   // Simulate fetch
  //   setDrivableModels([1]); // Assume driver can drive Toyota Camry (id 1)
  // };
  const handleDeclareModel = async (e) => {
    e.preventDefault();
    if (!selectedModel || !currentDriverInfo?.name) {
        console.error("Missing model or driver information.");
        return;
    }

    const modelId = selectedModel;
    const driverName = currentDriverInfo.name;

    console.log(`Assigning driver '${driverName}' to model '${modelId}'`);

    try {
        // API call to assign the driver's name to the selected model
        const response = await fetch(`${API_URL}/models/assign-driver`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                driver_name: driverName,
                model_id: modelId,
            }),
        });

        const result = await response.json();

        if (response.ok) {
            console.log(`Driver '${driverName}' successfully assigned to model '${modelId}'`);
            if (!drivableModels.includes(modelId)) {
                setDrivableModels([...drivableModels, modelId]);  // Update UI state
            }
        } else {
            console.error("Failed to assign driver to model:", result.error);
        }
    } catch (error) {
        console.error("Network error while declaring model:", error);
    }
};
  // const handleDeclareModel = (e) => {
  //   e.preventDefault();
  //   if (!selectedModel) return;
  //   const modelId = parseInt(selectedModel);
  //   console.log('Declaring model', modelId, 'as drivable for', currentDriverInfo?.name);
  //   // TODO: API Call to backend to add model to driver's list
  //   if (!drivableModels.includes(modelId)) {
  //     setDrivableModels([...drivableModels, modelId]);
  //   }
  // };
  // const handleDeclareModel = (e) => {
  //   e.preventDefault();
  //   if (!selectedModel) return;
  //   const modelId = parseInt(selectedModel);
  //   console.log('Declaring model', modelId, 'as drivable for', currentDriverInfo?.name);
  //   // TODO: API Call to backend to add model to driver's list
  //   if (!drivableModels.includes(modelId)) {
  //     setDrivableModels([...drivableModels, modelId]);
  //   }
  // };

  const handleRemoveDrivableModel = (modelId) => {
    console.log('Removing model', modelId, 'from drivable list for', currentDriverInfo?.name);
    // TODO: API Call to backend to remove model from driver's list
    setDrivableModels(drivableModels.filter(id => id !== modelId));
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
              />
              <button type="submit">Login</button>
            </div>
          </form>
          {/* {driverMessage && <p className={`message ${driverMessage.includes('Failed') || driverMessage.includes('Error') ? 'error' : 'success'}`}>{driverMessage}</p>} */}
        </div>
      ) : (
        // --- Logged In Driver Actions ---
        <div>
           <p style={{textAlign: 'right'}}>Logged In as: {currentDriverInfo?.name} <button onClick={() => setIsLoggedIn(false)}>Logout</button></p>

           {/* --- Change Address Section --- */}
           <div className="action-section">
              <h3>Update Address</h3>
              <form onSubmit={handleAddressChange} className="sub-action">
                  <div className="controls stacked">
                      <input 
                        type="text" 
                        placeholder="New Address" 
                        value={newAddress} 
                        onChange={(e) => setNewAddress(e.target.value)} 
                      />
                      <button type="submit">Update Address</button>
                  </div>
              </form>
              {driverMessage && <p className={`message ${driverMessage.includes('Failed') || driverMessage.includes('Error') ? 'error' : 'success'}`}>{driverMessage}</p>}
           </div>

            {/* --- View All Models Section --- */}
            <div className="action-section">
              <h3>Available Car Models</h3>
              <div className="results sub-action">
                {allCarModels.length > 0 ? (
                  <ul>
                    {allCarModels.map(car => (
                      <li key={car.id}>{car.year} {car.make} {car.model}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No car models found.</p>
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
                           {car.year} {car.make} {car.model}
                         </option>
                       ))}
                    </select>
                    <button type="submit">Declare Drivable</button>
                 </div>
              </form>
              {/* Display currently declared models */} 
              {drivableModels.length > 0 && (
                <div className="results sub-action">
                   <h4>Models You Can Drive:</h4>
                   <ul>
                      {drivableModels.map(modelId => {
                         const modelInfo = allCarModels.find(m => m.id === modelId);
                         return modelInfo ? (
                           <li key={modelId}>
                             {modelInfo.year} {modelInfo.make} {modelInfo.model} 
                             <button 
                               onClick={() => handleRemoveDrivableModel(modelId)} 
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
import React, { useState, useEffect } from 'react'; // Import hooks
import './component.css'; // Add a CSS import for component-specific styles

function Drivers() {
  // State for Login
  const [loginName, setLoginName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentDriverInfo, setCurrentDriverInfo] = useState(null); // Store logged in driver data

  // State for Changing Address
  const [newAddress, setNewAddress] = useState('');

  // State for Car Models
  const [allCarModels, setAllCarModels] = useState([]); // List of all models
  const [drivableModels, setDrivableModels] = useState([]); // Models the logged-in driver can drive
  const [selectedModel, setSelectedModel] = useState(''); // Model to add/remove from drivable list

  // --- Placeholder Handlers ---
  const handleLogin = (e) => {
    e.preventDefault();
    console.log('Logging in Driver:', loginName);
    // TODO: API Call to backend to verify driver name
    // On success, set login status and fetch driver info & models
    setIsLoggedIn(true);
    setCurrentDriverInfo({ name: loginName, address: '123 Main St' }); // Simulate fetch
    setNewAddress('123 Main St'); // Pre-fill address field
    fetchAllCarModels(); // Fetch all models on login
    fetchDrivableModels(loginName); // Fetch models this driver can drive
  };

  const handleAddressChange = (e) => {
    e.preventDefault();
    console.log('Changing address for', currentDriverInfo?.name, 'to', newAddress);
    // TODO: API call to backend to update address
    setCurrentDriverInfo({ ...currentDriverInfo, address: newAddress }); // Update local state
  };

  // --- Car Model Functions ---
  const fetchAllCarModels = () => {
    console.log('Fetching all car models...');
    // TODO: API Call to backend to get all models
    // Simulate fetch
    setAllCarModels([
      { id: 1, make: 'Toyota', model: 'Camry', year: 2022 },
      { id: 2, make: 'Honda', model: 'Civic', year: 2023 },
      { id: 3, make: 'Ford', model: 'Mustang', year: 2021 },
    ]);
  };

  const fetchDrivableModels = (driverName) => {
    console.log('Fetching drivable models for', driverName);
    // TODO: API Call to backend to get models driverName can drive
    // Simulate fetch
    setDrivableModels([1]); // Assume driver can drive Toyota Camry (id 1)
  };

  const handleDeclareModel = (e) => {
    e.preventDefault();
    if (!selectedModel) return;
    const modelId = parseInt(selectedModel);
    console.log('Declaring model', modelId, 'as drivable for', currentDriverInfo?.name);
    // TODO: API Call to backend to add model to driver's list
    if (!drivableModels.includes(modelId)) {
      setDrivableModels([...drivableModels, modelId]);
    }
  };

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
import React, { useState } from 'react';
import './component.css'; // Add a CSS import for component-specific styles

function Managers() {
const[regName,setRegName]=useState('');
const[regSsn,setRegSsn]=useState('');
const[regEmail,setRegEmail]=useState('');

//state for login 
const[loginSsn,setLoginSsn]=useState('');
const[isLoggedIn,setIsLoggedIn]=useState(false);

//state for add remove
const[carMake,setCarMake]=useState('');
const[carModel,setCarModel]=useState('');
const[carYear,setCarYear]=useState('');

//state for top-k
const[kValue,setKValue]=useState('');
const[topKClients,setTopKClients]=useState([]);


const handleRegister=async(e)=>{
  e.preventDefault();
  console.log('Registeration Managers',{name:regName,ssn:regSsn,email:  regEmail});
 setIsLoggedIn(true);
};
const handleLogin=(e)=>{
  e.preventDefault();
console.log('login',{ssn:loginSsn});

//API backend
setIsLoggedIn(true);
};
const handleAddCarModel=(e)=>{
  e.preventDefault();
console.log('adding car model',{make:carMake,model:carModel,year:carYear});

//API backend

};
const handleRemoveCarModel=(e)=>{
  e.preventDefault();
console.log('Removing car model',{make:carMake,model:carModel,year:carYear});

//API backend
};

const handelGetTopKClients=(e)=>{
  e.preventDefault();
  console.log('getting top k clients',{k:kValue});


 setTopKClients([
  {name:'John Doe',email:'john.doe@example.com'},
  {name:'Jane Smith',email:'jane.smith@example.com'},
  {name:'Alice Johnson',email:'alice.johnson@example.com'},
  {name:'Bob Brown',email:'bob.brown@example.com'},
  {name:'Charlie Davis',email:'charlie.davis@example.com'},
 ]);  
};






return (
    <div className="component-content"> {/* Add a wrapper for content below image */}
      <div className="image-container">
        <img src="/images/manager.png" alt="Manager illustration" />
      </div>
      <h2>Managers</h2>
      
      {/* --- Login/Register Section --- */}
      {!isLoggedIn ? (
        <div className="action-section">
          <h3>Login / Register</h3>
          <form onSubmit={handleLogin} className="sub-action">
            <h4>Login</h4>
            <div className="controls">
              <input 
                type="text" 
                placeholder="Enter SSN to login..." 
                value={loginSsn} 
                onChange={(e) => setLoginSsn(e.target.value)}
              />
              <button type="submit">Login</button>
            </div>
          </form>
          <hr />
          <form onSubmit={handleRegister} className="sub-action">
            <h4>Register New Manager</h4>
             <div className="controls stacked">
                <input type="text" placeholder="Name" value={regName} onChange={(e) => setRegName(e.target.value)} />
                <input type="text" placeholder="SSN" value={regSsn} onChange={(e) => setRegSsn(e.target.value)} />
                <input type="email" placeholder="Email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                <button type="submit">Register</button>
            </div>
          </form>
        </div>
      ) : (
        // Show Manager Actions only if logged in
        <div>
          <p style={{textAlign: 'right'}}>Logged In <button onClick={() => setIsLoggedIn(false)}>Logout</button></p>
          
          {/* --- Car Management Section --- */}
          <div className="action-section">
            <h3>Manage Cars / Models</h3>
            <form onSubmit={handleAddCarModel} className="sub-action">
              <h4>Add/Remove Car Model</h4>
              <div className="controls stacked">
                <input type="text" placeholder="Make (e.g., Toyota)" value={carMake} onChange={(e) => setCarMake(e.target.value)} />
                <input type="text" placeholder="Model (e.g., Camry)" value={carModel} onChange={(e) => setCarModel(e.target.value)} />
                <input type="number" placeholder="Year" value={carYear} onChange={(e) => setCarYear(e.target.value)} />
                <div> {/* Button group */}
                  <button type="submit">Add Model</button>
                  <button type="button" onClick={handleRemoveCarModel} style={{marginLeft: '10px'}}>Remove Model</button> 
                </div>
              </div>
            </form>
            {/* TODO: Add UI for removing specific cars */} 
          </div>

          {/* --- Top K Clients Section --- */}
          <div className="action-section">
            <h3>Client Reports</h3>
             <form onSubmit={handelGetTopKClients} className="sub-action">
              <h4>Top-K Clients by Rents</h4>
              <div className="controls">
                <input type="number" placeholder="Enter K" value={kValue} onChange={(e) => setKValue(e.target.value)} />
                <button type="submit">Get Top K</button>
              </div>
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
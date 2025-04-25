import React from 'react'; 
import './App.css'; // Default Vite App CSS
import Managers from './components/Managers.jsx'; 
import Clients from './components/Clients.jsx';
import Drivers from './components/Drivers.jsx';

function App() {
  return (
    <div className='App'> 
      <h1>Taxi Rental System</h1>
      {/* Add a container for layout */}
      <div className="container">
        {/* Wrap each component in a section div */}
        <div className="section">
          <Managers />
        </div>
        <div className="section">
          <Clients />
        </div>
        <div className="section">
          <Drivers />
        </div>
      </div>
    </div>
  );
}

export default App; 
import React, { useState } from 'react'; 
import './App.css'; // Default Vite App CSS
import Managers from './components/Managers.jsx'; 
import Clients from './components/Clients.jsx';
import Drivers from './components/Drivers.jsx';
import AboutModal from './components/AboutModal.jsx'; // Import the new modal component

function App() {
  const [showAboutModal, setShowAboutModal] = useState(false);

  const openAboutModal = () => setShowAboutModal(true);
  const closeAboutModal = () => setShowAboutModal(false);

  return (
    // Add relative positioning to allow absolute positioning of button inside
    <div className='App' style={{ position: 'relative' }}> 
      {/* Add About button */}
      <button className="about-button" onClick={openAboutModal}>About</button>

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

      {/* Conditionally render the About modal */}
      {showAboutModal && <AboutModal onClose={closeAboutModal} />}
    </div>
  );
}

export default App; 
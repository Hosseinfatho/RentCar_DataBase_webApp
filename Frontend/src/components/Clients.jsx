import React from 'react';
import './component.css'; // Add a CSS import for component-specific styles

function Clients() {
  return (
    <div className="component-content"> {/* Add a wrapper for content below image */}
      <div className="image-container">
        <img src="/images/client.png" alt="Client illustration" />
      </div>
      <h2>Clients</h2>
      {/* Client content goes here */}
    </div>
  );
}

export default Clients; 
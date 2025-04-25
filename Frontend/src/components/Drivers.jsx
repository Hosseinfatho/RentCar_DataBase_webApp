import React from 'react';
import './component.css'; // Add a CSS import for component-specific styles

function Drivers() {
  return (
    <div className="component-content"> {/* Add a wrapper for content below image */}
      <div className="image-container">
        <img src="/images/driver.png" alt="Driver illustration" />
      </div>
      <h2>Drivers</h2>
      {/* Driver content goes here */}
    </div>
  );
}

export default Drivers; 
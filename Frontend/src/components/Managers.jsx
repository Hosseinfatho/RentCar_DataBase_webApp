import React from 'react';
import './component.css'; // Add a CSS import for component-specific styles

function Managers() {
  return (
    <div className="component-content"> {/* Add a wrapper for content below image */}
      <div className="image-container">
        <img src="/images/manager.png" alt="Manager illustration" />
      </div>
      <h2>Managers</h2>
      {/* Manager content goes here */}
    </div>
  );
}

export default Managers; 
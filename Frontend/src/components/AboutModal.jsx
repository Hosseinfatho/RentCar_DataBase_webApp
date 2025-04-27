import React from 'react';
import './modal.css'; // We'll create this CSS file next

function AboutModal({ onClose }) {
  const aboutText = `This web application was developed as the final project for the Database Systems course (Spring 2025) at the University of Illinois Chicago. Designed to manage a taxi rental service, the system includes dedicated interfaces and functionality for three user roles: managers, drivers, and clients. The project emphasizes real-world database implementation and system design using PostgreSQL, Flask, and JavaScript. It was created by students: Hossein Fathollahian, Yamaan Nandolia, and Kaustubha Medikundam under the guidance of Professor Stavros Sintos.`;

  return (
    <div className="modal-overlay" onClick={onClose}> {/* Close on overlay click */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* Prevent closing when clicking inside content */}
        <h2>About This Project</h2>
        <p>{aboutText}</p>
        <button className="modal-close-button" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default AboutModal; 
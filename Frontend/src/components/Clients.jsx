import React, { useState, useEffect } from 'react'; // Import hooks
import './component.css'; // Add a CSS import for component-specific styles

function Clients() {
  // --- State Variables ---
  // Login/Register
  const [loginEmail, setLoginEmail] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAddress, setRegAddress] = useState(''); // Simplified: assuming one address for now
  const [regCard, setRegCard] = useState(''); // Simplified: assuming one card for now
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [clientInfo, setClientInfo] = useState(null);

  // Check Availability
  const [checkDate, setCheckDate] = useState('');
  const [availableModels, setAvailableModels] = useState([]);

  // Book Rent
  const [bookDate, setBookDate] = useState('');
  const [bookModelId, setBookModelId] = useState('');
  const [bookingStatus, setBookingStatus] = useState('');

  // View Rents
  const [bookedRents, setBookedRents] = useState([]);
  const [showRents, setShowRents] = useState(false);

  // Review Driver
  const [reviewDriverId, setReviewDriverId] = useState(''); // Need a way to select driver (e.g., from booked rents)
  const [reviewRating, setReviewRating] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');

  // --- Placeholder Handlers ---
  const handleLogin = (e) => {
    e.preventDefault();
    console.log('Logging in Client:', loginEmail);
    // TODO: API Call to backend to verify email
    // On success:
    setIsLoggedIn(true);
    setClientInfo({ name: 'Test Client', email: loginEmail }); // Simulate fetch
    fetchBookedRents(loginEmail); // Fetch rents on login
  };

  const handleRegister = (e) => {
    e.preventDefault();
    console.log('Registering Client:', { name: regName, email: regEmail, address: regAddress, card: regCard });
    // TODO: API Call to backend to register client
    // On success, maybe log them in:
    setIsLoggedIn(true);
    setClientInfo({ name: regName, email: regEmail });
    fetchBookedRents(regEmail);
  };

  const handleCheckAvailability = (e) => {
    e.preventDefault();
    console.log('Checking availability for date:', checkDate);
    // TODO: API Call to backend to check available models on checkDate
    // Simulate result:
    setAvailableModels([
      { id: 1, make: 'Toyota', model: 'Camry', year: 2022 },
      { id: 2, make: 'Honda', model: 'Civic', year: 2023 },
    ]);
    setBookDate(checkDate); // Pre-fill booking date
  };

  const handleBookRent = (e) => {
    e.preventDefault();
    if (!bookModelId || !bookDate) {
      setBookingStatus('Please select a date and model first.');
      return;
    }
    console.log('Booking rent for model:', bookModelId, 'on date:', bookDate);
    // TODO: API Call to backend to book rent
    // On success:
    setBookingStatus(`Successfully booked model ${bookModelId} for ${bookDate}! Driver will be assigned.`);
    fetchBookedRents(clientInfo?.email); // Refresh booked rents
    // On failure:
    // setBookingStatus('Failed to book rent. Model might no longer be available.');
  };

  const fetchBookedRents = (clientEmail) => {
    if (!clientEmail) return;
    console.log('Fetching booked rents for:', clientEmail);
    // TODO: API Call to backend to get rents for this client
    // Simulate result:
    setBookedRents([
      { rentId: 101, date: '2024-10-20', model: 'Toyota Camry', driver: 'Driver Dave' },
      { rentId: 102, date: '2024-11-05', model: 'Honda Civic', driver: 'Driver Emma' },
    ]);
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!reviewDriverId || !reviewRating) {
      setReviewStatus('Please select a driver and rating.');
      return;
    }
    console.log('Submitting review:', { driverId: reviewDriverId, rating: reviewRating, comment: reviewComment });
    // TODO: API Call to backend to submit review (backend validates if driver was used by client)
    // On success:
    setReviewStatus('Review submitted successfully!');
    // On failure (e.g., driver not associated with client rents):
    // setReviewStatus('Error: Cannot review this driver.');
  };

  // Add handler for requirement 6 if needed
  const handleBookBestDriver = (e) => {
     e.preventDefault();
     // Similar to handleBookRent, but with different backend endpoint/parameter
     console.log('Booking rent with BEST driver for model:', bookModelId, 'on date:', bookDate);
     // TODO: API call to backend
     setBookingStatus(`Successfully booked model ${bookModelId} with BEST driver for ${bookDate}!`);
     fetchBookedRents(clientInfo?.email);
  }

  return (
    <div className="component-content"> {/* Add a wrapper for content below image */}
      <div className="image-container">
        <img src="/images/client.png" alt="Client illustration" />
      </div>
      <h2>Clients</h2>

      {!isLoggedIn ? (
         // --- Login/Register Section ---
         <div className="action-section">
          <h3>Login / Register</h3>
          <form onSubmit={handleLogin} className="sub-action">
            <h4>Login</h4>
            <div className="controls stacked">
              <input 
                type="email" 
                placeholder="Enter Email..." 
                value={loginEmail} 
                onChange={(e) => setLoginEmail(e.target.value)}
                required 
              />
              <button type="submit">Login</button>
            </div>
          </form>
          <hr />
          <form onSubmit={handleRegister} className="sub-action">
            <h4>Register New Client</h4>
             <div className="controls stacked">
                <input type="text" placeholder="Name" value={regName} onChange={(e) => setRegName(e.target.value)} required />
                <input type="email" placeholder="Email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                <input type="text" placeholder="Address (Street, City, Zip)" value={regAddress} onChange={(e) => setRegAddress(e.target.value)} />
                <input type="text" placeholder="Credit Card (Number, Exp, CVV)" value={regCard} onChange={(e) => setRegCard(e.target.value)} />
                {/* TODO: Add UI for multiple addresses/cards */} 
                <button type="submit">Register</button>
            </div>
          </form>
        </div>
      ) : (
        // --- Logged In Client Actions ---
        <div>
           <p style={{textAlign: 'right'}}>Welcome, {clientInfo?.name}! <button onClick={() => setIsLoggedIn(false)}>Logout</button></p>

           {/* --- Check Availability & Book Section --- */}
           <div className="action-section">
              <h3>Check Availability & Book</h3>
              <form onSubmit={handleCheckAvailability} className="sub-action">
                  <h4>Check Available Models</h4>
                  <div className="controls">
                      <input 
                        type="date" 
                        value={checkDate} 
                        onChange={(e) => setCheckDate(e.target.value)}
                        required 
                      />
                      <button type="submit">Check</button>
                  </div>
              </form>
              {/* Display Available Models & Booking Form */} 
              {availableModels.length > 0 && (
                 <form onSubmit={handleBookRent} className="sub-action">
                     <h4>Book a Rent for {bookDate}</h4>
                     <div className="controls stacked">
                         <select 
                           value={bookModelId} 
                           onChange={(e) => setBookModelId(e.target.value)}
                           required
                          >
                             <option value="">-- Select Available Model --</option>
                             {availableModels.map(car => (
                               <option key={car.id} value={car.id}>
                                 {car.year} {car.make} {car.model}
                               </option>
                             ))}
                         </select>
                         <div> {/* Button group */}
                            <button type="submit">Book Now</button>
                            {/* Add button for Req 6 if needed */}
                            <button type="button" onClick={handleBookBestDriver} style={{marginLeft: '10px'}}>Book with Best Driver</button> 
                         </div>
                     </div>
                 </form>
              )}
              {bookingStatus && <p className="results">{bookingStatus}</p>}
           </div>

           {/* --- View Booked Rents Section --- */}
           <div className="action-section">
              <h3>My Rents</h3>
              <button onClick={() => setShowRents(!showRents)} className="sub-action">
                 {showRents ? 'Hide' : 'Show'} My Booked Rents
              </button>
              {showRents && (
                 <div className="results sub-action">
                    {bookedRents.length > 0 ? (
                       <ul>
                          {bookedRents.map(rent => (
                             <li key={rent.rentId}>
                                {rent.date}: {rent.model} (Driver: {rent.driver})
                             </li>
                          ))}
                       </ul>
                    ) : (
                       <p>You have no booked rents.</p>
                    )}
                 </div>
              )}
           </div>

           {/* --- Review Driver Section --- */}
           <div className="action-section">
              <h3>Review a Driver</h3>
               <form onSubmit={handleSubmitReview} className="sub-action">
                 <div className="controls stacked">
                    {/* Note: Selecting driver needs improvement. Maybe dropdown based on bookedRents? */} 
                    <select 
                       value={reviewDriverId} 
                       onChange={(e) => setReviewDriverId(e.target.value)}
                       required
                    >
                       <option value="">-- Select Driver from Past Rents --</option>
                       {/* Create unique driver options from bookedRents */} 
                       {[...new Set(bookedRents.map(r => r.driver))].map(driverName => (
                          <option key={driverName} value={driverName}>{driverName}</option> 
                       ))}
                    </select>
                    <input 
                       type="number" 
                       placeholder="Rating (1-5)" 
                       min="1" max="5" 
                       value={reviewRating} 
                       onChange={(e) => setReviewRating(e.target.value)}
                       required 
                    />
                    <textarea 
                       placeholder="Comments (optional)" 
                       value={reviewComment} 
                       onChange={(e) => setReviewComment(e.target.value)} 
                       rows="3"
                     />
                    <button type="submit">Submit Review</button>
                 </div>
              </form>
              {reviewStatus && <p className="results">{reviewStatus}</p>}
           </div>

        </div>
      )}
    </div>
  );
}

export default Clients; 
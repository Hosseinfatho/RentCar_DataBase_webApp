import React, { useState, useEffect } from 'react'; // Import hooks
import './component.css'; // Add a CSS import for component-specific styles
const API_URL = 'http://localhost:5000/api';
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
  // const handleLogin = (e) => {
  //   e.preventDefault();
  //   console.log('Logging in Client:', loginEmail);
  //   // TODO: API Call to backend to verify email
  //   // On success:
  //   setIsLoggedIn(true);
  //   setClientInfo({ name: 'Test Client', email: loginEmail }); // Simulate fetch
  //   fetchBookedRents(loginEmail); // Fetch rents on login
  // };

  const handleLogin = async (e) => {
    e.preventDefault();
    //  setLoginMessage('');
    console.log('Logging in Client:', loginEmail);
    //  setDriverMessage(`trying`);
    try {
      const response = await fetch(`${API_URL}/clients/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail }),
      });
      const data = await response.json();

      if (response.ok) {
        // setDriverMessage('Login successful!');
        setIsLoggedIn(true);
        setClientInfo({ name: 'Test Client', email: loginEmail }); // Simulate fetch
        fetchBookedRents(loginEmail); // Fetch rents on login
        // setManagerInfo(data.manager);
        // --- Store the token --- (Use localStorage to persist across sessions)
        // localStorage.setItem('driver_access_token', data.access_token);
        // setLoginSsn('');
        // setCurrentDriverInfo({ name: loginName, address: '123 Main St' }); // Simulate fetch
        // setNewAddress('123 Main St'); // Pre-fill address field
        // fetchAllCarModels(); // Fetch all models on login
        // fetchDrivableModels(loginName)
      } else {
        // setDriverMessage(`Login failed: ${data.error || response.statusText}`);
        setIsLoggedIn(false);
        // setManagerInfo(null);
        localStorage.removeItem('driver_access_token'); // Ensure token is removed on failed login
      }
    } catch (error) {
      console.error('Login network error:', error);
      // setDriverMessage('Login failed: Network error or server is down.');
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
      number: parts.slice(0, -3).join(" "),
      roadname: parts[parts.length - 3],
      city: parts[parts.length - 2],
      zipcode: parts[parts.length - 1]
    };
  };

  const parseCard = (card) => {
    const parts = card.split(" ");
    if (parts.length < 3) return null;
  
    return {
      cardnumber: parts[0], // First part before any space
      expir: parts[1], // Second part (expiration date)
      cvv: parts[2] // Third part (CVV)
    };
  };
  

  const handleRegister = async (e) => {
    e.preventDefault();
    // setRegMessage('');
    // Include pincode in log message
    const parsedAddress = parseAddress(regAddress);
    if (!parsedAddress) {
      // setDriverMessage("Invalid address format!");
      return;
    }

    const parsedCardInfo = parseCard(regCard);
    if (!parsedCardInfo) {
      // setDriverMessage("Invalid address format!");
      return;
    }

    const clientData = {
      name: regName,
      email: regEmail,
      roadname: parsedAddress.roadname,
      number: parsedAddress.number,
      city: parsedAddress.city,
      zipcode: parsedAddress.zipcode,
      cardnumber: parsedCardInfo.cardnumber,
      expir: parsedCardInfo.expir,
      cvv: parsedCardInfo.cvv,
    };
    console.log('Attempting to register Client:', clientData); // Mask pincode in log


    try {
      const response = await fetch(`${API_URL}/clients/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // --- Include pincode in the request body --- !!
        body: JSON.stringify(clientData), // Include pincode
      });

      const data = await response.json();

      if (response.ok) { // Status 201 Created
        // Modify success message based on response or context if needed
        // setRegMessage(data.message || 'Registration successful! You can now login.');
        setRegName('');
        setRegEmail('');
        setRegAddress('');
        setRegCard(''); // Clear pincode field
      } else {
         // Handle specific errors like 403 Forbidden (registration closed / invalid pincode)
        //  setRegMessage(`Registration failed: ${data.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Registration network error:', error);
      // setRegMessage('Registration failed: Network error or server is down.');
    }
  };
  // const handleRegister = (e) => {
  //   e.preventDefault();
  //   console.log('Registering Client:', { name: regName, email: regEmail, address: regAddress, card: regCard });
  //   // TODO: API Call to backend to register client
  //   // On success, maybe log them in:
  //   setIsLoggedIn(true);
  //   setClientInfo({ name: regName, email: regEmail });
  //   fetchBookedRents(regEmail);
  // };
  const handleCheckAvailability = async (e) => {
    e.preventDefault();
    console.log("Checking availability for date:", checkDate);

    try {
        const response = await fetch(`${API_URL}/rents/checkAvailability?date=${checkDate}`);
        
        const textResponse = await response.text(); // Capture raw response
        console.log("Raw API Response:", textResponse);

        try {
            const availableCars = JSON.parse(textResponse);
            if (response.ok) {
                setAvailableModels(availableCars);
                setBookDate(checkDate);
            } else {
                console.error("Failed to check availability:", availableCars.error);
            }
        } catch (jsonError) {
            console.error("Failed to parse JSON:", textResponse);
        }
    } catch (error) {
        console.error("Network error checking availability:", error);
    }
};

// const handleBookRent = async (e) => {
//   e.preventDefault();
//   if (!bookModelId || !bookDate || !clientInfo?.email || !selectedDriver) {
//       setBookingStatus("Please select a date, model, and ensure a driver is assigned.");
//       return;
//   }

//   console.log("Booking rent for model:", bookModelId, "on date:", bookDate);

//   try {
//       const response = await fetch(`${API_URL}/rents/book`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//               model_id: bookModelId,
//               date: bookDate,
//               email: clientInfo.email,
//               name: selectedDriver, // Ensure driver name is passed
//           }),
//       });

//       const result = await response.json();

//       if (response.ok) {
//           setBookingStatus(`Successfully booked model ${bookModelId} for ${bookDate}! Driver ${selectedDriver} assigned.`);
//           fetchBookedRents(clientInfo.email);
//       } else {
//           setBookingStatus(`Failed to book rent: ${result.error}`);
//       }
//   } catch (error) {
//       setBookingStatus("Network error while booking rent. Please try again.");
//       console.error("Network error booking rent:", error);
//   }
// };

// const parseModelString = (bookModelID) => {
//   const modelParts = bookModelID.split(" "); // Split by space
//   const year = modelParts[0];  // First element is year
//   const make = modelParts[1];  // Second element is make
//   const model = modelParts.slice(2).join(" "); // Remaining elements form the model

//   return { year, make, model };
// };

// const handleBookRent = async (e) => {
//   e.preventDefault();
//   if (!bookModelId || !bookDate || !clientInfo?.email) {
//       setBookingStatus("Please select a date, model, and ensure you're logged in.");
//       return;
//   }
//   const modelString = bookModelId; // Example input


//   console.log("Booking rent for model:", bookModelId, "on date:", bookDate);

//   try {
//       const response = await fetch(`${API_URL}/rents/book`, {
//           method: "POST",
//           headers: {
//               "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//               year: year,
//               make: make, 
//               model: model,
//               date: bookDate,
//               email: clientInfo.email, // Assuming clientInfo contains user email
//           }),
//       });

//       const result = await response.json();

//       if (response.ok) {
//           setBookingStatus(`Successfully booked model ${bookModelId} for ${bookDate}! Driver will be assigned.`);
//           fetchBookedRents(clientInfo.email); // Refresh booked rents
//       } else {
//           setBookingStatus(`Failed to book rent: ${result.error}`);
//       }
//   } catch (error) {
//       setBookingStatus("Network error while booking rent. Please try again.");
//       console.error("Network error booking rent:", error);
//   }
// };
//   // const handleBookRent = (e) => {
  //   e.preventDefault();
  //   if (!bookModelId || !bookDate) {
  //     setBookingStatus('Please select a date and model first.');
  //     return;
  //   }
  //   console.log('Booking rent for model:', bookModelId, 'on date:', bookDate);
  //   // TODO: API Call to backend to book rent
  //   // On success:
  //   setBookingStatus(`Successfully booked model ${bookModelId} for ${bookDate}! Driver will be assigned.`);
  //   fetchBookedRents(clientInfo?.email); // Refresh booked rents
  //   // On failure:
  //   // setBookingStatus('Failed to book rent. Model might no longer be available.');
  // };
//   const fetchBookedRents = async (clientEmail) => {
//     if (!clientEmail) return;
    
//     console.log("Fetching booked rents for:", clientEmail);

//     try {
//         const response = await fetch(`${API_URL}/rents/client?email=${clientEmail}`);
//         const rentsData = await response.json();

//         if (response.ok) {
//             setBookedRents(rentsData);
//         } else {
//             console.error("Failed to fetch booked rents:", rentsData.error);
//             setBookedRents([]); // Set empty array if API fails
//         }
//     } catch (error) {
//         console.error("Network error fetching booked rents:", error);
//         setBookedRents([]); // Handle network failures safely
//     }
// };
  

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
  // const handleBookBestDriver = (e) => {
  //    e.preventDefault();
  //    // Similar to handleBookRent, but with different backend endpoint/parameter
  //    console.log('Booking rent with BEST driver for model:', bookModelId, 'on date:', bookDate);
  //    // TODO: API call to backend
  //    setBookingStatus(`Successfully booked model ${bookModelId} with BEST driver for ${bookDate}!`);
  //    fetchBookedRents(clientInfo?.email);
  // }

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
                            {/* <button type="button" onClick={handleBookBestDriver} style={{marginLeft: '10px'}}>Book with Best Driver</button>  */}
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
import React, { useState, useEffect } from 'react'; 
import './component.css'; 

const generateId = () => `_${Math.random().toString(36).substr(2, 9)}`;

function Clients() {
  const [loginEmail, setLoginEmail] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [currentAddress, setCurrentAddress] = useState({ id: generateId(), street: '', city: '', zip: '' });
  const [currentCard, setCurrentCard] = useState({ id: generateId(), number: '', expiry: '', cvv: '', billingAddress: '' }); // Added billingAddress
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
    // On success:
    setIsLoggedIn(true);
    setClientInfo({ name: 'Test Client', email: loginEmail }); 
    fetchBookedRents(loginEmail); 
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (addresses.length === 0 || creditCards.length === 0) {
      alert("Please add at least one address and one credit card."); 
      return;
    }
    console.log('Registering Client:', { name: regName, email: regEmail, addresses: addresses, creditCards: creditCards });
    setIsLoggedIn(true);
    setClientInfo({ name: regName, email: regEmail });
    setRegName('');
    setRegEmail('');
    setAddresses([]);
    setCreditCards([]);
    setCurrentAddress({ id: generateId(), street: '', city: '', zip: '' });
    setCurrentCard({ id: generateId(), number: '', expiry: '', cvv: '', billingAddress: '' });
  };

  const handleCheckAvailability = async (e) => { 
    e.preventDefault();
    console.log('Checking availability for date:', checkDate);
    setAvailableModels([]); 
    setBookingStatus(''); 

    if (!checkDate) {
        alert("Please select a date first.");
        return;
    }

    try {
        // --- API Call to Backend --- 
        const response = await fetch(`http://localhost:5001/api/cars/available?date=${checkDate}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Failed to fetch available cars. Server error." })); 
            console.error("Error fetching available cars:", response.status, errorData);
            alert(errorData.error || "An error occurred while checking availability.");
            return;
        }

        const data = await response.json();
        console.log("Available models received:", data.available_models);

        if (data.available_models && data.available_models.length > 0) {
            setAvailableModels(data.available_models); 
            setBookDate(checkDate); 
        } else {
             setAvailableModels([]); 
             setBookingStatus("No models available for the selected date."); 
        }

    } catch (error) {
        console.error('Network or other error during fetch:', error);
        alert("Could not connect to the server to check availability. Please try again later.");
    }

  };

  const handleBookRent = async (e) => { // Make async
    e.preventDefault();
    setBookingStatus('Processing...'); // Give feedback

    if (!bookModelId || !bookDate) {
      setBookingStatus('Please check availability and select a model first.');
      return;
    }

    console.log('Attempting to book rent for modelId:', bookModelId, 'on date:', bookDate);

    const token = localStorage.getItem('client_access_token'); // Adjust key if needed
    if (!token) {
        setBookingStatus('Error: You must be logged in to book.');
        return;
    }

    try {
        const response = await fetch('/api/clients/rents', { // Target the new booking endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Send JWT token
            },
            body: JSON.stringify({ 
                modelId: bookModelId, // Send modelId selected by user
                date: bookDate 
            })
        });

        const data = await response.json(); // Try to parse JSON regardless of status

        if (!response.ok) {
            // Handle errors from backend (e.g., 400, 404, 409, 500)
            console.error("Booking failed:", response.status, data);
            setBookingStatus(data.error || `Failed to book rent (Status: ${response.status}).`);
            return;
        }
        
        console.log("Booking successful:", data);
        setBookingStatus(data.message || `Successfully booked model ${bookModelId} for ${bookDate}!`);
        fetchBookedRents(clientInfo?.email); // Refresh booked rents list
        setAvailableModels([]); // Clear availability list after booking
        setBookModelId(''); // Reset selection

    } catch (error) {
        console.error('Network or other error during booking:', error);
        setBookingStatus("Could not connect to the server to book the rent. Please try again later.");
    }

  };

  const fetchBookedRents = async (clientEmail) => { // Make async
    // No longer using clientEmail directly, will use JWT on backend
    if (!isLoggedIn || !clientInfo) return; // Need to be logged in

    console.log('Fetching booked rents for client:', clientInfo.clientId); // Use clientId if available

    // --- Retrieve JWT token --- 
    const token = localStorage.getItem('client_access_token'); // Adjust key if needed
    if (!token) {
      console.error("Cannot fetch rents: Client token not found.");
      // Maybe clear bookedRents or show a message
      setBookedRents([]); 
      return;
    }
    // --- End JWT retrieval ---

    try {
        // --- API Call to Backend --- 
        const response = await fetch('/api/clients/rents', { // Target the new GET endpoint
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` // Send JWT token
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Failed to fetch booked rents." }));
            console.error("Error fetching booked rents:", response.status, errorData);
            // Maybe show an error message to the user
            setBookedRents([]); // Clear possibly stale data
            return;
        }

        const data = await response.json();
        console.log("Booked rents received:", data.rents);

        if (data.rents) {
            setBookedRents(data.rents); 
        } else {
            setBookedRents([]); // Set to empty if no rents found or unexpected format
        }

    } catch (error) {
        console.error('Network or other error fetching rents:', error);
        setBookedRents([]); // Clear possibly stale data on error
    }

  };

  const handleSubmitReview = async (e) => { // Make async
    e.preventDefault();
    setReviewStatus('Submitting...'); // Feedback

    if (!reviewDriverId || !reviewRating) { // reviewDriverId holds the driver name here
      setReviewStatus('Please select a driver and provide a rating.');
      return;
    }

    const ratingNum = parseInt(reviewRating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        setReviewStatus('Rating must be a number between 1 and 5.');
        return;
    }

    console.log('Submitting review for driver:', reviewDriverId, 'Rating:', ratingNum, 'Comment:', reviewComment);

    const token = localStorage.getItem('client_access_token'); // Adjust key if needed
    if (!token) {
        setReviewStatus('Error: You must be logged in to submit a review.');
        return;
    }

    try {
        // --- API Call to Backend --- 
        const response = await fetch('/api/clients/reviews', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ 
                driverName: reviewDriverId, 
                rating: ratingNum,         
                comment: reviewComment     
            })
        });

        const data = await response.json(); 

        if (!response.ok) {
            // Handle errors from backend (e.g., 400, 403, 404, 500)
            console.error("Review submission failed:", response.status, data);
            // Specific check for 403 Forbidden (Client didn't use this driver)
            if (response.status === 403) {
                 setReviewStatus(data.error || "You cannot review a driver you haven't rented with.");
            } else {
                 setReviewStatus(data.error || `Failed to submit review (Status: ${response.status}).`);
            }
            return;
        }
        
        console.log("Review submitted successfully:", data);
        setReviewStatus(data.message || 'Review submitted successfully!');
        setReviewDriverId('');
        setReviewRating('');
        setReviewComment('');

    } catch (error) {
        console.error('Network or other error submitting review:', error);
        setReviewStatus("Could not connect to the server to submit the review. Please try again later.");
    }

  };

  const handleBookBestDriver = async (e) => { 
     e.preventDefault();
     setBookingStatus('Processing booking with best driver...'); 

     if (!bookModelId || !bookDate) {
       setBookingStatus('Please check availability and select a model first.');
       return;
     }

     console.log('Attempting to book rent with BEST driver for modelId:', bookModelId, 'on date:', bookDate);

     // --- Retrieve JWT token --- 
     const token = localStorage.getItem('client_access_token'); 
     if (!token) {
         setBookingStatus('Error: You must be logged in to book.');
         return;
     }

     try {
         const response = await fetch('/api/clients/rents/best-driver', { 
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${token}` 
             },
             body: JSON.stringify({ 
                 modelId: bookModelId,
                 date: bookDate 
             })
         });

         const data = await response.json(); 

         if (!response.ok) {
             console.error("Booking with best driver failed:", response.status, data);
             setBookingStatus(data.error || `Failed to book rent with best driver (Status: ${response.status}).`);
             return;
         }
         
         console.log("Booking with best driver successful:", data);
         setBookingStatus(data.message || `Successfully booked model ${bookModelId} with BEST driver for ${bookDate}!`);
         fetchBookedRents(clientInfo?.email); // Refresh booked rents list
         setAvailableModels([]); 
         setBookModelId(''); 


     } catch (error) {
         console.error('Network or other error during best driver booking:', error);
         setBookingStatus("Could not connect to the server to book the rent. Please try again later.");
     }

  }

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setCurrentAddress(prev => ({ ...prev, [name]: value }));
  };

  const addAddress = () => {
    if (currentAddress.street && currentAddress.city && currentAddress.zip) {
      setAddresses(prev => [...prev, currentAddress]);
      setCurrentAddress({ id: generateId(), street: '', city: '', zip: '' }); // Reset form
    } else {
      alert("Please fill in all address fields.");
    }
  };

  const removeAddress = (idToRemove) => {
    setAddresses(prev => prev.filter(addr => addr.id !== idToRemove));
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCurrentCard(prev => ({ ...prev, [name]: value }));
  };

    const addCreditCard = () => {
    // Basic validation - could be more thorough (e.g., regex for card number/expiry)
    if (currentCard.number && currentCard.expiry && currentCard.cvv && currentCard.billingAddress) {
      setCreditCards(prev => [...prev, currentCard]);
      setCurrentCard({ id: generateId(), number: '', expiry: '', cvv: '', billingAddress: '' }); // Reset form
    } else {
        alert("Please fill in all credit card fields, including billing address.");
    }
  };

  const removeCreditCard = (idToRemove) => {
    setCreditCards(prev => prev.filter(card => card.id !== idToRemove));
  };
  // --- End New Handlers ---

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
          {/* --- Modified Registration Form --- */}
          <form onSubmit={handleRegister} className="sub-action">
            <h4>Register New Client</h4>
             <div className="controls stacked">
                {/* Basic Info */}
                <input type="text" placeholder="Name" value={regName} onChange={(e) => setRegName(e.target.value)} required />
                <input type="email" placeholder="Email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />

                {/* Address Management */}
                <h5>Addresses</h5>
                <div className="address-card-input-stacked">
                    <input type="text" name="street" placeholder="Street" value={currentAddress.street} onChange={handleAddressChange} />
                    <input type="text" name="city" placeholder="City" value={currentAddress.city} onChange={handleAddressChange} />
                    <input type="text" name="zip" placeholder="Zip Code" value={currentAddress.zip} onChange={handleAddressChange} />
                    <button type="button" onClick={addAddress}>Add Address</button>
                </div>
                {addresses.length > 0 && (
                    <ul className="item-list">
                        {addresses.map(addr => (
                            <li key={addr.id}>
                                {addr.street}, {addr.city}, {addr.zip}
                                <button type="button" className="remove-button" onClick={() => removeAddress(addr.id)}>Remove</button>
                            </li>
                        ))}
                    </ul>
                )}

                 {/* Credit Card Management */}
                <h5>Credit Cards</h5>
                 <div className="address-card-input-stacked">
                    <input type="text" name="number" placeholder="Card Number" value={currentCard.number} onChange={handleCardChange} />
                    <input type="text" name="expiry" placeholder="Expiry (MM/YY)" value={currentCard.expiry} onChange={handleCardChange} />
                    <input type="text" name="cvv" placeholder="CVV" value={currentCard.cvv} onChange={handleCardChange} />
                    <input type="text" name="billingAddress" placeholder="Billing Address (Street, City, Zip)" value={currentCard.billingAddress} onChange={handleCardChange} />
                    <button type="button" onClick={addCreditCard}>Add Credit Card</button>
                </div>
                 {creditCards.length > 0 && (
                    <ul className="item-list">
                        {creditCards.map(card => (
                            <li key={card.id}>
                                **** **** **** {card.number.slice(-4)} Exp: {card.expiry} (Billing: {card.billingAddress})
                                <button type="button" className="remove-button" onClick={() => removeCreditCard(card.id)}>Remove</button>
                            </li>
                        ))}
                    </ul>
                )}

                <button type="submit" style={{marginTop: '20px'}}>Register</button>
            </div>
          </form>
          {/* --- End Modified Form --- */}
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
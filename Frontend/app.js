import React from 'react';
import './style.css';
import Managers from './components/Managers';
import Clients from './components/Clients';
import Drivers from './components/Drivers';

function App(){
  return(
    <div className='App'>
      <h1> Taxi Rental System</h1>
      <div className="container">
        <div className="section">
          <Managers/>
        </div>
        <div className="section">
          <Clients/>
        </div>
        <div className="section">
          <Drivers/>
        </div>
      </div>
    </div>
  );
}
export default App;

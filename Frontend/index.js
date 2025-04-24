import React from 'react';
import ReactDom from 'react-dom';
import App from'./app';
import {BrowserRouter} from 'react-router-dom';
import './style.css';

const rootElement=document.getElementById('root');
const root=ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>
);
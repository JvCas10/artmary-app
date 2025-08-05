// src/main.jsx - VERSIÓN TEMPORAL SIN AUTH PROVIDER
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
// import { AuthProvider } from './context/AuthContext.jsx'; // COMENTAMOS TEMPORALMENTE

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CartProvider>
        {/* TEMPORALMENTE SIN AuthProvider */}
        <App />
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>
);
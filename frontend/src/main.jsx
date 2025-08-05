// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { HashRouter } from 'react-router-dom'; // CAMBIAR ESTA LÍNEA
import { CartProvider } from './context/CartContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter> {/* CAMBIAR ESTA LÍNEA */}
      <CartProvider>
        <App />
      </CartProvider>
    </HashRouter>
  </React.StrictMode>
);
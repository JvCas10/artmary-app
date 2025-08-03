// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F7F0E8 0%, #EDE0D3 100%)', // Fondo que combine
      color: '#6B4423', // Color de texto que combine
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem', color: '#B8860B' }}>404</h1>
      <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: '#8B4513' }}>Página No Encontrada 😔</h2>
      <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
        Lo sentimos, la página que buscas no existe o se ha movido.
      </p>
      <Link to="/productos" style={{
        backgroundColor: '#FFB74D', // Botón que combine
        color: 'white',
        fontWeight: 'bold',
        padding: '12px 24px',
        borderRadius: '8px',
        textDecoration: 'none',
        fontSize: '1rem',
        boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
        transition: 'all 0.3s ease'
      }}
        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#FF9800'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 152, 0, 0.4)'; }}
        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#FFB74D'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 152, 0, 0.3)'; }}
      >
        Volver al Catálogo
      </Link>
    </div>
  );
}

export default NotFoundPage;

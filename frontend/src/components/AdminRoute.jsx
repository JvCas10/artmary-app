// src/components/AdminRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Asegúrate de que la ruta sea correcta

/**
 * @file Componente AdminRoute para proteger rutas administrativas en React.
 * @description Este componente verifica si el usuario está autenticado y tiene el rol 'admin'.
 * Si el usuario no cumple los requisitos, lo redirige a la página de acceso denegado o al login.
 * Si el usuario es un administrador, renderiza las rutas hijas.
 */
const AdminRoute = () => {
  // Obtiene el estado de autenticación, el usuario y el estado de carga desde el AuthContext
  const { isAuthenticated, user, loading } = useAuth();

  // Muestra un mensaje de carga mientras se verifica el estado de autenticación y el rol
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#F7F0E8', // Color de fondo claro que combine con tu tema
        color: '#8B4513', // Color de texto que combine
        fontSize: '1.25rem',
        fontFamily: 'Arial, sans-serif'
      }}>
        <p>Verificando permisos...</p>
      </div>
    );
  }

  // Si el usuario no está autenticado O no tiene el rol de 'admin', redirige
  if (!isAuthenticated || (user && user.rol !== 'admin')) { // <-- Asegúrate de la condición correcta
    // Puedes redirigir a una página de "Acceso Denegado" o directamente al login/productos
    return <Navigate to="/productos" replace />; // Redirige a /productos si no es admin
  }

  // Si el usuario es un administrador, renderiza las rutas hijas
  return <Outlet />;
};

export default AdminRoute;

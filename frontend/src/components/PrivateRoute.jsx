// src/components/PrivateRoute.jsx
import React from 'react'; // Asegúrate de que React esté importado
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Asegúrate de que la ruta sea correcta

/**
 * @file Componente PrivateRoute para proteger rutas en React.
 * @description Este componente verifica si el usuario está autenticado.
 * Si el usuario no está autenticado y la carga de autenticación ha terminado,
 * lo redirige a la página de inicio de sesión.
 * Si el usuario está autenticado, renderiza las rutas hijas.
 */
const PrivateRoute = () => {
  // Obtiene el estado de autenticación y carga desde el AuthContext
  const { isAuthenticated, loading } = useAuth();

  // Muestra un mensaje de carga mientras se verifica el estado de autenticación
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#1a202c', // Color de fondo oscuro
        color: 'white',
        fontSize: '1.25rem',
        fontFamily: 'Arial, sans-serif'
      }}>
        <p>Cargando...</p>
      </div>
    );
  }

  // Si el usuario no está autenticado después de la carga, redirige a la página de login
  // Reemplaza '/login' con la ruta real de tu componente de login si es diferente
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si el usuario está autenticado, renderiza las rutas hijas
  return <Outlet />;
};

export default PrivateRoute;

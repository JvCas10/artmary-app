// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Función para verificar si el token es válido
  const verifyToken = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.usuario);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error verificando token:', error);
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Función para iniciar sesión
  const login = async (correo, contrasena) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ correo, contraseña: contrasena })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.usuario);
        setIsAuthenticated(true);
        return { success: true, message: 'Inicio de sesión exitoso' };
      } else {
        return { success: false, message: data.mensaje || 'Error al iniciar sesión', requiresVerification: data.requiresVerification };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, message: 'No se pudo conectar al servidor' };
    }
  };

  // Función para registrar un nuevo usuario
  const register = async (nombre, correo, contrasena) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
         body: JSON.stringify({ nombre, correo, contraseña: contrasena })
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje(data.mensaje);
        return { success: true };
      } else {
        setMensaje(data.mensaje || 'Error al registrarse');
        return { success: false, message: data.mensaje || 'Error al registrarse' };
      }
    } catch (error) {
      console.error('Error en registro:', error);
      setMensaje('No se pudo conectar al servidor');
      return { success: false, message: 'No se pudo conectar al servidor' };
    }
  };

  // Función para cerrar sesión
  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Error al cerrar sesión en el servidor:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Verificar token al cargar la aplicación
  useEffect(() => {
    verifyToken();
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    verifyToken,
    mensaje,
    setMensaje
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
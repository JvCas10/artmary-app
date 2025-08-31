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

  // Función para iniciar sesión - CORREGIDA
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
      console.log('Response from server:', data); // Para debug

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.usuario);
        setIsAuthenticated(true);
        return { success: true, message: 'Inicio de sesión exitoso' };
      } else {
        // Manejar diferentes tipos de error basados en el código de estado
        let errorMessage = data.mensaje || 'Error al iniciar sesión';
        let errorType = null;

        if (response.status === 404) {
          errorMessage = '❌ Correo no registrado';
          errorType = 'CORREO_NO_ENCONTRADO';
        } else if (response.status === 401) {
          if (data.requiresVerification) {
            errorMessage = '⚠️ Debes verificar tu correo electrónico antes de iniciar sesión';
            errorType = 'EMAIL_NO_VERIFICADO';
          } else {
            errorMessage = '❌ Contraseña incorrecta';
            errorType = 'CONTRASENA_INCORRECTA';
          }
        } else if (response.status === 500) {
          errorMessage = '❌ Error del servidor. Intenta más tarde';
          errorType = 'ERROR_SERVIDOR';
        }

        return { 
          success: false, 
          message: errorMessage,
          errorType: errorType,
          requiresVerification: data.requiresVerification,
          email: correo
        };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { 
        success: false, 
        message: '❌ No se pudo conectar al servidor',
        errorType: 'ERROR_RED'
      };
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
        setMensaje('✅ Usuario registrado exitosamente. Revisa tu correo para verificar tu cuenta.');
        return { success: true, message: data.mensaje };
      } else {
        let errorMessage = data.mensaje || 'Error al registrar usuario';
        
        if (response.status === 400) {
          if (data.mensaje.includes('ya está registrado')) {
            errorMessage = '⚠️ Este correo ya está registrado';
          }
        }
        
        setMensaje(errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error('Error en registro:', error);
      const errorMessage = '❌ No se pudo conectar al servidor';
      setMensaje(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    setMensaje('');
  };

  // Verificar token al cargar la aplicación
  useEffect(() => {
    verifyToken();
  }, []);

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated,
    mensaje,
    setMensaje
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
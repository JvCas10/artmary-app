// src/api/axios.js
import axios from 'axios';

// URL base que funciona tanto en desarrollo como en producción
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Crear una instancia de axios con configuración base
const instance = axios.create({
  baseURL: baseURL,
  timeout: 10000, // Timeout de 10 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests - añadir token automáticamente
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses - manejar errores globalmente
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Si el token expiró o es inválido, redirigir al login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Solo redirigir si no estamos ya en la página de login
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
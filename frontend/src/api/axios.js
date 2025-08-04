// src/api/axios.js
import axios from 'axios';

// URL base en prod/desarrollo
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Crea la instancia (llamémosla "api" para evitar confusiones)
const api = axios.create({
  baseURL,
  timeout: 10000,
});

// Interceptor de request: token + FormData sin forzar Content-Type
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // Si enviamos FormData, dejamos que axios ponga el boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de response: 401 → limpiar y redirigir
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (!['/login', '/'].includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

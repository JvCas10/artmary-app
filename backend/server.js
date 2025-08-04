// server.js (versión simple, como antes)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Básico
app.disable('x-powered-by');
app.use(cors()); // <-- CORS abierto (lo que te permitía loguear sin bloqueos)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI no está definida');
  process.exit(1);
}
mongoose.connect(uri)
  .then(() => console.log('📦 Conectado a MongoDB Atlas'))
  .catch(err => {
    console.error('❌ Error en la conexión a MongoDB', err);
    process.exit(1);
  });

// Healthcheck
app.get('/health', (req, res) => res.json({ ok: true }));

// Rutas
app.get('/', (req, res) => res.send('✅ API funcionando correctamente'));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/productos', require('./routes/productRoutes'));
app.use('/api/pedidos', require('./routes/orderRoutes'));
app.use('/api/ventas', require('./routes/salesRoutes'));

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error global
app.use((err, req, res, next) => {
  console.error('--- ERROR GLOBAL DETECTADO ---');
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? 'Error interno del servidor' : err.message,
    message: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

// Start
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});

// Cierre ordenado
process.on('SIGINT', () => { server.close(() => process.exit(0)); });
process.on('SIGTERM', () => { server.close(() => process.exit(0)); });

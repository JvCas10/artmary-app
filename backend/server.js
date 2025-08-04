// server.js (versión endurecida)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
//const helmet = require('helmet');
//const rateLimit = require('express-rate-limit');
//const compression = require('compression');
//const morgan = require('morgan');
require('dotenv').config();

const app = express();

// --- Seguridad básica
app.disable('x-powered-by');
//app.use(helmet());
//app.use(compression());

// Logs en desarrollo
//if (process.env.NODE_ENV !== 'production') {
//  app.use(morgan('dev'));
//}

// Límites de body
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// CORS estricto usando FRONTEND_URL
const ALLOWED_ORIGINS = [process.env.FRONTEND_URL].filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error('Origen no permitido por CORS'));
  },
  credentials: true,
}));

// Rate limiting global
//app.use(rateLimit({
//  windowMs: 15 * 60 * 1000,
//  max: 500, // ajusta según tu tráfico
//  standardHeaders: true,
//  legacyHeaders: false,
//}));

// --- DB
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error handler (incluye Multer si usas uploads)
app.use((err, req, res, next) => {
  console.error('--- ERROR GLOBAL DETECTADO ---');
  console.error(err);

  const status = err.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? 'Error interno del servidor' : err.message,
    message: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

// Graceful shutdown
const server = app.listen(process.env.PORT || 5000, () => {
  console.log(`🚀 Servidor en http://localhost:${process.env.PORT || 5000}`);
});
process.on('SIGINT', () => { server.close(() => process.exit(0)); });
process.on('SIGTERM', () => { server.close(() => process.exit(0)); });

// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

/* ========= Config básica ========= */
app.disable('x-powered-by');

// Body parsers (ajusta si necesitas subir archivos grandes)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

/* ========= CORS (whitelist por env) =========
   Define en Render (backend → Environment):
   - FRONTEND_URL = https://artmary-frontend.onrender.com
   - FRONTEND_URL_2 = https://tu-dominio-personalizado.com   (opcional)
*/
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,
  'http://localhost:5173', // Vite dev
  'http://localhost:3000', // React dev (opcional)
].filter(Boolean);

const corsOptions = {
  origin(origin, cb) {
    // Permite requests sin Origin (health checks, curl) y orígenes en whitelist
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS: origen no permitido'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// Ayuda a proxies/CDN a variar por Origin
app.use((req, res, next) => {
  res.header('Vary', 'Origin');
  next();
});
// Preflight explícito
app.options('*', cors(corsOptions));

/* ========= Base de datos ========= */
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('❌ MONGO_URI no está definida');
  process.exit(1);
}

mongoose
  .connect(uri)
  .then(() => console.log('📦 Conectado a MongoDB Atlas'))
  .catch((err) => {
    console.error('❌ Error en la conexión a MongoDB:', err?.message || err);
    process.exit(1);
  });

/* ========= Rutas ========= */
app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/', (req, res) => {
  res.send('✅ API funcionando correctamente');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/productos', require('./routes/productRoutes'));
app.use('/api/pedidos', require('./routes/orderRoutes'));
app.use('/api/ventas', require('./routes/salesRoutes'));

/* ========= 404 ========= */
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

/* ========= Manejador global de errores ========= */
app.use((err, req, res, next) => {
  console.error('--- ERROR GLOBAL DETECTADO ---');
  console.error(err);

  const status = err.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? 'Error interno del servidor' : err.message,
    // en prod no exponemos detalles
    message: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

/* ========= Inicio del servidor ========= */
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});

/* ========= Graceful shutdown ========= */
process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

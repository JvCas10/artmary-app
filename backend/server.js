const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Cargar variables de entorno
const multer = require('multer'); // Para capturar errores específicos de subida

// Verifica que Cloudinary esté cargando correctamente
console.log('Cargando CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET);

const app = express();

// 🧠 Middleware para parsear el cuerpo de las solicitudes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// 🛢️ Conexión a MongoDB Atlas
const uri = process.env.MONGO_URI;
if (uri) {
  mongoose.connect(uri)
    .then(() => console.log('📦 Conectado a MongoDB Atlas'))
    .catch(err => console.error('❌ Error en la conexión a MongoDB', err));
} else {
  console.log('⚠️ MONGO_URI no está definida. Sin conexión a base de datos.');
}

// 📡 Ruta básica para verificar conexión
app.get('/', (req, res) => {
  res.send('✅ API funcionando correctamente');
});

// 📁 Importar rutas
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const salesRoutes = require('./routes/salesRoutes'); // 🆕 Ruta para ventas físicas

// 🚏 Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/productos', productRoutes);  // productos
app.use('/api/pedidos', orderRoutes);      // pedidos online
app.use('/api/ventas', salesRoutes);       // ventas físicas desde el POS

// 🛡️ Middleware de manejo de errores (debe ir al final)
app.use((err, req, res, next) => {
  console.error('--- ERROR GLOBAL DETECTADO ---');
  console.error('Error:', err.message);

  if (err.stack) {
    console.error('Stack:', err.stack);
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: 'Error de subida de archivo (Multer)',
      message: err.message
    });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message
    });
  }

  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message || 'Algo salió mal en el servidor.'
  });
});

// 🚀 Arrancar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

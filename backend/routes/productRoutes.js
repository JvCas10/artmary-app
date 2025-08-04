// backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Para subir imágenes

// ✅ NUEVA RUTA: Obtener todos los productos sin filtros (para el POS)
router.get('/todos', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const productos = await Product.find();
    res.json({ productos });
  } catch (err) {
    next(err);
  }
});

// GET /api/productos - Obtener productos con filtros/paginación
router.get('/', authMiddleware, productController.obtenerProductos);

// GET /api/productos/:id - Obtener un producto por ID
router.get('/:id', productController.obtenerProductoPorId);

// POST /api/productos - Crear un nuevo producto (admin)
router.post('/', authMiddleware, adminMiddleware, upload.single('imagen'), productController.crearProducto);

// PUT /api/productos/:id - Actualizar un producto (admin)
router.put('/:id', authMiddleware, adminMiddleware, upload.single('imagen'), productController.actualizarProducto);

// DELETE /api/productos/:id - Eliminar un producto (admin)
router.delete('/:id', authMiddleware, adminMiddleware, productController.eliminarProducto);

module.exports = router;

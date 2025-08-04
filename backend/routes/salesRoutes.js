// routes/salesRoutes.js
const express = require('express');
const router = express.Router();
const { createSale } = require('../controllers/salesController');
const authMiddleware = require('../middleware/authMiddleware');
const Sale = require('../models/Sale');

// POST - Crear nueva venta (CON autenticación)
router.post('/', authMiddleware, createSale);

// GET - Obtener todas las ventas (CON autenticación)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const ventas = await Sale.find()
      .sort({ fecha: -1 })
      .populate('productos.productoId');
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ventas', message: error.message });
  }
});

module.exports = router;

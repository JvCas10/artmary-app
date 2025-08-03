// controllers/salesController.js
const Sale = require('../models/Sale');
const Product = require('../models/Product');

const createSale = async (req, res, next) => {
  try {
    const venta = req.body;

    await Promise.all(venta.productos.map(async (p) => {
      await Product.findByIdAndUpdate(
        p.productoId,
        { $inc: { stock: -p.cantidad } }
      );
    }));

    const nuevaVenta = await Sale.create(venta);
    res.status(201).json(nuevaVenta);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSale
};

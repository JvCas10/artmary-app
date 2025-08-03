// backend/models/Order.js
const mongoose = require('mongoose');

// Define el esquema para los productos dentro de un pedido
const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', // Referencia al modelo de Producto
    required: true
  },
  nombre: {
    type: String,
    required: true
  },
  cantidad: {
    type: Number,
    required: true,
    min: 1
  },
  precioVenta: {
    type: Number,
    required: true
  },
  precioCompra: {
    type: Number,
    required: true // NUEVO: Necesario para calcular ganancias
  },
  imagenUrl: {
    type: String
  },
  ganancia: {
    type: Number,
    default: 0 // NUEVO: Ganancia por producto (precioVenta - precioCompra) * cantidad
  }
}, { _id: false }); // No crear un _id para cada subdocumento de item

// Define el esquema principal del Pedido
const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Referencia al modelo de Usuario
    required: true
  },
  productos: [orderItemSchema], // Array de items de pedido
  total: {
    type: Number,
    required: true
  },
  gananciaTotal: {
    type: Number,
    default: 0 // NUEVO: Ganancia total del pedido
  },
  fecha: {
    type: Date,
    default: Date.now // Fecha de creación del pedido
  },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado', 'listo_para_recoger'],
    default: 'pendiente'
  }
}, {
  timestamps: true // Añade createdAt y updatedAt automáticamente
});

module.exports = mongoose.model('Order', orderSchema);
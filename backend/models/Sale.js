const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  cliente: {
    nombre: { type: String, required: true },
    telefono: { type: String },
  },
  productos: [{
    productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    nombre: String,
    cantidad: Number,
    precioCompra: Number,
    precioVenta: Number,
    subtotal: Number,
    ganancia: Number
  }],
  total: { type: Number, required: true },
  gananciaTotal: { type: Number, required: true },
  tipo: { type: String, enum: ['fisica', 'online'], default: 'fisica' },
  metodoPago: { type: String, default: 'efectivo' },
  fecha: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);

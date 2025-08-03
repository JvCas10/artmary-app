const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  descripcion: {
    type: String
  },
  precioCompra: {
    type: Number,
    required: true
  },
  precioVenta: {
    type: Number,
    required: true
  },
  categoria: {
    type: String
  },
  stock: {
    type: Number,
    default: 0
  },
  imagenUrl: {
    type: String // la usaremos cuando integremos Cloudinary
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);

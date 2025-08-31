const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  cliente: {
    nombre: { type: String, required: true },
    telefono: { type: String },
  },
  productos: [{
    productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    nombre: String,
    cantidad: Number, // Para conjuntos: unidades totales, para individuales: cantidad normal
    precioCompra: Number,
    precioVenta: Number,
    subtotal: Number,
    ganancia: Number,
    
    // ===== NUEVOS CAMPOS PARA SISTEMA DE CONJUNTOS =====
    tipoVenta: { 
      type: String, 
      enum: ['individual', 'conjunto'], 
      default: 'individual' 
    },
    cantidadOriginal: Number, // Cantidad original (conjuntos vendidos o unidades individuales)
    
    // Campos específicos para conjuntos (solo se llenan si tipoVenta === 'conjunto')
    unidadesPorConjunto: Number,
    nombreConjunto: String,
    precioConjunto: Number,
    descripcionVenta: String // Descripción legible de lo que se vendió
  }],
  total: { type: Number, required: true },
  gananciaTotal: { type: Number, required: true },
  tipo: { type: String, enum: ['fisica', 'online'], default: 'fisica' },
  metodoPago: { type: String, default: 'efectivo' },
  fecha: { type: Date, default: Date.now }
}, { timestamps: true });

// Índice para mejorar consultas por fecha
saleSchema.index({ fecha: -1 });

// Método para obtener información resumida de la venta
saleSchema.methods.getResumen = function() {
  const totalUnidades = this.productos.reduce((acc, prod) => {
    return acc + (prod.cantidad || 0);
  }, 0);
  
  const totalConjuntos = this.productos.reduce((acc, prod) => {
    if (prod.tipoVenta === 'conjunto') {
      return acc + (prod.cantidadOriginal || 0);
    }
    return acc;
  }, 0);
  
  return {
    totalUnidades,
    totalConjuntos,
    tieneConjuntos: totalConjuntos > 0,
    cliente: this.cliente.nombre,
    total: this.total,
    fecha: this.fecha
  };
};

module.exports = mongoose.model('Sale', saleSchema);
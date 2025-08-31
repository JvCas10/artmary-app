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
    type: String
  },

  // ===== NUEVOS CAMPOS PARA SISTEMA DUAL =====

  // Indica si el producto se puede vender por conjuntos
  tieneConjunto: {
    type: Boolean,
    default: false
  },

  // Nombre del conjunto (ej: "Caja", "Resma", "Bolsa", "Paquete")
  nombreConjunto: {
    type: String,
    default: null,
    // Solo requerido si tieneConjunto es true
    validate: {
      validator: function (v) {
        return !this.tieneConjunto || (v && v.trim().length > 0);
      },
      message: 'El nombre del conjunto es requerido cuando tieneConjunto es true'
    }
  },

  // Cuántas unidades tiene el conjunto
  unidadesPorConjunto: {
    type: Number,
    default: null,
    min: [1, 'Las unidades por conjunto deben ser mayor a 0'],
    // Solo requerido si tieneConjunto es true
    validate: {
      validator: function (v) {
        return !this.tieneConjunto || (v && v > 0);
      },
      message: 'Las unidades por conjunto son requeridas cuando tieneConjunto es true'
    }
  },

  // Precio del conjunto completo
  precioConjunto: {
    type: Number,
    default: null,
    min: [0, 'El precio del conjunto no puede ser negativo'],
    // Solo requerido si tieneConjunto es true
    validate: {
      validator: function (v) {
        return !this.tieneConjunto || (v && v >= 0);
      },
      message: 'El precio del conjunto es requerido cuando tieneConjunto es true'
    }
  },

  // Stock de conjuntos completos disponibles
  // REMOVIDO: stockConjuntos (ahora se calcula automáticamente)
  // El stock de conjuntos se calcula como Math.floor(stock / unidadesPorConjunto)
}, {
  timestamps: true
});

// ===== MÉTODOS VIRTUALES =====

// Calcular precio por unidad en conjunto (para mostrar descuento)
productSchema.virtual('precioUnidadEnConjunto').get(function () {
  if (!this.tieneConjunto || !this.unidadesPorConjunto || !this.precioConjunto) {
    return null;
  }
  return this.precioConjunto / this.unidadesPorConjunto;
});

// Calcular porcentaje de descuento del conjunto vs individual
productSchema.virtual('porcentajeDescuentoConjunto').get(function () {
  if (!this.tieneConjunto || !this.precioUnidadEnConjunto) {
    return 0;
  }

  const descuento = ((this.precioVenta - this.precioUnidadEnConjunto) / this.precioVenta) * 100;
  return Math.round(descuento * 100) / 100; // Redondear a 2 decimales
});

// Conjuntos completos disponibles (calculado dinámicamente)
productSchema.virtual('conjuntosDisponibles').get(function () {
  if (!this.tieneConjunto || !this.unidadesPorConjunto) return 0;
  return Math.floor((this.stock || 0) / this.unidadesPorConjunto);
});

// Unidades sueltas (resto después de formar conjuntos)
productSchema.virtual('unidadesSueltas').get(function () {
  if (!this.tieneConjunto || !this.unidadesPorConjunto) return this.stock || 0;
  return (this.stock || 0) % this.unidadesPorConjunto;
});

// ===== MÉTODOS DE INSTANCIA =====

// Verificar si hay stock suficiente para venta individual
productSchema.methods.puedeVenderUnidades = function (cantidad) {
  return this.stock >= cantidad;
};

// Verificar si hay stock suficiente para venta por conjuntos
productSchema.methods.puedeVenderConjuntos = function (cantidadConjuntos) {
  if (!this.tieneConjunto || !this.unidadesPorConjunto) return false;
  const conjuntosDisponibles = Math.floor((this.stock || 0) / this.unidadesPorConjunto);
  return conjuntosDisponibles >= cantidadConjuntos;
};

// Reducir stock por venta individual
productSchema.methods.reducirStockUnidades = function (cantidad) {
  if (!this.puedeVenderUnidades(cantidad)) {
    throw new Error(`Stock insuficiente. Disponible: ${this.stock}, Solicitado: ${cantidad}`);
  }
  this.stock -= cantidad;
  return this;
};

// Reducir stock por venta de conjuntos
productSchema.methods.reducirStockConjuntos = function (cantidadConjuntos) {
  if (!this.puedeVenderConjuntos(cantidadConjuntos)) {
    const conjuntosDisponibles = Math.floor((this.stock || 0) / this.unidadesPorConjunto);
    throw new Error(`Stock de conjuntos insuficiente. Disponible: ${conjuntosDisponibles}, Solicitado: ${cantidadConjuntos}`);
  }

  // Reducir unidades del stock total
  const unidadesTotales = cantidadConjuntos * this.unidadesPorConjunto;
  this.stock -= unidadesTotales;

  return this;
};

// ===== MIDDLEWARES =====

// Validación antes de guardar
productSchema.pre('save', function (next) {
  // Si tieneConjunto es false, limpiar campos relacionados
  if (!this.tieneConjunto) {
    this.nombreConjunto = null;
    this.unidadesPorConjunto = null;
    this.precioConjunto = null;
    this.stockConjuntos = 0;
  }

  // Validar que el stock no sea negativo
  if (this.stock < 0) {
    return next(new Error('El stock no puede ser negativo'));
  }

  if (this.stockConjuntos < 0) {
    return next(new Error('El stock de conjuntos no puede ser negativo'));
  }

  next();
});

// ===== CONFIGURACIÓN DE SALIDA JSON =====

// Incluir campos virtuales en JSON
productSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    // Eliminar campos internos de mongoose
    delete ret.__v;
    return ret;
  }
});

productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
// backend/routes/productRoutes.js - RUTAS ACTUALIZADAS CON SISTEMA DUAL
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Para subir imágenes

// ===== RUTAS PÚBLICAS (sin autenticación) =====

// GET /api/productos/catalogo - Obtener productos para catálogo público
router.get('/catalogo', async (req, res, next) => {
  try {
    // Parámetros de filtrado para catálogo
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = req.query.search || '';
    const categoria = req.query.categoria || '';
    const precioMin = req.query.precioMin ? parseFloat(req.query.precioMin) : null;
    const precioMax = req.query.precioMax ? parseFloat(req.query.precioMax) : null;
    const tipoVenta = req.query.tipoVenta || '';

    const skip = (page - 1) * limit;

    // Filtro base - solo productos con stock
    let searchFilter = {
      $or: [
        { stock: { $gt: 0 } },
        { stockConjuntos: { $gt: 0 } }
      ]
    };

    // Filtro de texto
    if (search) {
      searchFilter.$and = searchFilter.$and || [];
      searchFilter.$and.push({
        $or: [
          { nombre: { $regex: search, $options: 'i' } },
          { descripcion: { $regex: search, $options: 'i' } },
          { categoria: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Filtro por categoría
    if (categoria) {
      searchFilter.categoria = categoria;
    }

    // Filtro por rango de precios
    if (precioMin !== null || precioMax !== null) {
      searchFilter.precioVenta = {};
      if (precioMin !== null) searchFilter.precioVenta.$gte = precioMin;
      if (precioMax !== null) searchFilter.precioVenta.$lte = precioMax;
    }

    // Filtro por tipo de venta
    if (tipoVenta === 'individual') {
      searchFilter.tieneConjunto = false;
    } else if (tipoVenta === 'conjunto') {
      searchFilter.tieneConjunto = true;
    }

    const [productos, totalProductos, categorias] = await Promise.all([
      Product.find(searchFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(searchFilter),
      Product.distinct('categoria')
    ]);

    const totalPages = Math.ceil(totalProductos / limit);

    res.json({
      productos,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts: totalProductos,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      },
      categorias: categorias.filter(cat => cat && cat.trim() !== '')
    });

  } catch (err) {
    next(err);
  }
});

// GET /api/productos/:id/detalle - Obtener detalle público de un producto
router.get('/:id/detalle', async (req, res, next) => {
  try {
    const producto = await Product.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Solo mostrar si tiene stock disponible
    const tieneStock = producto.stock > 0 || producto.stockConjuntos > 0;
    if (!tieneStock) {
      return res.status(404).json({ error: 'Producto no disponible' });
    }

    res.json(producto);
  } catch (err) {
    next(err);
  }
});

// ===== RUTAS PROTEGIDAS (requieren autenticación) =====

// GET /api/productos - Obtener productos con filtros/paginación (Admin/Cliente)
router.get('/', authMiddleware, productController.obtenerProductos);

// GET /api/productos/:id - Obtener un producto por ID
router.get('/:id', authMiddleware, productController.obtenerProductoPorId);

// ===== RUTAS ADMINISTRATIVAS (solo admin) =====

// GET /api/productos/admin/todos - Obtener todos los productos sin filtros (para POS)
router.get('/admin/todos', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const productos = await Product.find().sort({ nombre: 1 });
    res.json({ productos });
  } catch (err) {
    next(err);
  }
});

// GET /api/productos/admin/estadisticas - Obtener estadísticas de productos
router.get('/admin/estadisticas', authMiddleware, adminMiddleware, productController.obtenerEstadisticas);

// POST /api/productos/admin/verificar-stock - Verificar stock antes de venta
router.post('/admin/verificar-stock', authMiddleware, adminMiddleware, productController.verificarStock);

// POST /api/productos - Crear un nuevo producto (admin)
router.post('/', authMiddleware, adminMiddleware, upload.single('imagen'), productController.crearProducto);

// PUT /api/productos/:id - Actualizar un producto (admin)
router.put('/:id', authMiddleware, adminMiddleware, upload.single('imagen'), productController.actualizarProducto);

// DELETE /api/productos/:id - Eliminar un producto (admin)
router.delete('/:id', authMiddleware, adminMiddleware, productController.eliminarProducto);

// ===== RUTAS ESPECIALES PARA SISTEMA DUAL =====

// GET /api/productos/conjunto/:id/disponibilidad - Verificar disponibilidad de conjuntos
router.get('/conjunto/:id/disponibilidad', authMiddleware, async (req, res, next) => {
  try {
    const producto = await Product.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (!producto.tieneConjunto) {
      return res.status(400).json({ error: 'Este producto no se vende por conjuntos' });
    }

    res.json({
      productId: producto._id,
      nombre: producto.nombre,
      nombreConjunto: producto.nombreConjunto,
      unidadesPorConjunto: producto.unidadesPorConjunto,
      precioConjunto: producto.precioConjunto,
      stockConjuntos: producto.stockConjuntos,
      precioUnidadEnConjunto: producto.precioUnidadEnConjunto,
      porcentajeDescuentoConjunto: producto.porcentajeDescuentoConjunto,
      disponible: producto.stockConjuntos > 0
    });

  } catch (err) {
    next(err);
  }
});

// POST /api/productos/validar-carrito - Validar productos en carrito antes de checkout
router.post('/validar-carrito', authMiddleware, async (req, res, next) => {
  try {
    const { items } = req.body; // Array de { productoId, tipoVenta, cantidad }
    
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items debe ser un array' });
    }

    const validaciones = [];
    const errores = [];

    for (const item of items) {
      const { productoId, tipoVenta, cantidad } = item;
      
      try {
        const producto = await Product.findById(productoId);
        if (!producto) {
          errores.push(`Producto ${productoId} no encontrado`);
          continue;
        }

        let esValido = false;
        let mensaje = '';

        if (tipoVenta === 'individual') {
          esValido = producto.puedeVenderUnidades(cantidad);
          mensaje = esValido ? 
            'OK' : 
            `${producto.nombre}: Stock insuficiente (disponible: ${producto.stock})`;
        } else if (tipoVenta === 'conjunto') {
          if (!producto.tieneConjunto) {
            errores.push(`${producto.nombre}: No se vende por conjuntos`);
            continue;
          }
          
          esValido = producto.puedeVenderConjuntos(cantidad);
          mensaje = esValido ? 
            'OK' : 
            `${producto.nombre}: Stock de conjuntos insuficiente (disponible: ${producto.stockConjuntos})`;
        } else {
          errores.push(`${producto.nombre}: Tipo de venta inválido`);
          continue;
        }

        validaciones.push({
          productoId,
          nombre: producto.nombre,
          tipoVenta,
          cantidad,
          esValido,
          mensaje
        });

        if (!esValido) {
          errores.push(mensaje);
        }

      } catch (error) {
        errores.push(`Error al validar producto ${productoId}: ${error.message}`);
      }
    }

    const todoValido = errores.length === 0;

    res.json({
      valido: todoValido,
      validaciones,
      errores: todoValido ? [] : errores,
      mensaje: todoValido ? 
        'Todos los productos están disponibles' : 
        'Algunos productos no están disponibles'
    });

  } catch (err) {
    next(err);
  }
});

// ===== RUTA LEGACY (mantener compatibilidad) =====

// GET /api/productos/todos - Redirigir a la nueva ruta de admin
router.get('/todos', authMiddleware, adminMiddleware, (req, res) => {
  res.redirect('/api/productos/admin/todos');
});

module.exports = router;
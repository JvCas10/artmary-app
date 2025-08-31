// backend/controllers/productController.js - CON SISTEMA DUAL DE VENTAS
const Product = require('../models/Product');
const { cloudinary } = require('../utils/cloudinary');
const fs = require('fs');

// Crear producto con sistema dual
exports.crearProducto = async (req, res) => {
    let imageUrl = '';

    try {
        console.log('🟡 Datos recibidos del formulario (req.body):', req.body);
        console.log('🟡 Archivo recibido (req.file):', req.file);

        const {
            nombre,
            descripcion,
            precioCompra,
            precioVenta,
            categoria,
            stock,
            // NUEVOS CAMPOS PARA SISTEMA DUAL
            tieneConjunto,
            nombreConjunto,
            unidadesPorConjunto,
            precioConjunto,
            stockConjuntos
        } = req.body;

        // Validaciones básicas
        if (!nombre || !precioCompra || !precioVenta) {
            return res.status(400).json({
                error: 'Campos obligatorios faltantes',
                detalles: 'nombre, precioCompra y precioVenta son requeridos'
            });
        }

        // Validaciones para sistema dual
        const esConjunto = tieneConjunto === 'true' || tieneConjunto === true;

        if (esConjunto) {
            if (!nombreConjunto || !unidadesPorConjunto || !precioConjunto) {
                return res.status(400).json({
                    error: 'Campos de conjunto incompletos',
                    detalles: 'Para productos con conjunto se requiere: nombreConjunto, unidadesPorConjunto y precioConjunto'
                });
            }

            if (Number(unidadesPorConjunto) <= 0) {
                return res.status(400).json({
                    error: 'Las unidades por conjunto deben ser mayor a 0'
                });
            }

            if (Number(precioConjunto) < 0) {
                return res.status(400).json({
                    error: 'El precio del conjunto no puede ser negativo'
                });
            }
        }

        // Subir imagen si existe
        if (req.file) {
            try {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'productos',
                });
                imageUrl = result.secure_url;
                console.log('✅ Imagen subida a Cloudinary:', imageUrl);
            } catch (uploadError) {
                console.error('❌ Error al subir imagen a Cloudinary:', uploadError);
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                throw new Error('Fallo la subida de la imagen a Cloudinary: ' + uploadError.message);
            } finally {
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                    console.log('🗑️ Archivo temporal eliminado:', req.file.path);
                }
            }
        }

        // Crear objeto del producto
        const datosProducto = {
            nombre,
            descripcion,
            precioCompra: Number(precioCompra),
            precioVenta: Number(precioVenta),
            categoria,
            stock: Number(stock) || 0,
            imagenUrl: imageUrl,
            tieneConjunto: esConjunto
        };

        // Agregar campos de conjunto solo si aplica
        if (esConjunto) {
            datosProducto.nombreConjunto = nombreConjunto.trim();
            datosProducto.unidadesPorConjunto = Number(unidadesPorConjunto);
            datosProducto.precioConjunto = Number(precioConjunto);
            // stockConjuntos se calcula automáticamente como Math.floor(stock / unidadesPorConjunto)
        }

        const nuevoProducto = new Product(datosProducto);
        const guardado = await nuevoProducto.save();

        console.log('✅ Producto guardado en DB:', guardado);
        res.status(201).json(guardado);

    } catch (error) {
        console.error('❌ Error al crear producto en productController:');
        console.error('🪵 Detalle completo del error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error('🪵 Stack:', error.stack);

        res.status(500).json({
            error: 'Error interno al crear producto',
            detalle: error.message || 'Error desconocido'
        });
    }
};

// Obtener todos los productos CON PAGINACIÓN Y FILTROS AVANZADOS
exports.obtenerProductos = async (req, res) => {
    try {
        // Parámetros de paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'default';

        // PARÁMETROS DE FILTROS
        const categoria = req.query.categoria || '';
        const precioMin = req.query.precioMin ? parseFloat(req.query.precioMin) : null;
        const precioMax = req.query.precioMax ? parseFloat(req.query.precioMax) : null;
        const soloStock = req.query.soloStock === 'true';

        // NUEVO: Filtro por tipo de venta
        const tipoVenta = req.query.tipoVenta || ''; // 'individual', 'conjunto', 'ambos'

        const skip = (page - 1) * limit;

        // Construir filtro de búsqueda
        let searchFilter = {};

        // Filtro de texto
        if (search) {
            searchFilter.$or = [
                { nombre: { $regex: search, $options: 'i' } },
                { descripcion: { $regex: search, $options: 'i' } },
                { categoria: { $regex: search, $options: 'i' } }
            ];
        }

        // Filtro por categoría
        if (categoria) {
            searchFilter.categoria = categoria;
        }

        // Filtro por rango de precios (precio individual)
        if (precioMin !== null || precioMax !== null) {
            searchFilter.precioVenta = {};
            if (precioMin !== null) searchFilter.precioVenta.$gte = precioMin;
            if (precioMax !== null) searchFilter.precioVenta.$lte = precioMax;
        }

        // Filtro solo productos con stock
        if (soloStock) {
            searchFilter.$or = [
                { stock: { $gt: 0 } },
                { stockConjuntos: { $gt: 0 } }
            ];
        }

        // NUEVO: Filtro por tipo de venta
        if (tipoVenta === 'individual') {
            searchFilter.tieneConjunto = false;
        } else if (tipoVenta === 'conjunto') {
            searchFilter.tieneConjunto = true;
        }
        // Si es 'ambos' o vacío, no filtrar

        // Opciones de ordenamiento
        let sortOption = {};
        switch (sortBy) {
            case 'price_asc':
                sortOption = { precioVenta: 1 };
                break;
            case 'price_desc':
                sortOption = { precioVenta: -1 };
                break;
            case 'name_asc':
                sortOption = { nombre: 1 };
                break;
            case 'name_desc':
                sortOption = { nombre: -1 };
                break;
            case 'stock_asc':
                sortOption = { stock: 1 };
                break;
            case 'stock_desc':
                sortOption = { stock: -1 };
                break;
            default:
                sortOption = { createdAt: -1 }; // Más recientes primero
                break;
        }

        console.log('🔍 Filtro final construido:', JSON.stringify(searchFilter, null, 2));

        // Ejecutar consultas en paralelo para optimizar rendimiento
        const [productos, totalProductos, categorias] = await Promise.all([
            Product.find(searchFilter)
                .sort(sortOption)
                .skip(skip)
                .limit(limit),
            Product.countDocuments(searchFilter),
            Product.distinct('categoria') // Obtener todas las categorías únicas
        ]);

        // Calcular información de paginación
        const totalPages = Math.ceil(totalProductos / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        console.log('✅ Resultados encontrados:', {
            totalProductos,
            productosEnPagina: productos.length,
            categorias: categorias.length
        });

        // Respuesta con datos de paginación y filtros
        res.json({
            productos,
            pagination: {
                currentPage: page,
                totalPages,
                totalProducts: totalProductos,
                hasNextPage,
                hasPrevPage,
                limit
            },
            filtros: {
                categorias: categorias.filter(cat => cat && cat.trim() !== ''), // Filtrar categorías vacías
                aplicados: {
                    search,
                    categoria,
                    precioMin,
                    precioMax,
                    soloStock,
                    tipoVenta
                }
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener productos:', error);
        res.status(500).json({
            error: 'Error al obtener productos',
            detalle: error.message
        });
    }
};

// Obtener un producto por ID
exports.obtenerProductoPorId = async (req, res) => {
    try {
        const producto = await Product.findById(req.params.id);
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(producto);
    } catch (error) {
        console.error('❌ Error al obtener producto por ID:', error);
        res.status(500).json({ error: 'Error al obtener producto' });
    }
};

// Actualizar producto
exports.actualizarProducto = async (req, res) => {
    let imageUrlToUpdate = req.body.imagenUrl; // URL existente por defecto

    try {
        console.log('🟡 Actualizando producto con ID:', req.params.id);
        console.log('🟡 Datos recibidos:', req.body);
        console.log('🟡 Archivo recibido:', req.file);

        const productoExistente = await Product.findById(req.params.id);
        if (!productoExistente) {
            return res.status(404).json({ error: 'Producto no encontrado para actualizar' });
        }

        const {
            nombre,
            descripcion,
            precioCompra,
            precioVenta,
            categoria,
            stock,
            // CAMPOS PARA SISTEMA DUAL
            tieneConjunto,
            nombreConjunto,
            unidadesPorConjunto,
            precioConjunto,
            stockConjuntos
        } = req.body;

        // Validaciones básicas
        if (!nombre || !precioCompra || !precioVenta) {
            return res.status(400).json({
                error: 'Campos obligatorios faltantes',
                detalles: 'nombre, precioCompra y precioVenta son requeridos'
            });
        }

        // Validaciones para sistema dual
        const esConjunto = tieneConjunto === 'true' || tieneConjunto === true;

        if (esConjunto) {
            if (!nombreConjunto || !unidadesPorConjunto || !precioConjunto) {
                return res.status(400).json({
                    error: 'Campos de conjunto incompletos',
                    detalles: 'Para productos con conjunto se requiere: nombreConjunto, unidadesPorConjunto y precioConjunto'
                });
            }

            if (Number(unidadesPorConjunto) <= 0) {
                return res.status(400).json({
                    error: 'Las unidades por conjunto deben ser mayor a 0'
                });
            }

            if (Number(precioConjunto) < 0) {
                return res.status(400).json({
                    error: 'El precio del conjunto no puede ser negativo'
                });
            }
        }

        // Manejar nueva imagen si se subió
        if (req.file) {
            try {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'productos',
                });
                imageUrlToUpdate = result.secure_url;
                console.log('✅ Nueva imagen subida a Cloudinary:', imageUrlToUpdate);
            } catch (uploadError) {
                console.error('❌ Error al subir nueva imagen:', uploadError);
                throw new Error('Fallo la subida de la nueva imagen: ' + uploadError.message);
            } finally {
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                    console.log('🗑️ Archivo temporal eliminado:', req.file.path);
                }
            }
        }

        // Construir objeto con los campos a actualizar
        const updateData = {
            nombre,
            descripcion,
            precioCompra: Number(precioCompra),
            precioVenta: Number(precioVenta),
            categoria,
            stock: Number(stock),
            imagenUrl: imageUrlToUpdate,
            tieneConjunto: esConjunto
        };

        // Manejar campos de conjunto
        if (esConjunto) {
            updateData.nombreConjunto = nombreConjunto.trim();
            updateData.unidadesPorConjunto = Number(unidadesPorConjunto);
            updateData.precioConjunto = Number(precioConjunto);
            // stockConjuntos se calcula automáticamente
        } else {
            // Si ya no es conjunto, limpiar campos relacionados
            updateData.nombreConjunto = null;
            updateData.unidadesPorConjunto = null;
            updateData.precioConjunto = null;
            // No hay stockConjuntos que limpiar
        }

        // Actualizar el producto en la base de datos
        const actualizado = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!actualizado) {
            return res.status(404).json({ error: 'Producto no encontrado para actualizar' });
        }

        console.log('✅ Producto actualizado en DB:', actualizado);
        res.json(actualizado);

    } catch (error) {
        console.error('❌ Error al actualizar producto en productController:');
        console.error('🪵 Detalle completo del error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error('🪵 Stack:', error.stack);

        res.status(500).json({
            error: 'Error interno al actualizar producto',
            detalle: error.message || 'Error desconocido'
        });
    }
};

// Eliminar producto
exports.eliminarProducto = async (req, res) => {
    try {
        const eliminado = await Product.findByIdAndDelete(req.params.id);
        if (!eliminado) {
            return res.status(404).json({ error: 'Producto no encontrado para eliminar' });
        }

        console.log('✅ Producto eliminado:', eliminado.nombre);
        res.json({ mensaje: 'Producto eliminado correctamente' });
    } catch (error) {
        console.error('❌ Error al eliminar producto:', error);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
};

// NUEVAS FUNCIONES PARA SISTEMA DUAL

// Verificar disponibilidad de stock para venta
exports.verificarStock = async (req, res) => {
    try {
        const { productoId, tipoVenta, cantidad } = req.body;

        const producto = await Product.findById(productoId);
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        let disponible = false;
        let mensaje = '';

        if (tipoVenta === 'individual') {
            disponible = producto.puedeVenderUnidades(cantidad);
            mensaje = disponible ?
                'Stock suficiente' :
                `Stock insuficiente. Disponible: ${producto.stock}, Solicitado: ${cantidad}`;
        } else if (tipoVenta === 'conjunto') {
            disponible = producto.puedeVenderConjuntos(cantidad);
            const conjuntosDisponibles = Math.floor((producto.stock || 0) / producto.unidadesPorConjunto);
            mensaje = disponible ?
                'Stock de conjuntos suficiente' :
                `Stock de conjuntos insuficiente. Disponible: ${conjuntosDisponibles}, Solicitado: ${cantidad}`;
        }

        const conjuntosDisponibles = producto.tieneConjunto ?
            Math.floor((producto.stock || 0) / producto.unidadesPorConjunto) : 0;

        res.json({
            disponible,
            mensaje,
            stockIndividual: producto.stock,
            conjuntosDisponibles
        });
    } catch (error) {
        console.error('❌ Error al verificar stock:', error);
        res.status(500).json({ error: 'Error al verificar stock' });
    }
};

// Obtener estadísticas de productos
exports.obtenerEstadisticas = async (req, res) => {
    try {
        const stats = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalProductos: { $sum: 1 },
                    productosConConjunto: {
                        $sum: { $cond: ['$tieneConjunto', 1, 0] }
                    },
                    productosIndividuales: {
                        $sum: { $cond: ['$tieneConjunto', 0, 1] }
                    },
                    stockTotalUnidades: { $sum: '$stock' },
                    stockTotalConjuntos: { $sum: '$stockConjuntos' }
                }
            }
        ]);

        const categorias = await Product.distinct('categoria');

        res.json({
            estadisticas: stats[0] || {
                totalProductos: 0,
                productosConConjunto: 0,
                productosIndividuales: 0,
                stockTotalUnidades: 0,
                stockTotalConjuntos: 0
            },
            totalCategorias: categorias.length,
            categorias: categorias.filter(cat => cat && cat.trim() !== '')
        });

    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
};
// backend/controllers/productController.js - CON FILTROS AVANZADOS
const Product = require('../models/Product');
const { cloudinary } = require('../utils/cloudinary'); // Importa cloudinary directamente
const fs = require('fs'); // Necesitamos fs para eliminar el archivo temporal

// Crear producto
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
            stock
        } = req.body;

        if (!nombre || !precioCompra || !precioVenta) {
            return res.status(400).json({ error: 'Campos obligatorios (nombre, precio de compra, precio de venta) faltantes' });
        }

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

        const nuevoProducto = new Product({
            nombre,
            descripcion,
            precioCompra: Number(precioCompra),
            precioVenta: Number(precioVenta),
            categoria,
            stock: Number(stock),
            imagenUrl: imageUrl
        });

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
        
        // NUEVOS PARÁMETROS DE FILTROS
        const categoria = req.query.categoria || '';
        const precioMin = req.query.precioMin ? parseFloat(req.query.precioMin) : null;
        const precioMax = req.query.precioMax ? parseFloat(req.query.precioMax) : null;
        const disponibilidad = req.query.disponibilidad || ''; // 'en_stock', 'agotado', 'stock_bajo'

        console.log('🔍 Filtros recibidos:', {
            page, limit, search, sortBy, categoria, precioMin, precioMax, disponibilidad
        });

        const skip = (page - 1) * limit;

        // Construir filtros de búsqueda
        let searchFilter = {};

        // Filtro de búsqueda por texto
        if (search) {
            searchFilter.$or = [
                { nombre: { $regex: search, $options: 'i' } },
                { descripcion: { $regex: search, $options: 'i' } },
                { categoria: { $regex: search, $options: 'i' } }
            ];
        }

        // Filtro por categoría
        if (categoria && categoria !== 'todas' && categoria !== '') {
            searchFilter.categoria = { $regex: categoria, $options: 'i' };
        }

        // Filtro por rango de precios
        if (precioMin !== null || precioMax !== null) {
            searchFilter.precioVenta = {};
            if (precioMin !== null) searchFilter.precioVenta.$gte = precioMin;
            if (precioMax !== null) searchFilter.precioVenta.$lte = precioMax;
        }

        // Filtro por disponibilidad
        if (disponibilidad) {
            switch (disponibilidad) {
                case 'en_stock':
                    searchFilter.stock = { $gt: 0 };
                    break;
                case 'agotado':
                    searchFilter.stock = { $eq: 0 };
                    break;
                case 'stock_bajo':
                    searchFilter.stock = { $gt: 0, $lt: 5 };
                    break;
            }
        }

        // Construir ordenamiento
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
                    disponibilidad,
                    sortBy
                }
            }
        });
    } catch (error) {
        console.error('❌ Error al obtener productos con filtros:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
};

// Obtener producto por ID
exports.obtenerProductoPorId = async (req, res) => {
    try {
        const producto = await Product.findById(req.params.id);
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(producto);
    } catch (error) {
        console.error('❌ Error al buscar el producto:', error);
        res.status(500).json({ error: 'Error al buscar el producto' });
    }
};

// Actualizar producto
exports.actualizarProducto = async (req, res) => {
    let imageUrlToUpdate = req.body.imagenUrl; // Asume la URL existente si no se envía nueva imagen

    try {
        console.log('🟡 Datos recibidos para actualizar (req.body):', req.body);
        console.log('🟡 Archivo recibido para actualizar (req.file):', req.file);

        // Si se envía una nueva imagen, subirla a Cloudinary
        if (req.file) {
            try {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'productos', // Misma carpeta que para la creación
                });
                imageUrlToUpdate = result.secure_url; // Actualiza la URL con la nueva imagen
                console.log('✅ Nueva imagen subida a Cloudinary para actualización:', imageUrlToUpdate);
            } catch (uploadError) {
                console.error('❌ Error al subir nueva imagen a Cloudinary durante actualización:', uploadError);
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                throw new Error('Fallo la subida de la nueva imagen a Cloudinary: ' + uploadError.message);
            } finally {
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                    console.log('🗑️ Archivo temporal eliminado:', req.file.path);
                }
            }
        }

        // Construir el objeto con los campos a actualizar
        const updateData = {
            nombre: req.body.nombre,
            descripcion: req.body.descripcion,
            precioCompra: Number(req.body.precioCompra),
            precioVenta: Number(req.body.precioVenta),
            categoria: req.body.categoria,
            stock: Number(req.body.stock),
            imagenUrl: imageUrlToUpdate // Usa la URL de la nueva imagen o la existente
        };

        // Actualizar el producto en la base de datos
        const actualizado = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
        
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
        if (!eliminado) return res.status(404).json({ error: 'Producto no encontrado para eliminar' });
        res.json({ mensaje: 'Producto eliminado' });
    } catch (error) {
        console.error('❌ Error al eliminar producto:', error);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
};
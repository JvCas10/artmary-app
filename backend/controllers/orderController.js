// backend/controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');

// Función para obtener todos los pedidos CON PAGINACIÓN (útil para administradores)
exports.obtenerPedidos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [pedidos, totalPedidos] = await Promise.all([
      Order.find()
        .populate('userId', 'nombre correo')
        .sort({ fecha: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments()
    ]);

    const totalPages = Math.ceil(totalPedidos / limit);

    res.json({
      pedidos,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders: totalPedidos,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener todos los pedidos:', error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
};

// Función para obtener los pedidos de un usuario específico
exports.obtenerMisPedidos = async (req, res) => {
  try {
    const userId = req.user._id;
    const pedidos = await Order.find({ userId: userId }).sort({ fecha: -1 });
    res.json(pedidos);
  } catch (error) {
    console.error('❌ Error al obtener los pedidos del usuario:', error);
    res.status(500).json({ error: 'Error al obtener tus pedidos' });
  }
};

// Función para actualizar el estado de un pedido (solo para administradores)
exports.actualizarEstadoPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosPermitidos = ['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado', 'listo_para_recoger'];
    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({ mensaje: 'Estado de pedido inválido.' });
    }

    const pedido = await Order.findById(id);

    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado.' });
    }

    // Lógica para devolver stock si el estado cambia a 'cancelado'
    if (estado === 'cancelado' && pedido.estado !== 'cancelado') {
      for (const item of pedido.productos) {
        const producto = await Product.findById(item.productId);
        if (producto) {
          producto.stock += item.cantidad;
          await producto.save();
          console.log(`✅ Stock del producto ${producto.nombre} actualizado: +${item.cantidad}`);
        } else {
          console.warn(`⚠️ Producto con ID ${item.productId} no encontrado al intentar devolver stock.`);
        }
      }
    }

    pedido.estado = estado;
    await pedido.save();

    res.status(200).json({ mensaje: 'Estado del pedido actualizado con éxito.', pedido });
  } catch (error) {
    console.error('❌ Error al actualizar el estado del pedido:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el estado del pedido.', detalle: error.message });
  }
};

// NUEVA FUNCIÓN: Cancelar pedido por parte del cliente
exports.cancelarPedidoCliente = async (req, res) => {
  try {
    const { id } = req.params; // ID del pedido a cancelar
    const userId = req.user._id; // ID del usuario autenticado (para verificar que es su pedido)

    const pedido = await Order.findById(id);

    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado.' });
    }

    // Verificar que el pedido pertenece al usuario autenticado
    if (pedido.userId.toString() !== userId.toString()) {
      return res.status(403).json({ mensaje: 'No tienes permiso para cancelar este pedido.' });
    }

    // ✅ VERIFICACIÓN AMPLIADA: Incluir 'listo_para_recoger' y 'enviado'
    if (pedido.estado === 'entregado' || pedido.estado === 'cancelado') {
      return res.status(400).json({ mensaje: `El pedido ya está ${pedido.estado}. No se puede cancelar.` });
    }

    // ✅ DEVOLUCIÓN DE STOCK CORREGIDA con lógica de conjuntos
    for (const item of pedido.productos) {
      const producto = await Product.findById(item.productId);
      if (producto) {
        let unidadesADevolver;

        // Determinar cuántas unidades devolver según el tipo de venta
        if (item.tipoVenta === 'conjunto') {
          // Para conjuntos: item.cantidad contiene la cantidad de conjuntos O las unidades totales
          // Verificar si tenemos la información completa del conjunto
          if (item.unidadesPorConjunto && item.cantidadOriginal) {
            // Caso ideal: tenemos toda la información
            const cantidadConjuntos = item.cantidadOriginal;
            const unidadesPorConjunto = item.unidadesPorConjunto;
            unidadesADevolver = cantidadConjuntos * unidadesPorConjunto;

            console.log(`📦 Devolviendo stock por conjuntos (cliente):
              - Producto: ${producto.nombre}
              - Conjuntos cancelados: ${cantidadConjuntos}
              - Unidades por conjunto: ${unidadesPorConjunto}
              - Unidades totales a devolver: ${unidadesADevolver}`);
          } else {
            // Caso de compatibilidad: item.cantidad ya contiene las unidades totales
            unidadesADevolver = item.cantidad;

            console.log(`📦 Devolviendo stock por conjuntos (compatibilidad):
              - Producto: ${producto.nombre}
              - Unidades a devolver: ${unidadesADevolver}`);
          }
        } else {
          // Para productos individuales: item.cantidad ya son unidades
          unidadesADevolver = item.cantidad;

          console.log(`📦 Devolviendo stock individual (cliente):
            - Producto: ${producto.nombre}
            - Unidades a devolver: ${unidadesADevolver}`);
        }

        // Devolver el stock
        const stockAnterior = producto.stock;
        producto.stock += unidadesADevolver;
        await producto.save();

        console.log(`✅ Stock del producto ${producto.nombre} actualizado por cancelación de cliente:
          - Stock anterior: ${stockAnterior}
          - Unidades devueltas: ${unidadesADevolver}
          - Nuevo stock: ${producto.stock}`);
      } else {
        console.warn(`⚠️ Producto con ID ${item.productId} no encontrado al intentar devolver stock por cancelación de cliente.`);
      }
    }

    // Cambiar el estado del pedido a 'cancelado'
    pedido.estado = 'cancelado';
    await pedido.save();

    res.status(200).json({
      mensaje: 'Pedido cancelado con éxito. Stock devuelto.',
      pedido
    });
  } catch (error) {
    console.error('❌ Error al cancelar pedido por cliente:', error);
    console.error('📝 Stack trace:', error.stack);
    res.status(500).json({
      mensaje: 'Error al cancelar el pedido.',
      detalle: error.message
    });
  }
};
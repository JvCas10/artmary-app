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

    // Verificar que el pedido no esté ya entregado o cancelado
    if (pedido.estado === 'entregado' || pedido.estado === 'cancelado') {
      return res.status(400).json({ mensaje: `El pedido ya está ${pedido.estado}. No se puede cancelar.` });
    }

    // Devolver stock de los productos del pedido
    for (const item of pedido.productos) {
      const producto = await Product.findById(item.productId);
      if (producto) {
        producto.stock += item.cantidad; // Devuelve la cantidad al stock
        await producto.save();
        console.log(`✅ Stock del producto ${producto.nombre} actualizado: +${item.cantidad} (por cancelación de cliente).`);
      } else {
        console.warn(`⚠️ Producto con ID ${item.productId} no encontrado al intentar devolver stock por cancelación de cliente.`);
      }
    }

    // Cambiar el estado del pedido a 'cancelado'
    pedido.estado = 'cancelado';
    await pedido.save();

    res.status(200).json({ mensaje: 'Pedido cancelado con éxito. Stock devuelto.', pedido });
  } catch (error) {
    console.error('❌ Error al cancelar pedido por cliente:', error);
    res.status(500).json({ mensaje: 'Error al cancelar el pedido.', detalle: error.message });
  }
};
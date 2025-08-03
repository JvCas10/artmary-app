const express = require('express');
const router = express.Router();
const Producto = require('../models/Product');
const Order = require('../models/Order');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware'); // Importado para rutas admin
const orderController = require('../controllers/orderController');

// POST /api/pedidos/confirmar
// La ruta ahora es solo '/confirmar' porque se montará bajo '/api/pedidos'
router.post('/confirmar', authMiddleware, async (req, res) => {
  try {
    const itemsDelPedido = req.body;
    const userId = req.user._id;

    let totalPedido = 0;
    let gananciaTotalPedido = 0; // NUEVO: Variable para calcular ganancia total
    const productosParaGuardarEnOrden = [];

    // Primero verificamos stock y calculamos totales
    for (let item of itemsDelPedido) {
      const producto = await Producto.findById(item._id);
      if (!producto) {
        return res.status(404).json({ error: `Producto no encontrado: ${item.nombre || item._id}` });
      }

      if (producto.stock < item.cantidad) {
        return res.status(400).json({ error: `Stock insuficiente para el producto: ${producto.nombre}. Stock disponible: ${producto.stock}` });
      }

      // Calcular ganancia por producto
      const gananciaProducto = (producto.precioVenta - producto.precioCompra) * item.cantidad;
      const subtotalProducto = producto.precioVenta * item.cantidad;

      productosParaGuardarEnOrden.push({
        productId: producto._id,
        nombre: producto.nombre,
        cantidad: item.cantidad,
        precioVenta: producto.precioVenta,
        precioCompra: producto.precioCompra, // NUEVO: Guardamos precio de compra
        imagenUrl: producto.imagenUrl,
        ganancia: gananciaProducto // NUEVO: Guardamos ganancia por producto
      });

      totalPedido += subtotalProducto;
      gananciaTotalPedido += gananciaProducto; // NUEVO: Sumamos a la ganancia total

      console.log(`📊 Producto: ${producto.nombre} - Ganancia: Q${gananciaProducto.toFixed(2)}`);
    }

    // Ahora actualizamos el stock
    for (let item of itemsDelPedido) {
      const producto = await Producto.findById(item._id);
      producto.stock -= item.cantidad;
      await producto.save();
    }

    // Crear el pedido con la ganancia calculada
    const nuevoPedido = new Order({
      userId: userId,
      productos: productosParaGuardarEnOrden,
      total: totalPedido,
      gananciaTotal: gananciaTotalPedido, // NUEVO: Guardamos ganancia total
      fecha: new Date(),
      estado: 'confirmado'
    });

    await nuevoPedido.save();

    console.log(`✅ Pedido confirmado - Total: Q${totalPedido.toFixed(2)} - Ganancia: Q${gananciaTotalPedido.toFixed(2)}`);

    return res.status(200).json({ 
      mensaje: 'Pedido confirmado y stock actualizado. Pedido guardado.', 
      pedidoId: nuevoPedido._id,
      total: totalPedido,
      gananciaTotal: gananciaTotalPedido
    });
  } catch (err) {
    console.error('Error al confirmar pedido:', err);
    res.status(500).json({ error: 'Error al procesar el pedido', detalle: err.message });
  }
});

// GET /api/pedidos/mis-pedidos (PROTEGIDA para usuario normal)
// La ruta ahora es solo '/mis-pedidos' porque se montará bajo '/api/pedidos'
router.get('/mis-pedidos', authMiddleware, orderController.obtenerMisPedidos);

// GET /api/pedidos/todos (PROTEGIDA para administradores)
// La ruta ahora es solo '/todos' porque se montará bajo '/api/pedidos'
router.get('/todos', authMiddleware, adminMiddleware, orderController.obtenerPedidos);

// PUT /api/pedidos/:id/estado (PROTEGIDA para administradores)
// La ruta ahora es solo '/:id/estado' porque se montará bajo '/api/pedidos'
router.put('/:id/estado', authMiddleware, adminMiddleware, orderController.actualizarEstadoPedido);

// DELETE /api/pedidos/:id/cancelar-cliente (PROTEGIDA para clientes)
// La ruta ahora es solo '/:id/cancelar-cliente' porque se montará bajo '/api/pedidos'
router.delete('/:id/cancelar-cliente', authMiddleware, orderController.cancelarPedidoCliente);

module.exports = router;
const express = require('express');
const router = express.Router();
const Producto = require('../models/Product');
const Order = require('../models/Order');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const orderController = require('../controllers/orderController');

// POST /api/pedidos/confirmar
router.post('/confirmar', authMiddleware, async (req, res) => {
  try {
    const itemsDelPedido = req.body;
    const userId = req.user._id;

    let totalPedido = 0;
    let gananciaTotalPedido = 0;
    const productosParaGuardarEnOrden = [];

    // Primero verificamos stock y calculamos totales
    for (let item of itemsDelPedido) {
      const producto = await Producto.findById(item._id);
      if (!producto) {
        return res.status(404).json({ error: `Producto no encontrado: ${item.nombre || item._id}` });
      }

      // Determinar el tipo de venta
      const tipoVenta = item.tipoVenta || 'individual';
      
      // Validar stock disponible
      if (producto.stock < item.cantidad) {
        return res.status(400).json({ error: `Stock insuficiente para el producto: ${producto.nombre}. Stock disponible: ${producto.stock}` });
      }

      // Calcular ganancia y subtotal
      let gananciaProducto, subtotalProducto;
      
      if (tipoVenta === 'conjunto') {
        // Para conjuntos: calcular basado en el precio del conjunto
        const cantidadConjuntos = item.cantidadOriginal || Math.floor(item.cantidad / (producto.unidadesPorConjunto || 1));
        const precioCompraConjunto = producto.precioCompra * (producto.unidadesPorConjunto || 1);
        
        gananciaProducto = (producto.precioConjunto - precioCompraConjunto) * cantidadConjuntos;
        subtotalProducto = producto.precioConjunto * cantidadConjuntos;
      } else {
        // Para individuales: calcular normalmente
        gananciaProducto = (producto.precioVenta - producto.precioCompra) * item.cantidad;
        subtotalProducto = producto.precioVenta * item.cantidad;
      }

      // Preparar datos para guardar en la orden
      productosParaGuardarEnOrden.push({
        productId: producto._id,
        nombre: producto.nombre,
        cantidad: tipoVenta === 'conjunto' ? 
          (item.cantidadOriginal || Math.floor(item.cantidad / (producto.unidadesPorConjunto || 1))) : 
          item.cantidad,
        precioVenta: tipoVenta === 'conjunto' ? producto.precioConjunto : producto.precioVenta,
        precioCompra: tipoVenta === 'conjunto' ? 
          (producto.precioCompra * (producto.unidadesPorConjunto || 1)) : 
          producto.precioCompra,
        imagenUrl: producto.imagenUrl,
        ganancia: gananciaProducto,
        // Campos adicionales para el nuevo sistema
        tipoVenta: tipoVenta,
        cantidadOriginal: tipoVenta === 'conjunto' ? 
          (item.cantidadOriginal || Math.floor(item.cantidad / (producto.unidadesPorConjunto || 1))) : 
          item.cantidad,
        ...(tipoVenta === 'conjunto' && {
          nombreConjunto: producto.nombreConjunto,
          unidadesPorConjunto: producto.unidadesPorConjunto,
          precioConjunto: producto.precioConjunto,
          descripcionVenta: `${item.cantidadOriginal || Math.floor(item.cantidad / (producto.unidadesPorConjunto || 1))} ${producto.nombreConjunto}(s)`
        }),
        ...(tipoVenta === 'individual' && {
          descripcionVenta: `${item.cantidad} unidad(es)`
        })
      });

      totalPedido += subtotalProducto;
      gananciaTotalPedido += gananciaProducto;

      console.log(`📊 Producto: ${producto.nombre} - Tipo: ${tipoVenta} - Ganancia: Q${gananciaProducto.toFixed(2)}`);
    }

    // Actualizar stock (siempre en unidades totales)
    for (let item of itemsDelPedido) {
      const producto = await Producto.findById(item._id);
      producto.stock -= item.cantidad; // item.cantidad ya viene en unidades del frontend
      await producto.save();
      
      console.log(`📦 Stock actualizado para ${producto.nombre}: -${item.cantidad} unidades (restante: ${producto.stock})`);
    }

    // Crear el pedido
    const nuevoPedido = new Order({
      userId: userId,
      productos: productosParaGuardarEnOrden,
      total: totalPedido,
      gananciaTotal: gananciaTotalPedido,
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
router.get('/mis-pedidos', authMiddleware, orderController.obtenerMisPedidos);

// GET /api/pedidos/todos (PROTEGIDA para administradores)
router.get('/todos', authMiddleware, adminMiddleware, orderController.obtenerPedidos);

// PUT /api/pedidos/:id/estado (PROTEGIDA para administradores)
router.put('/:id/estado', authMiddleware, adminMiddleware, orderController.actualizarEstadoPedido);

// DELETE /api/pedidos/:id/cancelar-cliente (PROTEGIDA para clientes)
router.delete('/:id/cancelar-cliente', authMiddleware, orderController.cancelarPedidoCliente);

module.exports = router;
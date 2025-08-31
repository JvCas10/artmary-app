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
      
      // ✅ VALIDACIÓN DE STOCK CORREGIDA: item.cantidad siempre viene en unidades totales
      if (producto.stock < item.cantidad) {
        return res.status(400).json({ error: `Stock insuficiente para el producto: ${producto.nombre}. Stock disponible: ${producto.stock}` });
      }

      // Calcular ganancia y subtotal
      let gananciaProducto, subtotalProducto;
      let cantidadConjuntos = 1; // Por defecto para productos individuales
      
      if (tipoVenta === 'conjunto') {
        // Para conjuntos: calcular cuántos conjuntos se están vendiendo
        cantidadConjuntos = item.cantidadOriginal || Math.floor(item.cantidad / (producto.unidadesPorConjunto || 1));
        const precioCompraConjunto = producto.precioCompra * (producto.unidadesPorConjunto || 1);
        
        gananciaProducto = (producto.precioConjunto - precioCompraConjunto) * cantidadConjuntos;
        subtotalProducto = producto.precioConjunto * cantidadConjuntos;
        
        console.log(`🎁 Conjunto detectado:
          - Producto: ${producto.nombre}
          - Conjuntos vendidos: ${cantidadConjuntos}
          - Unidades por conjunto: ${producto.unidadesPorConjunto}
          - Unidades totales: ${item.cantidad}
          - Precio por conjunto: Q${producto.precioConjunto}`);
      } else {
        // Para individuales: calcular normalmente
        gananciaProducto = (producto.precioVenta - producto.precioCompra) * item.cantidad;
        subtotalProducto = producto.precioVenta * item.cantidad;
        
        console.log(`📦 Producto individual:
          - Producto: ${producto.nombre}
          - Unidades vendidas: ${item.cantidad}
          - Precio unitario: Q${producto.precioVenta}`);
      }

      // ✅ PREPARAR DATOS PARA GUARDAR EN LA ORDEN - INFORMACIÓN COMPLETA
      productosParaGuardarEnOrden.push({
        productId: producto._id,
        nombre: producto.nombre,
        // ✅ CORRECCIÓN CRÍTICA: Siempre guardar las unidades totales que se descontaron del stock
        cantidad: item.cantidad, // Esta es la cantidad real en unidades que se descontó del stock
        precioVenta: tipoVenta === 'conjunto' ? producto.precioConjunto : producto.precioVenta,
        precioCompra: tipoVenta === 'conjunto' ? 
          (producto.precioCompra * (producto.unidadesPorConjunto || 1)) : 
          producto.precioCompra,
        imagenUrl: producto.imagenUrl,
        ganancia: gananciaProducto,
        // Campos adicionales para el nuevo sistema
        tipoVenta: tipoVenta,
        // ✅ NUEVA LÓGICA: Guardar tanto la cantidad de conjuntos como las unidades totales
        cantidadOriginal: tipoVenta === 'conjunto' ? cantidadConjuntos : item.cantidad,
        unidadesTotales: item.cantidad, // Siempre las unidades que se descontaron del stock
        ...(tipoVenta === 'conjunto' && {
          nombreConjunto: producto.nombreConjunto,
          unidadesPorConjunto: producto.unidadesPorConjunto,
          precioConjunto: producto.precioConjunto,
          descripcionVenta: `${cantidadConjuntos} ${producto.nombreConjunto}(s) = ${item.cantidad} unidades`
        }),
        ...(tipoVenta === 'individual' && {
          descripcionVenta: `${item.cantidad} unidad(es)`
        })
      });

      totalPedido += subtotalProducto;
      gananciaTotalPedido += gananciaProducto;

      console.log(`📊 Resumen producto:
        - Nombre: ${producto.nombre}
        - Tipo: ${tipoVenta}
        - Ganancia: Q${gananciaProducto.toFixed(2)}
        - Subtotal: Q${subtotalProducto.toFixed(2)}`);
    }

    // ✅ ACTUALIZAR STOCK (siempre en unidades totales)
    for (let item of itemsDelPedido) {
      const producto = await Producto.findById(item._id);
      if (producto) {
        const stockAnterior = producto.stock;
        producto.stock -= item.cantidad; // item.cantidad ya viene en unidades totales del frontend
        await producto.save();
        
        console.log(`📦 Stock actualizado para ${producto.nombre}:
          - Stock anterior: ${stockAnterior}
          - Unidades descontadas: ${item.cantidad}
          - Stock restante: ${producto.stock}`);
      }
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

    console.log(`✅ Pedido confirmado exitosamente:
      - ID: ${nuevoPedido._id}
      - Total: Q${totalPedido.toFixed(2)}
      - Ganancia: Q${gananciaTotalPedido.toFixed(2)}
      - Productos: ${productosParaGuardarEnOrden.length}`);

    return res.status(200).json({
      mensaje: 'Pedido confirmado y stock actualizado. Pedido guardado.',
      pedidoId: nuevoPedido._id,
      total: totalPedido,
      gananciaTotal: gananciaTotalPedido
    });
  } catch (err) {
    console.error('❌ Error al confirmar pedido:', err);
    console.error('📝 Stack trace:', err.stack);
    res.status(500).json({ 
      error: 'Error al procesar el pedido', 
      detalle: err.message 
    });
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
// src/components/admin/PuntoDeVenta.jsx - INTERFAZ PUNTO DE VENTA CORREGIDA
import React, { useState, useEffect } from 'react';
import './PuntoDeVenta.css'; // Importamos los estilos por separado

function PuntoDeVenta({ 
  productos, 
  carritoPos, 
  setCarritoPos, 
  onVentaRegistrada, 
  obtenerTodosLosProductos 
}) {
  const [busqueda, setBusqueda] = useState('');
  const [todosLosProductos, setTodosLosProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas');
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [cliente, setCliente] = useState({ nombre: '', telefono: '' });

  // Cargar todos los productos al inicializar
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const productos = await obtenerTodosLosProductos();
        setTodosLosProductos(productos);
        setProductosFiltrados(productos);
      } catch (error) {
        console.error('Error al cargar productos:', error);
      }
    };
    cargarProductos();
  }, [obtenerTodosLosProductos]);

  // Filtrar productos por búsqueda y categoría
  useEffect(() => {
    let productosFiltrados = todosLosProductos;

    // Filtrar por categoría
    if (categoriaSeleccionada !== 'todas') {
      productosFiltrados = productosFiltrados.filter(
        producto => producto.categoria === categoriaSeleccionada
      );
    }

    // Filtrar por búsqueda
    if (busqueda.trim()) {
      productosFiltrados = productosFiltrados.filter(producto =>
        producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (producto.categoria && producto.categoria.toLowerCase().includes(busqueda.toLowerCase()))
      );
    }

    setProductosFiltrados(productosFiltrados);
  }, [busqueda, categoriaSeleccionada, todosLosProductos]);

  // Obtener categorías únicas
  const categorias = [...new Set(todosLosProductos.map(p => p.categoria).filter(Boolean))];

  const formatPrice = (price) => {
    const numPrice = Number(price);
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  const agregarAlCarrito = (producto) => {
    if (producto.stock <= 0) {
      setMensaje('⚠️ Este producto no tiene stock disponible');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }

    const existeEnCarrito = carritoPos.find(item => item._id === producto._id);
    
    if (existeEnCarrito) {
      if (existeEnCarrito.cantidad >= producto.stock) {
        setMensaje('⚠️ No hay más stock disponible de este producto');
        setTimeout(() => setMensaje(''), 3000);
        return;
      }
      
      setCarritoPos(prev => 
        prev.map(item => 
          item._id === producto._id 
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      setCarritoPos(prev => [...prev, { ...producto, cantidad: 1 }]);
    }

    setMensaje('✅ Producto agregado al carrito');
    setTimeout(() => setMensaje(''), 2000);
  };

  const actualizarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(productoId);
      return;
    }

    const producto = todosLosProductos.find(p => p._id === productoId);
    if (nuevaCantidad > producto.stock) {
      setMensaje('⚠️ Cantidad excede el stock disponible');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }

    setCarritoPos(prev =>
      prev.map(item =>
        item._id === productoId
          ? { ...item, cantidad: nuevaCantidad }
          : item
      )
    );
  };

  const eliminarDelCarrito = (productoId) => {
    setCarritoPos(prev => prev.filter(item => item._id !== productoId));
  };

  const vaciarCarrito = () => {
    setCarritoPos([]);
    setCliente({ nombre: '', telefono: '' });
  };

  const calcularTotal = () => {
    return carritoPos.reduce((total, item) => 
      total + (item.precioVenta * item.cantidad), 0
    );
  };

  const calcularGanancias = () => {
    return carritoPos.reduce((total, item) => 
      total + ((item.precioVenta - item.precioCompra) * item.cantidad), 0
    );
  };

  const procesarVenta = async () => {
    if (carritoPos.length === 0) {
      setMensaje('⚠️ El carrito está vacío');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }

    if (!cliente.nombre.trim()) {
      setMensaje('⚠️ Por favor ingresa el nombre del cliente');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const ventaData = {
        cliente: cliente,
        productos: carritoPos.map(item => ({
          productoId: item._id,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precioVenta: item.precioVenta,
          precioCompra: item.precioCompra,
          subtotal: item.precioVenta * item.cantidad,
          ganancia: (item.precioVenta - item.precioCompra) * item.cantidad
        })),
        total: calcularTotal(),
        gananciaTotal: calcularGanancias(),
        tipo: 'fisica',
        metodoPago: 'efectivo',
        fecha: new Date()
      };

      await onVentaRegistrada(ventaData);
      vaciarCarrito();
      setMensaje('✅ Venta registrada exitosamente');
      setTimeout(() => setMensaje(''), 5000);
    } catch (error) {
      console.error('Error al procesar venta:', error);
      setMensaje('❌ Error al procesar la venta');
      setTimeout(() => setMensaje(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pos-container">
      {/* Mensajes */}
      {mensaje && (
        <div className={`notification ${mensaje.includes('✅') ? 'success' : 'error'}`}>
          {mensaje}
        </div>
      )}

      <div className="pos-layout">
        {/* Panel izquierdo - Catálogo de productos */}
        <div className="catalogo-panel">
          <div className="catalogo-header">
            <h2 className="panel-title">
              <span className="panel-icon">🛍️</span>
              Catálogo de Productos
            </h2>
            
            {/* Búsqueda */}
            <div className="search-container">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>

            {/* Filtro por categoría */}
            <select
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              className="category-select"
            >
              <option value="todas">Todas las categorías</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </div>

          {/* Grid de productos */}
          <div className="productos-grid">
            {productosFiltrados.length === 0 ? (
              <div className="no-products">
                <span className="no-products-icon">📦</span>
                <p className="no-products-text">
                  {busqueda || categoriaSeleccionada !== 'todas' 
                    ? 'No se encontraron productos con esos filtros'
                    : 'No hay productos disponibles'
                  }
                </p>
              </div>
            ) : (
              productosFiltrados.map(producto => (
                <div key={producto._id} className="producto-card">
                  <div className="producto-image-container">
                    <img
                      src={producto.imagenUrl || "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=120&h=120&fit=crop"}
                      alt={producto.nombre}
                      className="producto-image"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=120&h=120&fit=crop";
                      }}
                    />
                    <div className={`stock-badge ${producto.stock === 0 ? 'sin-stock' : 'con-stock'}`}>
                      Stock: {producto.stock}
                    </div>
                  </div>
                  
                  <div className="producto-info">
                    <h4 className="producto-nombre">{producto.nombre}</h4>
                    <p className="producto-categoria">{producto.categoria || 'Sin categoría'}</p>
                    <p className="producto-precio">Q{formatPrice(producto.precioVenta)}</p>
                  </div>

                  <button
                    onClick={() => agregarAlCarrito(producto)}
                    disabled={producto.stock === 0}
                    className={`agregar-button ${producto.stock === 0 ? 'disabled' : ''}`}
                  >
                    <span className="button-icon">➕</span>
                    {producto.stock === 0 ? 'Sin Stock' : 'Agregar'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel derecho - Carrito de venta */}
        <div className="carrito-panel">
          <div className="carrito-header">
            <h2 className="panel-title">
              <span className="panel-icon">🛒</span>
              Carrito de Venta
            </h2>
            {carritoPos.length > 0 && (
              <button
                onClick={vaciarCarrito}
                className="vaciar-button"
              >
                <span className="button-icon">🗑️</span>
                Vaciar
              </button>
            )}
          </div>

          {/* Información del cliente */}
          <div className="cliente-section">
            <h3 className="cliente-title">
              <span className="cliente-icon">👤</span>
              Información del Cliente
            </h3>
            <div className="cliente-form">
              <input
                type="text"
                placeholder="Nombre del cliente *"
                value={cliente.nombre}
                onChange={(e) => setCliente(prev => ({...prev, nombre: e.target.value}))}
                className="cliente-input"
              />
              <input
                type="tel"
                placeholder="Teléfono (opcional)"
                value={cliente.telefono}
                onChange={(e) => setCliente(prev => ({...prev, telefono: e.target.value}))}
                className="cliente-input"
              />
            </div>
          </div>

          {/* Items del carrito */}
          <div className="carrito-items">
            {carritoPos.length === 0 ? (
              <div className="carrito-vacio">
                <span className="carrito-vacio-icon">🛒</span>
                <p className="carrito-vacio-text">El carrito está vacío</p>
                <p className="carrito-vacio-subtext">Agrega productos del catálogo</p>
              </div>
            ) : (
              <div className="carrito-list">
                {carritoPos.map(item => (
                  <div key={item._id} className="carrito-item">
                    <div className="item-image-container">
                      <img
                        src={item.imagenUrl || "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=60&h=60&fit=crop"}
                        alt={item.nombre}
                        className="item-image"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=60&h=60&fit=crop";
                        }}
                      />
                    </div>
                    
                    <div className="item-info">
                      <h4 className="item-nombre">{item.nombre}</h4>
                      <p className="item-precio">Q{formatPrice(item.precioVenta)} c/u</p>
                      <p className="item-subtotal">
                        Subtotal: Q{formatPrice(item.precioVenta * item.cantidad)}
                      </p>
                    </div>

                    <div className="item-controls">
                      <div className="quantity-control">
                        <button
                          onClick={() => actualizarCantidad(item._id, item.cantidad - 1)}
                          className="quantity-button"
                        >
                          −
                        </button>
                        <span className="quantity-display">{item.cantidad}</span>
                        <button
                          onClick={() => actualizarCantidad(item._id, item.cantidad + 1)}
                          className="quantity-button"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => eliminarDelCarrito(item._id)}
                        className="remove-button"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resumen y total */}
          {carritoPos.length > 0 && (
            <div className="resumen-section">
              <div className="resumen-item">
                <span className="resumen-label">Productos:</span>
                <span className="resumen-value">
                  {carritoPos.reduce((sum, item) => sum + item.cantidad, 0)}
                </span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">Ganancia:</span>
                <span className="resumen-ganancia">Q{formatPrice(calcularGanancias())}</span>
              </div>
              <div className="resumen-divider"></div>
              <div className="total-row">
                <span className="total-label">TOTAL:</span>
                <span className="total-amount">Q{formatPrice(calcularTotal())}</span>
              </div>
            </div>
          )}

          {/* Botón de procesar venta */}
          <button
            onClick={procesarVenta}
            disabled={carritoPos.length === 0 || !cliente.nombre.trim() || isLoading}
            className={`procesar-venta-button ${(carritoPos.length === 0 || !cliente.nombre.trim() || isLoading) ? 'disabled' : ''}`}
          >
            <span className="button-icon">
              {isLoading ? '⏳' : '💳'}
            </span>
            {isLoading ? 'Procesando...' : 'Procesar Venta'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PuntoDeVenta;
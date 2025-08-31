// src/components/admin/PuntoDeVenta.jsx - INTERFAZ PUNTO DE VENTA CON LÓGICA DE CAJAS Y UNIDADES
import React, { useState, useEffect } from 'react';
import './PuntoDeVenta.css';

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
  const [metodoPago, setMetodoPago] = useState('efectivo');

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

  // Función para calcular stock disponible considerando lo que ya está en el carrito
  const calcularStockDisponible = (producto) => {
    // Encontrar items del mismo producto en el carrito
    const itemsDelProducto = carritoPos.filter(item => item._id === producto._id);

    const unidadesUsadasIndividual = itemsDelProducto
      .filter(item => item.tipoVenta === 'individual')
      .reduce((total, item) => total + item.cantidad, 0);

    const conjuntosUsados = itemsDelProducto
      .filter(item => item.tipoVenta === 'conjunto')
      .reduce((total, item) => total + item.cantidad, 0);

    // Calcular unidades totales ocupadas en el carrito
    const unidadesTotalesOcupadas = unidadesUsadasIndividual + (conjuntosUsados * (producto.unidadesPorConjunto || 0));

    // Stock total disponible del producto
    const stockTotalDisponible = producto.stock || 0;
    const unidadesLibres = stockTotalDisponible - unidadesTotalesOcupadas;

    // Conjuntos disponibles = cuántos conjuntos completos se pueden formar con las unidades libres
    const conjuntosDisponibles = producto.tieneConjunto ?
      Math.floor(unidadesLibres / (producto.unidadesPorConjunto || 1)) : 0;

    return {
      unidadesLibres,
      conjuntosDisponibles
    };
  };

  const agregarAlCarrito = (producto, tipoVenta = 'individual', cantidad = 1) => {
    // Calcular stock disponible
    const stockDisponible = calcularStockDisponible(producto);

    // Validar antes de agregar
    if (tipoVenta === 'conjunto') {
      if (stockDisponible.conjuntosDisponibles <= 0) {
        setMensaje(`❌ No hay ${producto.nombreConjunto}s disponibles (stock ocupado por otros items)`);
        setTimeout(() => setMensaje(''), 3000);
        return;
      }
    } else {
      if (stockDisponible.unidadesLibres <= 0) {
        setMensaje(`❌ No hay unidades disponibles (stock ocupado por conjuntos en carrito)`);
        setTimeout(() => setMensaje(''), 3000);
        return;
      }
    }

    // Buscar item existente del mismo tipo
    const existeEnCarrito = carritoPos.find(item =>
      item._id === producto._id && item.tipoVenta === tipoVenta
    );

    if (existeEnCarrito) {
      setCarritoPos(prev =>
        prev.map(item =>
          item._id === producto._id && item.tipoVenta === tipoVenta
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        )
      );
    } else {
      const nuevoItem = {
        ...producto,
        tipoVenta,
        cantidad,
        claveUnica: `${producto._id}-${tipoVenta}`,
        precioDisplay: tipoVenta === 'conjunto' ? producto.precioConjunto : producto.precioVenta
      };
      setCarritoPos(prev => [...prev, nuevoItem]);
    }

    const mensaje = tipoVenta === 'conjunto' ?
      `✅ ${producto.nombreConjunto} agregado al carrito` :
      `✅ ${producto.nombre} agregado al carrito`;
    setMensaje(mensaje);
    setTimeout(() => setMensaje(''), 2000);
  };

  const actualizarCantidad = (productoId, nuevaCantidad, tipoVenta = 'individual') => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(productoId, tipoVenta);
      return;
    }

    const producto = todosLosProductos.find(p => p._id === productoId);
    if (!producto) return;

    // Validar stock disponible considerando el carrito actual
    const stockDisponible = calcularStockDisponible(producto);

    if (tipoVenta === 'conjunto') {
      if (nuevaCantidad > stockDisponible.conjuntosDisponibles + (carritoPos.find(item =>
        item._id === productoId && item.tipoVenta === tipoVenta)?.cantidad || 0)) {
        setMensaje('⚠️ Cantidad excede el stock disponible');
        setTimeout(() => setMensaje(''), 3000);
        return;
      }
    } else {
      if (nuevaCantidad > stockDisponible.unidadesLibres + (carritoPos.find(item =>
        item._id === productoId && item.tipoVenta === tipoVenta)?.cantidad || 0)) {
        setMensaje('⚠️ Cantidad excede el stock disponible');
        setTimeout(() => setMensaje(''), 3000);
        return;
      }
    }

    setCarritoPos(prev =>
      prev.map(item =>
        item._id === productoId && item.tipoVenta === tipoVenta
          ? { ...item, cantidad: nuevaCantidad }
          : item
      )
    );
  };

  const eliminarDelCarrito = (productoId, tipoVenta = 'individual') => {
    setCarritoPos(prev => prev.filter(item =>
      !(item._id === productoId && item.tipoVenta === tipoVenta)
    ));
  };

  const vaciarCarrito = () => {
    setCarritoPos([]);
    setCliente({ nombre: '', telefono: '' });
  };

  const calcularTotal = () => {
    return carritoPos.reduce((total, item) => {
      const precio = item.tipoVenta === 'conjunto' ? item.precioConjunto : item.precioVenta;
      return total + (precio * item.cantidad);
    }, 0);
  };

  const calcularGanancias = () => {
    return carritoPos.reduce((total, item) => {
      const precioVentaUnitario = item.tipoVenta === 'conjunto' ?
        (item.precioConjunto / item.unidadesPorConjunto) :
        item.precioVenta;
      const unidadesVendidas = item.tipoVenta === 'conjunto' ?
        (item.cantidad * item.unidadesPorConjunto) :
        item.cantidad;
      const gananciaUnitaria = precioVentaUnitario - item.precioCompra;
      return total + (gananciaUnitaria * unidadesVendidas);
    }, 0);
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
        productos: carritoPos.map(item => {
          // Detectar si es conjunto
          const esConjunto = item.tipoVenta === 'conjunto';

          return {
            productoId: item._id,
            nombre: item.nombre,
            // Para conjuntos: unidades totales, para individuales: cantidad normal
            cantidad: esConjunto ? (item.cantidad * item.unidadesPorConjunto) : item.cantidad,
            tipoVenta: item.tipoVenta || 'individual',
            cantidadOriginal: item.cantidad, // Cantidad original de conjuntos o unidades
            precioVenta: esConjunto ? item.precioConjunto : item.precioVenta,
            precioCompra: item.precioCompra,
            subtotal: (esConjunto ? item.precioConjunto : item.precioVenta) * item.cantidad,
            ganancia: esConjunto ?
              ((item.precioConjunto / item.unidadesPorConjunto) - item.precioCompra) * (item.cantidad * item.unidadesPorConjunto) :
              (item.precioVenta - item.precioCompra) * item.cantidad,
            // Campos adicionales para conjuntos
            ...(esConjunto && {
              unidadesPorConjunto: item.unidadesPorConjunto,
              nombreConjunto: item.nombreConjunto,
              precioConjunto: item.precioConjunto,
              descripcionVenta: `${item.cantidad} ${item.nombreConjunto}(s) = ${item.cantidad * item.unidadesPorConjunto} unidades`
            }),
            // Campos para individuales
            ...(!esConjunto && {
              descripcionVenta: `${item.cantidad} unidades individuales`
            })
          };
        }),
        total: calcularTotal(),
        gananciaTotal: calcularGanancias(),
        tipo: 'fisica',
        metodoPago: metodoPago,
        fecha: new Date()
      };

      console.log('💾 Enviando datos de venta física:', ventaData);

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
        <div className={`notification ${mensaje.includes('✅') ? 'success' : mensaje.includes('❌') ? 'error' : 'warning'}`}>
          <span className="notification-icon">
            {mensaje.includes('✅') ? '✅' : mensaje.includes('❌') ? '❌' : '⚠️'}
          </span>
          {mensaje}
        </div>
      )}

      {/* Contenido principal */}
      <div className="pos-layout">
        {/* Panel izquierdo - Productos */}
        <div className="productos-panel">
          <div className="productos-header">
            <h2 className="panel-title">
              <span className="panel-icon">🛍️</span>
              Catálogo de Productos
            </h2>

            {/* Controles de búsqueda y filtrado */}
            <div className="productos-controls">
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

              <select
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                className="category-select"
              >
                <option value="todas">Todas las categorías</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid de productos */}
          <div className="productos-grid">
            {productosFiltrados.map(producto => (
              <div key={producto._id} className="producto-card">
                <div className="producto-imagen">
                  {producto.imagenUrl ? (
                    <img src={producto.imagenUrl} alt={producto.nombre} className="producto-img" />
                  ) : (
                    <div className="placeholder-image">
                      <span className="placeholder-icon">📦</span>
                    </div>
                  )}
                </div>
                <div className="producto-info">
                  <h3 className="producto-nombre">{producto.nombre}</h3>
                  <p className="producto-categoria">{producto.categoria}</p>

                  {/* Información de precios */}
                  <div className="producto-precios">
                    <div className="precio-individual">
                      <span className="precio-label">Individual:</span>
                      <span className="precio-valor">Q{formatPrice(producto.precioVenta)}</span>
                    </div>

                    {/* Mostrar información de conjunto si aplica */}
                    {producto.tieneConjunto && (
                      <div className="precio-conjunto">
                        <span className="precio-label">{producto.nombreConjunto}:</span>
                        <span className="precio-valor">Q{formatPrice(producto.precioConjunto)}</span>
                        <span className="precio-unidades">({producto.unidadesPorConjunto} unidades)</span>
                        {producto.precioConjunto && producto.unidadesPorConjunto && (
                          <span className="precio-descuento">
                            {(((producto.precioVenta - (producto.precioConjunto / producto.unidadesPorConjunto)) / producto.precioVenta) * 100).toFixed(1)}% desc.
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Información de stock */}
                  <div className="producto-stock">
                    <div className="stock-info">
                      <span className="stock-label">Stock total:</span>
                      <span className="stock-valor">{producto.stock || 0} unidades</span>
                    </div>

                    {producto.tieneConjunto && (() => {
                      const { unidadesLibres, conjuntosDisponibles } = calcularStockDisponible(producto);
                      return (
                        <div className="stock-conjuntos">
                          <span className="stock-label">{producto.nombreConjunto}s disponibles:</span>
                          <span className="stock-valor">{conjuntosDisponibles}</span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Botones de agregar */}
                  <div className="producto-acciones">
                    {/* Botón para compra individual */}
                    <button
                      onClick={() => agregarAlCarrito(producto, 'individual', 1)}
                      disabled={(() => {
                        const { unidadesLibres } = calcularStockDisponible(producto);
                        return unidadesLibres <= 0;
                      })()}
                      className={`agregar-button individual ${(() => {
                        const { unidadesLibres } = calcularStockDisponible(producto);
                        return unidadesLibres <= 0 ? 'disabled' : '';
                      })()}`}
                    >
                      <span className="button-icon">🛒</span>
                      {(() => {
                        const { unidadesLibres } = calcularStockDisponible(producto);
                        return unidadesLibres <= 0 ? 'Sin stock' : '+ Individual';
                      })()}
                    </button>

                    {/* Botón para compra por conjunto (solo si aplica) */}
                    {producto.tieneConjunto && (
                      <button
                        onClick={() => agregarAlCarrito(producto, 'conjunto', 1)}
                        disabled={(() => {
                          const { conjuntosDisponibles } = calcularStockDisponible(producto);
                          return conjuntosDisponibles <= 0;
                        })()}
                        className={`agregar-button conjunto ${(() => {
                          const { conjuntosDisponibles } = calcularStockDisponible(producto);
                          return conjuntosDisponibles <= 0 ? 'disabled' : '';
                        })()}`}
                      >
                        <span className="button-icon">📦</span>
                        {(() => {
                          const { conjuntosDisponibles } = calcularStockDisponible(producto);
                          return conjuntosDisponibles <= 0 ? `Sin ${producto.nombreConjunto}s` : `+ ${producto.nombreConjunto}`;
                        })()}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel derecho - Carrito de venta */}
        {/* Panel del carrito - SECCIÓN COMPLETA */}
        <div className="carrito-panel">
          {/* Header del carrito */}
          <div className="carrito-header">
            <div className="panel-title">
              <span className="panel-icon">🛒</span>
              Carrito ({carritoPos.length})
            </div>
            {carritoPos.length > 0 && (
              <button onClick={vaciarCarrito} className="vaciar-button">
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
                onChange={(e) => setCliente(prev => ({ ...prev, nombre: e.target.value }))}
                className="cliente-input"
                required
              />
              <input
                type="text"
                placeholder="Teléfono (opcional)"
                value={cliente.telefono}
                onChange={(e) => setCliente(prev => ({ ...prev, telefono: e.target.value }))}
                className="cliente-input"
              />
            </div>
          </div>

          {/* Items del carrito */}
          <div className="carrito-items">
            {carritoPos.length === 0 ? (
              <div className="carrito-vacio">
                <div className="carrito-vacio-icon">🛒</div>
                <p className="carrito-vacio-text">El carrito está vacío</p>
                <p className="carrito-vacio-subtitle">Agrega productos para comenzar la venta</p>
              </div>
            ) : (
              carritoPos.map(item => (
                <div key={item.claveUnica} className="carrito-item">
                  <div className="item-info">
                    <h4 className="item-nombre">{item.nombre}</h4>
                    <p className="item-tipo">
                      {item.tipoVenta === 'conjunto' ?
                        `${item.nombreConjunto} (${item.unidadesPorConjunto} unidades)` :
                        'Individual'
                      }
                    </p>
                    <p className="item-precio">
                      Q{formatPrice(item.tipoVenta === 'conjunto' ? item.precioConjunto : item.precioVenta)}
                    </p>
                  </div>

                  <div className="item-controls">
                    <div className="cantidad-controls">
                      <button
                        onClick={() => actualizarCantidad(item._id, item.cantidad - 1, item.tipoVenta)}
                        className="cantidad-button minus"
                      >
                        -
                      </button>
                      <span className="cantidad-display">{item.cantidad}</span>
                      <button
                        onClick={() => actualizarCantidad(item._id, item.cantidad + 1, item.tipoVenta)}
                        className="cantidad-button plus"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => eliminarDelCarrito(item._id, item.tipoVenta)}
                      className="eliminar-button"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="item-subtotal">
                    Q{formatPrice((item.tipoVenta === 'conjunto' ? item.precioConjunto : item.precioVenta) * item.cantidad)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Resumen de venta */}
          {/* Método de pago - SIEMPRE VISIBLE */}
          <div className="metodo-pago-container">
            <label className="metodo-pago-label">Método de pago:</label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="metodo-pago-select"
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
              <option value="mixto">Mixto</option>
            </select>
          </div>

          {/* Resumen solo cuando hay productos */}
          {carritoPos.length > 0 && (
            <div className="resumen-venta">
              <div className="resumen-item">
                <span className="resumen-label">Subtotal:</span>
                <span className="resumen-value">Q{formatPrice(calcularTotal())}</span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">Ganancia estimada:</span>
                <span className="resumen-ganancia">Q{formatPrice(calcularGanancias())}</span>
              </div>
              <div className="resumen-divider"></div>
              <div className="total-row">
                <span className="total-label">Total:</span>
                <span className="total-amount">Q{formatPrice(calcularTotal())}</span>
              </div>
            </div>
          )}

          {/* Botón de procesar venta */}
          <button
            onClick={procesarVenta}
            disabled={carritoPos.length === 0 || !cliente.nombre.trim() || isLoading}
            className={`procesar-venta-button ${carritoPos.length === 0 || !cliente.nombre.trim() || isLoading ? 'disabled' : ''}`}
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
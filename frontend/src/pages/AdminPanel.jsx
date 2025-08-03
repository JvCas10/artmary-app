// src/pages/AdminPanel.jsx - SISTEMA COMPLETO DE GESTIÓN ART MARY
import React, { useEffect, useState, useCallback } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Pagination from '../components/Pagination';
// Importar el componente PuntoDeVenta
import PuntoDeVenta from '../components/admin/PuntoDeVenta';

// Animaciones y estilos globales
if (!window._adminPanelCustomStyles) {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideInDown { from { opacity:0; transform: translateY(-16px);} to { opacity:1; transform: translateY(0);} }
    .fadeIn { animation: fadeIn 0.7s; }
    @media (max-width: 768px) {
      .responsive-table { min-width: 520px; }
      .responsive-card { padding: 1em 0.5em !important; }
      .section-header { flex-direction: column !important; gap: 1em !important; align-items: stretch !important; }
      .tabs-container { overflow-x: auto !important; }
      .tab-button { min-width: max-content !important; }
    }
  `;
  document.head.appendChild(styleSheet);
  window._adminPanelCustomStyles = true;
}

function AdminPanel() {
  const { user, isAuthenticated, loading } = useAuth();
  const [productos, setProductos] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingVentas, setIsLoadingVentas] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filtroTemporal, setFiltroTemporal] = useState('mes'); // 'dia', 'semana', 'mes'
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const navigate = useNavigate();

  // Estados de paginación
  const [productsPagination, setProductsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10
  });

  const [ordersPagination, setOrdersPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10
  });

  // Estado para el carrito del POS
  const [carritoPos, setCarritoPos] = useState([]);
  const [todosLosProductos, setTodosLosProductos] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  const orderStatuses = ['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado', 'listo_para_recoger'];

  const clearMessage = useCallback((type) => {
    setTimeout(() => {
      if (type === 'success') {
        setMensaje('');
      } else if (type === 'error') {
        setError('');
      }
    }, 5000);
  }, []);

  // Funciones para obtener datos
  const obtenerProductos = useCallback(async (page = 1, search = '') => {
    try {
      setIsLoadingProducts(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: search
      });
      const response = await axios.get(`/productos?${params}`);
      if (response.data && response.data.productos && Array.isArray(response.data.productos)) {
        setProductos(response.data.productos);
        setProductsPagination(response.data.pagination);
        setError('');
      } else {
        throw new Error('Formato de datos inválido para productos');
      }
    } catch (err) {
      console.error("Error al obtener productos:", err);
      setError('No se pudieron cargar los productos 😓');
      setProductos([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  const obtenerTodosLosPedidos = useCallback(async (page = 1) => {
    try {
      setIsLoadingOrders(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      const response = await axios.get(`/pedidos/todos?${params}`);
      if (response.data && response.data.pedidos && Array.isArray(response.data.pedidos)) {
        setOrders(response.data.pedidos);
        setOrdersPagination(response.data.pagination);
        setError('');
      } else {
        throw new Error('Formato de datos inválido para pedidos');
      }
    } catch (err) {
      console.error("Error al obtener pedidos:", err);
      setError('No se pudieron cargar los pedidos 😓');
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  const obtenerTodosLosProductos = useCallback(async () => {
    try {
      const response = await axios.get('/productos/todos');
      setTodosLosProductos(response.data?.productos || []);
      return response.data?.productos || [];
    } catch (err) {
      console.error("Error al obtener todos los productos:", err);
      setTodosLosProductos([]);
      return [];
    }
  }, []);

  const obtenerVentas = useCallback(async () => {
    try {
      setIsLoadingVentas(true);
      const response = await axios.get('/ventas');
      if (response.data && Array.isArray(response.data)) {
        setVentas(response.data);
        setError('');
      } else {
        setVentas([]);
      }
    } catch (err) {
      console.error("Error al obtener ventas:", err);
      setVentas([]);
    } finally {
      setIsLoadingVentas(false);
    }
  }, []);

  const registrarVentaPos = useCallback(async (ventaData) => {
    try {
      const response = await axios.post('/ventas', ventaData);
      setMensaje('✅ Venta registrada exitosamente');
      setCarritoPos([]);

      // Recargar datos
      obtenerVentas();
      obtenerProductos(1, productSearchTerm);
      obtenerTodosLosProductos();

      clearMessage('success');
      return response.data;
    } catch (err) {
      console.error("Error al registrar venta:", err);
      setError('❌ Error al registrar la venta: ' + (err.response?.data?.error || err.message));
      clearMessage('error');
      throw err;
    }
  }, [obtenerVentas, obtenerProductos, obtenerTodosLosProductos, clearMessage]);

  useEffect(() => {
    if (isAuthenticated && user && user.rol === 'admin') {
      obtenerProductos(1);
      obtenerTodosLosPedidos(1);
      obtenerVentas();
      obtenerTodosLosProductos();
    } else if (!loading && (!isAuthenticated || (user && user.rol !== 'admin'))) {
      setIsLoadingProducts(false);
      setIsLoadingOrders(false);
      setIsLoadingVentas(false);
      if (isAuthenticated && user && user.rol !== 'admin') {
        setError('Acceso denegado. Se requieren privilegios de administrador.');
      }
    }
  }, [isAuthenticated, user, loading, obtenerProductos, obtenerTodosLosPedidos, obtenerVentas, obtenerTodosLosProductos]);

  // Efecto para búsqueda de productos con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isAuthenticated && user && user.rol === 'admin') {
        obtenerProductos(1, productSearchTerm);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [productSearchTerm, isAuthenticated, user, obtenerProductos]);

  const handleProductsPageChange = (newPage) => {
    obtenerProductos(newPage, productSearchTerm);
  };

  const handleOrdersPageChange = (newPage) => {
    obtenerTodosLosPedidos(newPage);
  };

  const handleDeleteProduct = async (productId) => {
    if (!productId) {
      setError('ID de producto inválido');
      return;
    }
    const confirmDelete = window.confirm('¿Estás seguro de que quieres eliminar este producto?');
    if (confirmDelete) {
      try {
        const response = await axios.delete(`/productos/${productId}`);
        setMensaje(response.data?.mensaje || 'Producto eliminado con éxito.');
        setProductos(prevProductos => prevProductos.filter(p => p._id !== productId));
        setError('');
        clearMessage('success');
      } catch (err) {
        console.error("Error al eliminar producto:", err);
        setError(err.response?.data?.error || 'Error al eliminar el producto.');
        setMensaje('');
        clearMessage('error');
      }
    }
  };

  const handleEditProduct = (productId) => {
    if (!productId) {
      setError('ID de producto inválido');
      return;
    }
    navigate(`/crear-producto?id=${productId}`);
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    if (!orderId || !newStatus) {
      setError('Datos de pedido inválidos');
      return;
    }
    if (newStatus === 'cancelado') {
      const confirmCancel = window.confirm('¿Estás seguro de que quieres cancelar este pedido? Esta acción devolverá el stock de los productos.');
      if (!confirmCancel) return;
    }
    if (newStatus === 'entregado') {
      const confirmDelivered = window.confirm('¿Seguro que quiere marcar este pedido como entregado?');
      if (!confirmDelivered) return;
    }
    try {
      const response = await axios.put(`/pedidos/${orderId}/estado`, { estado: newStatus });
      setMensaje(response.data?.mensaje || 'Estado del pedido actualizado con éxito.');

      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId ? { ...order, estado: newStatus } : order
        )
      );
      setError('');
      clearMessage('success');
    } catch (err) {
      console.error("Error al actualizar estado del pedido:", err);
      setError(err.response?.data?.mensaje || 'Error al actualizar el estado del pedido.');
      setMensaje('');
      clearMessage('error');
    }
  };

  const formatPrice = (price) => {
    const numPrice = Number(price);
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  const getUserInfo = (order, field) => {
    return order?.userId?.[field] || 'N/A';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendiente': return '#f59e0b';
      case 'confirmado': return '#10b981';
      case 'listo_para_recoger': return '#3b82f6';
      case 'enviado': return '#8b5cf6';
      case 'entregado': return '#22c55e';
      case 'cancelado': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pendiente': return '⏳';
      case 'confirmado': return '✅';
      case 'listo_para_recoger': return '📦';
      case 'enviado': return '🚚';
      case 'entregado': return '🎉';
      case 'cancelado': return '❌';
      default: return '📋';
    }
  };

  // Función para unificar todas las ventas (físicas + online entregadas)
  const obtenerTodasLasVentas = () => {
    const ventasFisicas = ventas.map(venta => ({
      ...venta,
      tipo: 'fisica',
      fecha: venta.fecha,
      cliente: venta.cliente,
      total: venta.total,
      gananciaTotal: venta.gananciaTotal,
      productos: venta.productos
    }));

    const ventasOnline = orders
      .filter(order => order.estado === 'entregado')
      .map(order => ({
        _id: order._id,
        tipo: 'online',
        fecha: order.fecha,
        cliente: {
          nombre: getUserInfo(order, 'nombre'),
          telefono: getUserInfo(order, 'telefono') || 'N/A'
        },
        total: order.total,
        gananciaTotal: order.gananciaTotal || 0,
        productos: order.productos || [],
        estado: order.estado
      }));

    return [...ventasFisicas, ...ventasOnline].sort((a, b) =>
      new Date(b.fecha) - new Date(a.fecha)
    );
  };

  // Función para filtrar ventas por período
  const obtenerVentasFiltradas = () => {
    const todasLasVentas = obtenerTodasLasVentas();
    const fechaBase = new Date(fechaSeleccionada);

    return todasLasVentas.filter(venta => {
      const fechaVenta = new Date(venta.fecha);

      switch (filtroTemporal) {
        case 'dia':
          return fechaVenta.toDateString() === fechaBase.toDateString();

        case 'semana':
          const inicioSemana = new Date(fechaBase);
          inicioSemana.setDate(fechaBase.getDate() - fechaBase.getDay());
          const finSemana = new Date(inicioSemana);
          finSemana.setDate(inicioSemana.getDate() + 6);
          return fechaVenta >= inicioSemana && fechaVenta <= finSemana;

        case 'mes':
          return fechaVenta.getMonth() === fechaBase.getMonth() &&
            fechaVenta.getFullYear() === fechaBase.getFullYear();

        default:
          return true;
      }
    });
  };

  // Función para obtener datos para gráficas
  // Función para obtener datos para gráficas
  const obtenerDatosGraficas = () => {
    const ventasFiltradas = obtenerVentasFiltradas();

    // Datos para gráfica de ventas por día
    const ventasPorDia = {};
    const ingresosPorDia = {};
    const gananciasPorDia = {};

    ventasFiltradas.forEach(venta => {
      const fecha = new Date(venta.fecha).toLocaleDateString('es-ES');
      ventasPorDia[fecha] = (ventasPorDia[fecha] || 0) + 1;
      ingresosPorDia[fecha] = (ingresosPorDia[fecha] || 0) + (venta.total || 0);
      gananciasPorDia[fecha] = (gananciasPorDia[fecha] || 0) + (venta.gananciaTotal || 0);
    });

    // Convertir a formato para gráficas
    const datosVentas = Object.keys(ventasPorDia).map(fecha => ({
      fecha,
      ventas: ventasPorDia[fecha],
      ingresos: ingresosPorDia[fecha] || 0,
      ganancias: gananciasPorDia[fecha] || 0
    })).sort((a, b) => new Date(a.fecha.split('/').reverse().join('-')) - new Date(b.fecha.split('/').reverse().join('-')));

    // Datos para gráfica de productos más vendidos
    const productosVendidos = {};
    ventasFiltradas.forEach(venta => {
      (venta.productos || []).forEach(producto => {
        const nombre = producto.nombre;
        productosVendidos[nombre] = (productosVendidos[nombre] || 0) + producto.cantidad;
      });
    });

    const topProductos = Object.entries(productosVendidos)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));

    // Datos para gráfica de ventas por tipo
    const ventasFisicas = ventasFiltradas.filter(v => v.tipo === 'fisica').length;
    const ventasOnline = ventasFiltradas.filter(v => v.tipo === 'online').length;

    return {
      datosVentas,
      topProductos,
      ventasPorTipo: [
        { tipo: 'Físicas', cantidad: ventasFisicas, color: '#22c55e' },
        { tipo: 'Online', cantidad: ventasOnline, color: '#3b82f6' }
      ]
    };
  };

  // Función auxiliar para obtener productos más vendidos
  const obtenerProductosMasVendidos = () => {
    const todasLasVentas = obtenerTodasLasVentas();
    const productosVendidos = {};

    todasLasVentas.forEach(venta => {
      (venta.productos || []).forEach(producto => {
        const nombre = producto.nombre;
        if (!productosVendidos[nombre]) {
          productosVendidos[nombre] = {
            nombre,
            cantidadVendida: 0,
            ingresoTotal: 0
          };
        }
        productosVendidos[nombre].cantidadVendida += producto.cantidad;
        productosVendidos[nombre].ingresoTotal += (producto.precioVenta || producto.precio) * producto.cantidad;
      });
    });

    return Object.values(productosVendidos)
      .sort((a, b) => b.cantidadVendida - a.cantidadVendida);
  };

  // Calcular estadísticas para el dashboard
  // Calcular estadísticas para el dashboard
  const calcularEstadisticas = () => {
    const ventasFiltradas = obtenerVentasFiltradas();
    const hoy = new Date();

    const ventasHoy = ventasFiltradas.filter(v => {
      const fechaVenta = new Date(v.fecha);
      return fechaVenta.toDateString() === hoy.toDateString();
    }).length;

    const gananciasTotal = ventasFiltradas.reduce((acc, venta) => {
      return acc + (venta.gananciaTotal || 0);
    }, 0);

    const productosVendidos = ventasFiltradas.reduce((acc, venta) => {
      return acc + (venta.productos || []).reduce((sum, prod) => sum + (prod.cantidad || 0), 0);
    }, 0);

    const ventasEsteMes = ventasFiltradas.filter(v => {
      const fechaVenta = new Date(v.fecha);
      return fechaVenta.getMonth() === hoy.getMonth() && fechaVenta.getFullYear() === hoy.getFullYear();
    }).length;

    return {
      totalVentas: ventasFiltradas.length,
      ventasHoy,
      ventasEsteMes,
      gananciasTotal,
      productosVendidos,
      productosEnStock: productos.filter(p => p.stock > 0).length,
      productosSinStock: productos.filter(p => p.stock === 0).length,
      ingresosBrutos: ventasFiltradas.reduce((acc, venta) => acc + (venta.total || 0), 0)
    };
  };

  if (loading || isLoadingProducts || isLoadingOrders) {
    return (
      <div style={loadingContainerStyle}>
        <div style={loadingSpinnerStyle}>
          <div style={spinnerIconStyle}>⚙️</div>
        </div>
        <p style={loadingTextStyle}>Cargando panel de administración...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.rol !== 'admin') {
    return (
      <div style={containerStyle}>
        <div style={errorStateStyle}>
          <div style={errorIconContainerStyle}>
            <div style={errorIconStyle}>🚫</div>
          </div>
          <h2 style={errorTitleStyle}>Acceso Denegado</h2>
          <p style={errorSubtitleStyle}>
            No tienes permisos de administrador para ver esta página.
          </p>
          <Link to="/productos" style={errorButtonStyle}>
            <span style={buttonIconStyle}>🛍️</span>
            Volver al Catálogo
          </Link>
        </div>
      </div>
    );
  }

  const estadisticas = calcularEstadisticas();
  const todasLasVentas = obtenerTodasLasVentas();

  return (
    <div style={pageWrapperStyle}>
      {/* Hero Header */}
      <div style={heroHeaderStyle}>
        <div style={heroContentStyle}>
          <h1 style={heroTitleStyle}>
            <span style={heroIconStyle}>⚙️</span>
            Sistema de Gestión Art Mary
          </h1>
          <p style={heroSubtitleStyle}>
            Panel completo de administración y punto de venta
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={mainContentStyle}>
        {/* Mensajes de notificación */}
        {mensaje && (
          <div style={{
            ...notificationStyle,
            background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
            color: '#166534',
            borderColor: '#22c55e'
          }}>
            <span style={notificationIconStyle}>✅</span>
            {mensaje}
          </div>
        )}

        {error && (
          <div style={{
            ...notificationStyle,
            background: 'linear-gradient(135deg, #fef2f2, #fecaca)',
            color: '#dc2626',
            borderColor: '#ef4444'
          }}>
            <span style={notificationIconStyle}>⚠️</span>
            {error}
          </div>
        )}

        {/* Navegación por pestañas */}
        <div style={tabsContainerStyle} className="tabs-container">
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              ...tabButtonStyle,
              ...(activeTab === 'dashboard' ? activeTabStyle : {})
            }}
            className="tab-button"
          >
            <span style={tabIconStyle}>📊</span>
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('pos')}
            style={{
              ...tabButtonStyle,
              ...(activeTab === 'pos' ? activeTabStyle : {})
            }}
            className="tab-button"
          >
            <span style={tabIconStyle}>🏪</span>
            Punto de Venta
          </button>
          <button
            onClick={() => setActiveTab('productos')}
            style={{
              ...tabButtonStyle,
              ...(activeTab === 'productos' ? activeTabStyle : {})
            }}
            className="tab-button"
          >
            <span style={tabIconStyle}>📦</span>
            Productos ({productsPagination.totalProducts})
          </button>
          <button
            onClick={() => setActiveTab('pedidos')}
            style={{
              ...tabButtonStyle,
              ...(activeTab === 'pedidos' ? activeTabStyle : {})
            }}
            className="tab-button"
          >
            <span style={tabIconStyle}>📋</span>
            Pedidos ({ordersPagination.totalOrders})
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            style={{
              ...tabButtonStyle,
              ...(activeTab === 'historial' ? activeTabStyle : {})
            }}
            className="tab-button"
          >
            <span style={tabIconStyle}>📈</span>
            Historial ({todasLasVentas.length})
          </button>
          <button
            onClick={() => setActiveTab('estadisticas')}
            style={{
              ...tabButtonStyle,
              ...(activeTab === 'estadisticas' ? activeTabStyle : {})
            }}
            className="tab-button"
          >
            <span style={tabIconStyle}>📊</span>
            Estadísticas
          </button>
        </div>

        {/* Contenido de las pestañas */}
        {activeTab === 'dashboard' && (
          <div style={tabContentStyle} className="fadeIn">
            <div style={dashboardGridStyle}>
              {/* Métricas principales */}
              <div style={metricsContainerStyle}>
                <h2 style={sectionTitleStyle}>
                  <span style={sectionIconStyle}>📊</span>
                  Métricas Principales
                </h2>
                <div style={metricsGridStyle}>
                  <div style={metricCardStyle}>
                    <div style={metricIconContainerStyle}>
                      <span style={{ ...metricIconStyle, background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>💰</span>
                    </div>
                    <div style={metricContentStyle}>
                      <h3 style={metricValueStyle}>Q{formatPrice(estadisticas.gananciasTotal)}</h3>
                      <p style={metricLabelStyle}>Ganancias Netas</p>
                    </div>
                  </div>

                  <div style={metricCardStyle}>
                    <div style={metricIconContainerStyle}>
                      <span style={{ ...metricIconStyle, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>💵</span>
                    </div>
                    <div style={metricContentStyle}>
                      <h3 style={metricValueStyle}>Q{formatPrice(estadisticas.ingresosBrutos)}</h3>
                      <p style={metricLabelStyle}>Ingresos Brutos</p>
                    </div>
                  </div>

                  <div style={metricCardStyle}>
                    <div style={metricIconContainerStyle}>
                      <span style={{ ...metricIconStyle, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>📊</span>
                    </div>
                    <div style={metricContentStyle}>
                      <h3 style={metricValueStyle}>{estadisticas.totalVentas}</h3>
                      <p style={metricLabelStyle}>Ventas Totales</p>
                    </div>
                  </div>

                  <div style={metricCardStyle}>
                    <div style={metricIconContainerStyle}>
                      <span style={{ ...metricIconStyle, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>🔥</span>
                    </div>
                    <div style={metricContentStyle}>
                      <h3 style={metricValueStyle}>{estadisticas.ventasHoy}</h3>
                      <p style={metricLabelStyle}>Ventas Hoy</p>
                    </div>
                  </div>

                  <div style={metricCardStyle}>
                    <div style={metricIconContainerStyle}>
                      <span style={{ ...metricIconStyle, background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>📅</span>
                    </div>
                    <div style={metricContentStyle}>
                      <h3 style={metricValueStyle}>{estadisticas.ventasEsteMes}</h3>
                      <p style={metricLabelStyle}>Ventas Este Mes</p>
                    </div>
                  </div>

                  <div style={metricCardStyle}>
                    <div style={metricIconContainerStyle}>
                      <span style={{ ...metricIconStyle, background: 'linear-gradient(135deg, #ec4899, #db2777)' }}>📦</span>
                    </div>
                    <div style={metricContentStyle}>
                      <h3 style={metricValueStyle}>{estadisticas.productosVendidos}</h3>
                      <p style={metricLabelStyle}>Productos Vendidos</p>
                    </div>
                  </div>

                  <div style={metricCardStyle}>
                    <div style={metricIconContainerStyle}>
                      <span style={{ ...metricIconStyle, background: 'linear-gradient(135deg, #10b981, #059669)' }}>✅</span>
                    </div>
                    <div style={metricContentStyle}>
                      <h3 style={metricValueStyle}>{estadisticas.productosEnStock}</h3>
                      <p style={metricLabelStyle}>En Stock</p>
                    </div>
                  </div>

                  <div style={metricCardStyle}>
                    <div style={metricIconContainerStyle}>
                      <span style={{ ...metricIconStyle, background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>⚠️</span>
                    </div>
                    <div style={metricContentStyle}>
                      <h3 style={metricValueStyle}>{estadisticas.productosSinStock}</h3>
                      <p style={metricLabelStyle}>Sin Stock</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen rápido */}
              <div style={quickSummaryStyle}>
                <h3 style={summaryTitleStyle}>
                  <span style={sectionIconStyle}>⚡</span>
                  Acciones Rápidas
                </h3>
                <div style={summaryItemsStyle}>
                  <button
                    onClick={() => setActiveTab('pos')}
                    style={quickActionButtonStyle}
                  >
                    <span style={summaryIconStyle}>🏪</span>
                    <div style={summaryTextStyle}>
                      <strong>Usar Punto de Venta</strong>
                      <p>Registrar ventas físicas</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('estadisticas')}
                    style={quickActionButtonStyle}
                  >
                    <span style={summaryIconStyle}>📈</span>
                    <div style={summaryTextStyle}>
                      <strong>Ver Estadísticas</strong>
                      <p>Análisis detallado de ventas</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('productos')}
                    style={quickActionButtonStyle}
                  >
                    <span style={summaryIconStyle}>📦</span>
                    <div style={summaryTextStyle}>
                      <strong>Gestionar Inventario</strong>
                      <p>Productos y stock</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('pedidos')}
                    style={quickActionButtonStyle}
                  >
                    <span style={summaryIconStyle}>📋</span>
                    <div style={summaryTextStyle}>
                      <strong>Procesar Pedidos</strong>
                      <p>Pedidos online pendientes</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pos' && (
          <div style={tabContentStyle} className="fadeIn">
            {/* Componente de Punto de Venta integrado */}
            <PuntoDeVenta
              productos={productos}
              carritoPos={carritoPos}
              setCarritoPos={setCarritoPos}
              onVentaRegistrada={registrarVentaPos}
              obtenerTodosLosProductos={obtenerTodosLosProductos}
            />
          </div>
        )}

        {activeTab === 'historial' && (
          <div style={tabContentStyle} className="fadeIn">
            <div style={historialContainerStyle}>
              <div style={sectionHeaderStyle}>
                <h2 style={sectionTitleStyle}>
                  <span style={sectionIconStyle}>📈</span>
                  Historial de Ventas Unificado
                </h2>
                <div style={historialStatsStyle}>
                  <span style={historialStatStyle}>
                    <strong>{todasLasVentas.length}</strong> ventas totales
                  </span>
                  <span style={historialStatStyle}>
                    <strong>Q{formatPrice(estadisticas.gananciasTotal)}</strong> ganancias
                  </span>
                </div>
              </div>

              {todasLasVentas.length === 0 ? (
                <div style={emptyStateStyle}>
                  <div style={emptyIconStyle}>📈</div>
                  <h3 style={emptyTitleStyle}>No hay ventas registradas</h3>
                  <p style={emptySubtitleStyle}>
                    Las ventas físicas y pedidos entregados aparecerán aquí
                  </p>
                </div>
              ) : (
                <div style={historialListStyle}>
                  {todasLasVentas.map((venta, index) => (
                    <div key={`${venta.tipo}-${venta._id}-${index}`} style={historialItemStyle}>
                      <div style={historialItemHeaderStyle}>
                        <div style={historialItemInfoStyle}>
                          <h3 style={historialItemTitleStyle}>
                            <span style={tipoVentaBadgeStyle(venta.tipo)}>
                              {venta.tipo === 'fisica' ? '🏪 Venta Física' : '🌐 Venta Online'}
                            </span>
                            <span style={historialIdStyle}>
                              #{venta._id.substring(0, 8)}
                            </span>
                          </h3>
                          <p style={historialDateStyle}>
                            {new Date(venta.fecha).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div style={historialAmountsStyle}>
                          <div style={historialTotalStyle}>
                            <span style={historialTotalLabelStyle}>Total:</span>
                            <span style={historialTotalAmountStyle}>Q{formatPrice(venta.total)}</span>
                          </div>
                          <div style={historialGananciaStyle}>
                            <span style={historialGananciaLabelStyle}>Ganancia:</span>
                            <span style={historialGananciaAmountStyle}>Q{formatPrice(venta.gananciaTotal)}</span>
                          </div>
                        </div>
                      </div>

                      <div style={historialDetailsStyle}>
                        <div style={historialClienteStyle}>
                          <h4 style={historialClienteTitleStyle}>
                            👤 Cliente: {venta.cliente?.nombre || 'N/A'}
                          </h4>
                          {venta.cliente?.telefono && (
                            <p style={historialClienteInfoStyle}>
                              📞 {venta.cliente.telefono}
                            </p>
                          )}
                        </div>

                        <div style={historialProductosStyle}>
                          <h4 style={historialProductosTitleStyle}>
                            📦 Productos ({(venta.productos || []).length})
                          </h4>
                          <div style={historialProductosListStyle}>
                            {(venta.productos || []).map((producto, idx) => (
                              <div key={idx} style={historialProductoItemStyle}>
                                <span style={historialProductoNombreStyle}>
                                  {producto.nombre}
                                </span>
                                <span style={historialProductoCantidadStyle}>
                                  x{producto.cantidad}
                                </span>
                                <span style={historialProductoPrecioStyle}>
                                  Q{formatPrice(producto.precioVenta || producto.precio)}
                                </span>
                                <span style={historialProductoSubtotalStyle}>
                                  Q{formatPrice((producto.precioVenta || producto.precio) * producto.cantidad)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'estadisticas' && (
          <div style={tabContentStyle} className="fadeIn">
            <div style={estadisticasContainerStyle}>
              {/* Header con filtros temporales */}
              <div style={{
                background: 'white',
                borderRadius: '1rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                border: '1px solid var(--neutral-200)',
                overflow: 'hidden'
              }}>
                {/* Header compacto */}
                <div style={{
                  background: 'var(--gradient-primary)',
                  color: 'white',
                  padding: '1.5rem 2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>📊</span>
                    Estadísticas Avanzadas
                  </h2>

                  <div style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      opacity: 0.9
                    }}>
                      {filtroTemporal === 'dia' && `📅 ${fechaSeleccionada.toLocaleDateString('es-ES')}`}
                      {filtroTemporal === 'semana' && `📆 Semana del ${fechaSeleccionada.toLocaleDateString('es-ES')}`}
                      {filtroTemporal === 'mes' && `🗓️ ${fechaSeleccionada.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`}
                    </span>
                  </div>
                </div>

                {/* Selector optimizado */}
                <div style={{
                  padding: '2rem',
                  background: 'var(--neutral-50)'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.5rem'
                  }}>
                    {/* Selectores de período */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem'
                    }}>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: 'var(--neutral-700)',
                        margin: 0,
                        marginBottom: '0.5rem'
                      }}>
                        Período de análisis:
                      </h3>

                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap'
                      }}>
                        <button
                          onClick={() => {
                            setFiltroTemporal('dia');
                            setFechaSeleccionada(new Date());
                          }}
                          style={{
                            padding: '0.75rem 1rem',
                            background: filtroTemporal === 'dia' ? 'var(--gradient-primary)' : 'white',
                            color: filtroTemporal === 'dia' ? 'white' : 'var(--neutral-700)',
                            border: '1px solid',
                            borderColor: filtroTemporal === 'dia' ? 'transparent' : 'var(--neutral-300)',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          📅 Hoy
                        </button>

                        <button
                          onClick={() => {
                            setFiltroTemporal('semana');
                            setFechaSeleccionada(new Date());
                          }}
                          style={{
                            padding: '0.75rem 1rem',
                            background: filtroTemporal === 'semana' ? 'var(--gradient-primary)' : 'white',
                            color: filtroTemporal === 'semana' ? 'white' : 'var(--neutral-700)',
                            border: '1px solid',
                            borderColor: filtroTemporal === 'semana' ? 'transparent' : 'var(--neutral-300)',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          📆 Semana
                        </button>

                        <button
                          onClick={() => {
                            setFiltroTemporal('mes');
                            setFechaSeleccionada(new Date());
                          }}
                          style={{
                            padding: '0.75rem 1rem',
                            background: filtroTemporal === 'mes' ? 'var(--gradient-primary)' : 'white',
                            color: filtroTemporal === 'mes' ? 'white' : 'var(--neutral-700)',
                            border: '1px solid',
                            borderColor: filtroTemporal === 'mes' ? 'transparent' : 'var(--neutral-300)',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          🗓️ Mes
                        </button>
                      </div>
                    </div>

                    {/* Selector de fecha personalizada */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem'
                    }}>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: 'var(--neutral-700)',
                        margin: 0,
                        marginBottom: '0.5rem'
                      }}>
                        Fecha específica:
                      </h3>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <input
                          type={filtroTemporal === 'mes' ? 'month' : 'date'}
                          value={filtroTemporal === 'mes'
                            ? `${fechaSeleccionada.getFullYear()}-${String(fechaSeleccionada.getMonth() + 1).padStart(2, '0')}`
                            : fechaSeleccionada.toISOString().split('T')[0]
                          }
                          onChange={(e) => {
                            if (filtroTemporal === 'mes') {
                              const [year, month] = e.target.value.split('-');
                              const newDate = new Date(parseInt(year), parseInt(month) - 1, 1);
                              setFechaSeleccionada(newDate);
                            } else {
                              const newDate = new Date(e.target.value + 'T12:00:00');
                              setFechaSeleccionada(newDate);
                            }
                          }}
                          style={{
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--neutral-300)',
                            background: 'white',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            flex: 1
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Métricas resumidas con datos filtrados */}
              <div style={estadisticasMetricsStyle}>
                <div style={estadisticaCardStyle}>
                  <h3 style={estadisticaCardTitleStyle}>💰 Rendimiento Financiero</h3>
                  <div style={estadisticaCardContentStyle}>
                    <div style={estadisticaItemStyle}>
                      <span style={estadisticaLabelStyle}>Ingresos Brutos:</span>
                      <span style={estadisticaValueStyle}>Q{formatPrice(calcularEstadisticas().ingresosBrutos)}</span>
                    </div>
                    <div style={estadisticaItemStyle}>
                      <span style={estadisticaLabelStyle}>Ganancias Netas:</span>
                      <span style={{ ...estadisticaValueStyle, color: '#22c55e' }}>Q{formatPrice(calcularEstadisticas().gananciasTotal)}</span>
                    </div>
                    <div style={estadisticaItemStyle}>
                      <span style={estadisticaLabelStyle}>Margen de Ganancia:</span>
                      <span style={{ ...estadisticaValueStyle, color: '#3b82f6' }}>
                        {calcularEstadisticas().ingresosBrutos > 0
                          ? ((calcularEstadisticas().gananciasTotal / calcularEstadisticas().ingresosBrutos) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div style={estadisticaCardStyle}>
                  <h3 style={estadisticaCardTitleStyle}>📈 Volumen de Ventas</h3>
                  <div style={estadisticaCardContentStyle}>
                    <div style={estadisticaItemStyle}>
                      <span style={estadisticaLabelStyle}>Ventas en Período:</span>
                      <span style={estadisticaValueStyle}>{calcularEstadisticas().totalVentas}</span>
                    </div>
                    <div style={estadisticaItemStyle}>
                      <span style={estadisticaLabelStyle}>Productos Vendidos:</span>
                      <span style={{ ...estadisticaValueStyle, color: '#8b5cf6' }}>{calcularEstadisticas().productosVendidos}</span>
                    </div>
                    <div style={estadisticaItemStyle}>
                      <span style={estadisticaLabelStyle}>Promedio por Venta:</span>
                      <span style={{ ...estadisticaValueStyle, color: '#f59e0b' }}>
                        Q{calcularEstadisticas().totalVentas > 0 ? formatPrice(calcularEstadisticas().ingresosBrutos / calcularEstadisticas().totalVentas) : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráficas intuitivas */}
              <div style={graficasContainerStyle}>
                {/* Gráfica de ventas, ingresos y ganancias */}
                {/* Gráfica de ingresos y ganancias */}
                <div style={graficaCardStyle}>
                  <h3 style={graficaTitleStyle}>
                    💰 Evolución de Ingresos y Ganancias
                  </h3>
                  <div style={graficaContentStyle}>
                    {obtenerDatosGraficas().datosVentas.length > 0 ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'end',
                        gap: '1.5rem',
                        height: '280px',
                        width: '100%',
                        padding: '1rem 0'
                      }}>
                        {obtenerDatosGraficas().datosVentas.map((dato, index) => {
                          const maxIngresos = Math.max(...obtenerDatosGraficas().datosVentas.map(d => d.ingresos));
                          const maxGanancias = Math.max(...obtenerDatosGraficas().datosVentas.map(d => d.ganancias));

                          return (
                            <div key={index} style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              flex: 1,
                              height: '100%',
                              gap: '0.5rem'
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'end',
                                gap: '8px',
                                height: '200px',
                                justifyContent: 'center'
                              }}>
                                {/* Barra de Ingresos */}
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  <div
                                    style={{
                                      width: '24px',
                                      height: `${maxIngresos > 0 ? (dato.ingresos / maxIngresos) * 180 : 2}px`,
                                      background: 'linear-gradient(180deg, #10b981, #047857)',
                                      borderRadius: '4px 4px 0 0',
                                      minHeight: '2px',
                                      transition: 'all 0.3s ease'
                                    }}
                                    title={`Ingresos: Q${dato.ingresos.toFixed(2)}`}
                                  ></div>
                                  <span style={{
                                    fontSize: '0.65rem',
                                    fontWeight: '600',
                                    color: '#047857',
                                    textAlign: 'center'
                                  }}>
                                    Q{dato.ingresos.toFixed(0)}
                                  </span>
                                </div>

                                {/* Barra de Ganancias */}
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  <div
                                    style={{
                                      width: '24px',
                                      height: `${maxGanancias > 0 ? (dato.ganancias / maxGanancias) * 180 : 2}px`,
                                      background: 'linear-gradient(180deg, #f59e0b, #d97706)',
                                      borderRadius: '4px 4px 0 0',
                                      minHeight: '2px',
                                      transition: 'all 0.3s ease'
                                    }}
                                    title={`Ganancias: Q${dato.ganancias.toFixed(2)}`}
                                  ></div>
                                  <span style={{
                                    fontSize: '0.65rem',
                                    fontWeight: '600',
                                    color: '#d97706',
                                    textAlign: 'center'
                                  }}>
                                    Q{dato.ganancias.toFixed(0)}
                                  </span>
                                </div>
                              </div>

                              <div style={{
                                fontSize: '0.75rem',
                                color: 'var(--neutral-600)',
                                textAlign: 'center',
                                fontWeight: '500',
                                transform: 'rotate(-15deg)',
                                whiteSpace: 'nowrap'
                              }}>
                                {dato.fecha}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={noDataStyle}>
                        <span style={noDataIconStyle}>💰</span>
                        <p style={noDataTextStyle}>No hay datos financieros para el período seleccionado</p>
                      </div>
                    )}

                    {/* Leyenda mejorada */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '2rem',
                      marginTop: '1.5rem',
                      padding: '1rem',
                      background: 'var(--neutral-50)',
                      borderRadius: '0.75rem',
                      border: '1px solid var(--neutral-200)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          background: 'linear-gradient(135deg, #10b981, #047857)',
                          borderRadius: '4px',
                          boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                        }}></div>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: 'var(--neutral-700)'
                        }}>
                          Ingresos Brutos
                        </span>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          borderRadius: '4px',
                          boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
                        }}></div>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: 'var(--neutral-700)'
                        }}>
                          Ganancias Netas
                        </span>
                      </div>
                    </div>
                  </div>
                </div>



                {/* Gráfica de productos más vendidos */}
                <div style={graficaCardStyle}>
                  <h3 style={graficaTitleStyle}>
                    🏆 Top 5 Productos Más Vendidos
                  </h3>
                  <div style={graficaContentStyle}>
                    {obtenerDatosGraficas().topProductos.length > 0 ? (
                      <div style={topProductsChartStyle}>
                        {obtenerDatosGraficas().topProductos.map((producto, index) => (
                          <div key={index} style={productChartItemStyle}>
                            <div style={productRankStyle}>#{index + 1}</div>
                            <div style={productNameChartStyle}>{producto.nombre}</div>
                            <div style={productBarContainerStyle}>
                              <div
                                style={{
                                  ...productBarStyle,
                                  width: `${(producto.cantidad / obtenerDatosGraficas().topProductos[0].cantidad) * 100}%`,
                                  background: `linear-gradient(90deg, ${['#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'][index]}, ${['#d97706', '#16a34a', '#1d4ed8', '#7c3aed', '#db2777'][index]})`
                                }}
                              ></div>
                            </div>
                            <div style={productQuantityStyle}>{producto.cantidad}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={noDataStyle}>
                        <span style={noDataIconStyle}>🏆</span>
                        <p style={noDataTextStyle}>No hay productos vendidos en el período</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pestañas existentes de productos y pedidos */}
        {activeTab === 'productos' && (
          <div style={tabContentStyle} className="fadeIn">
            <div style={sectionHeaderStyle} className="section-header">
              <h2 style={sectionTitleStyle}>
                <span style={sectionIconStyle}>📦</span>
                Gestión de Productos
              </h2>
              <Link to="/crear-producto" style={createButtonStyle}>
                <span style={buttonIconStyle}>➕</span>
                Crear Producto
              </Link>
            </div>
            {/* Barra de búsqueda para productos */}
            <div style={searchSectionStyle}>
              <div style={searchContainerStyle}>
                <div style={searchInputContainerStyle}>
                  <div style={searchIconStyle}>🔍</div>
                  <input
                    type="text"
                    placeholder="Buscar productos por nombre, categoría..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    style={searchInputStyle}
                  />
                  {productSearchTerm && (
                    <button
                      onClick={() => setProductSearchTerm('')}
                      style={clearSearchStyle}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={statsContainerStyle}>
              <div style={statCardStyle}>
                <span style={statNumberStyle}>{productsPagination.totalProducts}</span>
                <span style={statLabelStyle}>Total Productos</span>
              </div>
              <div style={statCardStyle}>
                <span style={statNumberStyle}>{productos.filter(p => p.stock === 0).length}</span>
                <span style={statLabelStyle}>Sin Stock</span>
              </div>
              <div style={statCardStyle}>
                <span style={statNumberStyle}>{productos.filter(p => p.stock > 0).length}</span>
                <span style={statLabelStyle}>Disponibles</span>
              </div>
            </div>

            {productos.length === 0 && !isLoadingProducts ? (
              <div style={emptyStateStyle}>
                <div style={emptyIconStyle}>📦</div>
                <h3 style={emptyTitleStyle}>No hay productos</h3>
                <p style={emptySubtitleStyle}>Comienza creando tu primer producto</p>
                <Link to="/crear-producto" style={primaryButtonStyle}>
                  <span style={buttonIconStyle}>➕</span>
                  Crear Primer Producto
                </Link>
              </div>
            ) : (
              <div style={tableContainerStyle}>
                <div style={tableWrapperStyle}>
                  <table style={tableStyle} className="responsive-table">
                    <thead>
                      <tr style={tableHeaderStyle}>
                        <th style={tableHeaderCellStyle}>Producto</th>
                        <th style={tableHeaderCellStyle}>Categoría</th>
                        <th style={tableHeaderCellStyle}>Precios</th>
                        <th style={tableHeaderCellStyle}>Stock</th>
                        <th style={tableHeaderCellStyle}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productos.map((producto) => (
                        <tr key={producto._id} style={tableRowStyle} className="fadeIn">
                          <td style={tableCellStyle}>
                            <div style={productCellStyle}>
                              <img
                                src={producto.imagenUrl || "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=50&h=50&fit=crop"}
                                alt={producto.nombre}
                                style={productImageStyle}
                                onError={(e) => {
                                  e.target.src = "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=50&h=50&fit=crop";
                                }}
                              />
                              <div style={productInfoStyle}>
                                <h4 style={productNameStyle}>{producto.nombre}</h4>
                              </div>
                            </div>
                          </td>
                          <td style={tableCellStyle}>
                            <span style={categoryBadgeStyle}>
                              {producto.categoria || 'Sin categoría'}
                            </span>
                          </td>
                          <td style={tableCellStyle}>
                            <div style={pricesContainerStyle}>
                              <span style={priceCompraStyle}>Compra: Q{formatPrice(producto.precioCompra)}</span>
                              <span style={priceVentaStyle}>Venta: Q{formatPrice(producto.precioVenta)}</span>
                            </div>
                          </td>
                          <td style={tableCellStyle}>
                            <span style={{
                              ...stockBadgeStyle,
                              background: producto.stock === 0 ? '#fef2f2' : '#f0fdf4',
                              color: producto.stock === 0 ? '#dc2626' : '#166534',
                              borderColor: producto.stock === 0 ? '#fecaca' : '#bbf7d0'
                            }}>
                              {producto.stock === 0 ? '⚠️ Agotado' : `✅ ${producto.stock}`}
                            </span>
                          </td>
                          <td style={tableCellStyle}>
                            <div style={actionsContainerStyle}>
                              <button
                                onClick={() => handleEditProduct(producto._id)}
                                style={editButtonStyle}
                              >
                                <span style={buttonIconStyle}>✏️</span>
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(producto._id)}
                                style={deleteButtonStyle}
                              >
                                <span style={buttonIconStyle}>🗑️</span>
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={productsPagination.currentPage}
                  totalPages={productsPagination.totalPages}
                  hasNextPage={productsPagination.hasNextPage}
                  hasPrevPage={productsPagination.hasPrevPage}
                  onPageChange={handleProductsPageChange}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'pedidos' && (
          <div style={tabContentStyle} className="fadeIn">
            <div style={sectionHeaderStyle} className="section-header">
              <h2 style={sectionTitleStyle}>
                <span style={sectionIconStyle}>📋</span>
                Gestión de Pedidos
              </h2>
            </div>

            <div style={statsContainerStyle}>
              <div style={statCardStyle}>
                <span style={statNumberStyle}>{ordersPagination.totalOrders}</span>
                <span style={statLabelStyle}>Total Pedidos</span>
              </div>
              <div style={statCardStyle}>
                <span style={statNumberStyle}>{orders.filter(o => o.estado === 'pendiente').length}</span>
                <span style={statLabelStyle}>Pendientes</span>
              </div>
              <div style={statCardStyle}>
                <span style={statNumberStyle}>{orders.filter(o => o.estado === 'entregado').length}</span>
                <span style={statLabelStyle}>Completados</span>
              </div>
            </div>

            {orders.length === 0 && !isLoadingOrders ? (
              <div style={emptyStateStyle}>
                <div style={emptyIconStyle}>📋</div>
                <h3 style={emptyTitleStyle}>No hay pedidos</h3>
                <p style={emptySubtitleStyle}>Los pedidos aparecerán aquí cuando los clientes realicen compras</p>
              </div>
            ) : (
              <div style={ordersContainerStyle}>
                {orders.map((order) => (
                  <div key={order._id} style={orderCardStyle} className="responsive-card fadeIn">
                    <div style={orderHeaderStyle}>
                      <div style={orderInfoStyle}>
                        <h3 style={orderIdStyle}>
                          Pedido #{order._id ? order._id.substring(0, 8) : 'N/A'}
                        </h3>
                        <p style={orderDateStyle}>
                          {order.fecha ? new Date(order.fecha).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'N/A'}
                        </p>
                      </div>
                      <div style={orderStatusContainerStyle}>
                        <div style={{
                          ...orderStatusBadgeStyle,
                          background: getStatusColor(order.estado),
                          color: 'white'
                        }}>
                          <span style={statusIconStyle}>{getStatusIcon(order.estado)}</span>
                          {order.estado.replace(/_/g, ' ').toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div style={orderDetailsStyle}>
                      <div style={customerInfoStyle}>
                        <h4 style={customerNameStyle}>
                          👤 {getUserInfo(order, 'nombre')}
                        </h4>
                        <p style={customerEmailStyle}>
                          📧 {getUserInfo(order, 'correo')}
                        </p>
                      </div>

                      <div style={orderProductsStyle}>
                        <h4 style={productsHeaderStyle}>
                          📦 Productos ({order.productos ? order.productos.length : 0})
                        </h4>
                        <div style={productListStyle}>
                          {order.productos && order.productos.map((item, idx) => (
                            <div key={idx} style={orderProductItemStyle}>
                              <span style={productItemNameStyle}>{item.nombre}</span>
                              <span style={productItemQuantityStyle}>x{item.cantidad}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={orderFooterStyle}>
                        <div style={orderTotalStyle}>
                          <span style={totalLabelStyle}>Total:</span>
                          <span style={totalAmountStyle}>Q{formatPrice(order.total)}</span>
                        </div>

                        <div style={statusSelectContainerStyle}>
                          <label style={selectLabelStyle}>Estado:</label>
                          <select
                            value={order.estado}
                            onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                            disabled={order.estado === 'cancelado' || order.estado === 'entregado'}
                            style={{
                              ...statusSelectStyle,
                              opacity: (order.estado === 'cancelado' || order.estado === 'entregado') ? 0.6 : 1,
                              cursor: (order.estado === 'cancelado' || order.estado === 'entregado') ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {orderStatuses.map(status => (
                              <option key={status} value={status}>
                                {status.replace(/_/g, ' ').toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Pagination
                  currentPage={ordersPagination.currentPage}
                  totalPages={ordersPagination.totalPages}
                  hasNextPage={ordersPagination.hasNextPage}
                  hasPrevPage={ordersPagination.hasPrevPage}
                  onPageChange={handleOrdersPageChange}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== TODOS LOS ESTILOS CSS =====

const pageWrapperStyle = {
  minHeight: '100vh',
  background: 'var(--gradient-background)',
  fontFamily: 'var(--font-sans)',
  paddingBottom: '2rem'
};

const heroHeaderStyle = {
  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
  color: 'white',
  padding: '3rem 2rem',
  textAlign: 'center'
};

const heroContentStyle = {
  maxWidth: '800px',
  margin: '0 auto'
};

const heroTitleStyle = {
  fontSize: 'clamp(2rem, 4vw, 3rem)',
  fontWeight: '800',
  marginBottom: '1rem',
  fontFamily: 'var(--font-display)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1rem'
};

const heroIconStyle = {
  fontSize: '3rem'
};

const heroSubtitleStyle = {
  fontSize: '1.125rem',
  opacity: 0.9,
  fontWeight: '500'
};

const mainContentStyle = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '0 2rem',
  marginTop: '-2rem',
  position: 'relative',
  zIndex: 2
};

const loadingContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  background: 'var(--gradient-background)',
  color: 'var(--neutral-700)'
};

const loadingSpinnerStyle = {
  marginBottom: '2rem'
};

const spinnerIconStyle = {
  fontSize: '4rem',
  animation: 'spin 2s linear infinite'
};

const loadingTextStyle = {
  fontSize: '1.25rem',
  fontWeight: '600'
};

const containerStyle = {
  minHeight: '100vh',
  background: 'var(--gradient-background)',
  fontFamily: 'var(--font-sans)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const errorStateStyle = {
  textAlign: 'center',
  padding: '4rem 2rem',
  background: 'white',
  borderRadius: '2rem',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)',
  maxWidth: '500px',
  margin: '2rem'
};

const errorIconContainerStyle = {
  marginBottom: '2rem'
};

const errorIconStyle = {
  fontSize: '6rem',
  opacity: 0.8
};

const errorTitleStyle = {
  fontSize: '2rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  marginBottom: '1rem'
};

const errorSubtitleStyle = {
  fontSize: '1.125rem',
  color: 'var(--neutral-600)',
  marginBottom: '2rem',
  lineHeight: 1.6
};

const errorButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '1rem 2rem',
  background: 'var(--gradient-primary)',
  color: 'white',
  textDecoration: 'none',
  borderRadius: '1rem',
  fontSize: '1.125rem',
  fontWeight: '700',
  transition: 'all 0.3s ease',
  boxShadow: '0 8px 25px rgba(236, 72, 153, 0.4)'
};

const notificationStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '1rem 1.5rem',
  borderRadius: '1rem',
  border: '1px solid',
  marginTop: '2rem',
  marginBottom: '2rem',
  fontSize: '1rem',
  fontWeight: '600',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  animation: 'slideInDown 0.5s ease-out'
};

const notificationIconStyle = {
  fontSize: '1.25rem'
};

const tabsContainerStyle = {
  display: 'flex',
  background: 'white',
  borderRadius: '1rem',
  padding: '0.5rem',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)',
  marginBottom: '2rem',
  gap: '0.25rem',
  overflowX: 'auto'
};

const tabButtonStyle = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '0.875rem 1rem',
  background: 'transparent',
  color: 'var(--neutral-600)',
  border: 'none',
  borderRadius: '0.75rem',
  fontSize: '0.875rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  minWidth: 'max-content',
  whiteSpace: 'nowrap'
};

const activeTabStyle = {
  background: 'var(--gradient-primary)',
  color: 'white',
  boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
};

const tabIconStyle = {
  fontSize: '1rem'
};

const tabContentStyle = {
  animation: 'fadeIn 0.5s ease-out'
};

// Estilos del Dashboard
const dashboardGridStyle = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: '2rem'
};

const metricsContainerStyle = {
  background: 'white',
  borderRadius: '1.5rem',
  padding: '2rem',
  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)'
};

const metricsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '1.5rem'
};

const metricCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1.5rem',
  background: 'var(--neutral-50)',
  borderRadius: '1rem',
  border: '1px solid var(--neutral-200)',
  transition: 'all 0.3s ease'
};

const metricIconContainerStyle = {
  flexShrink: 0
};

const metricIconStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '60px',
  height: '60px',
  borderRadius: '1rem',
  fontSize: '1.5rem',
  color: 'white',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
};

const metricContentStyle = {
  flex: 1
};

const metricValueStyle = {
  fontSize: '2rem',
  fontWeight: '800',
  color: 'var(--neutral-800)',
  marginBottom: '0.25rem',
  lineHeight: 1
};

const metricLabelStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-600)',
  fontWeight: '500'
};

const quickSummaryStyle = {
  background: 'white',
  borderRadius: '1.5rem',
  padding: '2rem',
  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)',
  height: 'fit-content'
};

const summaryTitleStyle = {
  fontSize: '1.25rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  marginBottom: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem'
};

const summaryItemsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const quickActionButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem',
  background: 'var(--primary-50)',
  borderRadius: '0.75rem',
  border: '1px solid var(--primary-200)',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%'
};

const summaryIconStyle = {
  fontSize: '1.5rem',
  flexShrink: 0
};

const summaryTextStyle = {
  flex: 1
};

// Estilos para historial
const historialContainerStyle = {
  background: 'white',
  borderRadius: '1.5rem',
  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)',
  overflow: 'hidden'
};

const historialStatsStyle = {
  display: 'flex',
  gap: '2rem',
  alignItems: 'center'
};

const historialStatStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-600)'
};

const historialListStyle = {
  padding: '2rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  maxHeight: '70vh',
  overflowY: 'auto'
};

const historialItemStyle = {
  background: 'var(--neutral-50)',
  borderRadius: '1rem',
  padding: '1.5rem',
  border: '1px solid var(--neutral-200)',
  transition: 'all 0.3s ease'
};

const historialItemHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid var(--neutral-200)'
};

const historialItemInfoStyle = {
  flex: 1
};

const historialItemTitleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  marginBottom: '0.5rem'
};

const tipoVentaBadgeStyle = (tipo) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 1rem',
  borderRadius: '1rem',
  fontSize: '0.875rem',
  fontWeight: '600',
  background: tipo === 'fisica' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  color: 'white',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
});

const historialIdStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-600)',
  fontWeight: '500'
};

const historialDateStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-600)',
  fontWeight: '500'
};

const historialAmountsStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '0.5rem'
};

const historialTotalStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const historialTotalLabelStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'var(--neutral-700)'
};

const historialTotalAmountStyle = {
  fontSize: '1.25rem',
  fontWeight: '800',
  color: 'var(--primary-600)'
};

const historialGananciaStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const historialGananciaLabelStyle = {
  fontSize: '0.875rem',
  fontWeight: '500',
  color: 'var(--neutral-600)'
};

const historialGananciaAmountStyle = {
  fontSize: '1rem',
  fontWeight: '700',
  color: '#22c55e'
};

const historialDetailsStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 2fr',
  gap: '1.5rem'
};

const historialClienteStyle = {
  background: 'white',
  padding: '1rem',
  borderRadius: '0.75rem',
  border: '1px solid var(--neutral-200)'
};

const historialClienteTitleStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'var(--neutral-800)',
  marginBottom: '0.5rem'
};

const historialClienteInfoStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-600)',
  margin: 0
};

const historialProductosStyle = {
  background: 'white',
  padding: '1rem',
  borderRadius: '0.75rem',
  border: '1px solid var(--neutral-200)'
};

const historialProductosTitleStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'var(--neutral-700)',
  marginBottom: '0.75rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const historialProductosListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const historialProductoItemStyle = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr 1fr',
  alignItems: 'center',
  padding: '0.5rem',
  background: 'var(--neutral-50)',
  borderRadius: '0.5rem',
  border: '1px solid var(--neutral-200)',
  gap: '1rem'
};

const historialProductoNombreStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-700)',
  fontWeight: '500'
};

const historialProductoCantidadStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-600)',
  fontWeight: '600',
  textAlign: 'center'
};

const historialProductoPrecioStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-600)',
  textAlign: 'center'
};

const historialProductoSubtotalStyle = {
  fontSize: '0.875rem',
  color: 'var(--primary-600)',
  fontWeight: '600',
  textAlign: 'right'
};

// Estilos para estadísticas
const estadisticasContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem'
};

const estadisticasMetricsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '2rem'
};

const estadisticaCardStyle = {
  background: 'white',
  borderRadius: '1rem',
  padding: '2rem',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)'
};

const estadisticaCardTitleStyle = {
  fontSize: '1.25rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  marginBottom: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const estadisticaCardContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const estadisticaItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem',
  background: 'var(--neutral-50)',
  borderRadius: '0.5rem',
  border: '1px solid var(--neutral-200)'
};

const estadisticaLabelStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-600)',
  fontWeight: '500'
};

const estadisticaValueStyle = {
  fontSize: '1.125rem',
  fontWeight: '700',
  color: 'var(--neutral-800)'
};

const ventasPorTipoStyle = {
  background: 'white',
  borderRadius: '1rem',
  padding: '2rem',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)'
};

const analisisTitleStyle = {
  fontSize: '1.25rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  marginBottom: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const tipoVentasGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '2rem'
};

const tipoVentaCardStyle = {
  background: 'var(--neutral-50)',
  borderRadius: '1rem',
  padding: '1.5rem',
  border: '1px solid var(--neutral-200)'
};

const tipoVentaHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  marginBottom: '1.5rem'
};

const tipoVentaIconStyle = {
  fontSize: '2rem'
};

const tipoVentaTitleStyle = {
  fontSize: '1.125rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  margin: 0
};

const tipoVentaStatsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '1rem'
};

const tipoVentaStatStyle = {
  textAlign: 'center',
  padding: '1rem',
  background: 'white',
  borderRadius: '0.75rem',
  border: '1px solid var(--neutral-200)'
};

const tipoVentaStatNumberStyle = {
  display: 'block',
  fontSize: '1.5rem',
  fontWeight: '800',
  color: 'var(--neutral-800)',
  marginBottom: '0.25rem'
};

const tipoVentaStatLabelStyle = {
  fontSize: '0.75rem',
  color: 'var(--neutral-600)',
  fontWeight: '500'
};

const productosPopularesStyle = {
  background: 'white',
  borderRadius: '1rem',
  padding: '2rem',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)'
};

const productosPopularesListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const productoPopularItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem',
  background: 'var(--neutral-50)',
  borderRadius: '0.75rem',
  border: '1px solid var(--neutral-200)',
  transition: 'all 0.3s ease'
};

const productoPopularRankStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
  color: 'white',
  borderRadius: '50%',
  fontSize: '1rem',
  fontWeight: '800'
};

const productoPopularInfoStyle = {
  flex: 1
};

const productoPopularNombreStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'var(--neutral-800)',
  marginBottom: '0.25rem'
};

const productoPopularCantidadStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-600)'
};

const productoPopularIngresoStyle = {
  fontSize: '1.125rem',
  fontWeight: '700',
  color: 'var(--primary-600)'
};

// Estilos existentes para productos y pedidos
const sectionHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
  background: 'white',
  padding: '1.5rem 2rem',
  borderRadius: '1rem',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)'
};

const sectionTitleStyle = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  margin: 0
};

const sectionIconStyle = {
  fontSize: '1.5rem'
};

const createButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '1rem 1.5rem',
  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
  color: 'white',
  textDecoration: 'none',
  borderRadius: '0.75rem',
  fontSize: '1rem',
  fontWeight: '600',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
};

const statsContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1.5rem',
  marginBottom: '2rem'
};

const statCardStyle = {
  background: 'white',
  borderRadius: '1rem',
  padding: '1.5rem',
  textAlign: 'center',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)',
  transition: 'all 0.3s ease'
};

const statNumberStyle = {
  display: 'block',
  fontSize: '2rem',
  fontWeight: '800',
  color: 'var(--primary-600)',
  marginBottom: '0.5rem'
};

const statLabelStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-600)',
  fontWeight: '500'
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '4rem 2rem',
  background: 'white',
  borderRadius: '2rem',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)'
};

const emptyIconStyle = {
  fontSize: '6rem',
  opacity: 0.6,
  marginBottom: '1rem'
};

const emptyTitleStyle = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  marginBottom: '0.5rem'
};

const emptySubtitleStyle = {
  fontSize: '1rem',
  color: 'var(--neutral-600)',
  marginBottom: '2rem'
};

const primaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '1rem 2rem',
  background: 'var(--gradient-primary)',
  color: 'white',
  textDecoration: 'none',
  borderRadius: '1rem',
  fontSize: '1.125rem',
  fontWeight: '700',
  transition: 'all 0.3s ease',
  boxShadow: '0 8px 25px rgba(236, 72, 153, 0.4)'
};

const tableContainerStyle = {
  background: 'white',
  borderRadius: '1rem',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)',
  overflow: 'hidden'
};

const tableWrapperStyle = {
  overflowX: 'auto'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse'
};

const tableHeaderStyle = {
  background: 'var(--neutral-50)',
  borderBottom: '1px solid var(--neutral-200)'
};

const tableHeaderCellStyle = {
  padding: '1rem 1.5rem',
  textAlign: 'left',
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'var(--neutral-700)',
  borderBottom: '1px solid var(--neutral-200)'
};

const tableRowStyle = {
  borderBottom: '1px solid var(--neutral-200)',
  transition: 'all 0.2s ease'
};

const tableCellStyle = {
  padding: '1rem 1.5rem',
  verticalAlign: 'middle'
};

const productCellStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem'
};

const productImageStyle = {
  width: '50px',
  height: '50px',
  objectFit: 'cover',
  borderRadius: '0.5rem',
  border: '2px solid white',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
};

const productInfoStyle = {
  flex: 1
};

const productNameStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'var(--neutral-800)',
  margin: 0
};

const categoryBadgeStyle = {
  display: 'inline-block',
  padding: '0.25rem 0.75rem',
  background: 'var(--primary-50)',
  color: 'var(--primary-700)',
  borderRadius: '1rem',
  fontSize: '0.875rem',
  fontWeight: '500',
  border: '1px solid var(--primary-200)'
};

const pricesContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem'
};

const priceCompraStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-600)'
};

const priceVentaStyle = {
  fontSize: '0.875rem',
  color: 'var(--green-600)',
  fontWeight: '600'
};

const stockBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '0.5rem 0.75rem',
  borderRadius: '1rem',
  fontSize: '0.875rem',
  fontWeight: '600',
  border: '1px solid'
};

const actionsContainerStyle = {
  display: 'flex',
  gap: '0.5rem'
};

const editButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 1rem',
  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
  color: 'white',
  border: 'none',
  borderRadius: '0.5rem',
  fontSize: '0.875rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 2px 8px rgba(251, 191, 36, 0.3)'
};

const deleteButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 1rem',
  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
  color: 'white',
  border: 'none',
  borderRadius: '0.5rem',
  fontSize: '0.875rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
};

const buttonIconStyle = {
  fontSize: '1rem'
};

// Estilos para pedidos
const ordersContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
};

const orderCardStyle = {
  background: 'white',
  borderRadius: '1rem',
  padding: '1.5rem',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)',
  transition: 'all 0.3s ease'
};

const orderHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid var(--neutral-200)'
};

const orderInfoStyle = {
  flex: 1
};

const orderIdStyle = {
  fontSize: '1.25rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  marginBottom: '0.5rem'
};

const orderDateStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-600)',
  fontWeight: '500'
};

const orderStatusContainerStyle = {
  display: 'flex',
  alignItems: 'center'
};

const orderStatusBadgeStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 1rem',
  borderRadius: '1rem',
  fontSize: '0.875rem',
  fontWeight: '600',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
};

const statusIconStyle = {
  fontSize: '1rem'
};

const orderDetailsStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 2fr',
  gap: '1.5rem',
  marginBottom: '1rem'
};

const customerInfoStyle = {
  background: 'var(--neutral-50)',
  padding: '1rem',
  borderRadius: '0.75rem',
  border: '1px solid var(--neutral-200)'
};

const customerNameStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'var(--neutral-800)',
  marginBottom: '0.5rem'
};

const customerEmailStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-600)',
  margin: 0
};

const orderProductsStyle = {
  background: 'var(--neutral-50)',
  padding: '1rem',
  borderRadius: '0.75rem',
  border: '1px solid var(--neutral-200)'
};

const productsHeaderStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'var(--neutral-700)',
  marginBottom: '0.75rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const productListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const orderProductItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.5rem',
  background: 'white',
  borderRadius: '0.5rem',
  border: '1px solid var(--neutral-200)'
};

const productItemNameStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-700)',
  fontWeight: '500'
};

const productItemQuantityStyle = {
  fontSize: '0.875rem',
  color: 'var(--primary-600)',
  fontWeight: '600'
};

const orderFooterStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: '1rem',
  borderTop: '1px solid var(--neutral-200)'
};

const orderTotalStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const totalLabelStyle = {
  fontSize: '1.125rem',
  fontWeight: '600',
  color: 'var(--neutral-700)'
};

const totalAmountStyle = {
  fontSize: '1.5rem',
  fontWeight: '800',
  color: 'var(--primary-600)'
};

const statusSelectContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const selectLabelStyle = {
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'var(--neutral-700)'
};

const statusSelectStyle = {
  padding: '0.5rem 1rem',
  borderRadius: '0.5rem',
  border: '1px solid var(--neutral-300)',
  background: 'white',
  color: 'var(--neutral-700)',
  fontSize: '0.875rem',
  fontWeight: '500',
  transition: 'all 0.2s ease',
  minWidth: '150px'
};

// Estilos para búsqueda de productos
const searchSectionStyle = {
  padding: '0 0 2rem 0',
  maxWidth: '600px',
  margin: '0 auto'
};

const searchContainerStyle = {
  position: 'relative'
};

const searchInputContainerStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  background: 'white',
  borderRadius: 'var(--border-radius-2xl)',
  boxShadow: 'var(--shadow-xl)',
  border: '1px solid var(--secondary-200)',
  overflow: 'hidden'
};

const searchIconStyle = {
  padding: '1rem',
  color: 'var(--secondary-400)',
  fontSize: '1.25rem'
};

const searchInputStyle = {
  flex: 1,
  padding: '1rem 0',
  border: 'none',
  outline: 'none',
  fontSize: '1rem',
  fontWeight: '500',
  color: 'var(--secondary-700)',
  background: 'transparent'
};

const clearSearchStyle = {
  padding: '1rem',
  background: 'none',
  border: 'none',
  color: 'var(--secondary-400)',
  cursor: 'pointer',
  fontSize: '1rem',
  transition: 'var(--transition-fast)',
  borderRadius: '50%',
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

// Estilos para estadísticas avanzadas con gráficas
const estadisticasHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
  background: 'white',
  padding: '2rem',
  borderRadius: '1rem',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)',
  flexWrap: 'wrap',
  gap: '1rem'
};

const filtrosTemporalesStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
  flexWrap: 'wrap'
};

const filtroGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const filtroLabelStyle = {
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'var(--neutral-700)'
};

const filtroSelectStyle = {
  padding: '0.75rem 1rem',
  borderRadius: '0.5rem',
  border: '1px solid var(--neutral-300)',
  background: 'white',
  color: 'var(--neutral-700)',
  fontSize: '0.875rem',
  fontWeight: '500',
  minWidth: '150px'
};

const filtroDateStyle = {
  padding: '0.75rem 1rem',
  borderRadius: '0.5rem',
  border: '1px solid var(--neutral-300)',
  background: 'white',
  color: 'var(--neutral-700)',
  fontSize: '0.875rem',
  fontWeight: '500'
};

const periodoInfoStyle = {
  padding: '0.75rem 1rem',
  background: 'var(--primary-50)',
  borderRadius: '0.5rem',
  border: '1px solid var(--primary-200)'
};

const periodoTextStyle = {
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'var(--primary-700)'
};

const graficasContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
  gap: '2rem'
};

const graficaCardStyle = {
  background: 'white',
  borderRadius: '1rem',
  padding: '2rem',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)'
};

const graficaTitleStyle = {
  fontSize: '1.125rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  marginBottom: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const graficaContentStyle = {
  minHeight: '300px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const noDataStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
  color: 'var(--neutral-500)'
};

const noDataIconStyle = {
  fontSize: '3rem',
  opacity: 0.6
};

const noDataTextStyle = {
  fontSize: '1rem',
  fontWeight: '500',
  textAlign: 'center'
};

const chartContainerStyle = {
  display: 'flex',
  alignItems: 'end',
  gap: '0.5rem',
  height: '250px',
  width: '100%',
  padding: '1rem 0'
};

const chartBarContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flex: 1,
  height: '100%'
};

const chartBarStyle = {
  width: '100%',
  height: '180px',
  display: 'flex',
  alignItems: 'end',
  justifyContent: 'center',
  marginBottom: '0.5rem'
};

const chartBarFillStyle = {
  width: '80%',
  borderRadius: '0.25rem 0.25rem 0 0',
  transition: 'all 0.3s ease',
  minHeight: '4px'
};

const chartBarLabelStyle = {
  fontSize: '0.75rem',
  color: 'var(--neutral-600)',
  textAlign: 'center',
  marginBottom: '0.25rem',
  transform: 'rotate(-45deg)',
  whiteSpace: 'nowrap'
};

const chartBarValueStyle = {
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'var(--neutral-800)',
  textAlign: 'center'
};

const topProductsChartStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  width: '100%'
};

const productChartItemStyle = {
  display: 'grid',
  gridTemplateColumns: 'auto 2fr 3fr auto',
  alignItems: 'center',
  gap: '1rem',
  padding: '0.75rem',
  background: 'var(--neutral-50)',
  borderRadius: '0.5rem',
  border: '1px solid var(--neutral-200)'
};

const productRankStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '30px',
  height: '30px',
  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
  color: 'white',
  borderRadius: '50%',
  fontSize: '0.875rem',
  fontWeight: '700'
};

const productNameChartStyle = {
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'var(--neutral-800)'
};

const productBarContainerStyle = {
  height: '8px',
  background: 'var(--neutral-200)',
  borderRadius: '4px',
  overflow: 'hidden'
};

const productBarStyle = {
  height: '100%',
  borderRadius: '4px',
  transition: 'width 0.8s ease'
};

const productQuantityStyle = {
  fontSize: '0.875rem',
  fontWeight: '700',
  color: 'var(--primary-600)',
  textAlign: 'right'
};

const filtrosIntuitivosStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem'
};

const selectorPeriodoStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const selectorTitleStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'var(--neutral-700)',
  margin: 0
};

const opcionesPeriodoStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem'
};

const opcionButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem',
  background: 'white',
  border: '2px solid var(--neutral-200)',
  borderRadius: '0.75rem',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  textAlign: 'left'
};

const opcionActiveStyle = {
  background: 'var(--primary-50)',
  borderColor: 'var(--primary-500)',
  boxShadow: '0 4px 12px rgba(236, 72, 153, 0.2)'
};

const opcionIconStyle = {
  fontSize: '2rem',
  flexShrink: 0
};

const opcionContentStyle = {
  flex: 1
};

const fechaCustomStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  padding: '1rem',
  background: 'var(--neutral-50)',
  borderRadius: '0.75rem',
  border: '1px solid var(--neutral-200)'
};

const fechaCustomLabelStyle = {
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'var(--neutral-700)'
};

const fechaCustomInputStyle = {
  padding: '0.75rem',
  borderRadius: '0.5rem',
  border: '1px solid var(--neutral-300)',
  background: 'white',
  fontSize: '0.875rem'
};

const resumenPeriodoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem',
  background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
  borderRadius: '0.75rem',
  border: '1px solid #93c5fd'
};

const resumenIconStyle = {
  fontSize: '2rem',
  flexShrink: 0
};

const resumenTextStyle = {
  flex: 1
};

const resumenDescripcionStyle = {
  margin: '0.25rem 0 0 0',
  fontSize: '0.875rem',
  color: 'var(--neutral-600)'
};
export default AdminPanel;
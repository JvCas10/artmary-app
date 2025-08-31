// src/pages/AdminPanel.jsx - SISTEMA COMPLETO DE GESTIÓN ART MARY
import React, { useEffect, useState, useCallback } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Pagination from '../components/Pagination';
// Agregar estas líneas para las gráficas
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
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
    .tabs-container { 
      overflow-x: auto !important;
      padding-bottom: 0.5rem !important;
    }
    .tab-button { 
      min-width: max-content !important;
      font-size: 0.85rem !important;
      padding: 0.75rem 1rem !important;
    }
    
    .admin-page-wrapper {
      padding-top: 70px !important;
      padding-left: 0.25rem !important;
      padding-right: 0.25rem !important;
    }
  }
  
  @media (max-width: 480px) {
    .admin-page-wrapper {
      padding-top: 60px !important;
      padding-left: 0.125rem !important;
      padding-right: 0.125rem !important;
    }
    
    .tab-button {
      font-size: 0.8rem !important;
      padding: 0.6rem 0.8rem !important;
    }
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

  const orderStatuses = ['confirmado', 'entregado', 'cancelado', 'listo_para_recoger'];

  const clearMessage = useCallback((type) => {
    setTimeout(() => {
      if (type === 'success') {
        setMensaje('');
      } else if (type === 'error') {
        setError('');
      }
    }, 5000);
  }, []);

  const obtenerDatosGrafica = () => {
    const ventasFiltradas = obtenerVentasFiltradas();
    // Procesar datos para la gráfica
    return ventasFiltradas.slice(-7).map((venta, index) => ({
      fecha: new Date(venta.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      ventas: venta.gananciaTotal || 0
    }));
  };

  // Función auxiliar para validar y normalizar datos de productos en ventas
  const normalizarProductoVenta = (producto) => {
    const esConjunto = producto.tipoVenta === 'conjunto' ||
      (producto.nombreConjunto && producto.unidadesPorConjunto);

    return {
      ...producto,
      esConjunto,
      cantidadConjuntos: esConjunto ?
        (producto.cantidadOriginal || Math.floor(producto.cantidad / (producto.unidadesPorConjunto || 1))) : 0,
      unidadesTotales: producto.cantidad || 0,
      precioUnitarioReal: esConjunto ?
        (producto.precioConjunto || producto.precioVenta) :
        producto.precioVenta,
      descripcionVenta: esConjunto ?
        `${producto.cantidadOriginal || Math.floor(producto.cantidad / (producto.unidadesPorConjunto || 1))} ${producto.nombreConjunto || 'conjuntos'} (${producto.cantidad} unidades)` :
        `${producto.cantidad} unidades`
    };
  };

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
      const response = await axios.get('/productos/admin/todos');
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
  // Función para obtener todas las ventas (físicas + online entregadas) con datos normalizados
  const obtenerTodasLasVentas = () => {
    const ventasFisicas = (ventas || []).map(venta => ({
      ...venta,
      tipo: 'fisica',
      productos: (venta.productos || []).map(normalizarProductoVenta)
    }));

    const pedidosEntregados = (orders || [])
      .filter(pedido => pedido.estado === 'entregado')
      .map(pedido => ({
        ...pedido,
        tipo: 'online',
        productos: (pedido.productos || []).map(producto => normalizarProductoVenta({
          ...producto,
          cantidad: producto.tipoVenta === 'conjunto' ?
            (producto.cantidadOriginal || producto.cantidad) * (producto.unidadesPorConjunto || 1) :
            producto.cantidad
        }))
      }));

    return [...ventasFisicas, ...pedidosEntregados]
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
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

  /// Función para obtener datos para gráficas
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

    // Datos para gráfica de productos más vendidos CON LÓGICA DE CONJUNTOS
    const productosVendidos = {};
    ventasFiltradas.forEach(venta => {
      (venta.productos || []).forEach(producto => {
        const nombre = producto.nombre;
        if (!productosVendidos[nombre]) {
          productosVendidos[nombre] = 0;
        }

        // NUEVA LÓGICA: Contar unidades totales (incluye conjuntos convertidos a unidades)
        const esConjunto = producto.tipoVenta === 'conjunto' || (producto.nombreConjunto && producto.unidadesPorConjunto);

        if (esConjunto) {
          productosVendidos[nombre] += producto.cantidad; // Ya viene en unidades totales del backend
        } else {
          productosVendidos[nombre] += producto.cantidad; // Unidades individuales
        }
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
            conjuntosVendidos: 0,
            ingresoTotal: 0
          };
        }

        // LÓGICA CORREGIDA: Distinguir entre conjuntos e individuales
        const esConjunto = producto.tipoVenta === 'conjunto' || (producto.nombreConjunto && producto.unidadesPorConjunto);

        if (esConjunto) {
          const cantidadConjuntos = producto.cantidadOriginal || Math.floor(producto.cantidad / (producto.unidadesPorConjunto || 1));
          productosVendidos[nombre].conjuntosVendidos += cantidadConjuntos;
          productosVendidos[nombre].cantidadVendida += producto.cantidad; // Unidades totales
        } else {
          productosVendidos[nombre].cantidadVendida += producto.cantidad;
        }

        productosVendidos[nombre].ingresoTotal += (producto.precioVenta || producto.precio) * (producto.cantidadOriginal || producto.cantidad);
      });
    });

    return Object.values(productosVendidos)
      .sort((a, b) => b.cantidadVendida - a.cantidadVendida);
  };

  // Calcular estadísticas para el dashboard
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

    // NUEVA LÓGICA CORREGIDA: Calcular unidades y conjuntos vendidos
    let totalUnidadesVendidas = 0;
    let totalConjuntosVendidos = 0;

    ventasFiltradas.forEach(venta => {
      (venta.productos || []).forEach(prod => {
        // Detectar si es conjunto
        const esConjunto = prod.tipoVenta === 'conjunto' || (prod.nombreConjunto && prod.unidadesPorConjunto);

        if (esConjunto) {
          const cantidadConjuntos = prod.cantidadOriginal || Math.floor(prod.cantidad / (prod.unidadesPorConjunto || 1));
          totalConjuntosVendidos += cantidadConjuntos;
          totalUnidadesVendidas += prod.cantidad; // Unidades totales (ya viene correcto del backend)
        } else {
          totalUnidadesVendidas += prod.cantidad;
        }
      });
    });

    const ventasEsteMes = ventasFiltradas.filter(v => {
      const fechaVenta = new Date(v.fecha);
      return fechaVenta.getMonth() === hoy.getMonth() && fechaVenta.getFullYear() === hoy.getFullYear();
    }).length;

    return {
      totalVentas: ventasFiltradas.length,
      ventasHoy,
      ventasEsteMes,
      gananciasTotal,
      productosVendidos: totalUnidadesVendidas, // Ahora incluye lógica correcta de conjuntos
      totalConjuntosVendidos, // NUEVO: total de conjuntos vendidos
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
    <div style={pageWrapperStyle} className="admin-page-wrapper">
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
            {/* Dashboard Mejorado */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '2rem',
              padding: '2rem',
              marginBottom: '2rem',
              color: 'white'
            }}>
              <h2 style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                textAlign: 'center',
                marginBottom: '1rem',
                textShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}>
                📊 Dashboard Art Mary
              </h2>
              <p style={{
                textAlign: 'center',
                fontSize: '1.1rem',
                opacity: 0.9
              }}>
                Panel de control y métricas de negocio
              </p>
            </div>

            {/* Filtros Temporales */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '20px',
              padding: '1.5rem',
              marginBottom: '2rem',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {['dia', 'semana', 'mes'].map((filtro) => (
                <button
                  key={filtro}
                  onClick={() => setFiltroTemporal(filtro)}
                  style={{
                    padding: '0.8rem 1.5rem',
                    background: filtroTemporal === filtro ?
                      'linear-gradient(135deg, #667eea, #764ba2)' :
                      'rgba(255, 255, 255, 0.5)',
                    color: filtroTemporal === filtro ? 'white' : '#667eea',
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                    borderRadius: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textTransform: 'capitalize'
                  }}
                >
                  📅 {filtro === 'dia' ? 'Hoy' : filtro === 'semana' ? 'Esta Semana' : 'Este Mes'}
                </button>
              ))}
            </div>

            {/* Métricas Principales Mejoradas */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              marginBottom: '3rem'
            }}>
              {/* Tarjeta Ganancias */}
              <div style={{
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '24px',
                padding: '2rem',
                overflow: 'hidden',
                transition: 'all 0.4s ease',
                cursor: 'pointer'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    boxShadow: '0 8px 32px rgba(34, 197, 94, 0.3)'
                  }}>
                    💰
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    background: 'rgba(34, 197, 94, 0.1)',
                    color: '#16a34a'
                  }}>
                    📈 +15.3%
                  </div>
                </div>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  color: '#1f2937',
                  marginBottom: '0.5rem'
                }}>
                  Q{formatPrice(estadisticas.gananciasTotal)}
                </div>
                <div style={{
                  fontSize: '1rem',
                  color: '#6b7280',
                  fontWeight: '600'
                }}>
                  Ganancias Netas
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                  borderRadius: '0 0 24px 24px'
                }}></div>
              </div>

              {/* Tarjeta Conjuntos */}
              <div style={{
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '24px',
                padding: '2rem',
                overflow: 'hidden',
                transition: 'all 0.4s ease',
                cursor: 'pointer'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)'
                  }}>
                    📦
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    background: 'rgba(34, 197, 94, 0.1)',
                    color: '#16a34a'
                  }}>
                    📈 +8.2%
                  </div>
                </div>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  color: '#1f2937',
                  marginBottom: '0.5rem'
                }}>
                  {estadisticas.totalConjuntosVendidos}
                </div>
                <div style={{
                  fontSize: '1rem',
                  color: '#6b7280',
                  fontWeight: '600'
                }}>
                  Conjuntos Vendidos
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
                  borderRadius: '0 0 24px 24px'
                }}></div>
              </div>

              {/* Tarjeta Unidades */}
              <div style={{
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '24px',
                padding: '2rem',
                overflow: 'hidden',
                transition: 'all 0.4s ease',
                cursor: 'pointer'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    boxShadow: '0 8px 32px rgba(6, 182, 212, 0.3)'
                  }}>
                    🛍️
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    background: 'rgba(34, 197, 94, 0.1)',
                    color: '#16a34a'
                  }}>
                    📈 +12.4%
                  </div>
                </div>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  color: '#1f2937',
                  marginBottom: '0.5rem'
                }}>
                  {estadisticas.totalUnidadesVendidas}
                </div>
                <div style={{
                  fontSize: '1rem',
                  color: '#6b7280',
                  fontWeight: '600'
                }}>
                  Unidades Vendidas
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #06b6d4, #0891b2)',
                  borderRadius: '0 0 24px 24px'
                }}></div>
              </div>

              {/* Tarjeta Ventas Hoy */}
              <div style={{
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '24px',
                padding: '2rem',
                overflow: 'hidden',
                transition: 'all 0.4s ease',
                cursor: 'pointer'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)'
                  }}>
                    📊
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    background: 'rgba(34, 197, 94, 0.1)',
                    color: '#16a34a'
                  }}>
                    📈 +5.7%
                  </div>
                </div>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  color: '#1f2937',
                  marginBottom: '0.5rem'
                }}>
                  {estadisticas.ventasHoy}
                </div>
                <div style={{
                  fontSize: '1rem',
                  color: '#6b7280',
                  fontWeight: '600'
                }}>
                  Ventas de Hoy
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                  borderRadius: '0 0 24px 24px'
                }}></div>
              </div>
            </div>

            {/* Gráfica de Tendencias */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '24px',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📈 Tendencia de Ventas
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={obtenerDatosGrafica()}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#667eea" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis dataKey="fecha" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="ventas"
                    stroke="#667eea"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorVentas)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Resumen Final */}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
              borderRadius: '20px',
              padding: '2rem',
              color: '#1f2937',
              textAlign: 'center',
              border: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '1rem'
              }}>
                🎯 Resumen del Período
              </h3>
              <p style={{
                fontSize: '1.1rem',
                opacity: 0.9,
                lineHeight: 1.6
              }}>
                En {filtroTemporal === 'dia' ? 'el día de hoy' : filtroTemporal === 'semana' ? 'esta semana' : 'este mes'} has vendido{' '}
                <strong>{estadisticas.totalConjuntosVendidos} conjuntos</strong> y{' '}
                <strong>{estadisticas.totalUnidadesVendidas} unidades</strong>, generando{' '}
                <strong>Q{formatPrice(estadisticas.gananciasTotal)}</strong> en ganancias netas.
              </p>
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
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>
                <span style={sectionIconStyle}>📈</span>
                Historial de Ventas
              </h2>
            </div>

            <div style={statsContainerStyle}>
              <div style={statCardStyle}>
                <span style={statNumberStyle}>{todasLasVentas.length}</span>
                <span style={statLabelStyle}>Total Ventas</span>
              </div>
              <div style={statCardStyle}>
                <span style={statNumberStyle}>{estadisticas.productosVendidos}</span>
                <span style={statLabelStyle}>Unidades Vendidas</span>
              </div>
              <div style={statCardStyle}>
                <span style={statNumberStyle}>{estadisticas.totalConjuntosVendidos}</span>
                <span style={statLabelStyle}>Conjuntos Vendidos</span>
              </div>
              <div style={statCardStyle}>
                <span style={statNumberStyle}>Q{formatPrice(estadisticas.gananciasTotal)}</span>
                <span style={statLabelStyle}>Ganancias</span>
              </div>
            </div>

            {todasLasVentas.length === 0 ? (
              <div style={emptyStateStyle}>
                <div style={emptyIconStyle}>📈</div>
                <h3 style={emptyTitleStyle}>No hay ventas registradas</h3>
                <p style={emptySubtitleStyle}>Las ventas físicas y pedidos entregados aparecerán aquí</p>
              </div>
            ) : (
              <div className="historial-responsive-container">
                {todasLasVentas.map((venta, index) => (
                  <div key={`${venta.tipo}-${venta._id}-${index}`} className="historial-card" style={historialCardStyle}>
                    {/* Header de la venta */}
                    <div className="historial-card-header" style={historialCardHeaderStyle}>
                      <div style={historialCardIdStyle}>
                        #{(venta._id || '').slice(-8).toUpperCase()}
                      </div>
                      <div className="historial-card-badges">
                        <span style={venta.tipo === 'fisica' ?
                          { background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' } :
                          { background: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }
                        }>
                          {venta.tipo === 'fisica' ? 'Física' : 'Online'}
                        </span>
                      </div>
                    </div>

                    {/* Info de cliente y fecha */}
                    <div className="historial-card-info" style={historialCardInfoStyle}>
                      <div style={historialCardClientStyle}>
                        <strong>Cliente:</strong> {venta.cliente?.nombre || venta.userId?.nombre || 'N/A'}
                      </div>
                      <div style={historialCardDateStyle}>
                        <strong>Fecha:</strong> {new Date(venta.fecha).toLocaleDateString('es-ES')} • {new Date(venta.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {/* Productos */}
                    <div className="historial-card-productos" style={historialCardProductosStyle}>
                      <h4 style={historialCardProductosTitleStyle}>Productos:</h4>
                      {(venta.productos || []).map((prod, idx) => (
                        <div key={idx} style={historialCardProductoStyle}>
                          <div style={historialCardProductoInfoStyle}>
                            <span style={historialCardProductoNombreStyle}>{prod.nombre}</span>
                            <div style={historialCardProductoCantidadStyle}>
                              {prod.tipoVenta === 'conjunto' ? (
                                <>
                                  <strong>{prod.cantidadOriginal || prod.cantidad} {prod.nombreConjunto || 'conjuntos'}</strong>
                                  <small style={{ display: 'block', color: '#666' }}>
                                    ({prod.cantidad || (prod.cantidadOriginal * prod.unidadesPorConjunto)} unidades totales)
                                  </small>
                                </>
                              ) : (
                                <strong>{prod.cantidad} unidades</strong>
                              )}
                            </div>
                          </div>
                          <div style={historialCardProductoPrecioStyle}>
                            Q{formatPrice((prod.precioVenta || prod.precio) * (prod.cantidadOriginal || prod.cantidad))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totales */}
                    <div className="historial-card-totales" style={historialCardTotalesStyle}>
                      <div style={historialCardTotalStyle}>
                        <strong>Total: Q{formatPrice(venta.total)}</strong>
                      </div>
                      <div style={historialCardGananciaStyle}>
                        Ganancia: Q{formatPrice(venta.gananciaTotal || 0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'estadisticas' && (
          <div style={tabContentStyle} className="fadeIn estadisticas-container">
            {/* Header único - NO duplicado */}
            <div style={{
              background: 'white',
              borderRadius: '1.5rem',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '800',
                color: '#1e293b',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }} className="estadisticas-title">
                <span style={{
                  background: 'linear-gradient(135deg, #ec4899, #be185d)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '2.5rem'
                }}>📊</span>
                Estadísticas Avanzadas
              </h2>

              {/* Información del período seleccionado */}
              <div style={{
                padding: '1rem',
                background: '#f1f5f9',
                borderRadius: '0.75rem',
                marginBottom: '1.5rem',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#475569'
                }}>
                  📅 Período seleccionado: {' '}
                  <span style={{ color: '#ec4899' }}>
                    {filtroTemporal === 'dia' && `Día ${fechaSeleccionada.toLocaleDateString('es-GT', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}`}
                    {filtroTemporal === 'semana' && `Semana del ${(() => {
                      const inicioSemana = new Date(fechaSeleccionada);
                      inicioSemana.setDate(fechaSeleccionada.getDate() - fechaSeleccionada.getDay());
                      const finSemana = new Date(inicioSemana);
                      finSemana.setDate(inicioSemana.getDate() + 6);
                      return `${inicioSemana.toLocaleDateString('es-GT')} al ${finSemana.toLocaleDateString('es-GT')}`;
                    })()}`}
                    {filtroTemporal === 'mes' && fechaSeleccionada.toLocaleDateString('es-GT', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </span>
                </p>
              </div>

              {/* Controles de filtros con clases responsive */}
              <div className="filtros-container">
                {/* Selector de período */}
                <div className="filtro-grupo">
                  <label className="filtro-label">
                    📊 Tipo de período:
                  </label>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    {[
                      { value: 'dia', label: 'Día', icon: '📅' },
                      { value: 'semana', label: 'Semana', icon: '📆' },
                      { value: 'mes', label: 'Mes', icon: '🗓️' }
                    ].map(periodo => (
                      <button
                        key={periodo.value}
                        onClick={() => setFiltroTemporal(periodo.value)}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: '0.75rem',
                          border: '1px solid',
                          borderColor: filtroTemporal === periodo.value ? 'transparent' : '#cbd5e1',
                          background: filtroTemporal === periodo.value ? 'linear-gradient(135deg, #ec4899, #be185d)' : 'white',
                          color: filtroTemporal === periodo.value ? 'white' : '#475569',
                          cursor: 'pointer',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          minHeight: '44px'
                        }}
                      >
                        <span>{periodo.icon}</span>
                        {periodo.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selector de fecha específica */}
                <div className="filtro-grupo">
                  <label className="filtro-label">
                    🗓️ Fecha específica:
                  </label>
                  <input
                    type={filtroTemporal === 'mes' ? 'month' : filtroTemporal === 'semana' ? 'week' : 'date'}
                    value={
                      filtroTemporal === 'mes'
                        ? `${fechaSeleccionada.getFullYear()}-${String(fechaSeleccionada.getMonth() + 1).padStart(2, '0')}`
                        : filtroTemporal === 'semana'
                          ? (() => {
                            const year = fechaSeleccionada.getFullYear();
                            const inicioAno = new Date(year, 0, 1);
                            const diferenciaDias = Math.floor((fechaSeleccionada - inicioAno) / (24 * 60 * 60 * 1000));
                            const numeroSemana = Math.ceil((diferenciaDias + inicioAno.getDay() + 1) / 7);
                            return `${year}-W${String(numeroSemana).padStart(2, '0')}`;
                          })()
                          : fechaSeleccionada.toISOString().split('T')[0]
                    }
                    onChange={(e) => {
                      if (filtroTemporal === 'mes') {
                        const [year, month] = e.target.value.split('-');
                        setFechaSeleccionada(new Date(parseInt(year), parseInt(month) - 1, 1));
                      } else if (filtroTemporal === 'semana') {
                        const [year, week] = e.target.value.split('-W');
                        const primerDiaAno = new Date(parseInt(year), 0, 1);
                        const diasHastaSemana = (parseInt(week) - 1) * 7;
                        const nuevaFecha = new Date(primerDiaAno.getTime() + diasHastaSemana * 24 * 60 * 60 * 1000);
                        setFechaSeleccionada(nuevaFecha);
                      } else {
                        setFechaSeleccionada(new Date(e.target.value + 'T12:00:00'));
                      }
                    }}
                    className="filtro-input"
                  />
                </div>

                {/* Botón de resetear a hoy */}
                <div className="filtro-grupo">
                  <button
                    onClick={() => {
                      setFechaSeleccionada(new Date());
                      setFiltroTemporal('mes');
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      background: 'white',
                      color: '#64748b',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      width: '100%',
                      justifyContent: 'center',
                      minHeight: '44px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#f8fafc';
                      e.target.style.borderColor = '#cbd5e1';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'white';
                      e.target.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <span>🔄</span>
                    Resetear a Hoy
                  </button>
                </div>

                {/* Contador de ventas del período */}
                <div style={{
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                  borderRadius: '0.75rem',
                  border: '1px solid #0ea5e9',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '800',
                    color: '#0369a1',
                    marginBottom: '0.25rem'
                  }}>
                    {obtenerVentasFiltradas().length}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#0284c7',
                    fontWeight: '600'
                  }}>
                    ventas en período
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjetas de métricas principales con clase responsive */}
            <div className="estadisticas-metrics">
              {/* Ganancias Netas */}
              <div style={{
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                borderRadius: '1.5rem',
                padding: '2rem',
                color: 'white',
                boxShadow: '0 10px 25px rgba(34, 197, 94, 0.3)'
              }} className="estadistica-card">
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }} className="estadistica-card-title">
                  💰 Ganancias Netas
                </h3>
                <p style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', lineHeight: 1 }} className="estadistica-value">
                  Q{formatPrice(estadisticas.gananciasTotal)}
                </p>
                <p style={{ opacity: 0.9, fontSize: '0.875rem' }} className="estadistica-label">
                  Total de {estadisticas.totalVentas} ventas
                </p>
              </div>

              {/* Ventas Netas */}
              <div style={{
                background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                borderRadius: '1.5rem',
                padding: '2rem',
                color: 'white',
                boxShadow: '0 10px 25px rgba(6, 182, 212, 0.3)'
              }} className="estadistica-card">
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }} className="estadistica-card-title">
                  💵 Ventas Netas
                </h3>
                <p style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', lineHeight: 1 }} className="estadistica-value">
                  Q{formatPrice(estadisticas.ingresosBrutos)}
                </p>
                <p style={{ opacity: 0.9, fontSize: '0.875rem' }} className="estadistica-label">
                  Ingresos totales del período
                </p>
              </div>

              {/* Unidades Vendidas */}
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                borderRadius: '1.5rem',
                padding: '2rem',
                color: 'white',
                boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)'
              }} className="estadistica-card">
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }} className="estadistica-card-title">
                  📈 Unidades Vendidas
                </h3>
                <p style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', lineHeight: 1 }} className="estadistica-value">
                  {estadisticas.productosVendidos}
                </p>
                <p style={{ opacity: 0.9, fontSize: '0.875rem' }} className="estadistica-label">
                  Conjuntos: {estadisticas.totalConjuntosVendidos}
                </p>
              </div>

              {/* Stock Total */}
              <div style={{
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                borderRadius: '1.5rem',
                padding: '2rem',
                color: 'white',
                boxShadow: '0 10px 25px rgba(139, 92, 246, 0.3)'
              }} className="estadistica-card">
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }} className="estadistica-card-title">
                  📦 Stock Total
                </h3>
                <p style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', lineHeight: 1 }} className="estadistica-value">
                  {estadisticas.productosEnStock}
                </p>
                <p style={{
                  opacity: 0.9,
                  fontSize: '0.875rem',
                  color: estadisticas.productosSinStock > 0 ? '#fbbf24' : 'inherit'
                }} className="estadistica-label">
                  Sin stock: {estadisticas.productosSinStock}
                </p>
              </div>

              {/* Margen Promedio */}
              <div style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                borderRadius: '1.5rem',
                padding: '2rem',
                color: 'white',
                boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)'
              }} className="estadistica-card">
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }} className="estadistica-card-title">
                  📊 Margen Promedio
                </h3>
                <p style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', lineHeight: 1 }} className="estadistica-value">
                  {estadisticas.ingresosBrutos > 0 ?
                    `${((estadisticas.gananciasTotal / estadisticas.ingresosBrutos) * 100).toFixed(1)}%` :
                    '0%'
                  }
                </p>
                <p style={{ opacity: 0.9, fontSize: '0.875rem' }} className="estadistica-label">
                  {estadisticas.totalVentas > 0 ?
                    `Promedio por venta: Q${formatPrice(estadisticas.ingresosBrutos / estadisticas.totalVentas)}` :
                    'No hay ventas registradas'
                  }
                </p>
              </div>
            </div>

            {/* Gráficas con clase responsive y scroll */}
            <div className="tipo-ventas-grid">
              {/* Evolución de ventas */}
              <div style={{
                background: 'white',
                borderRadius: '1.5rem',
                padding: '2rem',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1e293b' }}>
                  📈 Evolución de Ventas (Últimos 7 días)
                </h3>
                <div className="grafico-scroll">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={(() => {
                      const datos = [];
                      const hoy = new Date();
                      for (let i = 6; i >= 0; i--) {
                        const fecha = new Date(hoy);
                        fecha.setDate(hoy.getDate() - i);
                        const ventasDelDia = obtenerTodasLasVentas().filter(v => {
                          const fechaVenta = new Date(v.fecha);
                          return fechaVenta.toDateString() === fecha.toDateString();
                        });
                        const gananciasDelDia = ventasDelDia.reduce((acc, v) => acc + (v.gananciaTotal || 0), 0);
                        datos.push({
                          fecha: fecha.toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric' }),
                          ventas: ventasDelDia.length,
                          ganancias: gananciasDelDia
                        });
                      }
                      return datos;
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="fecha" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '0.75rem',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="ganancias"
                        stroke="#ec4899"
                        fill="#ec4899"
                        fillOpacity={0.3}
                        name="Ganancias (Q)"
                      />
                      <Line
                        type="monotone"
                        dataKey="ventas"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        name="Número de Ventas"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Productos más vendidos */}
              <div style={{
                background: 'white',
                borderRadius: '1.5rem',
                padding: '2rem',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1e293b' }}>
                  🏆 Top 5 Productos Más Vendidos
                </h3>
                <div className="grafico-scroll">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={obtenerProductosMasVendidos().slice(0, 5).map(p => ({
                      nombre: p.nombre.length > 15 ? p.nombre.substring(0, 15) + '...' : p.nombre,
                      cantidad: p.cantidadVendida
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="nombre" stroke="#64748b" angle={-45} textAnchor="end" height={100} />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '0.75rem',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar
                        dataKey="cantidad"
                        fill="#22c55e"
                        radius={[4, 4, 0, 0]}
                        name="Unidades Vendidas"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Estado del inventario con clase responsive */}
            <div className="tipo-ventas-grid">
              <div style={{
                background: 'white',
                borderRadius: '1.5rem',
                padding: '2rem',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1e293b' }}>
                  📦 Estado del Inventario
                </h3>
                <div className="grafico-scroll">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { nombre: 'Stock Alto', cantidad: productos.filter(p => p.stock > 20).length, color: '#22c55e' },
                          { nombre: 'Stock Medio', cantidad: productos.filter(p => p.stock > 5 && p.stock <= 20).length, color: '#f59e0b' },
                          { nombre: 'Stock Bajo', cantidad: productos.filter(p => p.stock > 0 && p.stock <= 5).length, color: '#ef4444' },
                          { nombre: 'Sin Stock', cantidad: productos.filter(p => p.stock === 0).length, color: '#6b7280' }
                        ].filter(item => item.cantidad > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ nombre, cantidad }) => `${nombre}: ${cantidad}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="cantidad"
                      >
                        {[
                          { nombre: 'Stock Alto', cantidad: productos.filter(p => p.stock > 20).length, color: '#22c55e' },
                          { nombre: 'Stock Medio', cantidad: productos.filter(p => p.stock > 5 && p.stock <= 20).length, color: '#f59e0b' },
                          { nombre: 'Stock Bajo', cantidad: productos.filter(p => p.stock > 0 && p.stock <= 5).length, color: '#ef4444' },
                          { nombre: 'Sin Stock', cantidad: productos.filter(p => p.stock === 0).length, color: '#6b7280' }
                        ].filter(item => item.cantidad > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Resumen de rentabilidad */}
              <div style={{
                background: 'white',
                borderRadius: '1.5rem',
                padding: '2rem',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1e293b' }}>
                  💡 Resumen de Rentabilidad
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="estadistica-card-content">
                  <div style={{
                    padding: '1rem',
                    background: '#f1f5f9',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }} className="estadistica-item">
                    <span style={{ fontWeight: '600', color: '#475569' }} className="estadistica-label">Ingresos Brutos:</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }} className="estadistica-value">
                      Q{formatPrice(estadisticas.ingresosBrutos)}
                    </span>
                  </div>
                  <div style={{
                    padding: '1rem',
                    background: '#dcfce7',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }} className="estadistica-item">
                    <span style={{ fontWeight: '600', color: '#166534' }} className="estadistica-label">Ganancias Netas:</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#166534' }} className="estadistica-value">
                      Q{formatPrice(estadisticas.gananciasTotal)}
                    </span>
                  </div>
                  <div style={{
                    padding: '1rem',
                    background: '#fef3c7',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }} className="estadistica-item">
                    <span style={{ fontWeight: '600', color: '#92400e' }} className="estadistica-label">Margen de Ganancia:</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#92400e' }} className="estadistica-value">
                      {estadisticas.ingresosBrutos > 0 ?
                        `${((estadisticas.gananciasTotal / estadisticas.ingresosBrutos) * 100).toFixed(1)}%` :
                        '0%'
                      }
                    </span>
                  </div>
                  <div style={{
                    padding: '1rem',
                    background: '#e0e7ff',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }} className="estadistica-item">
                    <span style={{ fontWeight: '600', color: '#3730a3' }} className="estadistica-label">Venta Promedio:</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#3730a3' }} className="estadistica-value">
                      Q{estadisticas.totalVentas > 0 ? formatPrice(estadisticas.gananciasTotal / estadisticas.totalVentas) : '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Tabla de productos con bajo stock con scroll responsive */}
            {productos.filter(p => p.stock <= 5).length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: '1.5rem',
                padding: '2rem',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1e293b' }}>
                  ⚠️ Productos con Stock Bajo (≤ 5 unidades)
                </h3>
                <div className="tabla-responsive">
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: '700' }}>Producto</th>
                        <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: '700' }}>Stock</th>
                        <th style={{ padding: '1rem', textAlign: 'right', borderBottom: '2px solid #e2e8f0', fontWeight: '700' }}>Precio</th>
                        <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: '700' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productos
                        .filter(p => p.stock <= 5)
                        .sort((a, b) => a.stock - b.stock)
                        .slice(0, 10)
                        .map((producto) => (
                          <tr key={producto._id}>
                            <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: '600' }}>{producto.nombre}</td>
                            <td style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '0.5rem',
                                background: producto.stock === 0 ? '#fee2e2' : producto.stock <= 3 ? '#fef3c7' : '#dcfce7',
                                color: producto.stock === 0 ? '#dc2626' : producto.stock <= 3 ? '#d97706' : '#16a34a',
                                fontWeight: '600'
                              }}>
                                {producto.stock}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>
                              Q{formatPrice(producto.precio)}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                              {producto.stock === 0 ? '🔴 Agotado' : producto.stock <= 3 ? '🟡 Crítico' : '🟢 Bajo'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={priceVentaStyle}>Venta: Q{formatPrice(producto.precioVenta)} c/u</span>
                                {producto.tieneConjunto && (
                                  <span style={{
                                    fontSize: '12px',
                                    color: '#059669',
                                    fontWeight: '500',
                                    background: '#ecfdf5',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    display: 'inline-block'
                                  }}>
                                    {producto.nombreConjunto}: Q{formatPrice(producto.precioConjunto)}
                                    ({producto.unidadesPorConjunto} uds)
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={tableCellStyle}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{
                                ...stockBadgeStyle,
                                background: producto.stock === 0 ? '#fef2f2' : '#f0fdf4',
                                color: producto.stock === 0 ? '#dc2626' : '#166534',
                                borderColor: producto.stock === 0 ? '#fecaca' : '#bbf7d0'
                              }}>
                                {producto.stock === 0 ? 'Sin stock' : `${producto.stock} unidades`}
                              </span>
                              {producto.tieneConjunto && Math.floor((producto.stock || 0) / (producto.unidadesPorConjunto || 1)) > 0 && (
                                <span style={{
                                  fontSize: '11px',
                                  color: '#6b7280',
                                  fontStyle: 'italic',
                                  padding: '2px 6px',
                                  background: '#f3f4f6',
                                  borderRadius: '4px',
                                  alignSelf: 'flex-start'
                                }}>
                                  + {Math.floor((producto.stock || 0) / (producto.unidadesPorConjunto || 1))} {producto.nombreConjunto?.toLowerCase() || 'conjunto'}(s)
                                </span>
                              )}
                            </div>
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
                <h3 style={emptyTitleStyle}>No hay pedidos registrados</h3>
                <p style={emptySubtitleStyle}>
                  Los pedidos de los clientes aparecerán aquí
                </p>
              </div>
            ) : (
              <div style={ordersCardsContainerStyle}>
                {orders.map((pedido) => {
                  // Detectar si tiene conjuntos
                  const tieneConjuntos = pedido.productos.some(prod =>
                    prod.tipoVenta === 'conjunto' ||
                    prod.nombreConjunto ||
                    (prod.nombreConjunto === 'Caja')
                  );

                  return (
                    <div key={pedido._id} style={orderCardStyle} className="fadeIn">
                      {/* Header del pedido */}
                      <div style={orderCardHeaderStyle}>
                        <div style={orderCardIdSectionStyle}>
                          <span style={orderIdBadgeStyle}>
                            #{pedido._id.slice(-8).toUpperCase()}
                          </span>
                          <span style={getStatusBadgeStyle(pedido.estado)}>
                            {pedido.estado === 'confirmado' ? 'Confirmado' :
                              pedido.estado === 'entregado' ? 'Entregado' :
                                pedido.estado === 'cancelado' ? 'Cancelado' : 'Pendiente'}
                          </span>
                        </div>
                        <div style={orderCardDateStyle}>
                          📅 {new Date(pedido.fecha).toLocaleDateString('es-ES')}
                          <br />
                          🕐 {new Date(pedido.fecha).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>

                      {/* Información del cliente */}
                      <div style={orderCardClientSectionStyle}>
                        <div style={orderCardClientHeaderStyle}>
                          <span style={orderCardClientIconStyle}>👤</span>
                          <span style={orderCardClientNameStyle}>
                            {pedido.userId?.nombre || 'N/A'}
                          </span>
                        </div>
                        <span style={orderCardClientEmailStyle}>
                          📧 {pedido.userId?.correo || 'N/A'}
                        </span>
                      </div>

                      {/* Productos */}
                      <div style={orderCardProductsSectionStyle}>
                        <h4 style={orderCardProductsHeaderStyle}>
                          📦 Productos ({pedido.productos.length})
                          {tieneConjuntos && (
                            <span style={orderCardConjuntosIndicatorStyle}>
                              🎁 Incluye conjuntos
                            </span>
                          )}
                        </h4>
                        <div style={orderCardProductsListStyle}>
                          {pedido.productos.map((prod, idx) => {
                            // Detectar si es conjunto
                            const esConjunto = prod.tipoVenta === 'conjunto' ||
                              prod.nombreConjunto ||
                              prod.nombreConjunto === 'Caja';

                            const productoOriginal = productos.find(p => p._id === prod.productId) || {};
                            const unidadesPorConjunto = prod.unidadesPorConjunto ||
                              productoOriginal.unidadesPorConjunto || 10;
                            const nombreConjunto = prod.nombreConjunto ||
                              productoOriginal.nombreConjunto || 'Caja';

                            return (
                              <div key={idx} style={orderCardProductItemStyle}>
                                <div style={orderCardProductInfoStyle}>
                                  <span style={orderCardProductNameStyle}>{prod.nombre}</span>
                                  <div style={orderCardProductQuantityContainerStyle}>
                                    {esConjunto ? (
                                      <>
                                        <span style={orderCardProductConjuntoStyle}>
                                          🎁 {prod.cantidadOriginal || Math.floor(prod.cantidad / unidadesPorConjunto)} {nombreConjunto}(s)
                                        </span>
                                        <span style={orderCardProductUnidadesStyle}>
                                          📦 {prod.cantidad} unidades totales ({unidadesPorConjunto} c/u)
                                        </span>
                                      </>
                                    ) : (
                                      <span style={orderCardProductUnidadesIndividualStyle}>
                                        📦 {prod.cantidad} unidades individuales
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div style={orderCardProductPriceStyle}>
                                  Q{formatPrice((prod.precioVenta || 0) * (prod.cantidadOriginal || prod.cantidad))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Total y acciones */}
                      {/* Total y acciones */}
                      <div style={orderCardFooterStyle}>
                        <div style={orderCardTotalSectionStyle}>
                          <div style={orderCardTotalStyle}>
                            <strong>Total: Q{formatPrice(pedido.total)}</strong>
                          </div>
                          <div style={orderCardGananciaStyle}>
                            💰 Ganancia: Q{formatPrice(pedido.gananciaTotal || 0)}
                          </div>
                        </div>
                        <div style={orderCardActionsSectionStyle}>
                          {/* Combo box para cambiar estado */}
                          <div style={orderCardStatusSectionStyle}>
                            <label style={orderCardStatusLabelStyle}>Estado:</label>
                            <select
                              value={pedido.estado}
                              onChange={(e) => handleUpdateOrderStatus(pedido._id, e.target.value)}
                              style={orderCardStatusSelectStyle}
                              disabled={pedido.estado === 'entregado' || pedido.estado === 'cancelado'}
                            >
                              <option value="pendiente">⏳ Pendiente</option>
                              <option value="confirmado">✅ Confirmado</option>
                              <option value="entregado">📦 Entregado</option>
                              <option value="cancelado">❌ Cancelado</option>
                            </select>
                          </div>

                          {/* Botón de eliminar */}
                          <button
                            onClick={() => handleDeleteOrder(pedido._id)}
                            style={orderCardDeleteButtonStyle}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {orders.length > 0 && (
              <Pagination
                currentPage={ordersPagination.currentPage}
                totalPages={ordersPagination.totalPages}
                hasNextPage={ordersPagination.hasNextPage}
                hasPrevPage={ordersPagination.hasPrevPage}
                onPageChange={handleOrdersPageChange}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== TODOS LOS ESTILOS CSS =====
// Estilos para el combo box de estados
const orderCardStatusSectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  minWidth: '140px'
};

const orderCardStatusLabelStyle = {
  fontSize: '0.8rem',
  fontWeight: '600',
  color: '#374151'
};

const orderCardStatusSelectStyle = {
  padding: '8px 12px',
  fontSize: '0.85rem',
  fontWeight: '600',
  border: '2px solid #e5e7eb',
  borderRadius: '8px',
  backgroundColor: 'white',
  color: '#374151',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
};



// Estilos responsive para pedidos
const ordersCardsContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  marginBottom: '2rem'
};


const orderCardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid #f3f4f6',
  flexWrap: 'wrap',
  gap: '1rem'
};

const orderCardIdSectionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  flexWrap: 'wrap'
};

const orderIdBadgeStyle = {
  fontFamily: 'monospace',
  fontSize: '0.9rem',
  fontWeight: '700',
  color: '#6366f1',
  backgroundColor: '#f0f9ff',
  padding: '6px 12px',
  borderRadius: '8px',
  border: '1px solid #dbeafe'
};

const orderCardDateStyle = {
  fontSize: '0.85rem',
  color: '#6b7280',
  textAlign: 'right',
  lineHeight: '1.3'
};

const orderCardClientSectionStyle = {
  marginBottom: '1.5rem',
  padding: '1rem',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  border: '1px solid #f3f4f6'
};

const orderCardClientHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '0.5rem'
};

const orderCardClientIconStyle = {
  fontSize: '1.2rem'
};

const orderCardClientNameStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: '#1f2937'
};

const orderCardClientEmailStyle = {
  fontSize: '0.85rem',
  color: '#1f2937'
};

const orderCardProductsSectionStyle = {
  marginBottom: '1.5rem'
};

const orderCardProductsHeaderStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: '#1f2937',
  marginBottom: '1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  flexWrap: 'wrap'
};

const orderCardConjuntosIndicatorStyle = {
  fontSize: '0.8rem',
  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '6px',
  fontWeight: '600'
};

const orderCardProductsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
};

const orderCardProductItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: '1rem',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  gap: '1rem'
};

const orderCardProductInfoStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const orderCardProductNameStyle = {
  fontSize: '0.95rem',
  fontWeight: '600',
  color: '#1f2937'
};

const orderCardProductQuantityContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px'
};

const orderCardProductConjuntoStyle = {
  fontSize: '0.85rem',
  fontWeight: '600',
  color: '#8b5cf6'
};

const orderCardProductUnidadesStyle = {
  fontSize: '0.75rem',
  color: '#1f2937'
};

const orderCardProductUnidadesIndividualStyle = {
  fontSize: '0.85rem',
  fontWeight: '600',
  color: '#059669'
};

const orderCardProductPriceStyle = {
  fontSize: '0.9rem',
  fontWeight: '700',
  color: '#059669',
  textAlign: 'right'
};

const orderCardFooterStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  paddingTop: '1rem',
  borderTop: '1px solid #f3f4f6',
  gap: '1rem',
  flexWrap: 'wrap'
};

const orderCardTotalSectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
};

const orderCardTotalStyle = {
  fontSize: '1.1rem',
  fontWeight: '700',
  color: '#1f2937'
};

const orderCardGananciaStyle = {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: '#22c55e'
};

const orderCardActionsSectionStyle = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap'
};

const orderCardDeliverButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '8px 16px',
  fontSize: '0.85rem',
  fontWeight: '600',
  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
};

const orderCardDeleteButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '8px 16px',
  fontSize: '0.85rem',
  fontWeight: '600',
  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
};



// Estilos para filtros y grupos
const filtroGroupRedesignedStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
};

const selectFiltroRedesignedStyle = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '0.9rem',
  backgroundColor: 'white',
  color: '#374151'
};

// Estilos para tabla de estadísticas
const estadisticasTableContainerRedesignedStyle = {
  background: 'white',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  border: '1px solid #e5e7eb',
  marginBottom: '2rem'
};

const estadisticasTableTitleRedesignedStyle = {
  fontSize: '1.2rem',
  fontWeight: '700',
  color: '#1f2937',
  marginBottom: '1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const estadisticasTableWrapperRedesignedStyle = {
  overflowX: 'auto'
};

const estadisticasTableRedesignedStyle = {
  width: '100%',
  borderCollapse: 'collapse'
};

const estadisticasTableHeaderRedesignedStyle = {
  backgroundColor: '#f9fafb'
};

const estadisticasTableHeaderCellRedesignedStyle = {
  padding: '12px',
  textAlign: 'left',
  fontWeight: '600',
  color: '#1f2937',
  fontSize: '0.9rem',
  borderBottom: '1px solid #e5e7eb'
};

const estadisticasTableRowRedesignedStyle = {
  borderBottom: '1px solid #f3f4f6'
};

const estadisticasTableCellRedesignedStyle = {
  padding: '12px',
  fontSize: '0.9rem',
  color: '#1f2937'
};


// Función para badge de estado (para pedidos)
const getStatusBadgeStyle = (estado) => {
  const baseStyle = {
    fontSize: '0.8rem',
    fontWeight: '600',
    padding: '4px 8px',
    borderRadius: '6px',
    textTransform: 'capitalize'
  };

  switch (estado) {
    case 'confirmado':
      return { ...baseStyle, background: '#dbeafe', color: '#1e40af' };
    case 'entregado':
      return { ...baseStyle, background: '#dcfce7', color: '#166534' };
    case 'cancelado':
      return { ...baseStyle, background: '#fee2e2', color: '#dc2626' };
    default:
      return { ...baseStyle, background: '#f3f4f6', color: '#6b7280' };
  }
};

// Estilos para información de cliente y pedido


const dateStyle = {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: '#374151'
};

const timeStyle = {
  fontSize: '0.8rem',
  color: '#1f2937',
  display: 'block',
  marginTop: '2px'
};

const actionButtonsStyle = {
  display: 'flex',
  gap: '8px',
  flexDirection: 'column'
};

const deliverButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '6px 12px',
  fontSize: '0.8rem',
  fontWeight: '600',
  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer'
};




// Estilos faltantes para corregir los errores
const profitStyle = {
  fontSize: '0.8rem',
  color: '#22c55e',
  fontWeight: '600',
  marginTop: '4px',
  display: 'block'
};

const filtrosEstadisticasRedesignedStyle = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'center'
};

const historialMetaRedesignedStyle = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'center',
  fontSize: '0.85rem',
  color: '#1f2937',
  marginTop: '4px'
};


const historialFechaRedesignedStyle = {
  fontSize: '0.85rem',
  color: '#1f2937'
};

const historialClienteRedesignedStyle = {
  fontSize: '0.85rem',
  color: '#1f2937'
};

const historialTotalesRedesignedStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '4px'
};

const historialTotalRedesignedStyle = {
  fontSize: '1.3rem',
  fontWeight: '800',
  color: '#1f2937'
};

const historialGananciaRedesignedStyle = {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: '#22c55e'
};

const historialProductosContainerRedesignedStyle = {
  marginBottom: '1rem'
};

const historialProductosTitleRedesignedStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: '#1f2937',
  marginBottom: '0.75rem'
};

const historialProductosListRedesignedStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
};

const historialProductoRedesignedStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: '0.75rem',
  background: '#f9fafb',
  borderRadius: '8px',
  border: '1px solid #f3f4f6'
};

const historialProductoNombreRedesignedStyle = {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: '#1f2937',
  marginBottom: '4px'
};

const historialResumenRedesignedStyle = {
  display: 'flex',
  gap: '2rem',
  paddingTop: '1rem',
  borderTop: '1px solid #f3f4f6'
};

const historialResumenItemRedesignedStyle = {
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center'
};

const historialResumenLabelRedesignedStyle = {
  fontSize: '0.85rem',
  color: '#1f2937',
  fontWeight: '500'
};

const historialResumenValueRedesignedStyle = {
  fontSize: '0.85rem',
  fontWeight: '600',
  color: '#1f2937'
};

const historialResumenGananciaRedesignedStyle = {
  fontSize: '0.85rem',
  fontWeight: '600',
  color: '#22c55e'
};







// Estilos adicionales para la lógica de conjuntos
const quantityStatsContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px'
};

const quantityStatsMainStyle = {
  fontSize: '1.1rem',
  fontWeight: '700',
  color: '#1f2937'
};

const quantityStatsLabelStyle = {
  fontSize: '0.75rem',
  color: '#1f2937',
  fontWeight: '500'
};

const productNameStatsStyle = {
  fontWeight: '600',
  color: '#1f2937',
  fontSize: '0.9rem'
};

const rankingNumberStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  backgroundColor: '#f3f4f6',
  color: '#1f2937',
  borderRadius: '50%',
  fontSize: '0.8rem',
  fontWeight: '600'
};

const revenueStatsStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: '#059669'
};

const historialProductoDetallesRedesignedStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px'
};

const historialProductoCantidadRedesignedStyle = {
  fontSize: '0.85rem',
  fontWeight: '600',
  color: '#1f2937'
};

const historialProductoUnidadesRedesignedStyle = {
  fontSize: '0.75rem',
  color: '#1f2937',
  fontStyle: 'italic'
};

const historialProductoPreciosRedesignedStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '2px'
};

const historialProductoPrecioUnitarioRedesignedStyle = {
  fontSize: '0.75rem',
  color: '#1f2937'
};

const historialProductoInfoRedesignedStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  flex: 1
};



const pageWrapperStyle = {
  minHeight: '100vh',
  background: 'var(--gradient-background)',
  fontFamily: 'var(--font-sans)',
  paddingBottom: '2rem',
  paddingTop: '100px'
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
  animation: 'fadeIn 0.5s ease-out',
  height: '100%',  // Agregar si no está
  overflow: 'hidden'  // Agregar si no está
};

// Estilos del Dashboard
const dashboardGridStyle = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: '2rem',
  '@media (max-width: 768px)': {
    gridTemplateColumns: '1fr',
    gap: '1rem'
  }
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
  gap: '1.5rem',
  '@media (max-width: 768px)': {
    gridTemplateColumns: '1fr',
    gap: '1rem'
  }
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
  lineHeight: 1,
  wordBreak: 'break-all', // Para números largos
  '@media (max-width: 768px)': {
    fontSize: '1.5rem'
  }
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

// NUEVO - Estilos responsive para pedidos
const orderCardMobileStyle = {
  background: 'white',
  borderRadius: '1rem',
  padding: '1rem',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)',
  marginBottom: '1rem'
};

const orderHeaderMobileStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  marginBottom: '1rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid var(--neutral-200)'
};

const orderInfoRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.875rem'
};

const orderProductsMobileStyle = {
  marginBottom: '1rem'
};


const orderActionsMobileStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
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
  transition: 'all 0.2s ease',
  color: '#1f2937'
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
// REEMPLAZA tus estilos de estadísticas actuales con estos:

// Estilos básicos para estadísticas (sin media queries)
const estadisticasContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem'
};

// Eliminar las media queries de estos objetos JavaScript
const estadisticasMetricsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '2rem'
  // Quitar la media query - ahora está en CSS
};

const estadisticaCardStyle = {
  background: 'white',
  borderRadius: '1rem',
  padding: '2rem',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)',
  transition: 'all 0.3s ease'
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

// Eliminar las media queries de este objeto también
const tipoVentasGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '2rem'
  // Quitar la media query - ahora está en CSS
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

// Estilos específicos del rediseño de pedidos
const ordersContainerRedesignedStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '1.5rem',
};

const orderCardRedesignedStyle = {
  background: 'white',
  borderRadius: '1.5rem',
  padding: '2rem',
  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  transition: 'all 0.3s ease',
};

const orderHeaderRedesignedStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const orderIdRedesignedStyle = {
  fontSize: '1.125rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
};

const orderBodyRedesignedStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  paddingBottom: '1.5rem',
  borderBottom: '1px solid var(--neutral-200)',
};

const orderDetailRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const orderLabelStyle = {
  fontSize: '0.875rem',
  fontWeight: '500',
  color: 'var(--neutral-600)',
};

const orderValueStyle = {
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'var(--neutral-800)',
  textAlign: 'right',
  wordBreak: 'break-all',
};

const orderTotalRedesignedStyle = {
  fontSize: '1.25rem',
  fontWeight: '800',
  color: 'var(--primary-600)',
};

const orderProductsRedesignedStyle = {
  background: 'var(--neutral-50)',
  padding: '1rem',
  borderRadius: '1rem',
  border: '1px solid var(--neutral-200)',
};

const productsHeaderRedesignedStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'var(--neutral-700)',
  marginBottom: '0.75rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const productListRedesignedStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const orderProductItemRedesignedStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.5rem 0.75rem',
  background: 'white',
  borderRadius: '0.5rem',
  border: '1px solid var(--neutral-200)',
};

const productNameRedesignedStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-700)',
  fontWeight: '500',
};

const orderActionsRedesignedStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  marginTop: '0.5rem',
};

const statusSelectRedesignedStyle = (estado) => ({
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '0.75rem',
  border: '1px solid var(--neutral-300)',
  background: 'white',
  color: 'var(--neutral-700)',
  fontSize: '0.875rem',
  fontWeight: '500',
  transition: 'all 0.2s ease',
  opacity: (estado === 'cancelado' || estado === 'entregado') ? 0.6 : 1,
  cursor: (estado === 'cancelado' || estado === 'entregado') ? 'not-allowed' : 'pointer',
});

// Estilos específicos para Historial y Estadísticas
const historialContainerRedesignedStyle = {
  background: 'white',
  borderRadius: '1.5rem',
  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)',
  overflow: 'hidden'
};

const sectionHeaderRedesignedStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1.5rem 2rem',
  background: 'white',
  borderBottom: '1px solid var(--neutral-200)',
  gap: '1rem',
};

const sectionTitleRedesignedStyle = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  margin: 0
};

const historialStatsRedesignedStyle = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'center',
  fontSize: '0.875rem',
  color: 'var(--neutral-600)',
  flexWrap: 'wrap',
};

const historialStatRedesignedStyle = {
  whiteSpace: 'nowrap',
};

const historialListRedesignedStyle = {
  padding: '2rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

const historialItemRedesignedStyle = {
  background: 'var(--neutral-50)',
  borderRadius: '1.5rem',
  padding: '2rem',
  border: '1px solid var(--neutral-200)',
  transition: 'all 0.3s ease',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

const historialHeaderRedesignedStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  alignItems: 'flex-start',
  paddingBottom: '1.5rem',
  borderBottom: '1px solid var(--neutral-200)',
  '@media (min-width: 768px)': {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
};

const historialInfoRedesignedStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const historialIdTitleRedesignedStyle = {
  fontSize: '1.25rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

const tipoVentaBadgeRedesignedStyle = (tipo) => ({
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

const historialIdRedesignedStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-600)',
  fontWeight: '500',
};

const historialDateRedesignedStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-600)',
  fontWeight: '500',
};

const historialTotalsRedesignedStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '0.5rem',
};

const historialTotalRowRedesignedStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const historialTotalLabelRedesignedStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'var(--neutral-700)',
};

const historialTotalAmountRedesignedStyle = {
  fontSize: '1.5rem',
  fontWeight: '800',
  color: 'var(--primary-600)',
};

const historialGananciaRowRedesignedStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const historialGananciaLabelRedesignedStyle = {
  fontSize: '0.875rem',
  fontWeight: '500',
  color: 'var(--neutral-600)',
};

const historialGananciaAmountRedesignedStyle = {
  fontSize: '1rem',
  fontWeight: '700',
  color: '#22c55e',
};

const historialBodyRedesignedStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '1.5rem',
  '@media (min-width: 768px)': {
    gridTemplateColumns: '1fr 2fr',
  },
};

const historialClientDetailsRedesignedStyle = {
  background: 'white',
  padding: '1.5rem',
  borderRadius: '1rem',
  border: '1px solid var(--neutral-200)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const historialDetailsTitleRedesignedStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'var(--neutral-800)',
  marginBottom: '0.5rem',
  paddingBottom: '0.5rem',
  borderBottom: '1px solid var(--neutral-200)',
};

const historialDetailsContentRedesignedStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  fontSize: '0.875rem',
  color: 'var(--neutral-600)',
};

const historialProductDetailsRedesignedStyle = {
  background: 'white',
  padding: '1.5rem',
  borderRadius: '1rem',
  border: '1px solid var(--neutral-200)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const historialProductListRedesignedStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const historialProductItemRedesignedStyle = {
  display: 'flex',
  flexDirection: 'column',
  padding: '0.75rem',
  background: 'var(--neutral-50)',
  borderRadius: '0.75rem',
  border: '1px solid var(--neutral-200)',
  gap: '0.5rem',
};

const productInfoRowRedesignedStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const productNameHistorialRedesignedStyle = {
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'var(--neutral-700)',
};

const productQuantityHistorialRedesignedStyle = {
  fontSize: '0.875rem',
  color: 'var(--primary-600)',
  fontWeight: '600',
};

const productPricingRowRedesignedStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.75rem',
  color: 'var(--neutral-500)',
};

const productPriceHistorialRedesignedStyle = {
  fontStyle: 'italic',
};

const productSubtotalHistorialRedesignedStyle = {
  fontWeight: '600',
};

// Estilos de Estadísticas
const estadisticasContainerRedesignedStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem',
};

const estadisticasHeaderRedesignedStyle = {
  background: 'white',
  borderRadius: '1.5rem',
  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)',
  padding: '2rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

const estadisticasTitleSectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const periodoInfoRedesignedStyle = {
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'var(--primary-700)',
  background: 'var(--primary-50)',
  padding: '0.5rem 1rem',
  borderRadius: '0.75rem',
  border: '1px solid var(--primary-200)',
  alignSelf: 'flex-start',
};

const filtrosContainerRedesignedStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '1.5rem',
};

const filtrosGrupoRedesignedStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const labelFiltroRedesignedStyle = {
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'var(--neutral-700)',
};

const botonesFiltroRedesignedStyle = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

const botonFiltroRedesignedStyle = (isActive) => ({
  padding: '0.75rem 1.25rem',
  borderRadius: '0.75rem',
  border: '1px solid',
  borderColor: isActive ? 'transparent' : 'var(--neutral-300)',
  background: isActive ? 'var(--gradient-primary)' : 'white',
  color: isActive ? 'white' : 'var(--neutral-700)',
  cursor: 'pointer',
  fontWeight: '600',
  transition: 'all 0.2s ease',
  boxShadow: isActive ? '0 4px 12px rgba(236, 72, 153, 0.3)' : 'none',
});

const inputFiltroRedesignedStyle = {
  padding: '0.75rem 1rem',
  borderRadius: '0.75rem',
  border: '1px solid var(--neutral-300)',
  background: 'white',
  color: 'var(--neutral-700)',
  fontSize: '0.875rem',
  fontWeight: '500',
};

const estadisticasMetricsRedesignedStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '2rem',
};

const estadisticaCardRedesignedStyle = {
  background: 'white',
  borderRadius: '1.5rem',
  padding: '2rem',
  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)',
};

const estadisticaCardTitleRedesignedStyle = {
  fontSize: '1.25rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  marginBottom: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
};

const estadisticaCardContentRedesignedStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const estadisticaItemRedesignedStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem 1rem',
  background: 'var(--neutral-50)',
  borderRadius: '0.75rem',
  border: '1px solid var(--neutral-200)',
};

const estadisticaLabelRedesignedStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-600)',
  fontWeight: '500',
};

const estadisticaValueRedesignedStyle = {
  fontSize: '1.125rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
};

const graficasContainerRedesignedStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '2rem',
  '@media (min-width: 1024px)': {
    gridTemplateColumns: '1fr 1fr',
  },
};

const graficaCardRedesignedStyle = {
  background: 'white',
  borderRadius: '1.5rem',
  padding: '2rem',
  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)',
};

const graficaTitleRedesignedStyle = {
  fontSize: '1.25rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  marginBottom: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
};

const graficaContentRedesignedStyle = {
  minHeight: '300px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

const chartContainerRedesignedStyle = {
  display: 'flex',
  alignItems: 'end',
  gap: '1rem',
  width: '100%',
  height: '280px',
  padding: '1rem 0',
  overflowX: 'auto',
};

const chartBarGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.5rem',
  minWidth: '60px',
  flexShrink: 0,
};

const chartBarsContainerStyle = {
  display: 'flex',
  alignItems: 'end',
  gap: '8px',
  height: '200px',
};

const chartBarRedesignedStyle = {
  width: '20px',
  borderRadius: '4px 4px 0 0',
  minHeight: '2px',
  transition: 'all 0.3s ease',
};

const chartLabelRedesignedStyle = {
  fontSize: '0.75rem',
  color: 'var(--neutral-600)',
  textAlign: 'center',
  fontWeight: '500',
  transform: 'rotate(-15deg)',
  whiteSpace: 'nowrap',
};

const topProductsChartRedesignedStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  width: '100%',
};

const productChartItemRedesignedStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
  padding: '1rem',
  background: 'var(--neutral-50)',
  borderRadius: '1rem',
  border: '1px solid var(--neutral-200)',
};

const productRankRedesignedStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
  color: 'white',
  borderRadius: '50%',
  fontSize: '1rem',
  fontWeight: '700',
  flexShrink: 0,
};

const productInfoRedesignedStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const productNameChartRedesignedStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'var(--neutral-800)',
};

const productBarContainerRedesignedStyle = {
  height: '10px',
  background: 'var(--neutral-200)',
  borderRadius: '5px',
  overflow: 'hidden',
  width: '100%',
};

const productBarRedesignedStyle = {
  height: '100%',
  borderRadius: '5px',
  transition: 'width 0.8s ease',
};

const productQuantityRedesignedStyle = {
  fontSize: '1rem',
  fontWeight: '700',
  color: 'var(--primary-600)',
  textAlign: 'right',
  flexShrink: 0,
};

const historialCardStyle = {
  background: 'white',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  border: '1px solid #e5e7eb'
};

const historialCardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid #f3f4f6'
};

const historialCardIdStyle = {
  fontFamily: 'monospace',
  fontSize: '0.9rem',
  fontWeight: '700',
  color: '#6366f1'
};

const historialCardInfoStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '1rem',
  fontSize: '0.85rem',
  color: '#6b7280'
};

const historialCardClientStyle = {
  color: '#374151'
};

const historialCardDateStyle = {
  color: '#6b7280'
};

const historialCardProductosStyle = {
  marginBottom: '1rem'
};

const historialCardProductosTitleStyle = {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: '#374151',
  marginBottom: '0.5rem'
};

const historialCardProductoStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: '0.75rem',
  background: '#f9fafb',
  borderRadius: '6px',
  marginBottom: '0.5rem'
};

const historialCardProductoInfoStyle = {
  flex: 1
};

const historialCardProductoNombreStyle = {
  fontSize: '0.85rem',
  fontWeight: '600',
  color: '#1f2937',
  display: 'block',
  marginBottom: '0.25rem'
};

const historialCardProductoCantidadStyle = {
  fontSize: '0.8rem',
  color: '#6b7280'
};

const historialCardProductoPrecioStyle = {
  fontSize: '0.85rem',
  fontWeight: '700',
  color: '#059669'
};

const historialCardTotalesStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: '1rem',
  borderTop: '1px solid #f3f4f6'
};

const historialCardTotalStyle = {
  fontSize: '1rem',
  fontWeight: '700',
  color: '#1f2937'
};

const historialCardGananciaStyle = {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: '#22c55e'
};

// REEMPLAZA tu styleSheet.innerText actual con esto:
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideInDown { from { opacity:0; transform: translateY(-16px);} to { opacity:1; transform: translateY(0);} }
  .fadeIn { animation: fadeIn 0.7s; }
  
  /* Estilos para historial responsive cards */
  .historial-responsive-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  /* NUEVOS ESTILOS PARA ESTADÍSTICAS RESPONSIVE */
  .estadisticas-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .estadisticas-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }
  
  .tipo-ventas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }
  
  @media (max-width: 768px) {
    /* Header fix para menú hamburguesa */
    header {
      display: block !important;
    }
    
    header * {
      max-width: none !important;
    }
    
    header button {
      display: flex !important;
      opacity: 1 !important;
      visibility: visible !important;
    }
    
    header button div {
      display: block !important;
      opacity: 1 !important;
      visibility: visible !important;
    }

    /* Admin Panel responsive */
    .responsive-table { min-width: 520px; }
    .responsive-card { padding: 1em 0.5em !important; }
    .section-header { flex-direction: column !important; gap: 1em !important; align-items: stretch !important; }
    .tabs-container { 
      overflow-x: auto !important;
      padding-bottom: 0.5rem !important;
    }
    .tab-button { 
      min-width: max-content !important;
      font-size: 0.85rem !important;
      padding: 0.75rem 1rem !important;
    }
    
    .admin-page-wrapper {
      padding-top: 70px !important;
      padding-left: 0.25rem !important;
      padding-right: 0.25rem !important;
    }
    
    /* Historial cards responsive */
    .historial-card {
      margin-bottom: 1rem !important;
      padding: 1rem !important;
    }
    
    .historial-card-header {
      flex-direction: column !important;
      gap: 0.5rem !important;
      align-items: flex-start !important;
    }
    
    .historial-card-info {
      flex-direction: column !important;
      gap: 0.5rem !important;
    }
    
    .historial-card-producto {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 0.5rem !important;
    }
    
    .historial-card-totales {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 0.5rem !important;
      text-align: left !important;
    }
    
    /* Stats container responsive */
    .stats-container {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 0.75rem !important;
    }
    
    .stat-card {
      padding: 0.75rem !important;
      text-align: center !important;
    }
    
    /* ESTADÍSTICAS RESPONSIVE - NUEVOS ESTILOS */
    .estadisticas-container {
      gap: 1.5rem !important;
      padding: 0.5rem !important;
    }
    
    .estadisticas-metrics {
      grid-template-columns: 1fr !important;
      gap: 1rem !important;
    }
    
    .tipo-ventas-grid {
      grid-template-columns: 1fr !important;
      gap: 1rem !important;
    }
    
    /* Ajustes para cards de estadísticas */
    .estadistica-card {
      padding: 1.5rem !important;
      border-radius: 1rem !important;
    }
    
    .estadistica-card-title {
      font-size: 1.125rem !important;
      margin-bottom: 1rem !important;
      text-align: center !important;
      flex-direction: column !important;
      gap: 0.5rem !important;
    }
    
    .estadistica-card-content {
      gap: 0.75rem !important;
    }
    
    .estadistica-item {
      padding: 0.625rem !important;
      flex-direction: column !important;
      text-align: center !important;
      gap: 0.25rem !important;
    }
    
    .estadistica-label {
      font-size: 0.8rem !important;
    }
    
    .estadistica-value {
      font-size: 1rem !important;
    }
    
    /* Gráficos responsive */
    .recharts-wrapper {
      min-width: 300px !important;
    }
    
    .recharts-responsive-container {
      min-height: 250px !important;
    }
    
    /* Scroll horizontal para gráficos */
    .grafico-scroll {
      overflow-x: auto !important;
      padding-bottom: 0.5rem !important;
    }
    
    .grafico-scroll::-webkit-scrollbar {
      height: 4px;
    }
    
    .grafico-scroll::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 2px;
    }
    
    .grafico-scroll::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 2px;
    }
  }
  
  @media (max-width: 480px) {
    .admin-page-wrapper {
      padding-top: 60px !important;
      padding-left: 0.125rem !important;
      padding-right: 0.125rem !important;
    }
    
    .tab-button {
      font-size: 0.8rem !important;
      padding: 0.6rem 0.8rem !important;
    }
    
    .historial-card {
      padding: 0.75rem !important;
      margin-bottom: 0.75rem !important;
    }
    
    .historial-card-header {
      margin-bottom: 0.75rem !important;
    }
    
    .historial-card-productos {
      margin-bottom: 0.75rem !important;
    }
    
    /* Stats en una sola columna para móviles pequeños */
    .stats-container {
      grid-template-columns: 1fr !important;
      gap: 0.5rem !important;
    }
    
    .stat-number {
      font-size: 1.5rem !important;
    }
    
    .stat-label {
      font-size: 0.8rem !important;
    }
    
    /* ESTADÍSTICAS MOBILE PEQUEÑO */
    .estadisticas-container {
      padding: 0.25rem !important;
      gap: 1rem !important;
    }
    
    .estadistica-card {
      padding: 1rem !important;
      border-radius: 0.75rem !important;
    }
    
    .estadistica-card-title {
      font-size: 1rem !important;
      margin-bottom: 0.75rem !important;
    }
    
    .estadistica-card-content {
      gap: 0.5rem !important;
    }
    
    .estadistica-item {
      padding: 0.5rem !important;
      border-radius: 0.5rem !important;
    }
    
    .estadistica-label {
      font-size: 0.75rem !important;
    }
    
    .estadistica-value {
      font-size: 0.9rem !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default AdminPanel;
// src/pages/AdminPanel.jsx - SISTEMA COMPLETO DE GESTIÓN ART MARY
import React, { useEffect, useState, useCallback } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Pagination from '../components/Pagination';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import PuntoDeVenta from '../components/admin/PuntoDeVenta';
import './AdminPanel.css'; // Importar los estilos

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
  const [filtroTemporal, setFiltroTemporal] = useState('mes');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [searchedTerm, setSearchedTerm] = useState('');
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

  const orderStatuses = ['listo_para_recoger', 'confirmado', 'entregado', 'cancelado'];

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
        `${producto.cantidadConjuntos || Math.floor(producto.cantidad / (producto.unidadesPorConjunto || 1))} ${producto.nombreConjunto || 'conjuntos'} (${producto.cantidad} unidades)` :
        `${producto.cantidad} unidades`
    };
  };

  // Obtener productos con paginación - USANDO RUTA ESPECÍFICA DE ADMIN
  const obtenerProductos = useCallback(async (page = 1, searchTerm = '') => {
    try {
      setIsLoadingProducts(true);

      // Primero intentamos con la ruta de admin específica
      const response = await axios.get('/productos/admin/todos');

      if (response.data && response.data.productos && Array.isArray(response.data.productos)) {
        // Filtrar por término de búsqueda localmente si existe
        let productos = response.data.productos;

        if (searchTerm) {
          productos = productos.filter(producto =>
            producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            producto.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        // Implementar paginación manual
        const limit = 10;
        const start = (page - 1) * limit;
        const end = start + limit;
        const productosPaginados = productos.slice(start, end);

        setProductos(productosPaginados);
        setProductsPagination({
          currentPage: page,
          totalPages: Math.ceil(productos.length / limit),
          totalProducts: productos.length,
          hasNextPage: end < productos.length,
          hasPrevPage: page > 1,
          limit: limit
        });
        setError('');
      } else {
        throw new Error('Formato de datos inválido para productos');
      }
    } catch (err) {
      console.error("Error al obtener productos:", err);
      setError('No se pudieron cargar los productos 😔');
      setProductos([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Obtener todos los pedidos
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
      setError('No se pudieron cargar los pedidos 😔');
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
      case 'listo_para_recoger': return '#3b82f6';
      case 'confirmado': return '#10b981';
      case 'entregado': return '#22c55e';
      case 'cancelado': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'listo_para_recoger': return '📦';
      case 'confirmado': return '✅';
      case 'entregado': return '🎉';
      case 'cancelado': return '❌';
      default: return '📋';
    }
  };

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
            (producto.cantidadOriginal * (producto.unidadesPorConjunto || 1)) :
            producto.cantidad
        }))
      }));

    return [...ventasFisicas, ...pedidosEntregados].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  };

  // Función para obtener ventas filtradas por período temporal
  const obtenerVentasFiltradas = () => {
    const todasLasVentas = obtenerTodasLasVentas();
    const hoy = new Date();
    const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const inicioDelaSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));
    const inicioDelMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    let fechaInicio;
    switch (filtroTemporal) {
      case 'dia':
        fechaInicio = inicioDelDia;
        break;
      case 'semana':
        fechaInicio = inicioDelaSemana;
        break;
      case 'mes':
        fechaInicio = inicioDelMes;
        break;
      default:
        fechaInicio = inicioDelMes;
    }

    return todasLasVentas.filter(venta => {
      const fechaVenta = new Date(venta.fecha);
      return fechaVenta >= fechaInicio;
    });
  };

  // Función para calcular estadísticas - CORREGIDA para usar todos los productos
  const calcularEstadisticas = () => {
    const hoy = new Date();
    const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    const ventasFiltradas = obtenerVentasFiltradas();
    const ventasHoy = ventasFiltradas.filter(v => {
      const fechaVenta = new Date(v.fecha);
      return fechaVenta >= inicioDelDia;
    }).length;

    let gananciasTotal = 0;
    let totalUnidadesVendidas = 0;
    let totalConjuntosVendidos = 0;

    ventasFiltradas.forEach(venta => {
      gananciasTotal += venta.gananciaTotal || 0;

      (venta.productos || []).forEach(prod => {
        const esConjunto = prod.tipoVenta === 'conjunto' || (prod.nombreConjunto && prod.unidadesPorConjunto);

        if (esConjunto) {
          const cantidadConjuntos = prod.cantidadOriginal || Math.floor(prod.cantidad / (prod.unidadesPorConjunto || 1));
          totalConjuntosVendidos += cantidadConjuntos;
          totalUnidadesVendidas += prod.cantidad;
        } else {
          totalUnidadesVendidas += prod.cantidad;
        }
      });
    });

    const ventasEsteMes = ventasFiltradas.filter(v => {
      const fechaVenta = new Date(v.fecha);
      return fechaVenta.getMonth() === hoy.getMonth() && fechaVenta.getFullYear() === hoy.getFullYear();
    }).length;

    // USAR todosLosProductos EN LUGAR DE productos para contar stock real
    const productosParaEstadisticas = todosLosProductos.length > 0 ? todosLosProductos : productos;

    return {
      totalVentas: ventasFiltradas.length,
      ventasHoy,
      ventasEsteMes,
      gananciasTotal,
      productosVendidos: totalUnidadesVendidas,
      totalConjuntosVendidos,
      productosEnStock: productosParaEstadisticas.filter(p => p.stock > 0).length,
      productosSinStock: productosParaEstadisticas.filter(p => p.stock === 0).length,
      ingresosBrutos: ventasFiltradas.reduce((acc, venta) => acc + (venta.total || 0), 0)
    };
  };

  // Función para badge de estado (para pedidos)
  const getStatusBadgeStyle = (estado) => {
    switch (estado) {
      case 'confirmado':
        return 'status-badge-base status-confirmado';
      case 'entregado':
        return 'status-badge-base status-entregado';
      case 'cancelado':
        return 'status-badge-base status-cancelado';
      default:
        return 'status-badge-base status-default';
    }
  };

  if (loading || isLoadingProducts || isLoadingOrders) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner-icon">⚙️</div>
        </div>
        <p className="loading-text">Cargando panel de administración...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.rol !== 'admin') {
    return (
      <div className="container">
        <div className="error-state">
          <div className="error-icon-container">
            <div className="error-icon">🚫</div>
          </div>
          <h2 className="error-title">Acceso Denegado</h2>
          <p className="error-subtitle">
            No tienes permisos de administrador para ver esta página.
          </p>
          <Link to="/productos" className="error-button">
            <span className="button-icon">🛍️</span>
            Volver al Catálogo
          </Link>
        </div>
      </div>
    );
  }

  const estadisticas = calcularEstadisticas();
  const todasLasVentas = obtenerTodasLasVentas();

  return (
    <div className="admin-page-wrapper">
      <br/><br/>
      {/* Hero Header */}
      <div className="hero-header">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-icon">⚙️</span>
            Sistema de Gestión Art Mary
          </h1>
          <p className="hero-subtitle">
            Panel completo de administración y punto de venta
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="main-content">
        {/* Mensajes de notificación */}
        {mensaje && (
          <div className="notification success">
            <span className="notification-icon">✅</span>
            {mensaje}
          </div>
        )}

        {error && (
          <div className="notification error">
            <span className="notification-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Navegación por pestañas */}
        <div className="tabs-container">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <span className="tab-icon">📊</span>
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('pos')}
            className={`tab-button ${activeTab === 'pos' ? 'active' : ''}`}
          >
            <span className="tab-icon">🏪</span>
            Punto de Venta
          </button>
          <button
            onClick={() => setActiveTab('productos')}
            className={`tab-button ${activeTab === 'productos' ? 'active' : ''}`}
          >
            <span className="tab-icon">📦</span>
            Productos ({productsPagination.totalProducts})
          </button>
          <button
            onClick={() => setActiveTab('pedidos')}
            className={`tab-button ${activeTab === 'pedidos' ? 'active' : ''}`}
          >
            <span className="tab-icon">📋</span>
            Pedidos ({ordersPagination.totalOrders})
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`tab-button ${activeTab === 'historial' ? 'active' : ''}`}
          >
            <span className="tab-icon">📈</span>
            Historial ({todasLasVentas.length})
          </button>
          <button
            onClick={() => setActiveTab('estadisticas')}
            className={`tab-button ${activeTab === 'estadisticas' ? 'active' : ''}`}
          >
            <span className="tab-icon">📊</span>
            Estadísticas
          </button>
        </div>

        {/* Contenido de las pestañas */}
        {activeTab === 'dashboard' && (
          <div className="tab-content fadeIn">
            {/* Dashboard Mejorado */}
            <div className="dashboard-hero">
              <h2 className="dashboard-title">
                📊 Dashboard Art Mary
              </h2>
              <p className="dashboard-subtitle">
                Panel de control y métricas de negocio
              </p>
            </div>

            {/* Filtros Temporales */}
            <div className="filtros-temporales-container">
              {['dia', 'semana', 'mes'].map((filtro) => (
                <button
                  key={filtro}
                  onClick={() => setFiltroTemporal(filtro)}
                  className={`filtro-temporal-btn ${filtroTemporal === filtro ? 'active' : ''}`}
                >
                  📅 {filtro === 'dia' ? 'Hoy' : filtro === 'semana' ? 'Esta Semana' : 'Este Mes'}
                </button>
              ))}
            </div>

            {/* Estadísticas en Cards */}
            <div className="estadisticas-container">
              <div className="estadisticas-metrics">
                <div className="estadistica-card">
                  <div className="estadistica-card-title">
                    <span>💰</span>
                    Ganancias
                  </div>
                  <div className="estadistica-card-content">
                    <div className="estadistica-item">
                      <span className="estadistica-label">Total</span>
                      <span className="estadistica-value">Q{formatPrice(estadisticas.gananciasTotal)}</span>
                    </div>
                    <div className="estadistica-item">
                      <span className="estadistica-label">Ingresos Brutos</span>
                      <span className="estadistica-value">Q{formatPrice(estadisticas.ingresosBrutos)}</span>
                    </div>
                  </div>
                </div>

                <div className="estadistica-card">
                  <div className="estadistica-card-title">
                    <span>📈</span>
                    Ventas
                  </div>
                  <div className="estadistica-card-content">
                    <div className="estadistica-item">
                      <span className="estadistica-label">Total Ventas</span>
                      <span className="estadistica-value">{estadisticas.totalVentas}</span>
                    </div>
                    <div className="estadistica-item">
                      <span className="estadistica-label">Hoy</span>
                      <span className="estadistica-value">{estadisticas.ventasHoy}</span>
                    </div>
                    <div className="estadistica-item">
                      <span className="estadistica-label">Este Mes</span>
                      <span className="estadistica-value">{estadisticas.ventasEsteMes}</span>
                    </div>
                  </div>
                </div>

                <div className="estadistica-card">
                  <div className="estadistica-card-title">
                    <span>📦</span>
                    Productos
                  </div>
                  <div className="estadistica-card-content">
                    <div className="estadistica-item">
                      <span className="estadistica-label">Unidades Vendidas</span>
                      <span className="estadistica-value">{estadisticas.productosVendidos}</span>
                    </div>
                    <div className="estadistica-item">
                      <span className="estadistica-label">Conjuntos Vendidos</span>
                      <span className="estadistica-value">{estadisticas.totalConjuntosVendidos}</span>
                    </div>
                    <div className="estadistica-item">
                      <span className="estadistica-label">En Stock</span>
                      <span className="estadistica-value">{estadisticas.productosEnStock}</span>
                    </div>
                    <div className="estadistica-item">
                      <span className="estadistica-label">Sin Stock</span>
                      <span className="estadistica-value">{estadisticas.productosSinStock}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen del período */}
            <div className="periodo-resumen">
              <h3 className="periodo-titulo">
                📊 Resumen del {filtroTemporal === 'dia' ? 'día' : filtroTemporal === 'semana' ? 'semana' : 'mes'}
              </h3>
              <p className="periodo-descripcion">
                Durante {filtroTemporal === 'dia' ? 'el día de hoy' : filtroTemporal === 'semana' ? 'esta semana' : 'este mes'} has vendido{' '}
                <strong>{estadisticas.totalConjuntosVendidos} conjuntos</strong> y{' '}
                <strong>{estadisticas.totalUnidadesVendidas} unidades</strong>, generando{' '}
                <strong>Q{formatPrice(estadisticas.gananciasTotal)}</strong> en ganancias netas.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'pos' && (
          <div className="tab-content fadeIn">
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

        {activeTab === 'productos' && (
          <div className="tab-content fadeIn">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-icon">📦</span>
                Gestión de Productos
              </h2>
              <Link to="/crear-producto" className="primary-button">
                <span className="button-icon">➕</span>
                Crear Producto
              </Link>
            </div>

            {/* Búsqueda de productos */}
            <div className="search-section">
              <div className="search-container">
                <div className="search-input-container">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Buscar productos por nombre o categoría..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        setSearchedTerm(productSearchTerm); // ← Guardar término
                        obtenerProductos(1, productSearchTerm);
                      }
                    }}
                    className="search-input"
                  />
                  {productSearchTerm && (
                    <button
                      onClick={() => {
                        setProductSearchTerm('');
                              }}
                      className="clear-search"
                    >
                      ✕
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSearchedTerm(productSearchTerm); // ← Guardar término
                      obtenerProductos(1, productSearchTerm);
                    }}
                    className="search-button"
                  >
                    Buscar
                  </button>
                </div>
              </div>
            </div>

            {productos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h3 className="empty-title">No hay productos</h3>
                <p className="empty-subtitle">
                  {searchedTerm ? // ← Cambiar de productSearchTerm a searchedTerm
                    `No se encontraron productos que coincidan con "${searchedTerm}"` :
                    'Comienza creando tu primer producto'
                  }
                </p>
                {!searchedTerm && ( // ← Cambiar de productSearchTerm a searchedTerm
                  <Link to="/crear-producto" className="primary-button">
                    <span className="button-icon">➕</span>
                    Crear Primer Producto
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="products-grid">
                  {productos.map((producto) => (
                    <div key={producto._id} className="product-card">
                      <div className="product-image-container">
                        {producto.imagenUrl ? (
                          <img
                            src={producto.imagenUrl}
                            alt={producto.nombre}
                            className="product-image"
                          />
                        ) : (
                          <div className="product-image-placeholder">
                            <span className="placeholder-icon">📷</span>
                          </div>
                        )}
                        <div className="product-stock-badge">
                          Stock: {producto.stock}
                        </div>
                      </div>

                      <div className="product-info">
                        <h3 className="product-name">{producto.nombre}</h3>
                        <p className="product-category">{producto.categoria}</p>

                        <div className="product-pricing">
                          <div className="product-price">
                            <span className="price-label">Precio Venta:</span>
                            <span className="price-value">Q{formatPrice(producto.precioVenta)}</span>
                          </div>
                          <div className="product-price">
                            <span className="price-label">Precio Compra:</span>
                            <span className="price-value">Q{formatPrice(producto.precioCompra)}</span>
                          </div>
                        </div>

                        {producto.nombreConjunto && (
                          <div className="product-set-info">
                            <span className="set-label">Conjunto:</span>
                            <span className="set-name">{producto.nombreConjunto}</span>
                            <span className="set-units">({producto.unidadesPorConjunto} unidades)</span>
                            <div className="set-price">
                              Precio conjunto: Q{formatPrice(producto.precioConjunto)}
                            </div>
                          </div>
                        )}

                        <div className="product-actions">
                          <button
                            onClick={() => handleEditProduct(producto._id)}
                            className="secondary-button"
                          >
                            <span className="button-icon">✏️</span>
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(producto._id)}
                            className="danger-button"
                          >
                            <span className="button-icon">🗑️</span>
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination
                  currentPage={productsPagination.currentPage}
                  totalPages={productsPagination.totalPages}
                  onPageChange={handleProductsPageChange}
                  hasNextPage={productsPagination.hasNextPage}
                  hasPrevPage={productsPagination.hasPrevPage}
                />
              </>
            )}
          </div>
        )}

        {activeTab === 'pedidos' && (
          <div className="tab-content fadeIn">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-icon">📋</span>
                Gestión de Pedidos
              </h2>
            </div>

            {orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3 className="empty-title">No hay pedidos</h3>
                <p className="empty-subtitle">Los pedidos aparecerán aquí cuando los clientes realicen compras.</p>
              </div>
            ) : (
              <>
                <div className="orders-list">
                  {orders.map((order) => (
                    <div key={order._id} className="order-card">
                      <div className="order-header">
                        <div className="order-info">
                          <h3 className="order-id">Pedido #{order._id.slice(-6)}</h3>
                          <div className="order-meta">
                            <span className="date-style">
                              {new Date(order.fecha).toLocaleDateString('es-ES')}
                            </span>
                            <span className="time-style">
                              {new Date(order.fecha).toLocaleTimeString('es-ES')}
                            </span>
                          </div>
                        </div>
                        <div className="order-status">
                          <span className={getStatusBadgeStyle(order.estado)}>
                            {getStatusIcon(order.estado)} {order.estado}
                          </span>
                        </div>
                      </div>

                      <div className="order-customer">
                        <p><strong>Cliente:</strong> {getUserInfo(order, 'nombre')}</p>
                        <p><strong>Email:</strong> {getUserInfo(order, 'correo')}</p>
                      </div>

                      <div className="order-products">
                        <h4>Productos:</h4>
                        {order.productos.map((producto, index) => (
                          <div key={index} className="order-product">
                            <span className="product-name">{producto.nombre}</span>
                            <span className="product-quantity">x{producto.cantidad}</span>
                            <span className="product-price">Q{formatPrice(producto.precioVenta)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="order-total">
                        <strong>Total: Q{formatPrice(order.total)}</strong>
                        <span className="profit-style">
                          Ganancia: Q{formatPrice(order.gananciaTotal)}
                        </span>
                      </div>
                      <div className="order-card-actions-section">
                        {order.estado !== 'entregado' && order.estado !== 'cancelado' && (
                          <>
                            {/* NUEVO: Botón para "Listo para entregar" */}
                            {order.estado !== 'listo_para_recoger' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order._id, 'listo_para_recoger')}
                                className="order-card-ready-button"
                              >
                                <span>📦</span>
                                Marcar como Listo para Entregar
                              </button>
                            )}

                            {/* Botón existente para entregar */}
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'entregado')}
                              className="order-card-deliver-button"
                            >
                              <span>🚚</span>
                              Marcar como Entregado
                            </button>

                            {/* Botón existente para cancelar */}
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'cancelado')}
                              className="order-card-delete-button"
                            >
                              <span>❌</span>
                              Cancelar Pedido
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination
                  currentPage={ordersPagination.currentPage}
                  totalPages={ordersPagination.totalPages}
                  onPageChange={handleOrdersPageChange}
                  hasNextPage={ordersPagination.hasNextPage}
                  hasPrevPage={ordersPagination.hasPrevPage}
                />
              </>
            )}
          </div>
        )}

        {activeTab === 'historial' && (
          <div className="tab-content fadeIn">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-icon">📈</span>
                Historial de Ventas
              </h2>
            </div>

            <div className="stats-container">
              <div className="stat-card">
                <span className="stat-number">{todasLasVentas.length}</span>
                <span className="stat-label">Total Ventas</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{estadisticas.productosVendidos}</span>
                <span className="stat-label">Unidades Vendidas</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{estadisticas.totalConjuntosVendidos}</span>
                <span className="stat-label">Conjuntos Vendidos</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">Q{formatPrice(estadisticas.gananciasTotal)}</span>
                <span className="stat-label">Ganancias</span>
              </div>
            </div>

            {todasLasVentas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📈</div>
                <h3 className="empty-title">No hay ventas registradas</h3>
                <p className="empty-subtitle">Las ventas aparecerán aquí cuando uses el punto de venta o se entreguen pedidos.</p>
              </div>
            ) : (
              <div className="historial-ventas">
                {todasLasVentas.map((venta, index) => (
                  <div key={venta._id || index} className="historial-card">
                    <div className="historial-card-header">
                      <div className="historial-info">
                        <h3 className="historial-id">
                          {venta.tipo === 'fisica' ? '🏪 Venta Física' : '🌐 Pedido Online'} #{(venta._id || '').slice(-6)}
                        </h3>
                        <div className="historial-meta-redesigned">
                          <span className="historial-fecha-redesigned">
                            {new Date(venta.fecha).toLocaleDateString('es-ES')}
                          </span>
                          <span className="historial-cliente-redesigned">
                            {venta.cliente?.nombre || venta.userId?.nombre || 'Cliente'}
                          </span>
                        </div>
                      </div>
                      <div className="historial-totales-redesigned">
                        <span className="historial-total-redesigned">
                          Q{formatPrice(venta.total)}
                        </span>
                        <span className="historial-ganancia-redesigned">
                          Ganancia: Q{formatPrice(venta.gananciaTotal)}
                        </span>
                      </div>
                    </div>

                    <div className="historial-productos-container-redesigned">
                      <h4 className="historial-productos-title-redesigned">Productos:</h4>
                      <div className="historial-productos-list-redesigned">
                        {(venta.productos || []).map((producto, prodIndex) => (
                          <div key={prodIndex} className="historial-producto-redesigned">
                            <div>
                              <div className="product-name-historial-redesigned">{producto.nombre}</div>
                              <div className="product-quantity-historial-redesigned">
                                Cantidad: {producto.cantidad}
                                {producto.esConjunto && (
                                  <span> ({producto.cantidadConjuntos} conjuntos)</span>
                                )}
                              </div>
                              <div className="product-price-historial-redesigned">
                                Precio unit.: Q{formatPrice(producto.precioVenta)}
                              </div>
                            </div>
                            <div className="product-subtotal-historial-redesigned">
                              Q{formatPrice(producto.precioVenta * producto.cantidad)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'estadisticas' && (
          <div className="tab-content fadeIn">
            <div className="estadisticas-container-redesigned">
              <div className="estadisticas-header-redesigned">
                <div className="estadisticas-title-section">
                  <h2 className="section-title">
                    <span className="section-icon">📊</span>
                    Estadísticas Avanzadas
                  </h2>
                  <div className="periodo-info-redesigned">
                    Período: {filtroTemporal === 'dia' ? 'Hoy' : filtroTemporal === 'semana' ? 'Esta Semana' : 'Este Mes'}
                  </div>
                </div>

                <div className="filtros-container-redesigned">
                  <div className="filtros-grupo-redesigned">
                    <label className="label-filtro-redesigned">Período de Tiempo</label>
                    <div className="botones-filtro-redesigned">
                      {['dia', 'semana', 'mes'].map((periodo) => (
                        <button
                          key={periodo}
                          onClick={() => setFiltroTemporal(periodo)}
                          className={`boton-filtro-redesigned ${filtroTemporal === periodo ? 'boton-filtro-active' : 'boton-filtro-inactive'}`}
                        >
                          {periodo === 'dia' ? 'Hoy' : periodo === 'semana' ? 'Esta Semana' : 'Este Mes'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla de estadísticas detalladas */}
              <div className="estadisticas-table-container-redesigned">
                <h3 className="estadisticas-table-title-redesigned">
                  <span>📈</span>
                  Métricas Detalladas
                </h3>
                <div className="estadisticas-table-wrapper-redesigned">
                  <table className="estadisticas-table-redesigned">
                    <thead className="estadisticas-table-header-redesigned">
                      <tr>
                        <th className="estadisticas-table-header-cell-redesigned">Métrica</th>
                        <th className="estadisticas-table-header-cell-redesigned">Valor</th>
                        <th className="estadisticas-table-header-cell-redesigned">Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="estadisticas-table-row-redesigned">
                        <td className="estadisticas-table-cell-redesigned">Total de Ventas</td>
                        <td className="estadisticas-table-cell-redesigned">{estadisticas.totalVentas}</td>
                        <td className="estadisticas-table-cell-redesigned">Número total de transacciones</td>
                      </tr>
                      <tr className="estadisticas-table-row-redesigned">
                        <td className="estadisticas-table-cell-redesigned">Ventas Hoy</td>
                        <td className="estadisticas-table-cell-redesigned">{estadisticas.ventasHoy}</td>
                        <td className="estadisticas-table-cell-redesigned">Transacciones realizadas hoy</td>
                      </tr>
                      <tr className="estadisticas-table-row-redesigned">
                        <td className="estadisticas-table-cell-redesigned">Ganancias Netas</td>
                        <td className="estadisticas-table-cell-redesigned">Q{formatPrice(estadisticas.gananciasTotal)}</td>
                        <td className="estadisticas-table-cell-redesigned">Ganancia después de costos</td>
                      </tr>
                      <tr className="estadisticas-table-row-redesigned">
                        <td className="estadisticas-table-cell-redesigned">Ingresos Brutos</td>
                        <td className="estadisticas-table-cell-redesigned">Q{formatPrice(estadisticas.ingresosBrutos)}</td>
                        <td className="estadisticas-table-cell-redesigned">Total de ingresos sin deducir costos</td>
                      </tr>
                      <tr className="estadisticas-table-row-redesigned">
                        <td className="estadisticas-table-cell-redesigned">Unidades Vendidas</td>
                        <td className="estadisticas-table-cell-redesigned">{estadisticas.productosVendidos}</td>
                        <td className="estadisticas-table-cell-redesigned">Total de unidades individuales vendidas</td>
                      </tr>
                      <tr className="estadisticas-table-row-redesigned">
                        <td className="estadisticas-table-cell-redesigned">Conjuntos Vendidos</td>
                        <td className="estadisticas-table-cell-redesigned">{estadisticas.totalConjuntosVendidos}</td>
                        <td className="estadisticas-table-cell-redesigned">Total de conjuntos/cajas vendidas</td>
                      </tr>
                      <tr className="estadisticas-table-row-redesigned">
                        <td className="estadisticas-table-cell-redesigned">Productos en Stock</td>
                        <td className="estadisticas-table-cell-redesigned">{estadisticas.productosEnStock}</td>
                        <td className="estadisticas-table-cell-redesigned">Productos con inventario disponible</td>
                      </tr>
                      <tr className="estadisticas-table-row-redesigned">
                        <td className="estadisticas-table-cell-redesigned">Productos Sin Stock</td>
                        <td className="estadisticas-table-cell-redesigned">{estadisticas.productosSinStock}</td>
                        <td className="estadisticas-table-cell-redesigned">Productos que necesitan reabastecimiento</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Gráficas */}
              <div className="graficas-container">
                <div className="grafica-card">
                  <h3 className="analisis-title">
                    <span>📈</span>
                    Tendencia de Ventas (Últimos 7 días)
                  </h3>
                  <div style={{ width: '100%', height: '300px' }}>
                    <ResponsiveContainer>
                      <LineChart data={obtenerDatosGrafica()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="ventas"
                          stroke="#8884d8"
                          strokeWidth={3}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grafica-card">
                  <h3 className="analisis-title">
                    <span>📊</span>
                    Distribución de Productos
                  </h3>
                  <div style={{ width: '100%', height: '300px' }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'En Stock', value: estadisticas.productosEnStock },
                            { name: 'Sin Stock', value: estadisticas.productosSinStock }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#22c55e" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
// src/pages/MisPedidos.jsx - LÓGICA DE CAJAS/UNIDADES CORREGIDA
import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function MisPedidos() {
  const { user, isAuthenticated, loading } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [pedidoAnimandose, setPedidoAnimandose] = useState(null);

  useEffect(() => {
    const obtenerMisPedidos = async () => {
      if (!isAuthenticated || !user) {
        setIsLoadingOrders(false);
        setError('Debes iniciar sesión para ver tus pedidos.');
        return;
      }

      try {
        setIsLoadingOrders(true);
        const response = await axios.get('/pedidos/mis-pedidos');
        setPedidos(response.data);
        setError('');
      } catch (err) {
        console.error("Error al obtener mis pedidos:", err);
        setError('No se pudieron cargar tus pedidos 😔');
        setPedidos([]);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    if (!loading) {
      obtenerMisPedidos();
    }
  }, [isAuthenticated, user, loading]);

  // 🔧 FUNCIÓN COMPLETAMENTE CORREGIDA para calcular información del pedido con lógica de cajas/unidades
  const calcularInfoPedido = (pedido) => {
    let totalUnidades = 0;
    let totalConjuntos = 0;
    let detalleItems = [];

    console.log('🔍 Analizando pedido:', pedido._id, pedido.productos);

    pedido.productos.forEach((item, index) => {
      console.log(`📦 Item ${index}:`, item);

      // ✅ DETECCIÓN MEJORADA: Verificar si es conjunto
      const esConjunto = item.tipoVenta === 'conjunto' ||
        (item.nombreConjunto && item.unidadesPorConjunto > 0);

      console.log(`${esConjunto ? '📦' : '🔢'} Es conjunto:`, esConjunto);

      if (esConjunto) {
        // 🔧 CÁLCULO COMPLETAMENTE CORREGIDO PARA CONJUNTOS
        const unidadesPorConjunto = Number(item.unidadesPorConjunto) || 1;

        // ✅ CLAVE: En el backend, para conjuntos, 'cantidad' representa el NÚMERO DE CAJAS/CONJUNTOS
        // NO las unidades totales como pensábamos antes
        const cantidadConjuntos = Number(item.cantidad) || 0; // ← Esta es la cantidad de CAJAS
        const cantidadTotal = cantidadConjuntos * unidadesPorConjunto; // ← Estas son las UNIDADES TOTALES

        console.log(`📦 Conjunto detectado:`, {
          nombre: item.nombre,
          cantidadConjuntos, // Número de cajas/conjuntos
          unidadesPorConjunto, // Unidades por caja
          cantidadTotal, // Total de unidades individuales
          nombreConjunto: item.nombreConjunto
        });

        totalConjuntos += cantidadConjuntos;
        totalUnidades += cantidadTotal;

        // 🔧 INFORMACIÓN DETALLADA PARA CONJUNTOS
        detalleItems.push({
          ...item,
          tipo: 'conjunto',
          cantidadMostrar: `${cantidadConjuntos} ${item.nombreConjunto || 'conjunto'}(s)`,
          unidadesTotales: cantidadTotal, // ✅ AHORA CORRECTO: Muestra las unidades totales
          cantidadConjuntos: cantidadConjuntos, // Número de cajas/conjuntos
          unidadesPorConjunto: unidadesPorConjunto,
          precioUnitarioReal: item.precioConjunto || (item.precioVenta * unidadesPorConjunto),
          // Precio por conjunto completo
          precioConjunto: item.precioConjunto || (item.precioVenta * unidadesPorConjunto)
        });

        console.log(`✅ Conjunto procesado: ${cantidadConjuntos} ${item.nombreConjunto || 'cajas'} × ${unidadesPorConjunto} unidades c/u = ${cantidadTotal} unidades totales`);

      } else {
        // 🔧 CÁLCULO PARA UNIDADES INDIVIDUALES (sin cambios)
        const cantidadUnidades = Number(item.cantidad) || 0;

        totalUnidades += cantidadUnidades;

        detalleItems.push({
          ...item,
          tipo: 'individual',
          cantidadMostrar: `${cantidadUnidades} unidad(es)`,
          unidadesTotales: cantidadUnidades,
          cantidadConjuntos: 0,
          precioUnitarioReal: item.precioVenta || 0
        });

        console.log(`🔢 Individual procesado: ${cantidadUnidades} unidades individuales`);
      }
    });

    const resultado = {
      totalUnidades,
      totalConjuntos,
      detalleItems,
      totalItems: pedido.productos.length
    };

    console.log('📊 Resultado final del pedido:', {
      totalItems: resultado.totalItems,
      totalConjuntos: resultado.totalConjuntos,
      totalUnidades: resultado.totalUnidades
    });

    return resultado;
  };


  const getClientStatusText = (status) => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente de Confirmación';
      case 'confirmado':
        return 'Confirmado, en Proceso';
      case 'listo_para_recoger':
        return 'Listo para Recoger';
      case 'enviado':
        return 'Enviado';
      case 'entregado':
        return 'Entregado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendiente':
        return '#f59e0b';
      case 'confirmado':
        return '#10b981';
      case 'listo_para_recoger':
        return '#3b82f6';
      case 'enviado':
        return '#8b5cf6';
      case 'entregado':
        return '#22c55e';
      case 'cancelado':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pendiente':
        return '⏳';
      case 'confirmado':
        return '✅';
      case 'listo_para_recoger':
        return '📦';
      case 'enviado':
        return '🚚';
      case 'entregado':
        return '🎉';
      case 'cancelado':
        return '❌';
      default:
        return '📋';
    }
  };

  const handleCancelOrder = async (orderId) => {
    const confirmCancel = window.confirm('¿Estás seguro de que quieres cancelar este pedido? Esta acción no se puede deshacer y el stock será devuelto.');
    if (!confirmCancel) {
      return;
    }

    try {
      setPedidoAnimandose(orderId);
      const response = await axios.delete(`/pedidos/${orderId}/cancelar-cliente`);
      setMensaje(response.data.mensaje || 'Pedido cancelado con éxito.');
      setError('');

      setTimeout(() => {
        setPedidos(prevPedidos =>
          prevPedidos.map(pedido =>
            pedido._id === orderId ? { ...pedido, estado: 'cancelado' } : pedido
          )
        );
        setPedidoAnimandose(null);
      }, 300);

      setTimeout(() => setMensaje(''), 5000);
    } catch (err) {
      console.error("Error al cancelar pedido:", err);
      setMensaje('');
      setError(err.response?.data?.mensaje || 'Error al cancelar el pedido.');
      setPedidoAnimandose(null);
      setTimeout(() => setError(''), 5000);
    }
  };

  if (loading || isLoadingOrders) {
    return (
      <div style={loadingContainerStyle}>
        <div style={loadingSpinnerStyle}>
          <div style={spinnerIconStyle}>📦</div>
        </div>
        <p style={loadingTextStyle}>Cargando tus pedidos...</p>
      </div>
    );
  }

  if (error && pedidos.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={errorStateStyle}>
          <div style={errorIconContainerStyle}>
            <div style={errorIconStyle}>😕</div>
          </div>
          <h2 style={errorTitleStyle}>No se pudieron cargar tus pedidos</h2>
          <p style={errorSubtitleStyle}>{error}</p>
          <Link to="/productos" className="error-button" style={errorButtonStyle}>
            <span style={buttonIconStyle}>🛍️</span>
            Volver al Catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Hero Header */}
      <br /><br /><br /><br />
      <div style={heroHeaderStyle}>
        <div style={heroContentStyle}>
          <h1 style={heroTitleStyle}>
            <span style={heroIconStyle}>📦</span>
            Mis Pedidos
          </h1>
          <p style={heroSubtitleStyle}>
            {(() => {
              const totalUnidades = pedidos.reduce((total, p) => {
                const info = calcularInfoPedido(p);
                return total + info.totalUnidades;
              }, 0);
              return `${pedidos.length} ${pedidos.length === 1 ? 'pedido' : 'pedidos'} • ${totalUnidades} unidades totales`;
            })()}
          </p>
        </div>
      </div>

      <div style={mainContentStyle}>
        {/* Mensajes de notificación */}
        {mensaje && (
          <div className="notification" style={{
            ...notificationStyle,
            background: mensaje.includes('éxito')
              ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)'
              : 'linear-gradient(135deg, #fef2f2, #fecaca)',
            color: mensaje.includes('éxito') ? '#166534' : '#991b1b'
          }}>
            <span style={notificationIconStyle}>
              {mensaje.includes('éxito') ? '✅' : '⚠️'}
            </span>
            {mensaje}
          </div>
        )}

        {error && (
          <div className="notification" style={{
            ...notificationStyle,
            background: 'linear-gradient(135deg, #fef2f2, #fecaca)',
            color: '#991b1b'
          }}>
            <span style={notificationIconStyle}>❌</span>
            {error}
          </div>
        )}

        {pedidos.length === 0 ? (
          <div style={emptyStateStyle}>
            <div style={emptyIconContainerStyle}>
              <div style={emptyIconStyle}>🛒</div>
            </div>
            <h3 style={emptyTitleStyle}>No tienes pedidos aún</h3>
            <p style={emptySubtitleStyle}>
              Cuando realices tu primer pedido, aparecerá aquí con todos los detalles.
            </p>
            <Link to="/productos" className="empty-button" style={emptyButtonStyle}>
              <span style={buttonIconStyle}>🛍️</span>
              Explorar Productos
            </Link>
          </div>
        ) : (
          <div style={ordersListStyle}>
            {pedidos.map((pedido, index) => (
              <div
                key={pedido._id}
                style={{
                  ...orderCardStyle,
                  ...(pedidoAnimandose === pedido._id ? orderAnimatingStyle : {}),
                  animationDelay: `${index * 100}ms`
                }}
                className="order-card animate-slideIn"
              >
                {/* Header del pedido */}
                <div style={orderHeaderStyle}>
                  <div style={orderInfoStyle}>
                    <h3 style={orderIdStyle}>
                      Pedido #{pedido._id.substring(0, 8)}
                    </h3>
                    <p style={orderDateStyle}>
                      {new Date(pedido.fecha).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div style={orderStatusContainerStyle}>
                    <div style={{
                      ...orderStatusStyle,
                      background: getStatusColor(pedido.estado),
                      color: 'white'
                    }}>
                      <span style={statusIconStyle}>{getStatusIcon(pedido.estado)}</span>
                      {getClientStatusText(pedido.estado)}
                    </div>
                  </div>
                </div>

                {/* 🔧 PRODUCTOS DEL PEDIDO CON LÓGICA CORREGIDA */}
                <div style={orderProductsStyle}>
                  <h4 style={productsHeaderStyle}>
                    <span style={productsIconStyle}>📦</span>
                    Productos ({pedido.productos.length})
                  </h4>
                  <div style={productListStyle}>
                    {(() => {
                      const infoPedido = calcularInfoPedido(pedido);
                      return infoPedido.detalleItems.map((producto, prodIndex) => (
                        <div key={prodIndex} style={productItemStyle}>
                          <div style={productImageContainerStyle}>
                            {producto.imagenUrl ? (
                              <img
                                src={producto.imagenUrl}
                                alt={producto.nombre}
                                style={productImageStyle}
                              />
                            ) : (
                              <div style={noImagePlaceholderStyle}>📷</div>
                            )}
                            {/* 🔧 BADGE DE CANTIDAD CORREGIDO */}
                            <div style={productQuantityBadgeStyle}>
                              {producto.tipo === 'conjunto' ?
                                `${producto.cantidadConjuntos} 📦` :
                                `${producto.unidadesTotales} 🔢`
                              }
                            </div>
                          </div>

                          <div style={productDetailsStyle}>
                            <h4 style={productNameStyle}>{producto.nombre}</h4>

                            {producto.tipo === 'conjunto' ? (
                              <div>
                                <div style={typeTagConjuntoStyle}>
                                  🗃️ {producto.nombreConjunto || 'Conjunto'}
                                </div>
                                <p style={productPriceStyle}>
                                  <strong>{producto.cantidadMostrar}</strong>
                                </p>
                                <p style={unitsDetailStyle}>
                                  ({producto.unidadesTotales} unidades totales)
                                </p>
                                <p style={productPriceStyle}>
                                  Q{producto.precioConjunto?.toFixed(2)} por {producto.nombreConjunto}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <div style={typeTagIndividualStyle}>
                                  📦 Individual
                                </div>
                                <p style={productPriceStyle}>
                                  <strong>{producto.cantidadMostrar}</strong>
                                </p>
                                <p style={productPriceStyle}>
                                  Q{producto.precioUnitarioReal?.toFixed(2)} por unidad
                                </p>
                              </div>
                            )}

                            <p style={productSubtotalStyle}>
                              Subtotal: <span style={subtotalAmountStyle}>
                                Q{(
                                  producto.tipo === 'conjunto'
                                    ? (producto.precioConjunto || 0) * producto.cantidadConjuntos
                                    : (producto.precioUnitarioReal || 0) * producto.unidadesTotales
                                ).toFixed(2)}
                              </span>
                            </p>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Total y acciones */}
                <div style={orderFooterStyle}>
                  <div style={orderTotalStyle}>
                    <span style={totalLabelStyle}>Total del pedido:</span>
                    <span style={totalAmountStyle}>Q{pedido.total?.toFixed(2) || '0.00'}</span>
                  </div>

                  <div style={orderActionsStyle}>
                    {pedido.estado === 'pendiente' && (
                      <button
                        onClick={() => handleCancelOrder(pedido._id)}
                        className="cancel-button"
                        style={cancelButtonStyle}
                        disabled={pedidoAnimandose === pedido._id}
                      >
                        <span style={buttonIconStyle}>❌</span>
                        {pedidoAnimandose === pedido._id ? 'Cancelando...' : 'Cancelar Pedido'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Estilos (mantener los existentes)
const containerStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  paddingBottom: '2rem'
};

const heroHeaderStyle = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  padding: '4rem 2rem',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden'
};

const heroContentStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  position: 'relative',
  zIndex: 2
};

const heroTitleStyle = {
  fontSize: '3rem',
  fontWeight: 'bold',
  marginBottom: '1rem',
  textShadow: '0 4px 8px rgba(0,0,0,0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1rem'
};

const heroIconStyle = {
  fontSize: '3.5rem',
  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
};

const heroSubtitleStyle = {
  fontSize: '1.2rem',
  opacity: 0.9,
  fontWeight: '300'
};

const mainContentStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '2rem',
  position: 'relative'
};

const loadingContainerStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  color: 'white'
};

const loadingSpinnerStyle = {
  animation: 'spin 2s linear infinite',
  marginBottom: '1rem'
};

const spinnerIconStyle = {
  fontSize: '4rem'
};

const loadingTextStyle = {
  fontSize: '1.2rem',
  fontWeight: '300'
};

const errorStateStyle = {
  textAlign: 'center',
  color: 'white',
  padding: '4rem 2rem'
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
  fontWeight: 'bold',
  marginBottom: '1rem'
};

const errorSubtitleStyle = {
  fontSize: '1.1rem',
  opacity: 0.8,
  marginBottom: '2rem'
};

const errorButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  background: 'rgba(255, 255, 255, 0.2)',
  color: 'white',
  padding: '1rem 2rem',
  borderRadius: '50px',
  textDecoration: 'none',
  fontSize: '1.1rem',
  fontWeight: '600',
  transition: 'all 0.3s ease',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.3)'
};

const buttonIconStyle = {
  fontSize: '1.2rem'
};

const notificationStyle = {
  padding: '1rem 1.5rem',
  borderRadius: '12px',
  marginBottom: '1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  fontWeight: '600',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  backdropFilter: 'blur(10px)'
};

const notificationIconStyle = {
  fontSize: '1.2rem'
};

const emptyStateStyle = {
  textAlign: 'center',
  color: 'white',
  padding: '4rem 2rem'
};

const emptyIconContainerStyle = {
  marginBottom: '2rem'
};

const emptyIconStyle = {
  fontSize: '6rem',
  opacity: 0.8

};

const emptyTitleStyle = {
  fontSize: '2rem',
  fontWeight: 'bold',
  marginBottom: '1rem'
};

const emptySubtitleStyle = {
  fontSize: '1.1rem',
  opacity: 0.8,
  marginBottom: '2rem'
};

const emptyButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  background: 'rgba(255, 255, 255, 0.2)',
  color: 'white',
  padding: '1rem 2rem',
  borderRadius: '50px',
  textDecoration: 'none',
  fontSize: '1.1rem',
  fontWeight: '600',
  transition: 'all 0.3s ease',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.3)'
};

const ordersListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
};

const orderCardStyle = {
  background: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '20px',
  padding: '2rem',
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  transition: 'all 0.3s ease',
  opacity: 0,
  transform: 'translateY(20px)',
  animation: 'slideIn 0.6s ease forwards'
};

const orderAnimatingStyle = {
  opacity: 0.5,
  transform: 'scale(0.98)'
};

const orderHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1.5rem',
  paddingBottom: '1rem',
  borderBottom: '2px solid #f0f0f0'
};

const orderInfoStyle = {
  flex: 1
};

const orderIdStyle = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '0.5rem'
};

const orderDateStyle = {
  color: '#666',
  fontSize: '0.9rem',
  fontWeight: '400'
};

const orderStatusContainerStyle = {
  display: 'flex',
  alignItems: 'center'
};

const orderStatusStyle = {
  padding: '0.75rem 1.5rem',
  borderRadius: '50px',
  fontSize: '0.9rem',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const statusIconStyle = {
  fontSize: '1rem'
};

const orderProductsStyle = {
  marginBottom: '1.5rem'
};

const productsHeaderStyle = {
  fontSize: '1.2rem',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const productsIconStyle = {
  fontSize: '1.3rem'
};

const productListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const productItemStyle = {
  display: 'flex',
  gap: '1rem',
  padding: '1rem',
  background: '#f8f9fa',
  borderRadius: '12px',
  border: '1px solid #e9ecef'
};

const productImageContainerStyle = {
  position: 'relative',
  flexShrink: 0
};

const productImageStyle = {
  width: '80px',
  height: '80px',
  objectFit: 'cover',
  borderRadius: '10px',
  border: '2px solid #e9ecef'
};

const noImagePlaceholderStyle = {
  width: '80px',
  height: '80px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f8f9fa',
  borderRadius: '10px',
  border: '2px solid #e9ecef',
  fontSize: '2rem',
  color: '#adb5bd'
};

const productQuantityBadgeStyle = {
  position: 'absolute',
  top: '-5px',
  right: '-5px',
  background: '#28a745',
  color: 'white',
  borderRadius: '50px',
  padding: '0.2rem 0.6rem',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  minWidth: '30px',
  textAlign: 'center'
};

const productDetailsStyle = {
  flex: 1
};

const productNameStyle = {
  fontSize: '1.1rem',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '0.5rem'
};

const typeTagConjuntoStyle = {
  display: 'inline-block',
  background: 'linear-gradient(135deg, #28a745, #20c997)',
  color: 'white',
  padding: '0.3rem 0.8rem',
  borderRadius: '20px',
  fontSize: '0.8rem',
  fontWeight: '600',
  marginBottom: '0.5rem'
};

const typeTagIndividualStyle = {
  display: 'inline-block',
  background: 'linear-gradient(135deg, #007bff, #6610f2)',
  color: 'white',
  padding: '0.3rem 0.8rem',
  borderRadius: '20px',
  fontSize: '0.8rem',
  fontWeight: '600',
  marginBottom: '0.5rem'
};

const productPriceStyle = {
  color: '#666',
  fontSize: '0.9rem',
  marginBottom: '0.25rem'
};

const unitsDetailStyle = {
  color: '#28a745',
  fontSize: '0.85rem',
  fontStyle: 'italic',
  marginBottom: '0.25rem'
};

const productSubtotalStyle = {
  color: '#333',
  fontSize: '0.95rem',
  fontWeight: '600',
  marginTop: '0.5rem'
};

const subtotalAmountStyle = {
  color: '#28a745',
  fontWeight: 'bold'
};

const orderFooterStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: '1.5rem',
  borderTop: '2px solid #f0f0f0'
};

const orderTotalStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '0.25rem'
};

const totalLabelStyle = {
  fontSize: '0.9rem',
  color: '#666',
  fontWeight: '500'
};

const totalAmountStyle = {
  fontSize: '1.8rem',
  fontWeight: 'bold',
  color: '#28a745'
};

const orderActionsStyle = {
  display: 'flex',
  gap: '1rem'
};

const cancelButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  background: 'linear-gradient(135deg, #dc3545, #c82333)',
  color: 'white',
  border: 'none',
  padding: '0.75rem 1.5rem',
  borderRadius: '50px',
  fontSize: '0.9rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)'
};

// Agregar animación CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .order-card:hover {
    transform: translateY(-5px) !important;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
  }
  
  .order-card.animate-slideIn {
    animation: slideIn 0.6s ease forwards;
  }
  
  .cancel-button:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
  }
  
  .cancel-button:active {
    transform: scale(0.98);
  }
  
  .empty-button:hover, .error-button:hover {
    background: rgba(255, 255, 255, 0.3) !important;
    transform: translateY(-2px);
  }
  
  .notification {
    animation: slideIn 0.4s ease forwards;
  }
  
  @media (max-width: 768px) {
    .order-header {
      flex-direction: column;
      gap: 1rem;
    }
    
    .product-item {
      flex-direction: column;
      text-align: center;
    }
    
    .order-footer {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }
    
    .hero-title {
      font-size: 2rem !important;
    }
    
    .hero-icon {
      font-size: 2.5rem !important;
    }
  }
`;

// Solo agregar el estilo si no existe ya
if (!document.querySelector('[data-mispedidos-styles]')) {
  styleSheet.setAttribute('data-mispedidos-styles', 'true');
  document.head.appendChild(styleSheet);
}

export default MisPedidos;
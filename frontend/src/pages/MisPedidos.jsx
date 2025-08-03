// src/pages/MisPedidos.jsx - DISEÑO MODERNO ART MARY
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
        setError('No se pudieron cargar tus pedidos 😓');
        setPedidos([]);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    if (!loading) {
      obtenerMisPedidos();
    }
  }, [isAuthenticated, user, loading]);

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
          <Link to="/productos" style={errorButtonStyle}>
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
      <div style={heroHeaderStyle}>
        <div style={heroContentStyle}>
          <h1 style={heroTitleStyle}>
            <span style={heroIconStyle}>📦</span>
            Mis Pedidos
          </h1>
          <p style={heroSubtitleStyle}>
            {pedidos.length === 0 
              ? 'Aún no has realizado ningún pedido'
              : `Tienes ${pedidos.length} ${pedidos.length === 1 ? 'pedido' : 'pedidos'} registrados`
            }
          </p>
        </div>
      </div>

      <div style={mainContentStyle}>
        {/* Mensajes de notificación */}
        {mensaje && (
          <div style={{
            ...notificationStyle,
            background: mensaje.includes('éxito') 
              ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)' 
              : 'linear-gradient(135deg, #fef2f2, #fecaca)',
            color: mensaje.includes('éxito') ? '#166534' : '#dc2626',
            borderColor: mensaje.includes('éxito') ? '#22c55e' : '#ef4444'
          }}>
            <span style={notificationIconStyle}>
              {mensaje.includes('éxito') ? '✅' : '⚠️'}
            </span>
            {mensaje}
          </div>
        )}

        {error && !mensaje && (
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

        {pedidos.length === 0 ? (
          /* Estado vacío */
          <div style={emptyStateStyle}>
            <div style={emptyIconContainerStyle}>
              <div style={emptyIconStyle}>🛍️</div>
            </div>
            <h2 style={emptyTitleStyle}>No tienes pedidos aún</h2>
            <p style={emptySubtitleStyle}>
              ¡Es hora de hacer tu primer pedido! Explora nuestro catálogo y encuentra productos increíbles.
            </p>
            <Link to="/productos" style={emptyButtonStyle}>
              <span style={buttonIconStyle}>✨</span>
              Explorar Productos
            </Link>
            <div style={emptyDecorationsStyle}>
              <div style={floatingHeartStyle}>💕</div>
              <div style={{...floatingHeartStyle, ...floatingHeart2Style}}>🌸</div>
              <div style={{...floatingHeartStyle, ...floatingHeart3Style}}>🎨</div>
            </div>
          </div>
        ) : (
          /* Lista de pedidos */
          <div style={ordersContainerStyle}>
            <div style={ordersHeaderStyle}>
              <h2 style={sectionTitleStyle}>
                <span style={sectionIconStyle}>📋</span>
                Historial de Pedidos
              </h2>
              <div style={ordersSummaryStyle}>
                <span style={summaryTextStyle}>
                  {pedidos.filter(p => p.estado !== 'cancelado' && p.estado !== 'entregado').length} activos
                </span>
              </div>
            </div>

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

                  {/* Productos del pedido */}
                  <div style={orderProductsStyle}>
                    <h4 style={productsHeaderStyle}>
                      <span style={productsIconStyle}>📦</span>
                      Productos ({pedido.productos.length})
                    </h4>
                    <div style={productListStyle}>
                      {pedido.productos.map((item, itemIndex) => (
                        <div key={itemIndex} style={productItemStyle}>
                          <div style={productImageContainerStyle}>
                            <img
                              src={item.imagenUrl || "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=60&h=60&fit=crop"}
                              alt={item.nombre}
                              style={productImageStyle}
                              onError={(e) => {
                                e.target.src = "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=60&h=60&fit=crop";
                              }}
                            />
                            <div style={productQuantityBadgeStyle}>
                              {item.cantidad}
                            </div>
                          </div>
                          <div style={productDetailsStyle}>
                            <h5 style={productNameStyle}>{item.nombre}</h5>
                            <p style={productPriceStyle}>
                              Q{item.precioVenta.toFixed(2)} c/u
                            </p>
                            <p style={productSubtotalStyle}>
                              Subtotal: <span style={subtotalAmountStyle}>Q{(item.cantidad * item.precioVenta).toFixed(2)}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total y acciones */}
                  <div style={orderFooterStyle}>
                    <div style={orderTotalStyle}>
                      <span style={totalLabelStyle}>Total:</span>
                      <span style={totalAmountStyle}>Q{pedido.total.toFixed(2)}</span>
                    </div>
                    
                    {pedido.estado !== 'entregado' && pedido.estado !== 'cancelado' && (
                      <button
                        onClick={() => handleCancelOrder(pedido._id)}
                        style={cancelButtonStyle}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                        }}
                      >
                        <span style={buttonIconStyle}>❌</span>
                        Cancelar Pedido
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Botón para seguir comprando */}
            <div style={continueShoppingContainerStyle}>
              <Link to="/productos" style={continueShoppingButtonStyle}>
                <span style={buttonIconStyle}>🛍️</span>
                Continuar Comprando
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Estilos
const containerStyle = {
  minHeight: '100vh',
  background: 'var(--gradient-background)',
  fontFamily: 'var(--font-sans)',
  paddingBottom: '2rem'
};

const heroHeaderStyle = {
  background: 'var(--gradient-primary)',
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
  maxWidth: '1024px',
  margin: '0 auto',
  padding: '0 2rem'
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
  animation: 'bounce 1s infinite'
};

const loadingTextStyle = {
  fontSize: '1.25rem',
  fontWeight: '600'
};

const errorStateStyle = {
  textAlign: 'center',
  padding: '4rem 2rem',
  background: 'white',
  borderRadius: '2rem',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)',
  marginTop: '2rem'
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

const emptyStateStyle = {
  textAlign: 'center',
  padding: '4rem 2rem',
  position: 'relative',
  background: 'white',
  borderRadius: '2rem',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)',
  marginTop: '2rem'
};

const emptyIconContainerStyle = {
  marginBottom: '2rem'
};

const emptyIconStyle = {
  fontSize: '8rem',
  opacity: 0.6,
  animation: 'float 3s ease-in-out infinite'
};

const emptyTitleStyle = {
  fontSize: '2rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  marginBottom: '1rem',
  fontFamily: 'var(--font-display)'
};

const emptySubtitleStyle = {
  fontSize: '1.125rem',
  color: 'var(--neutral-600)',
  marginBottom: '2rem',
  lineHeight: 1.6,
  maxWidth: '500px',
  margin: '0 auto 2rem auto'
};

const emptyButtonStyle = {
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

const emptyDecorationsStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none'
};

const floatingHeartStyle = {
  position: 'absolute',
  fontSize: '2rem',
  opacity: 0.3,
  animation: 'float 4s ease-in-out infinite'
};

const floatingHeart2Style = {
  top: '20%',
  right: '20%',
  animationDelay: '1s'
};

const floatingHeart3Style = {
  bottom: '30%',
  left: '15%',
  animationDelay: '2s'
};

const ordersContainerStyle = {
  marginTop: '2rem'
};

const ordersHeaderStyle = {
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

const ordersSummaryStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem'
};

const summaryTextStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-600)',
  fontWeight: '600',
  background: 'var(--primary-50)',
  padding: '0.5rem 1rem',
  borderRadius: '0.5rem',
  border: '1px solid var(--primary-200)'
};

const ordersListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
};

const orderCardStyle = {
  background: 'white',
  borderRadius: '1.5rem',
  padding: '2rem',
  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
  border: '1px solid var(--neutral-200)',
  transition: 'all 0.3s ease',
  animation: 'slideInUp 0.5s ease-out'
};

const orderAnimatingStyle = {
  transform: 'scale(0.98)',
  opacity: 0.8
};

const orderHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1.5rem',
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

const orderStatusStyle = {
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

const orderProductsStyle = {
  marginBottom: '1.5rem'
};

const productsHeaderStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'var(--neutral-700)',
  marginBottom: '1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const productsIconStyle = {
  fontSize: '1rem'
};

const productListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
};

const productItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem',
  background: 'var(--neutral-50)',
  borderRadius: '0.75rem',
  border: '1px solid var(--neutral-200)'
};

const productImageContainerStyle = {
  position: 'relative',
  flexShrink: 0
};

const productImageStyle = {
  width: '60px',
  height: '60px',
  objectFit: 'cover',
  borderRadius: '0.5rem',
  border: '2px solid white',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
};

const productQuantityBadgeStyle = {
  position: 'absolute',
  top: '-6px',
  right: '-6px',
  background: 'var(--gradient-primary)',
  color: 'white',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  fontWeight: '700',
  boxShadow: '0 2px 6px rgba(236, 72, 153, 0.4)'
};

const productDetailsStyle = {
  flex: 1
};

const productNameStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'var(--neutral-800)',
  marginBottom: '0.25rem'
};

const productPriceStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-600)',
  marginBottom: '0.25rem'
};

const productSubtotalStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-600)'
};

const subtotalAmountStyle = {
  fontWeight: '700',
  color: 'var(--primary-600)'
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

const cancelButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
  color: 'white',
  border: 'none',
  borderRadius: '0.75rem',
  fontSize: '0.875rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
};

const continueShoppingContainerStyle = {
  textAlign: 'center',
  marginTop: '3rem'
};

const continueShoppingButtonStyle = {
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

const buttonIconStyle = {
  fontSize: '1.25rem'
};

export default MisPedidos;
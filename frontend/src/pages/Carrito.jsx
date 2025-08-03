// src/pages/Carrito.jsx - DISEÑO MODERNO ART MARY
import { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { Link } from 'react-router-dom';

function Carrito() {
  const {
    carrito,
    aumentarCantidad,
    disminuirCantidad,
    eliminarDelCarrito,
    vaciarCarrito
  } = useContext(CartContext);

  const [itemsAnimandose, setItemsAnimandose] = useState(new Set());
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const total = carrito.reduce(
    (acum, item) => acum + item.precioVenta * item.cantidad,
    0
  );

  const handleEliminarItem = (id, nombre) => {
    setItemsAnimandose(prev => new Set(prev).add(id));
    setTimeout(() => {
      eliminarDelCarrito(id);
      setItemsAnimandose(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 300);
  };

  const handleVaciarCarrito = () => {
    setMostrarConfirmacion(true);
  };

  const confirmarVaciarCarrito = () => {
    vaciarCarrito();
    setMostrarConfirmacion(false);
  };

  const handleCantidadChange = (id, accion) => {
    setItemsAnimandose(prev => new Set(prev).add(id));
    setTimeout(() => {
      if (accion === 'aumentar') {
        aumentarCantidad(id);
      } else {
        disminuirCantidad(id);
      }
      setItemsAnimandose(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 150);
  };

  return (
    <div style={containerStyle}>
      {/* Hero Header */}
      <div style={heroHeaderStyle}>
        <div style={heroContentStyle}>
          <h1 style={heroTitleStyle}>
            <span style={heroIconStyle}>🛒</span>
            Mi Carrito de Compras
          </h1>
          <p style={heroSubtitleStyle}>
            {carrito.length === 0 
              ? 'Tu carrito está esperando ser llenado de creatividad'
              : `${carrito.length} ${carrito.length === 1 ? 'producto' : 'productos'} seleccionados`
            }
          </p>
        </div>
      </div>

      <div style={mainContentStyle}>
        {carrito.length === 0 ? (
          /* Estado vacío */
          <div style={emptyStateStyle}>
            <div style={emptyIconContainerStyle}>
              <div style={emptyIconStyle}>🛍️</div>
            </div>
            <h2 style={emptyTitleStyle}>Tu carrito está vacío</h2>
            <p style={emptySubtitleStyle}>
              ¡Es hora de llenarlo con productos increíbles! Explora nuestro catálogo y encuentra todo lo que necesitas.
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
          /* Contenido del carrito */
          <div style={cartContentStyle}>
            {/* Items del carrito */}
            <div style={itemsContainerStyle}>
              <div style={itemsHeaderStyle}>
                <h2 style={sectionTitleStyle}>
                  <span style={sectionIconStyle}>📦</span>
                  Productos Seleccionados
                </h2>
                <button
                  onClick={handleVaciarCarrito}
                  style={clearCartButtonStyle}
                >
                  <span style={buttonIconStyle}>🗑️</span>
                  Vaciar Carrito
                </button>
              </div>

              <div style={itemsListStyle}>
                {carrito.map((producto, index) => (
                  <div
                    key={producto._id}
                    style={{
                      ...itemCardStyle,
                      ...(itemsAnimandose.has(producto._id) ? itemAnimatingStyle : {}),
                      animationDelay: `${index * 100}ms`
                    }}
                    className="cart-item animate-slideIn"
                  >
                    {/* Imagen del producto */}
                    <div style={itemImageContainerStyle}>
                      <img
                        src={producto.imagenUrl || "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=150&h=150&fit=crop"}
                        alt={producto.nombre}
                        style={itemImageStyle}
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=150&h=150&fit=crop";
                        }}
                      />
                      <div style={itemBadgeStyle}>
                        {producto.cantidad}
                      </div>
                    </div>

                    {/* Información del producto */}
                    <div style={itemInfoStyle}>
                      <h3 style={itemNameStyle}>{producto.nombre}</h3>
                      <p style={itemPriceStyle}>Q{producto.precioVenta.toFixed(2)} c/u</p>
                      <p style={itemSubtotalStyle}>
                        Subtotal: <span style={subtotalAmountStyle}>Q{(producto.precioVenta * producto.cantidad).toFixed(2)}</span>
                      </p>
                    </div>

                    {/* Controles de cantidad */}
                    <div style={quantityControlsStyle}>
                      <div style={quantityContainerStyle}>
                        <button
                          onClick={() => handleCantidadChange(producto._id, 'disminuir')}
                          disabled={producto.cantidad === 1}
                          style={{
                            ...quantityButtonStyle,
                            ...(producto.cantidad === 1 ? disabledButtonStyle : {})
                          }}
                        >
                          −
                        </button>
                        <span style={quantityDisplayStyle}>{producto.cantidad}</span>
                        <button
                          onClick={() => handleCantidadChange(producto._id, 'aumentar')}
                          disabled={producto.cantidad >= producto.stock}
                          style={{
                            ...quantityButtonStyle,
                            ...(producto.cantidad >= producto.stock ? disabledButtonStyle : {})
                          }}
                        >
                          +
                        </button>
                      </div>
                      <div style={stockInfoStyle}>
                        Stock: {producto.stock}
                      </div>
                    </div>

                    {/* Botón eliminar */}
                    <button
                      onClick={() => handleEliminarItem(producto._id, producto.nombre)}
                      style={removeButtonStyle}
                      title={`Eliminar ${producto.nombre}`}
                    >
                      <span style={removeIconStyle}>×</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen del carrito */}
            <div style={summaryContainerStyle}>
              <div style={summaryCardStyle}>
                <h2 style={summaryTitleStyle}>
                  <span style={summaryIconStyle}>📊</span>
                  Resumen del Pedido
                </h2>

                <div style={summaryDetailsStyle}>
                  <div style={summaryRowStyle}>
                    <span style={summaryLabelStyle}>Productos:</span>
                    <span style={summaryValueStyle}>{carrito.length}</span>
                  </div>
                  <div style={summaryRowStyle}>
                    <span style={summaryLabelStyle}>Items totales:</span>
                    <span style={summaryValueStyle}>
                      {carrito.reduce((acc, item) => acc + item.cantidad, 0)}
                    </span>
                  </div>
                  <div style={summaryDividerStyle}></div>
                  <div style={{...summaryRowStyle, ...totalRowStyle}}>
                    <span style={totalLabelStyle}>Total:</span>
                    <span style={totalAmountStyle}>Q{total.toFixed(2)}</span>
                  </div>
                </div>

                <div style={actionsContainerStyle}>
                  <Link to="/confirmar" style={confirmOrderButtonStyle}>
                    <span style={buttonIconStyle}>📝</span>
                    Confirmar el Pedido
                  </Link>
                  <Link to="/productos" style={continueShoppingStyle}>
                    <span style={buttonIconStyle}>🛍️</span>
                    Seguir Comprando
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      {mostrarConfirmacion && (
        <div style={modalOverlayStyle} onClick={() => setMostrarConfirmacion(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <span style={modalIconStyle}>⚠️</span>
              <h3 style={modalTitleStyle}>Confirmar Acción</h3>
            </div>
            <p style={modalTextStyle}>
              ¿Estás seguro de que quieres vaciar todo el carrito? Esta acción no se puede deshacer.
            </p>
            <div style={modalActionsStyle}>
              <button
                onClick={() => setMostrarConfirmacion(false)}
                style={modalCancelButtonStyle}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarVaciarCarrito}
                style={modalConfirmButtonStyle}
              >
                <span style={buttonIconStyle}>🗑️</span>
                Sí, Vaciar Carrito
              </button>
            </div>
          </div>
        </div>
      )}
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
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '0 2rem'
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '4rem 2rem',
  position: 'relative'
};

const emptyIconContainerStyle = {
  marginBottom: '2rem'
};

const emptyIconStyle = {
  fontSize: '6rem',
  opacity: 0.8,
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
  borderRadius: 'var(--border-radius-2xl)',
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

const cartContentStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 400px',
  gap: '3rem',
  marginTop: '-2rem',
  position: 'relative',
  zIndex: 2
};

const itemsContainerStyle = {
  background: 'white',
  borderRadius: 'var(--border-radius-2xl)',
  padding: '2rem',
  boxShadow: 'var(--shadow-xl)',
  border: '1px solid var(--neutral-200)'
};

const itemsHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid var(--neutral-200)'
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

const clearCartButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  background: 'var(--gradient-secondary)',
  color: 'white',
  border: 'none',
  borderRadius: 'var(--border-radius-lg)',
  fontSize: '0.875rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
};

const itemsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
};

const itemCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
  padding: '1.5rem',
  background: 'var(--neutral-50)',
  borderRadius: 'var(--border-radius-xl)',
  border: '1px solid var(--neutral-200)',
  transition: 'all 0.3s ease',
  position: 'relative'
};

const itemAnimatingStyle = {
  transform: 'scale(0.98)',
  opacity: 0.8
};

const itemImageContainerStyle = {
  position: 'relative',
  flexShrink: 0
};

const itemImageStyle = {
  width: '100px',
  height: '100px',
  objectFit: 'cover',
  borderRadius: 'var(--border-radius-lg)',
  border: '2px solid white',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
};

const itemBadgeStyle = {
  position: 'absolute',
  top: '-8px',
  right: '-8px',
  background: 'var(--gradient-primary)',
  color: 'white',
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.875rem',
  fontWeight: '700',
  boxShadow: '0 2px 8px rgba(236, 72, 153, 0.4)'
};

const itemInfoStyle = {
  flex: 1,
  minWidth: 0
};

const itemNameStyle = {
  fontSize: '1.125rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  marginBottom: '0.5rem',
  lineHeight: 1.3
};

const itemPriceStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-600)',
  marginBottom: '0.25rem'
};

const itemSubtotalStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-600)'
};

const subtotalAmountStyle = {
  fontWeight: '700',
  color: 'var(--primary-600)'
};

const quantityControlsStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.5rem'
};

const quantityContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  background: 'white',
  borderRadius: 'var(--border-radius-lg)',
  border: '1px solid var(--neutral-300)',
  overflow: 'hidden'
};

const quantityButtonStyle = {
  width: '40px',
  height: '40px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.25rem',
  fontWeight: '700',
  color: 'var(--primary-600)',
  transition: 'all 0.2s ease'
};

const disabledButtonStyle = {
  opacity: 0.4,
  cursor: 'not-allowed'
};

const quantityDisplayStyle = {
  padding: '0 1rem',
  fontSize: '1rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  minWidth: '50px',
  textAlign: 'center',
  borderLeft: '1px solid var(--neutral-300)',
  borderRight: '1px solid var(--neutral-300)'
};

const stockInfoStyle = {
  fontSize: '0.75rem',
  color: 'var(--neutral-500)',
  textAlign: 'center'
};

const removeButtonStyle = {
  position: 'absolute',
  top: '1rem',
  right: '1rem',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  border: 'none',
  background: 'var(--gradient-secondary)',
  color: 'white',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s ease',
  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
};

const removeIconStyle = {
  fontSize: '1.25rem',
  fontWeight: '700'
};

const summaryContainerStyle = {
  position: 'sticky',
  top: '120px',
  height: 'fit-content'
};

const summaryCardStyle = {
  background: 'white',
  borderRadius: 'var(--border-radius-2xl)',
  padding: '2rem',
  boxShadow: 'var(--shadow-xl)',
  border: '1px solid var(--neutral-200)'
};

const summaryTitleStyle = {
  fontSize: '1.375rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  marginBottom: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem'
};

const summaryIconStyle = {
  fontSize: '1.5rem'
};

const summaryDetailsStyle = {
  marginBottom: '2rem'
};

const summaryRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.75rem'
};

const summaryLabelStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-600)'
};

const summaryValueStyle = {
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'var(--neutral-800)'
};

const summaryDividerStyle = {
  height: '1px',
  background: 'var(--neutral-200)',
  margin: '1rem 0'
};

const totalRowStyle = {
  paddingTop: '0.5rem',
  borderTop: '2px solid var(--primary-200)'
};

const totalLabelStyle = {
  fontSize: '1.125rem',
  fontWeight: '700',
  color: 'var(--neutral-800)'
};

const totalAmountStyle = {
  fontSize: '1.5rem',
  fontWeight: '800',
  color: 'var(--primary-600)'
};

const actionsContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  marginBottom: '2rem'
};

const confirmOrderButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  padding: '1rem 1.5rem',
  background: 'var(--gradient-primary)',
  color: 'white',
  textDecoration: 'none',
  borderRadius: 'var(--border-radius-xl)',
  fontSize: '1.125rem',
  fontWeight: '700',
  transition: 'all 0.3s ease',
  boxShadow: '0 8px 25px rgba(236, 72, 153, 0.4)'
};

const continueShoppingStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  padding: '0.875rem 1.5rem',
  background: 'transparent',
  color: 'var(--primary-600)',
  textDecoration: 'none',
  borderRadius: 'var(--border-radius-xl)',
  fontSize: '1rem',
  fontWeight: '600',
  transition: 'all 0.3s ease',
  border: '1px solid var(--primary-300)'
};

const buttonIconStyle = {
  fontSize: '1.25rem'
};

// Modal styles
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(5px)'
};

const modalContentStyle = {
  background: 'white',
  borderRadius: 'var(--border-radius-2xl)',
  padding: '2rem',
  maxWidth: '400px',
  width: '90%',
  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
  animation: 'slideIn 0.3s ease-out'
};

const modalHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  marginBottom: '1rem'
};

const modalIconStyle = {
  fontSize: '2rem'
};

const modalTitleStyle = {
  fontSize: '1.25rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  margin: 0
};

const modalTextStyle = {
  fontSize: '1rem',
  color: 'var(--neutral-600)',
  lineHeight: 1.6,
  marginBottom: '2rem'
};

const modalActionsStyle = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'flex-end'
};

const modalCancelButtonStyle = {
  padding: '0.75rem 1rem',
  background: 'transparent',
  color: 'var(--neutral-600)',
  border: '1px solid var(--neutral-300)',
  borderRadius: 'var(--border-radius-lg)',
  fontSize: '0.875rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease'
};

const modalConfirmButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  background: 'var(--gradient-secondary)',
  color: 'white',
  border: 'none',
  borderRadius: 'var(--border-radius-lg)',
  fontSize: '0.875rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease'
};

// CSS adicional
const additionalStyles = `
@media (max-width: 1024px) {
  .cart-content {
    grid-template-columns: 1fr !important;
    gap: 2rem !important;
  }
  
  .summary-container {
    position: static !important;
  }
}

@media (max-width: 768px) {
  .item-card {
    flex-direction: column !important;
    text-align: center !important;
  }
  
  .quantity-controls {
    flex-direction: row !important;
    justify-content: center !important;
  }
  
  .hero-title {
    flex-direction: column !important;
    gap: 0.5rem !important;
  }
}

.cart-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.confirm-order-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(236, 72, 153, 0.5) !important;
}

.continue-shopping:hover {
  background: var(--primary-50) !important;
  border-color: var(--primary-500) !important;
}

.quantity-button:hover:not(:disabled) {
  background: var(--primary-50) !important;
}

.remove-button:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5) !important;
}

.clear-cart-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4) !important;
}

.empty-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(236, 72, 153, 0.5) !important;
}
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('carrito-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'carrito-styles';
    styleSheet.textContent = additionalStyles;
    document.head.appendChild(styleSheet);
  }
}

export default Carrito;
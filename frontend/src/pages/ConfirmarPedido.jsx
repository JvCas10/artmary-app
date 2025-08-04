import api from '../api/axios';
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom'; // ✅ Agregado Link

function ConfirmarPedido() {
  const { carrito, vaciarCarrito } = useContext(CartContext);
  const navigate = useNavigate();

  const total = carrito.reduce(
    (acum, item) => acum + item.precioVenta * item.cantidad,
    0
  );

  const handleConfirmar = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Debes iniciar sesión para confirmar tu pedido.');
        navigate('/login');
        return;
      }

      const { data } = await api.post('/pedidos/confirmar', carrito);

      alert('¡Pedido confirmado con éxito! 🎉');
      vaciarCarrito();
      navigate('/productos');
    } catch (error) {
      console.error('Error al confirmar pedido:', error);
      alert('Hubo un problema al procesar el pedido. Intenta de nuevo.');
    }
  };

  return (
    <div style={pageWrapperStyle}>
      {/* Hero Header */}
      <div style={heroHeaderStyle}>
        <div style={heroContentStyle}>
          <h1 style={heroTitleStyle}>
            <span style={heroIconStyle}>📦</span>
            Confirmación de Pedido
          </h1>
          <p style={heroSubtitleStyle}>
            {carrito.length === 0
              ? 'No tienes productos para confirmar'
              : `Revisa tu pedido de ${carrito.length} ${carrito.length === 1 ? 'producto' : 'productos'}`
            }
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={mainContentStyle}>
        {carrito.length === 0 ? (
          /* Estado vacío mejorado */
          <div style={emptyStateStyle}>
            <div style={emptyIconContainerStyle}>
              <div style={emptyIconStyle}>🛒</div>
            </div>
            <h2 style={emptyTitleStyle}>Tu carrito está vacío</h2>
            <p style={emptySubtitleStyle}>
              No hay productos en el carrito para confirmar. ¡Explora nuestro catálogo y encuentra productos increíbles!
            </p>
            <div style={emptyActionsStyle}>
              <Link to="/productos" style={primaryButtonStyle}>
                <span style={buttonIconStyle}>🛍️</span>
                Explorar Catálogo
              </Link>
              <Link to="/carrito" style={secondaryButtonStyle}>
                <span style={buttonIconStyle}>🛒</span>
                Ver Carrito
              </Link>
            </div>
            <div style={emptyDecorationsStyle}>
              <div style={floatingIconStyle}>✨</div>
              <div style={{ ...floatingIconStyle, ...floatingIcon2Style }}>🎨</div>
              <div style={{ ...floatingIconStyle, ...floatingIcon3Style }}>💝</div>
            </div>
          </div>
        ) : (
          /* Contenido del pedido */
          <div style={orderContentStyle}>
            <div style={orderSectionStyle}>
              <h2 style={sectionTitleStyle}>
                <span style={sectionIconStyle}>📋</span>
                Resumen del Pedido
              </h2>

              <div style={productListStyle}>
                {carrito.map((producto, index) => (
                  <div key={producto._id} style={{
                    ...productCardStyle,
                    animationDelay: `${index * 100}ms`
                  }}>
                    <div style={productImageContainerStyle}>
                      <img
                        src={producto.imagenUrl || "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=80&h=80&fit=crop"}
                        alt={producto.nombre}
                        style={productImageStyle}
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=80&h=80&fit=crop";
                        }}
                      />
                      <div style={quantityBadgeStyle}>
                        {producto.cantidad}
                      </div>
                    </div>

                    <div style={productInfoStyle}>
                      <h4 style={productNameStyle}>{producto.nombre}</h4>
                      <p style={productPriceStyle}>Q{producto.precioVenta.toFixed(2)} c/u</p>
                      <p style={productSubtotalStyle}>
                        Subtotal: <span style={subtotalAmountStyle}>Q{(producto.precioVenta * producto.cantidad).toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={totalSectionStyle}>
                <div style={totalRowStyle}>
                  <span style={totalLabelStyle}>Total del Pedido:</span>
                  <span style={totalAmountStyle}>Q{total.toFixed(2)}</span>
                </div>
              </div>

              <div style={actionButtonsStyle}>
                <button
                  onClick={handleConfirmar}
                  style={confirmButtonStyle}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 12px 30px rgba(34, 197, 94, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 25px rgba(34, 197, 94, 0.3)';
                  }}
                >
                  <span style={buttonIconStyle}>✅</span>
                  Confirmar Pedido
                </button>

                <Link to="/carrito" style={editCartButtonStyle}>
                  <span style={buttonIconStyle}>✏️</span>
                  Editar Carrito
                </Link>
              </div>
            </div>

            {/* Información adicional */}
            <div style={infoSectionStyle}>
              <h3 style={infoTitleStyle}>
                <span style={infoIconStyle}>📋</span>
                Información del Proceso
              </h3>
              <div style={infoListStyle}>
                <div style={infoItemStyle}>
                  <span style={infoItemIconStyle}>📞</span>
                  <span style={infoItemTextStyle}>Te contactaremos para confirmar detalles</span>
                </div>
                <div style={infoItemStyle}>
                  <span style={infoItemIconStyle}>💰</span>
                  <span style={infoItemTextStyle}>El pago se realiza al momento de la entrega</span>
                </div>
                <div style={infoItemStyle}>
                  <span style={infoItemIconStyle}>🚚</span>
                  <span style={infoItemTextStyle}>Coordinaremos la entrega contigo</span>
                </div>
                <div style={infoItemStyle}>
                  <span style={infoItemIconStyle}>⏰</span>
                  <span style={infoItemTextStyle}>Procesamiento en 24-48 horas</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Estilos
const pageWrapperStyle = {
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
  fontWeight: '500',
  maxWidth: '600px',
  margin: '0 auto'
};

const mainContentStyle = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '0 2rem',
  marginTop: '-2rem',
  position: 'relative',
  zIndex: 2
};

// Estado vacío
const emptyStateStyle = {
  textAlign: 'center',
  padding: '4rem 2rem',
  position: 'relative',
  background: 'white',
  borderRadius: '2rem',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)'
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
  marginBottom: '2.5rem',
  lineHeight: 1.6,
  maxWidth: '500px',
  margin: '0 auto 2.5rem auto'
};

const emptyActionsStyle = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center',
  flexWrap: 'wrap'
};

const primaryButtonStyle = {
  display: 'flex',
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

const secondaryButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '1rem 2rem',
  background: 'transparent',
  color: 'var(--primary-600)',
  textDecoration: 'none',
  borderRadius: '1rem',
  fontSize: '1.125rem',
  fontWeight: '700',
  transition: 'all 0.3s ease',
  border: '2px solid var(--primary-300)'
};

const emptyDecorationsStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none'
};

const floatingIconStyle = {
  position: 'absolute',
  fontSize: '2rem',
  opacity: 0.3,
  animation: 'float 4s ease-in-out infinite'
};

const floatingIcon2Style = {
  top: '20%',
  right: '20%',
  animationDelay: '1s'
};

const floatingIcon3Style = {
  bottom: '30%',
  left: '15%',
  animationDelay: '2s'
};

// Contenido del pedido
const orderContentStyle = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: '2rem',
  '@media (max-width: 1024px)': {
    gridTemplateColumns: '1fr'
  }
};

const orderSectionStyle = {
  background: 'white',
  borderRadius: '2rem',
  padding: '2rem',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)',
  height: 'fit-content'
};

const sectionTitleStyle = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  marginBottom: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem'
};

const sectionIconStyle = {
  fontSize: '1.5rem'
};

const productListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  marginBottom: '2rem'
};

const productCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1.5rem',
  background: 'var(--neutral-50)',
  borderRadius: '1rem',
  border: '1px solid var(--neutral-200)',
  transition: 'all 0.3s ease',
  animation: 'slideInUp 0.5s ease-out'
};

const productImageContainerStyle = {
  position: 'relative',
  flexShrink: 0
};

const productImageStyle = {
  width: '80px',
  height: '80px',
  objectFit: 'cover',
  borderRadius: '0.75rem',
  border: '2px solid white',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
};

const quantityBadgeStyle = {
  position: 'absolute',
  top: '-8px',
  right: '-8px',
  background: 'var(--gradient-primary)',
  color: 'white',
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  fontWeight: '700',
  boxShadow: '0 2px 8px rgba(236, 72, 153, 0.4)'
};

const productInfoStyle = {
  flex: 1
};

const productNameStyle = {
  fontSize: '1.125rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  marginBottom: '0.5rem'
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

const totalSectionStyle = {
  borderTop: '2px solid var(--neutral-200)',
  paddingTop: '1.5rem',
  marginBottom: '2rem'
};

const totalRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const totalLabelStyle = {
  fontSize: '1.25rem',
  fontWeight: '700',
  color: 'var(--neutral-800)'
};

const totalAmountStyle = {
  fontSize: '2rem',
  fontWeight: '800',
  color: 'var(--primary-600)'
};

const actionButtonsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const confirmButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  padding: '1rem 2rem',
  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
  color: 'white',
  border: 'none',
  borderRadius: '1rem',
  fontSize: '1.125rem',
  fontWeight: '700',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 8px 25px rgba(34, 197, 94, 0.3)'
};

const editCartButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  padding: '0.875rem 2rem',
  background: 'transparent',
  color: 'var(--primary-600)',
  textDecoration: 'none',
  borderRadius: '1rem',
  fontSize: '1rem',
  fontWeight: '600',
  transition: 'all 0.3s ease',
  border: '1px solid var(--primary-300)'
};

const buttonIconStyle = {
  fontSize: '1.25rem'
};

// Sección de información
const infoSectionStyle = {
  background: 'white',
  borderRadius: '2rem',
  padding: '2rem',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)',
  height: 'fit-content'
};

const infoTitleStyle = {
  fontSize: '1.25rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  marginBottom: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem'
};

const infoIconStyle = {
  fontSize: '1.25rem'
};

const infoListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const infoItemStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.75rem',
  padding: '1rem',
  background: 'var(--primary-50)',
  borderRadius: '0.75rem',
  border: '1px solid var(--primary-200)'
};

const infoItemIconStyle = {
  fontSize: '1.25rem',
  marginTop: '0.125rem'
};

const infoItemTextStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-700)',
  fontWeight: '500',
  lineHeight: 1.5
};

export default ConfirmarPedido;
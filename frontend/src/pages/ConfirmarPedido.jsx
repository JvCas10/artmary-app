import api from '../api/axios';
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';

function ConfirmarPedido() {
  const { carrito, vaciarCarrito } = useContext(CartContext);
  const navigate = useNavigate();

  // Calcular el total considerando el tipo de venta
  const total = carrito.reduce((acum, item) => {
    if (item.tipoVenta === 'conjunto') {
      return acum + (item.precioConjunto * item.cantidad);
    } else {
      return acum + (item.precioVenta * item.cantidad);
    }
  }, 0);

  // Función para calcular las unidades totales que se venderán
  const calcularUnidadesTotales = (item) => {
    if (item.tipoVenta === 'conjunto') {
      return item.cantidad * item.unidadesPorConjunto;
    } else {
      return item.cantidad;
    }
  };

  const handleConfirmar = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Debes iniciar sesión para confirmar tu pedido.');
      navigate('/login');
      return;
    }

    // Preparar los datos del pedido correctamente
    const pedidoParaEnviar = carrito.map(item => ({
      _id: item._id,
      nombre: item.nombre,
      cantidad: item.tipoVenta === 'conjunto' ? (item.cantidad * item.unidadesPorConjunto) : item.cantidad,
      tipoVenta: item.tipoVenta || 'individual',
      cantidadOriginal: item.cantidad,
      precioVenta: item.tipoVenta === 'conjunto' ? item.precioConjunto : item.precioVenta,
      // Campos adicionales para conjuntos
      ...(item.tipoVenta === 'conjunto' && {
        nombreConjunto: item.nombreConjunto,
        unidadesPorConjunto: item.unidadesPorConjunto,
        precioConjunto: item.precioConjunto
      })
    }));

    console.log('Enviando pedido:', pedidoParaEnviar); // Para debug

    const { data } = await api.post('/pedidos/confirmar', pedidoParaEnviar);
    alert('¡Pedido confirmado con éxito! 🎉');
    vaciarCarrito();
    navigate('/productos');
  } catch (error) {
    console.error('Error al confirmar pedido:', error);
    console.error('Respuesta del servidor:', error.response?.data);
    alert('Hubo un problema al procesar el pedido. Revisa la consola para más detalles.');
  }
};

  return (
    <div style={pageWrapperStyle}>
      {/* Hero Header */}
      <br/><br/><br/><br/>
      <div style={heroHeaderStyle}>
        <div style={heroContentStyle}>
          <h1 style={heroTitleStyle}>
            <span style={heroIconStyle}>📦</span>
            Confirmación de Pedido
          </h1>
          <p style={heroSubtitleStyle}>
            {carrito.length === 0
              ? 'No tienes productos para confirmar'
              : `Revisa tu pedido de ${carrito.length} ${carrito.length === 1 ? 'item' : 'items'}`
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
            <Link to="/productos" style={emptyButtonStyle}>
              <span style={buttonIconStyle}>🛍️</span>
              Ir al Catálogo
            </Link>
            <div style={emptyDecorationsStyle}>
              <div style={floatingHeartStyle}>💖</div>
              <div style={{...floatingHeartStyle, ...floatingHeart2Style}}>🌟</div>
              <div style={{...floatingHeartStyle, ...floatingHeart3Style}}>🎨</div>
            </div>
          </div>
        ) : (
          /* Lista de productos */
          <div style={contentContainerStyle}>
            {/* Resumen del pedido */}
            <div style={summaryCardStyle}>
              <h2 style={sectionTitleStyle}>
                <span style={sectionIconStyle}>📋</span>
                Resumen del Pedido
              </h2>
              
              <div style={orderSummaryStyle}>
                <div style={summaryItemStyle}>
                  <span style={summaryLabelStyle}>Items en carrito:</span>
                  <span style={summaryValueStyle}>{carrito.length}</span>
                </div>
                <div style={summaryItemStyle}>
                  <span style={summaryLabelStyle}>Unidades totales:</span>
                  <span style={summaryValueStyle}>
                    {carrito.reduce((total, item) => total + calcularUnidadesTotales(item), 0)}
                  </span>
                </div>
                <div style={summaryItemStyle}>
                  <span style={summaryLabelStyle}>Total:</span>
                  <span style={{...summaryValueStyle, fontSize: '1.5rem', fontWeight: 'bold', color: '#059669'}}>
                    Q{total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Lista detallada de productos */}
            <div style={productListStyle}>
              <h3 style={listTitleStyle}>
                <span style={listIconStyle}>📦</span>
                Detalle de Productos
              </h3>
              
              {carrito.map((item, index) => (
                <div key={`${item._id}-${item.tipoVenta}`} style={productItemStyle}>
                  {/* Imagen del producto */}
                  <div style={productImageContainerStyle}>
                    {item.imagenUrl ? (
                      <img 
                        src={item.imagenUrl} 
                        alt={item.nombre}
                        style={productImageStyle}
                      />
                    ) : (
                      <div style={noImagePlaceholderStyle}>
                        📷
                      </div>
                    )}
                  </div>

                  {/* Información del producto */}
                  <div style={productInfoStyle}>
                    <h4 style={productNameStyle}>{item.nombre}</h4>
                    
                    {/* Mostrar información según el tipo de venta */}
                    {item.tipoVenta === 'conjunto' ? (
                      <div style={typeInfoStyle}>
                        <span style={typeTagStyle}>
                          🗃️ {item.nombreConjunto || 'Conjunto'}
                        </span>
                        <div style={quantityInfoStyle}>
                          <span>Cantidad: <strong>{item.cantidad} {item.nombreConjunto}(s)</strong></span>
                          <span style={unitsDetailStyle}>
                            ({item.cantidad} × {item.unidadesPorConjunto} = {calcularUnidadesTotales(item)} unidades)
                          </span>
                        </div>
                        <div style={priceInfoStyle}>
                          <span>Precio por {item.nombreConjunto}: <strong>Q{item.precioConjunto?.toFixed(2) || '0.00'}</strong></span>
                          <span style={unitPriceStyle}>
                            (Q{(item.precioConjunto / item.unidadesPorConjunto)?.toFixed(2) || '0.00'} por unidad)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={typeInfoStyle}>
                        <span style={{...typeTagStyle, backgroundColor: '#dbeafe', color: '#1e40af'}}>
                          📦 Unidades individuales
                        </span>
                        <div style={quantityInfoStyle}>
                          <span>Cantidad: <strong>{item.cantidad} unidad(es)</strong></span>
                        </div>
                        <div style={priceInfoStyle}>
                          <span>Precio por unidad: <strong>Q{item.precioVenta?.toFixed(2) || '0.00'}</strong></span>
                        </div>
                      </div>
                    )}

                    {/* Subtotal */}
                    <div style={subtotalStyle}>
                      <strong>
                        Subtotal: Q{(item.tipoVenta === 'conjunto' ? 
                          (item.precioConjunto * item.cantidad) : 
                          (item.precioVenta * item.cantidad)
                        ).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botones de acción */}
            <div style={actionsContainerStyle}>
              <Link to="/carrito" style={secondaryButtonStyle}>
                <span style={buttonIconStyle}>⬅️</span>
                Volver al Carrito
              </Link>
              
              <button 
                onClick={handleConfirmar}
                style={primaryButtonStyle}
              >
                <span style={buttonIconStyle}>✅</span>
                Confirmar Pedido
              </button>
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
  background: 'var(--gradient-background)'
};

const heroHeaderStyle = {
  background: 'var(--gradient-primary)',
  backdropFilter: 'blur(10px)',
  padding: '3rem 0',
  textAlign: 'center',
  borderBottom: '1px solid rgba(255,255,255,0.2)'
};

const heroContentStyle = {
  maxWidth: '800px',
  margin: '0 auto',
  padding: '0 1rem'
};

const heroTitleStyle = {
  fontSize: '3rem',
  fontWeight: 'bold',
  color: 'black',
  marginBottom: '1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1rem'
};

const heroIconStyle = {
  fontSize: '3.5rem'
};

const heroSubtitleStyle = {
  fontSize: '1.2rem',
  color: 'rgba(0, 0, 0, 0.9)',
  marginBottom: '0'
};

const mainContentStyle = {
  padding: '2rem 1rem',
  maxWidth: '1200px',
  margin: '0 auto'
};

// Estilos para estado vacío
const emptyStateStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4rem 2rem',
  background: 'rgba(255,255,255,0.95)',
  borderRadius: '20px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  position: 'relative',
  overflow: 'hidden'
};

const emptyIconContainerStyle = {
  marginBottom: '2rem'
};

const emptyIconStyle = {
  fontSize: '4rem',
  opacity: 0.6
};

const emptyTitleStyle = {
  fontSize: '2rem',
  fontWeight: 'bold',
  color: '#374151',
  marginBottom: '1rem'
};

const emptySubtitleStyle = {
  fontSize: '1.1rem',
  color: '#6b7280',
  textAlign: 'center',
  marginBottom: '2rem',
  lineHeight: '1.6'
};

const emptyButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1.5rem',
  backgroundColor: '#059669',
  color: 'white',
  textDecoration: 'none',
  borderRadius: '10px',
  fontWeight: '600',
  fontSize: '1rem',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)'
};

const buttonIconStyle = {
  fontSize: '1.2rem'
};

const emptyDecorationsStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  overflow: 'hidden'
};

const floatingHeartStyle = {
  position: 'absolute',
  fontSize: '2rem',
  opacity: 0.1,
  animation: 'float 6s ease-in-out infinite'
};

const floatingHeart2Style = {
  top: '20%',
  right: '10%',
  animationDelay: '-2s'
};

const floatingHeart3Style = {
  bottom: '20%',
  left: '15%',
  animationDelay: '-4s'
};

// Estilos para contenido con productos
const contentContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem'
};

const summaryCardStyle = {
  background: 'rgba(255,255,255,0.95)',
  borderRadius: '15px',
  padding: '2rem',
  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
};

const sectionTitleStyle = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#374151',
  marginBottom: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const sectionIconStyle = {
  fontSize: '1.5rem'
};

const orderSummaryStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const summaryItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.5rem 0',
  borderBottom: '1px solid rgba(0,0,0,0.1)'
};

const summaryLabelStyle = {
  fontSize: '1rem',
  color: '#6b7280'
};

const summaryValueStyle = {
  fontSize: '1.1rem',
  fontWeight: '600',
  color: '#374151'
};

const productListStyle = {
  background: 'rgba(255,255,255,0.95)',
  borderRadius: '15px',
  padding: '2rem',
  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
};

const listTitleStyle = {
  fontSize: '1.3rem',
  fontWeight: 'bold',
  color: '#374151',
  marginBottom: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const listIconStyle = {
  fontSize: '1.3rem'
};

const productItemStyle = {
  display: 'flex',
  gap: '1rem',
  padding: '1.5rem',
  marginBottom: '1rem',
  backgroundColor: '#f9fafb',
  borderRadius: '12px',
  border: '1px solid #e5e7eb'
};

const productImageContainerStyle = {
  flexShrink: 0
};

const productImageStyle = {
  width: '80px',
  height: '80px',
  objectFit: 'cover',
  borderRadius: '8px',
  border: '1px solid #e5e7eb'
};

const noImagePlaceholderStyle = {
  width: '80px',
  height: '80px',
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '2rem',
  color: '#9ca3af'
};

const productInfoStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const productNameStyle = {
  fontSize: '1.1rem',
  fontWeight: 'bold',
  color: '#374151',
  margin: 0
};

const typeInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const typeTagStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '0.25rem 0.75rem',
  backgroundColor: '#dcfce7',
  color: '#166534',
  fontSize: '0.85rem',
  fontWeight: '500',
  borderRadius: '20px',
  alignSelf: 'flex-start'
};

const quantityInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  color: '#000000ff'
};

const unitsDetailStyle = {
  fontSize: '0.9rem',
  color: '#0f0f0fff',
  fontStyle: 'italic'
};

const priceInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  color: '#000000ff'
};

const unitPriceStyle = {
  fontSize: '0.9rem',
  color: '#000000ff'
};

const subtotalStyle = {
  marginTop: '0.5rem',
  fontSize: '1.1rem',
  color: '#059669'
};

const actionsContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '1rem',
  marginTop: '2rem'
};

const secondaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1.5rem',
  backgroundColor: '#6b7280',
  color: 'white',
  textDecoration: 'none',
  borderRadius: '10px',
  fontWeight: '600',
  fontSize: '1rem',
  transition: 'all 0.3s ease',
  border: 'none',
  cursor: 'pointer'
};

const primaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 2rem',
  backgroundColor: '#059669',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  fontWeight: '600',
  fontSize: '1rem',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)'
};

export default ConfirmarPedido;
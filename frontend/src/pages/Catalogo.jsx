// src/pages/Catalogo.jsx - DISEÑO MODERNO PREMIUM
import { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { CartContext } from '../context/CartContext';
import { Link } from 'react-router-dom';
import Pagination from '../components/Pagination';
import ProductFilters from '../components/ProductFilters';

function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para paginación
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 12
  });

  // Estados para filtros
  const [categorias, setCategorias] = useState([]);
  const [filtros, setFiltros] = useState({
    categoria: '',
    precioMin: '',
    precioMax: '',
    disponibilidad: '',
    sortBy: 'default'
  });

  const { agregarAlCarrito, carrito } = useContext(CartContext);

  // Función para obtener productos con paginación y filtros
  const obtenerProductos = async (page = 1, search = '', filtrosAplicados = {}) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        search: search,
        categoria: filtrosAplicados.categoria || '',
        precioMin: filtrosAplicados.precioMin || '',
        precioMax: filtrosAplicados.precioMax || '',
        disponibilidad: filtrosAplicados.disponibilidad || '',
        sortBy: filtrosAplicados.sortBy || 'default'
      });

      const response = await api.get(`/productos?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setProductos(response.data.productos || []);
      setPagination(response.data.pagination || {});

      if (response.data.filtros && response.data.filtros.categorias) {
        setCategorias(response.data.filtros.categorias);
      }

      setError('');
    } catch (err) {
      console.error("Error al obtener productos:", err);
      setError('No se pudieron cargar los productos 😓');
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerProductos(1, searchTerm, filtros);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      obtenerProductos(1, searchTerm, filtros);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleFiltersChange = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    obtenerProductos(1, searchTerm, nuevosFiltros);
  };

  const handleAgregar = (producto) => {
    agregarAlCarrito(producto);
    setMensaje(`"${producto.nombre}" agregado al carrito 🛒`);
    setTimeout(() => setMensaje(''), 3000);
  };

  const handlePageChange = (newPage) => {
    obtenerProductos(newPage, searchTerm, filtros);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={loadingSpinnerStyle}>
          <div style={spinnerStyle}></div>
          <h3 style={loadingTextStyle}>Cargando productos increíbles...</h3>
          <p style={loadingSubtextStyle}>Preparando la mejor experiencia para ti</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Hero Section */}
      <section style={heroSectionStyle}>
        <div style={heroContentStyle}>
          <div style={heroTextStyle}>
            <h1 style={heroTitleStyle}>
              Bienvenido a
              <span style={heroTitleAccentStyle}> Art Mary</span>
            </h1>
            <p style={heroSubtitleStyle}>
              Tu librería y papelería de confianza • Calidad, creatividad y pasión en cada producto
            </p>
          </div>
        </div>
      </section>

      {/* Mensajes */}
      {mensaje && (
        <div style={successMessageStyle}>
          <div style={messageIconStyle}>✅</div>
          <span>{mensaje}</span>
        </div>
      )}

      {error && (
        <div style={errorMessageStyle}>
          <div style={messageIconStyle}>❌</div>
          <span>{error}</span>
        </div>
      )}

      {/* Barra de búsqueda moderna */}
      <div style={searchSectionStyle}>
        <div style={searchContainerStyle}>
          <div style={searchInputContainerStyle}>
            <div style={searchIconStyle}>🔍</div>
            <input
              type="text"
              placeholder="Buscar productos, categorías..."
              value={searchTerm}
              onChange={handleSearchChange}
              style={searchInputStyle}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={clearSearchStyle}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <ProductFilters
        onFiltersChange={handleFiltersChange}
        categorias={categorias}
        filtrosAplicados={filtros}
        totalProductos={pagination.totalProducts}
      />

      {/* Grid de productos */}
      <section style={productsGridSectionStyle}>
        {productos.length === 0 && !loading ? (
          <div style={emptyStateStyle}>
            <div style={emptyIconStyle}>🔍</div>
            <h3 style={emptyTitleStyle}>No se encontraron productos</h3>
            <p style={emptySubtitleStyle}>
              {searchTerm || Object.values(filtros).some(f => f)
                ? 'Intenta ajustar tu búsqueda o filtros'
                : 'No hay productos disponibles en este momento'
              }
            </p>
            {(searchTerm || Object.values(filtros).some(f => f)) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  handleFiltersChange({
                    categoria: '',
                    precioMin: '',
                    precioMax: '',
                    disponibilidad: '',
                    sortBy: 'default'
                  });
                }}
                style={resetFiltersButtonStyle}
              >
                🔄 Limpiar búsqueda y filtros
              </button>
            )}
          </div>
        ) : (
          <div style={productsGridStyle}>
            {productos.map((producto, index) => (
              <ProductCard
                key={producto._id}
                producto={producto}
                onAgregar={handleAgregar}
                index={index}
              />
            ))}
          </div>
        )}
      </section>

      {/* Paginación */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        hasNextPage={pagination.hasNextPage}
        hasPrevPage={pagination.hasPrevPage}
        onPageChange={handlePageChange}
      />

      <Link to="/carrito" style={floatingCartStyle}>
        <div style={cartIconStyle}>🛒</div>
        <span style={cartTextStyle}>Ver Carrito</span>
        {carrito.length > 0 && (
          <div style={cartBadgeStyle}>
            {carrito.reduce((total, item) => total + item.cantidad, 0)}
          </div>
        )}
      </Link>
    </div>
  );
}

// Componente ProductCard separado para mejor organización
function ProductCard({ producto, onAgregar, index }) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const getStockStatus = (stock) => {
    if (stock === 0) return { color: '#ef4444', text: 'Agotado', icon: '❌' };
    if (stock < 5) return { color: '#f59e0b', text: 'Pocas unidades', icon: '⚠️' };
    return { color: '#10b981', text: 'Disponible', icon: '✅' };
  };

  const stockStatus = getStockStatus(producto.stock);

  return (
    <article
      style={{
        ...productCardStyle,
        transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isHovered
          ? '0 25px 50px rgba(0, 0, 0, 0.15)'
          : '0 4px 20px rgba(0, 0, 0, 0.08)',
        animationDelay: `${index * 100}ms`
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="animate-fadeIn"
    >
      {/* Imagen del producto */}
      <div style={productImageContainerStyle}>
        {!imageLoaded && <div style={imageSkeletonStyle}></div>}
        <img
          src={producto.imagenUrl || "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=400&h=300&fit=crop"}
          alt={producto.nombre}
          style={{
            ...productImageStyle,
            opacity: imageLoaded ? 1 : 0
          }}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=400&h=300&fit=crop";
            setImageLoaded(true);
          }}
        />

        {/* Badge de categoría */}
        {producto.categoria && (
          <div style={categoryBadgeStyle}>
            {producto.categoria}
          </div>
        )}

        {/* Badge de stock */}
        <div style={{
          ...stockBadgeStyle,
          background: stockStatus.color
        }}>
          <span style={stockIconStyle}>{stockStatus.icon}</span>
          {stockStatus.text}
        </div>
      </div>

      {/* Contenido del producto */}
      <div style={productContentStyle}>
        <h3 style={productTitleStyle}>{producto.nombre}</h3>

        {producto.descripcion && (
          <p style={productDescriptionStyle}>
            {producto.descripcion.length > 100
              ? `${producto.descripcion.substring(0, 100)}...`
              : producto.descripcion
            }
          </p>
        )}

        <div style={productDetailsStyle}>
          <div style={priceContainerStyle}>
            <span style={priceStyle}>Q{producto.precioVenta}</span>
            <span style={stockTextStyle}>Stock: {producto.stock}</span>
          </div>

          <button
            onClick={() => onAgregar(producto)}
            disabled={producto.stock === 0}
            style={{
              ...addToCartButtonStyle,
              background: producto.stock === 0
                ? 'var(--secondary-300)'
                : 'var(--gradient-primary)',
              cursor: producto.stock === 0 ? 'not-allowed' : 'pointer',
              transform: isHovered && producto.stock > 0 ? 'translateY(-2px)' : 'translateY(0)'
            }}
          >
            <span style={buttonIconStyle}>
              {producto.stock === 0 ? '❌' : '🛒'}
            </span>
            {producto.stock === 0 ? 'Agotado' : 'Agregar'}
          </button>
        </div>
      </div>
    </article>
  );
}

// Estilos
const containerStyle = {
  minHeight: '100vh',
  fontFamily: 'var(--font-sans)',
  paddingBottom: '2rem'
};

const loadingContainerStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--gradient-background)'
};

const loadingSpinnerStyle = {
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem'
};

const spinnerStyle = {
  width: '50px',
  height: '50px',
  border: '4px solid var(--secondary-200)',
  borderTop: '4px solid var(--primary-500)',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const loadingTextStyle = {
  fontSize: '1.5rem',
  fontWeight: '600',
  color: 'var(--secondary-700)',
  margin: 0
};

const loadingSubtextStyle = {
  fontSize: '1rem',
  color: 'var(--secondary-500)',
  margin: 0
};

const heroSectionStyle = {
  background: 'var(--gradient-primary)',
  color: 'white',
  padding: '4rem 2rem',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden'
};

const heroContentStyle = {
  maxWidth: '1280px',
  margin: '0 auto',
  position: 'relative',
  zIndex: 2
};

const heroTextStyle = {
  marginBottom: '3rem'
};

const heroTitleStyle = {
  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
  fontWeight: '800',
  marginBottom: '1rem',
  lineHeight: 1.1,
  fontFamily: 'var(--font-display)',
  color: 'white'
};

const heroTitleAccentStyle = {
  color: '#fbcfe8',
  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
};

const heroSubtitleStyle = {
  fontSize: '1.25rem',
  fontWeight: '400',
  opacity: 0.95,
  maxWidth: '700px',
  margin: '0 auto 1rem auto',
  lineHeight: 1.6
};

const heroTaglineStyle = {
  fontSize: '1.125rem',
  fontWeight: '500',
  fontStyle: 'italic',
  opacity: 0.9,
  fontFamily: 'var(--font-display)'
};

const heroStatsStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '3rem',
  flexWrap: 'wrap'
};

const statItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.5rem'
};

const statNumberStyle = {
  fontSize: '2.5rem',
  fontWeight: '800',
  lineHeight: 1
};

const statLabelStyle = {
  fontSize: '0.875rem',
  fontWeight: '500',
  opacity: 0.8,
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const successMessageStyle = {
  position: 'fixed',
  top: '100px',
  right: '20px',
  zIndex: 1000,
  padding: '1rem 2rem',
  background: 'var(--gradient-success)',
  color: 'white',
  borderRadius: 'var(--border-radius-xl)',
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  boxShadow: '0 8px 25px rgba(34, 197, 94, 0.4)',
  fontWeight: '500',
  animation: 'slideInRight 0.3s ease-out',
  minWidth: '300px',
  maxWidth: '400px'
};

const errorMessageStyle = {
  margin: '2rem auto',
  maxWidth: '1280px',
  padding: '1rem 2rem',
  background: 'var(--gradient-danger)',
  color: 'white',
  borderRadius: 'var(--border-radius-xl)',
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  boxShadow: 'var(--shadow-lg)',
  fontWeight: '500'
};

const messageIconStyle = {
  fontSize: '1.25rem'
};

const searchSectionStyle = {
  padding: '2rem',
  maxWidth: '1280px',
  margin: '0 auto'
};

const searchContainerStyle = {
  maxWidth: '600px',
  margin: '0 auto'
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
  color: 'var(--secondary-700)'
};

const clearSearchStyle = {
  padding: '1rem',
  background: 'none',
  border: 'none',
  color: 'var(--secondary-400)',
  cursor: 'pointer',
  fontSize: '1rem',
  transition: 'var(--transition-fast)'
};

const productsGridSectionStyle = {
  padding: '0 2rem',
  maxWidth: '1280px',
  margin: '0 auto'
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '4rem 2rem',
  background: 'white',
  borderRadius: 'var(--border-radius-2xl)',
  boxShadow: 'var(--shadow-lg)',
  border: '1px solid var(--secondary-200)'
};

const emptyIconStyle = {
  fontSize: '4rem',
  marginBottom: '1.5rem'
};

const emptyTitleStyle = {
  fontSize: '1.5rem',
  fontWeight: '600',
  color: 'var(--secondary-700)',
  marginBottom: '0.5rem'
};

const emptySubtitleStyle = {
  fontSize: '1rem',
  color: 'var(--secondary-500)',
  marginBottom: '2rem'
};

const resetFiltersButtonStyle = {
  padding: '0.75rem 1.5rem',
  background: 'var(--gradient-primary)',
  color: 'white',
  border: 'none',
  borderRadius: 'var(--border-radius-lg)',
  fontSize: '0.875rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'var(--transition-normal)'
};

const productsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '2rem',
  padding: '2rem 0'
};

const productCardStyle = {
  background: 'white',
  borderRadius: 'var(--border-radius-2xl)',
  overflow: 'hidden',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  border: '1px solid var(--secondary-200)',
  position: 'relative'
};

const productImageContainerStyle = {
  position: 'relative',
  height: '250px',
  overflow: 'hidden'
};

const imageSkeletonStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite'
};

const productImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  transition: 'all 0.4s ease'
};

const categoryBadgeStyle = {
  position: 'absolute',
  top: '1rem',
  left: '1rem',
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  color: 'var(--secondary-700)',
  padding: '0.25rem 0.75rem',
  borderRadius: 'var(--border-radius-full)',
  fontSize: '0.75rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const stockBadgeStyle = {
  position: 'absolute',
  top: '1rem',
  right: '1rem',
  color: 'white',
  padding: '0.25rem 0.75rem',
  borderRadius: 'var(--border-radius-full)',
  fontSize: '0.75rem',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem'
};

const stockIconStyle = {
  fontSize: '0.75rem'
};

const productContentStyle = {
  padding: '1.5rem'
};

const productTitleStyle = {
  fontSize: '1.25rem',
  fontWeight: '700',
  color: 'var(--secondary-900)',
  marginBottom: '0.75rem',
  lineHeight: 1.3
};

const productDescriptionStyle = {
  fontSize: '0.875rem',
  color: 'var(--secondary-600)',
  lineHeight: 1.6,
  marginBottom: '1.5rem'
};

const productDetailsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1rem'
};

const priceContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem'
};

const priceStyle = {
  fontSize: '1.5rem',
  fontWeight: '800',
  color: 'var(--primary-600)',
  lineHeight: 1
};

const stockTextStyle = {
  fontSize: '0.75rem',
  color: 'var(--secondary-500)',
  fontWeight: '500'
};

const addToCartButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1.25rem',
  border: 'none',
  borderRadius: 'var(--border-radius-xl)',
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'white',
  transition: 'all 0.3s ease',
  boxShadow: 'var(--shadow-md)',
  minWidth: '120px',
  justifyContent: 'center'
};

const buttonIconStyle = {
  fontSize: '1rem'
};

const floatingCartStyle = {
  position: 'fixed',
  bottom: '2rem',
  right: '2rem',
  background: 'var(--gradient-primary)',
  color: 'white',
  textDecoration: 'none',
  borderRadius: 'var(--border-radius-2xl)',
  padding: '1rem 1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  boxShadow: 'var(--shadow-2xl)',
  transition: 'all 0.3s ease',
  zIndex: 1000,
  fontWeight: '600',
  fontSize: '1rem',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(10px)'
};

const cartIconStyle = {
  fontSize: '1.25rem'
};

const cartTextStyle = {
  fontSize: '0.875rem',
  fontWeight: '600'
};

const cartBadgeStyle = {
  position: 'absolute',
  top: '-8px',
  right: '-8px',
  width: '24px',
  height: '24px',
  background: '#ef4444',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  fontWeight: '700',
  color: 'white',
  border: '2px solid white',
  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
};

// Agregar estilos de animación al CSS global
const additionalStyles = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.floating-cart:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: var(--shadow-2xl);
}

@media (max-width: 768px) {
  .floating-cart {
    bottom: 1rem;
    right: 1rem;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }
  
  .floating-cart .cart-text {
    display: none;
  }
}
`;

// Inyectar estilos adicionales
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = additionalStyles;
  document.head.appendChild(styleSheet);
}

export default Catalogo;
// src/components/Pagination.jsx - DISEÑO MODERNO PREMIUM
import React from 'react';

function Pagination({ currentPage, totalPages, onPageChange, hasNextPage, hasPrevPage }) {
  const handlePageClick = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Ajustar si estamos cerca del final
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Botón "Primera página" si no está visible
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageClick(1)}
          style={pageButtonStyle}
          className="page-button"
        >
          1
        </button>
      );
      
      if (startPage > 2) {
        pages.push(
          <div key="start-ellipsis" style={ellipsisStyle}>
            <span style={ellipsisDotsStyle}>•••</span>
          </div>
        );
      }
    }

    // Páginas numeradas
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageClick(i)}
          style={{
            ...pageButtonStyle,
            ...(i === currentPage ? activePageStyle : {})
          }}
          className={`page-button ${i === currentPage ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }

    // Botón "Última página" si no está visible
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <div key="end-ellipsis" style={ellipsisStyle}>
            <span style={ellipsisDotsStyle}>•••</span>
          </div>
        );
      }
      
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageClick(totalPages)}
          style={pageButtonStyle}
          className="page-button"
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  // Si hay una página o menos, no mostrar paginación
  if (totalPages <= 1) return null;

  return (
    <div style={containerStyle}>
      <div style={paginationWrapperStyle}>
        {/* Información de página */}
        <div style={pageInfoStyle}>
          <span style={pageInfoTextStyle}>
            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
          </span>
        </div>

        {/* Controles de navegación */}
        <div style={navigationStyle}>
          {/* Botón Primera Página */}
          <button
            onClick={() => handlePageClick(1)}
            disabled={!hasPrevPage}
            style={{
              ...navButtonStyle,
              ...(hasPrevPage ? {} : disabledButtonStyle)
            }}
            className="nav-button first"
            title="Primera página"
          >
            <span style={navIconStyle}>⏮️</span>
            <span style={navTextStyle}>Primera</span>
          </button>

          {/* Botón Anterior */}
          <button
            onClick={() => handlePageClick(currentPage - 1)}
            disabled={!hasPrevPage}
            style={{
              ...navButtonStyle,
              ...(hasPrevPage ? {} : disabledButtonStyle)
            }}
            className="nav-button prev"
            title="Página anterior"
          >
            <span style={navIconStyle}>⬅️</span>
            <span style={navTextStyle}>Anterior</span>
          </button>

          {/* Números de página */}
          <div style={pagesContainerStyle}>
            {renderPageNumbers()}
          </div>

          {/* Botón Siguiente */}
          <button
            onClick={() => handlePageClick(currentPage + 1)}
            disabled={!hasNextPage}
            style={{
              ...navButtonStyle,
              ...(hasNextPage ? {} : disabledButtonStyle)
            }}
            className="nav-button next"
            title="Página siguiente"
          >
            <span style={navTextStyle}>Siguiente</span>
            <span style={navIconStyle}>➡️</span>
          </button>

          {/* Botón Última Página */}
          <button
            onClick={() => handlePageClick(totalPages)}
            disabled={!hasNextPage}
            style={{
              ...navButtonStyle,
              ...(hasNextPage ? {} : disabledButtonStyle)
            }}
            className="nav-button last"
            title="Última página"
          >
            <span style={navTextStyle}>Última</span>
            <span style={navIconStyle}>⏭️</span>
          </button>
        </div>

        {/* Salto rápido a página */}
        <div style={quickJumpStyle}>
          <label style={quickJumpLabelStyle}>
            Ir a página:
          </label>
          <input
            type="number"
            min="1"
            max={totalPages}
            placeholder={currentPage}
            style={quickJumpInputStyle}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  handlePageClick(page);
                  e.target.value = '';
                }
              }
            }}
            onBlur={(e) => {
              const page = parseInt(e.target.value);
              if (page >= 1 && page <= totalPages) {
                handlePageClick(page);
                e.target.value = '';
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Estilos modernos
const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '3rem 2rem',
  fontFamily: 'var(--font-sans)'
};

const paginationWrapperStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2rem',
  padding: '2rem',
  background: 'white',
  borderRadius: 'var(--border-radius-2xl)',
  boxShadow: 'var(--shadow-xl)',
  border: '1px solid var(--secondary-200)',
  maxWidth: '100%',
  overflow: 'hidden'
};

const pageInfoStyle = {
  textAlign: 'center'
};

const pageInfoTextStyle = {
  fontSize: '1rem',
  color: 'var(--secondary-600)',
  fontWeight: '500'
};

const navigationStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  flexWrap: 'wrap',
  justifyContent: 'center'
};

const baseButtonStyle = {
  border: 'none',
  borderRadius: 'var(--border-radius-lg)',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  fontFamily: 'inherit',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  outline: 'none',
  position: 'relative',
  overflow: 'hidden'
};

const navButtonStyle = {
  ...baseButtonStyle,
  padding: '0.75rem 1rem',
  background: 'var(--gradient-primary)',
  color: 'white',
  fontSize: '0.875rem',
  boxShadow: 'var(--shadow-md)',
  minWidth: '100px'
};

const pageButtonStyle = {
  ...baseButtonStyle,
  width: '48px',
  height: '48px',
  padding: '0',
  background: 'var(--secondary-100)',
  color: 'var(--secondary-700)',
  fontSize: '0.875rem',
  border: '1px solid var(--secondary-200)'
};

const activePageStyle = {
  background: 'var(--gradient-primary)',
  color: 'white',
  boxShadow: 'var(--shadow-lg)',
  transform: 'scale(1.1)',
  zIndex: 2
};

const disabledButtonStyle = {
  background: 'var(--secondary-200)',
  color: 'var(--secondary-400)',
  cursor: 'not-allowed',
  boxShadow: 'none'
};

const navIconStyle = {
  fontSize: '1rem'
};

const navTextStyle = {
  fontSize: '0.875rem',
  fontWeight: '600'
};

const pagesContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
  margin: '0 1rem',
  flexWrap: 'wrap',
  justifyContent: 'center'
};

const ellipsisStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px'
};

const ellipsisDotsStyle = {
  color: 'var(--secondary-400)',
  fontSize: '1.25rem',
  fontWeight: '700',
  letterSpacing: '2px'
};

const quickJumpStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '1rem',
  background: 'var(--secondary-50)',
  borderRadius: 'var(--border-radius-lg)',
  border: '1px solid var(--secondary-200)'
};

const quickJumpLabelStyle = {
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'var(--secondary-700)',
  whiteSpace: 'nowrap'
};

const quickJumpInputStyle = {
  width: '80px',
  padding: '0.5rem 0.75rem',
  borderRadius: 'var(--border-radius-md)',
  border: '1px solid var(--secondary-300)',
  background: 'white',
  color: 'var(--secondary-700)',
  fontSize: '0.875rem',
  fontWeight: '600',
  textAlign: 'center',
  outline: 'none',
  transition: 'all 0.3s ease'
};

// Estilos CSS adicionales para interacciones
const additionalStyles = `
.page-button:hover:not(:disabled) {
  background: var(--primary-100) !important;
  color: var(--primary-700) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.page-button.active:hover {
  background: var(--gradient-primary) !important;
  color: white !important;
  transform: scale(1.1);
}

.nav-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #ea580c, #dc2626) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.nav-button:active:not(:disabled) {
  transform: translateY(0);
}

.quick-jump-input:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}

@media (max-width: 768px) {
  .pagination-wrapper {
    padding: 1rem;
    gap: 1.5rem;
  }
  
  .navigation {
    flex-direction: column;
    gap: 1rem;
  }
  
  .pages-container {
    margin: 0;
    order: -1;
  }
  
  .nav-button {
    min-width: 80px;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
  
  .nav-text {
    display: none;
  }
  
  .page-button {
    width: 40px;
    height: 40px;
    font-size: 0.75rem;
  }
  
  .quick-jump {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .pages-container {
    gap: 0.125rem;
  }
  
  .page-button {
    width: 36px;
    height: 36px;
    font-size: 0.7rem;
  }
  
  .nav-button {
    min-width: 60px;
    padding: 0.5rem;
  }
  
  .quick-jump-input {
    width: 60px;
  }
}

/* Animación de carga para páginas */
@keyframes pageLoad {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.pagination-wrapper {
  animation: pageLoad 0.4s ease-out;
}

/* Efecto ripple para botones */
.page-button::before,
.nav-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease;
  pointer-events: none;
}

.page-button:active::before,
.nav-button:active::before {
  width: 100px;
  height: 100px;
}
`;

// Inyectar estilos adicionales
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('pagination-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'pagination-styles';
    styleSheet.textContent = additionalStyles;
    document.head.appendChild(styleSheet);
  }
}

export default Pagination;
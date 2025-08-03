// src/components/Header.jsx - DISEÑO MODERNO PREMIUM
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/artmary-logo.png';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Detectar scroll para efecto glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/productos', label: 'Catálogo', icon: '🛍️' },
    { path: '/carrito', label: 'Carrito', icon: '🛒' },
    { path: '/confirmar', label: 'Confirmar', icon: '✅' },
    { path: '/mis-pedidos', label: 'Mis Pedidos', icon: '📦' }
  ];

  return (
    <header 
      style={{
        ...headerStyle,
        background: isScrolled 
          ? 'linear-gradient(135deg, rgba(253, 242, 248, 0.95) 0%, rgba(255, 251, 245, 0.95) 100%)' 
          : 'linear-gradient(135deg, rgba(253, 242, 248, 0.98) 0%, rgba(255, 251, 245, 0.98) 100%)',
        backdropFilter: isScrolled ? 'blur(20px)' : 'blur(10px)',
        boxShadow: isScrolled 
          ? '0 8px 32px rgba(236, 72, 153, 0.15)' 
          : '0 4px 16px rgba(236, 72, 153, 0.1)'
      }}
    >
      <div style={containerStyle}>
        {/* Logo y Brand */}
        <Link to={isAuthenticated ? "/productos" : "/"} style={brandStyle}>
          <div style={logoContainerStyle}>
            <img src={logo} alt="Art Mary Logo" style={logoStyle} />
            <div style={logoGlowStyle}></div>
          </div>
          <div style={brandTextStyle}>
            <h1 style={brandNameStyle}>Art Mary</h1>
            <span style={brandTaglineStyle}>Librería y Papelería</span>
          </div>
        </Link>

        {/* Navegación Desktop */}
        {isAuthenticated && (
          <nav style={desktopNavStyle}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...navLinkStyle,
                  ...(isActiveLink(item.path) ? activeNavLinkStyle : {})
                }}
                onMouseEnter={(e) => {
                  if (!isActiveLink(item.path)) {
                    e.target.style.background = 'rgba(236, 72, 153, 0.2)';
                    e.target.style.color = 'var(--primary-800)';
                    e.target.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActiveLink(item.path)) {
                    e.target.style.background = 'transparent';
                    e.target.style.color = 'var(--neutral-700)';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                <span style={navIconStyle}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            
            {/* Panel Admin */}
            {user && user.rol === 'admin' && (
              <Link
                to="/admin-panel"
                style={{
                  ...adminLinkStyle,
                  ...(isActiveLink('/admin-panel') ? activeAdminLinkStyle : {})
                }}
                onMouseEnter={(e) => {
                  if (!isActiveLink('/admin-panel')) {
                    e.target.style.background = 'linear-gradient(135deg, #7c3aed, #db2777)';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActiveLink('/admin-panel')) {
                    e.target.style.background = 'linear-gradient(135deg, #8b5cf6, #ec4899)';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                  }
                }}
              >
                <span style={adminIconStyle}>⚙️</span>
                Panel Admin
              </Link>
            )}
          </nav>
        )}

        {/* Usuario y Acciones */}
        <div style={userSectionStyle}>
          {isAuthenticated ? (
            <div style={userInfoStyle}>
              <div style={userAvatarStyle}>
                <span style={userInitialStyle}>
                  {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                </span>
                <div style={userStatusStyle}></div>
              </div>
              
              <div style={userDetailsStyle}>
                <span style={userNameStyle}>
                  Hola, {user?.nombre || 'Usuario'}
                </span>
                <span style={userRoleStyle}>
                  {user?.rol === 'admin' ? '👑 Administrador' : '🛍️ Cliente'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                style={logoutButtonStyle}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
                }}
              >
                <span style={logoutIconStyle}>👋</span>
                Salir
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              style={loginButtonStyle}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #db2777, #be185d)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'var(--gradient-primary)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <span style={loginIconStyle}>🚀</span>
              Iniciar Sesión
            </Link>
          )}

          {/* Botón menú móvil */}
          {isAuthenticated && (
            <button
              style={mobileMenuButtonStyle}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <div style={{
                ...hamburgerLineStyle,
                transform: isMobileMenuOpen ? 'rotate(45deg) translate(6px, 6px)' : 'none'
              }}></div>
              <div style={{
                ...hamburgerLineStyle,
                opacity: isMobileMenuOpen ? 0 : 1
              }}></div>
              <div style={{
                ...hamburgerLineStyle,
                transform: isMobileMenuOpen ? 'rotate(-45deg) translate(6px, -6px)' : 'none'
              }}></div>
            </button>
          )}
        </div>
      </div>

      {/* Menú Móvil */}
      {isAuthenticated && isMobileMenuOpen && (
        <div style={mobileMenuStyle}>
          <div style={mobileMenuContentStyle}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...mobileNavLinkStyle,
                  ...(isActiveLink(item.path) ? activeMobileNavLinkStyle : {})
                }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span style={mobileNavIconStyle}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            
            {user && user.rol === 'admin' && (
              <Link
                to="/admin-panel"
                style={{
                  ...mobileAdminLinkStyle,
                  ...(isActiveLink('/admin-panel') ? activeMobileAdminLinkStyle : {})
                }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span style={mobileNavIconStyle}>⚙️</span>
                Panel Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

// Estilos
const headerStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 1000,
  borderBottom: '1px solid rgba(236, 72, 153, 0.1)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  fontFamily: 'var(--font-sans)'
};

const containerStyle = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '0 1.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '100px'
};

const brandStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  textDecoration: 'none',
  transition: 'transform 0.3s ease'
};

const logoContainerStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const logoStyle = {
  height: '56px',
  width: '56px',
  objectFit: 'contain',
  borderRadius: '12px',
  transition: 'transform 0.3s ease',
  position: 'relative',
  zIndex: 2
};

const logoGlowStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '70px',
  height: '70px',
  background: 'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%)',
  borderRadius: '50%',
  zIndex: 1,
  animation: 'pulse 2s ease-in-out infinite'
};

const brandTextStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px'
};

const brandNameStyle = {
  fontSize: '2rem',
  fontWeight: '800',
  background: 'var(--gradient-primary)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  margin: 0,
  lineHeight: 1
};

const brandTaglineStyle = {
  fontSize: '0.8rem',
  fontWeight: '600',
  color: 'var(--primary-600)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase'
};

const desktopNavStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  '@media (max-width: 1024px)': {
    display: 'none'
  }
};

const navLinkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  borderRadius: '12px',
  textDecoration: 'none',
  color: 'var(--neutral-700)',
  fontWeight: '600',
  fontSize: '0.875rem',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden'
};

const activeNavLinkStyle = {
  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(244, 114, 182, 0.1))',
  color: 'var(--primary-700)',
  boxShadow: '0 2px 8px rgba(236, 72, 153, 0.2)',
  fontWeight: '700'
};

const navIconStyle = {
  fontSize: '1rem'
};

const adminLinkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  borderRadius: '12px',
  textDecoration: 'none',
  color: 'white',
  fontWeight: '700',
  fontSize: '0.875rem',
  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
  border: '1px solid rgba(139, 92, 246, 0.3)',
  transition: 'all 0.3s ease',
  marginLeft: '0.5rem',
  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
};

const activeAdminLinkStyle = {
  background: 'linear-gradient(135deg, #7c3aed, #db2777)',
  boxShadow: '0 6px 20px rgba(139, 92, 246, 0.5)',
  transform: 'translateY(-1px)'
};

const adminIconStyle = {
  fontSize: '1rem'
};

const userSectionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem'
};

const userInfoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  '@media (max-width: 768px)': {
    display: 'none'
  }
};

const userAvatarStyle = {
  position: 'relative',
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  background: 'var(--gradient-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)',
  border: '2px solid white'
};

const userInitialStyle = {
  color: 'white',
  fontWeight: '700',
  fontSize: '1.1rem'
};

const userStatusStyle = {
  position: 'absolute',
  bottom: '2px',
  right: '2px',
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  background: '#10b981',
  border: '2px solid white',
  boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
};

const userDetailsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px'
};

const userNameStyle = {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: 'var(--secondary-700)',
  lineHeight: 1
};

const userRoleStyle = {
  fontSize: '0.75rem',
  color: 'var(--secondary-500)',
  fontWeight: '500'
};

const logoutButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  fontSize: '0.875rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
};

const logoutIconStyle = {
  fontSize: '1rem'
};

const loginButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1.5rem',
  background: 'var(--gradient-primary)',
  color: 'white',
  textDecoration: 'none',
  borderRadius: '12px',
  fontSize: '0.875rem',
  fontWeight: '600',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)'
};

const loginIconStyle = {
  fontSize: '1rem'
};

const mobileMenuButtonStyle = {
  display: 'none',
  flexDirection: 'column',
  justifyContent: 'space-around',
  width: '24px',
  height: '24px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  '@media (max-width: 1024px)': {
    display: 'flex'
  }
};

const hamburgerLineStyle = {
  width: '24px',
  height: '2px',
  background: 'var(--secondary-600)',
  borderRadius: '1px',
  transition: 'all 0.3s ease',
  transformOrigin: '1px'
};

const mobileMenuStyle = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  borderTop: '1px solid rgba(226, 232, 240, 0.3)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  animation: 'slideDown 0.3s ease-out'
};

const mobileMenuContentStyle = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const mobileNavLinkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem',
  borderRadius: '12px',
  textDecoration: 'none',
  color: 'var(--secondary-600)',
  fontWeight: '500',
  fontSize: '1rem',
  transition: 'all 0.3s ease',
  border: '1px solid transparent'
};

const activeMobileNavLinkStyle = {
  background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(234, 88, 12, 0.1))',
  color: 'var(--primary-600)',
  borderColor: 'rgba(249, 115, 22, 0.2)'
};

const mobileNavIconStyle = {
  fontSize: '1.25rem'
};

const mobileAdminLinkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem',
  borderRadius: '12px',
  textDecoration: 'none',
  color: 'white',
  fontWeight: '700',
  fontSize: '1rem',
  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
  border: '1px solid rgba(139, 92, 246, 0.3)',
  transition: 'all 0.3s ease',
  marginTop: '0.5rem',
  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
};

const activeMobileAdminLinkStyle = {
  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
};

export default Header;
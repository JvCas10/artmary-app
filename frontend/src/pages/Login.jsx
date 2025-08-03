// src/pages/Login.jsx - DISEÑO MODERNO ART MARY
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import fondoArtMary from '../assets/Fondo Art Mary.jpg';
import logo from '../assets/artmary-logo.png'; // ¡NUEVO IMPORT!


function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [nombreRegistro, setNombreRegistro] = useState('');
  const [correoRegistro, setCorreoRegistro] = useState('');
  const [contrasenaRegistro, setContrasenaRegistro] = useState('');
  const [mensajeLocal, setMensajeLocal] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mostrarVerificacion, setMostrarVerificacion] = useState(false);
  const [emailNoVerificado, setEmailNoVerificado] = useState('');
  const [enviandoVerificacion, setEnviandoVerificacion] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async () => {
    setMensajeLocal('');

    if (!correo || !contrasena) {
      setMensajeLocal('Por favor ingresa ambos campos');
      return;
    }

    setIsLoading(true);
    const result = await login(correo, contrasena);

    if (result.success) {
      setMensajeLocal(result.message);
      setTimeout(() => navigate('/productos'), 1000);
    } else {
      // Verificar si el error es por email no verificado
      if (result.requiresVerification) {
        setMensajeLocal('');
        setEmailNoVerificado(correo);
        setMostrarVerificacion(true);
      } else {
        setMensajeLocal(result.message);
      }
    }
    setIsLoading(false);
  };

  const handleRegister = async () => {
    setMensajeLocal('');

    if (!nombreRegistro || !correoRegistro || !contrasenaRegistro) {
      setMensajeLocal('Por favor completa todos los campos para registrarte.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre: nombreRegistro, correo: correoRegistro, contraseña: contrasenaRegistro })
      });

      const data = await response.json();

      if (response.ok) {
        setMensajeLocal('Registro exitoso. ¡Ahora puedes iniciar sesión!');
        setNombreRegistro('');
        setCorreoRegistro('');
        setContrasenaRegistro('');
        setTimeout(() => setIsRegistering(false), 2000);
      } else {
        setMensajeLocal(data.mensaje || 'Error al registrar usuario.');
      }
    } catch (error) {
      console.error('Error al registrar:', error);
      setMensajeLocal('No se pudo conectar al servidor para registrar.');
    }
    setIsLoading(false);
  };

  const isSuccessMessage = (message) => {
    if (!message) return false;
    const lowerCaseMessage = message.toLowerCase().trim();
    return lowerCaseMessage.includes('exitoso') || lowerCaseMessage.includes('éxito');
  };

  const handleReenviarVerificacion = async () => {
    setEnviandoVerificacion(true);
    setMensajeLocal('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/reenviar-verificacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ correo: emailNoVerificado })
      });

      const data = await response.json();

      if (response.ok) {
        setMensajeLocal('✅ Email de verificación enviado. Revisa tu bandeja de entrada.');
        setMostrarVerificacion(false);
      } else {
        setMensajeLocal(data.mensaje || 'Error al reenviar verificación.');
      }
    } catch (error) {
      console.error('Error reenviando verificación:', error);
      setMensajeLocal('No se pudo reenviar el email de verificación.');
    } finally {
      setEnviandoVerificacion(false);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Fondo con overlay */}
      <div style={backgroundStyle}>
        <img src={fondoArtMary} alt="Art Mary Background" style={backgroundImageStyle} />
        <div style={overlayStyle}></div>
      </div>

      {/* Contenido principal */}
      <div style={contentStyle}>
        {/* Logo y bienvenida */}
        <div style={logoSectionStyle}>
          <div style={logoContainerStyle}>
            <div style={logoStyle}>
              <img src={logo} alt="Art Mary Logo" style={logoImageStyle} />
            </div>
          </div>
          <h1 style={welcomeTitleStyle}>
            {isRegistering ? 'Únete a Art Mary' : 'Bienvenido a Art Mary'}
          </h1>
          <p style={welcomeSubtitleStyle}>
            {isRegistering
              ? 'Crea tu cuenta y descubre un mundo de creatividad'
              : 'Tu librería y papelería de confianza te espera'
            }
          </p>
        </div>

        {/* Formulario */}
        <div style={formContainerStyle}>
          <div style={formCardStyle}>
            {/* Tabs */}
            <div style={tabsContainerStyle}>
              <button
                onClick={() => setIsRegistering(false)}
                style={{
                  ...tabButtonStyle,
                  ...(isRegistering ? inactiveTabStyle : activeTabStyle)
                }}
              >
                <span style={tabIconStyle}>🔑</span>
                Iniciar Sesión
              </button>
              <button
                onClick={() => setIsRegistering(true)}
                style={{
                  ...tabButtonStyle,
                  ...(isRegistering ? activeTabStyle : inactiveTabStyle)
                }}
              >
                <span style={tabIconStyle}>✨</span>
                Registrarse
              </button>
            </div>

            {/* Formulario de Login */}
            {!isRegistering ? (
              <div style={formContentStyle}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>
                    <span style={labelIconStyle}>📧</span>
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    style={inputStyle}
                    placeholder="tu@correo.com"
                    disabled={isLoading}
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>
                    <span style={labelIconStyle}>🔒</span>
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    style={inputStyle}
                    placeholder="Tu contraseña"
                    disabled={isLoading}
                  />
                </div>

                <div style={forgotPasswordContainerStyle}>
                  <Link to="/solicitar-restablecimiento" style={forgotPasswordLinkStyle}>
                    <span style={forgotPasswordIconStyle}>🔐</span>
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  style={{
                    ...primaryButtonStyle,
                    ...(isLoading ? loadingButtonStyle : {})
                  }}
                >
                  {isLoading ? (
                    <>
                      <div style={spinnerStyle}></div>
                      Iniciando...
                    </>
                  ) : (
                    <>
                      <span style={buttonIconStyle}>🚀</span>
                      Ingresar
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Formulario de Registro */
              <div style={formContentStyle}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>
                    <span style={labelIconStyle}>👤</span>
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={nombreRegistro}
                    onChange={(e) => setNombreRegistro(e.target.value)}
                    style={inputStyle}
                    placeholder="Tu nombre completo"
                    disabled={isLoading}
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>
                    <span style={labelIconStyle}>📧</span>
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={correoRegistro}
                    onChange={(e) => setCorreoRegistro(e.target.value)}
                    style={inputStyle}
                    placeholder="tu@correo.com"
                    disabled={isLoading}
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>
                    <span style={labelIconStyle}>🔒</span>
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={contrasenaRegistro}
                    onChange={(e) => setContrasenaRegistro(e.target.value)}
                    style={inputStyle}
                    placeholder="Mínimo 6 caracteres"
                    disabled={isLoading}
                  />
                </div>

                <button
                  onClick={handleRegister}
                  disabled={isLoading}
                  style={{
                    ...primaryButtonStyle,
                    ...(isLoading ? loadingButtonStyle : {})
                  }}
                >
                  {isLoading ? (
                    <>
                      <div style={spinnerStyle}></div>
                      Registrando...
                    </>
                  ) : (
                    <>
                      <span style={buttonIconStyle}>✨</span>
                      Crear Cuenta
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Mensaje */}
            {mensajeLocal && (
              <div style={{
                ...messageStyle,
                ...(isSuccessMessage(mensajeLocal) ? successMessageStyle : errorMessageStyle)
              }}>
                <span style={messageIconStyle}>
                  {isSuccessMessage(mensajeLocal) ? '✅' : '❌'}
                </span>
                {mensajeLocal}
              </div>
            )}
          </div>

          {/* Decoraciones */}
          <div style={decorationsStyle}>
            <div style={floatingElementStyle}>💕</div>
            <div style={{ ...floatingElementStyle, ...floatingElement2Style }}>🌸</div>
            <div style={{ ...floatingElementStyle, ...floatingElement3Style }}>✨</div>
          </div>
        </div>
      </div>
      {/* Modal de verificación de email */}
      {mostrarVerificacion && (
        <div style={modalOverlayStyle} onClick={() => setMostrarVerificacion(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <span style={modalIconStyle}>📧</span>
              <h3 style={modalTitleStyle}>Verificación Requerida</h3>
            </div>
            <div style={modalBodyStyle}>
              <p style={modalTextStyle}>
                Tu cuenta aún no ha sido verificada. Para poder iniciar sesión, necesitas verificar tu correo electrónico.
              </p>
              <div style={emailInfoStyle}>
                <strong>Email:</strong> {emailNoVerificado}
              </div>
              <p style={modalSubtextStyle}>
                Si no has recibido el email de verificación, puedes solicitar que te enviemos uno nuevo.
              </p>
            </div>
            <div style={modalActionsStyle}>
              <button
                onClick={() => setMostrarVerificacion(false)}
                style={modalCancelButtonStyle}
                disabled={enviandoVerificacion}
              >
                Cancelar
              </button>
              <button
                onClick={handleReenviarVerificacion}
                disabled={enviandoVerificacion}
                style={{
                  ...modalConfirmButtonStyle,
                  opacity: enviandoVerificacion ? 0.7 : 1
                }}
              >
                {enviandoVerificacion ? (
                  <>
                    <div style={miniSpinnerStyle}></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <span style={buttonIconStyle}>📧</span>
                    Reenviar Verificación
                  </>
                )}
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
  position: 'relative',
  overflow: 'hidden',
  fontFamily: 'var(--font-sans)'
};

const backgroundStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: 1
};

const backgroundImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  filter: 'blur(8px) brightness(0.7)'
};

const overlayStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'var(--gradient-primary)',
  opacity: 0.8
};

const contentStyle = {
  position: 'relative',
  zIndex: 2,
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  gap: '4rem'
};

const logoSectionStyle = {
  textAlign: 'center',
  color: 'white',
  maxWidth: '400px'
};

const logoContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '2rem'
};

const logoStyle = {
  width: '100px',
  height: '100px',
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(20px)',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
  animation: 'float 3s ease-in-out infinite'
};

const logoImageStyle = {
  width: '70px',
  height: '70px',
  objectFit: 'contain',
  borderRadius: '10px'
};

const welcomeTitleStyle = {
  fontSize: 'clamp(2rem, 4vw, 3rem)',
  fontWeight: '800',
  marginBottom: '1rem',
  fontFamily: 'var(--font-display)',
  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
};

const welcomeSubtitleStyle = {
  fontSize: '1.125rem',
  opacity: 0.9,
  lineHeight: 1.6,
  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)'
};

const formContainerStyle = {
  position: 'relative'
};

const formCardStyle = {
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  borderRadius: 'var(--border-radius-2xl)',
  padding: '2.5rem',
  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  minWidth: '400px',
  animation: 'slideIn 0.6s ease-out'
};

const tabsContainerStyle = {
  display: 'flex',
  marginBottom: '2rem',
  background: 'var(--neutral-100)',
  borderRadius: 'var(--border-radius-xl)',
  padding: '0.25rem'
};

const tabButtonStyle = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  border: 'none',
  borderRadius: 'var(--border-radius-lg)',
  fontSize: '0.875rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease'
};

const activeTabStyle = {
  background: 'var(--gradient-primary)',
  color: 'white',
  boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
};

const inactiveTabStyle = {
  background: 'transparent',
  color: 'var(--neutral-600)'
};

const tabIconStyle = {
  fontSize: '1rem'
};

const formContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
};

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const labelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'var(--neutral-700)'
};

const labelIconStyle = {
  fontSize: '1rem'
};

const inputStyle = {
  padding: '1rem 1.25rem',
  borderRadius: 'var(--border-radius-xl)',
  border: '1px solid var(--neutral-300)',
  background: 'white',
  color: 'var(--neutral-800)',
  fontSize: '1rem',
  transition: 'all 0.3s ease',
  outline: 'none',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
};

const primaryButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  padding: '1rem 1.5rem',
  background: 'var(--gradient-primary)',
  color: 'white',
  border: 'none',
  borderRadius: 'var(--border-radius-xl)',
  fontSize: '1rem',
  fontWeight: '700',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 8px 20px rgba(236, 72, 153, 0.4)',
  marginTop: '0.5rem'
};

const loadingButtonStyle = {
  opacity: 0.8,
  cursor: 'not-allowed'
};

const buttonIconStyle = {
  fontSize: '1.25rem'
};

const spinnerStyle = {
  width: '20px',
  height: '20px',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderTop: '2px solid white',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const messageStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '1rem',
  borderRadius: 'var(--border-radius-xl)',
  fontSize: '0.875rem',
  fontWeight: '600',
  marginTop: '1rem'
};

const successMessageStyle = {
  background: 'linear-gradient(135deg, #10b981, #059669)',
  color: 'white',
  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
};

const errorMessageStyle = {
  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
  color: 'white',
  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
};

const messageIconStyle = {
  fontSize: '1.25rem'
};

const decorationsStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  zIndex: -1
};

const floatingElementStyle = {
  position: 'absolute',
  fontSize: '2rem',
  opacity: 0.3,
  animation: 'float 4s ease-in-out infinite'
};

const floatingElement2Style = {
  top: '20%',
  right: '10%',
  animationDelay: '1s'
};

const floatingElement3Style = {
  bottom: '20%',
  left: '10%',
  animationDelay: '2s'
};

// Agregar animaciones CSS
const additionalStyles = `
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.login-input:focus {
  border-color: var(--primary-500) !important;
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1) !important;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(236, 72, 153, 0.5) !important;
}

@media (max-width: 768px) {
  .login-content {
    flex-direction: column;
    gap: 2rem;
    padding: 1rem;
  }
  
  .login-form-card {
    min-width: auto;
    padding: 2rem;
  }
  
  .login-logo-section {
    order: -1;
  }

  .forgot-password-link:hover {
  color: var(--primary-700) !important;
  transform: translateY(-1px);
  }
}
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('login-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'login-styles';
    styleSheet.textContent = additionalStyles;
    document.head.appendChild(styleSheet);
  }
}

// Estilos del modal
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
  borderRadius: '1.5rem',
  padding: '2rem',
  maxWidth: '450px',
  width: '90%',
  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
  animation: 'slideIn 0.3s ease-out'
};

const modalHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  marginBottom: '1.5rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid var(--neutral-200)'
};

const modalIconStyle = {
  fontSize: '2rem'
};

const modalTitleStyle = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  margin: 0
};

const modalBodyStyle = {
  marginBottom: '2rem'
};

const modalTextStyle = {
  fontSize: '1rem',
  color: 'var(--neutral-600)',
  lineHeight: 1.6,
  marginBottom: '1rem'
};

const emailInfoStyle = {
  padding: '1rem',
  background: 'var(--primary-50)',
  borderRadius: '0.75rem',
  border: '1px solid var(--primary-200)',
  marginBottom: '1rem',
  fontSize: '0.875rem',
  color: 'var(--primary-700)',
  wordBreak: 'break-all'
};

const modalSubtextStyle = {
  fontSize: '0.875rem',
  color: 'var(--neutral-500)',
  lineHeight: 1.5
};

const modalActionsStyle = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'flex-end'
};

const modalCancelButtonStyle = {
  padding: '0.75rem 1.5rem',
  background: 'transparent',
  color: 'var(--neutral-600)',
  border: '1px solid var(--neutral-300)',
  borderRadius: '0.75rem',
  fontSize: '0.875rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease'
};

const modalConfirmButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1.5rem',
  background: 'var(--gradient-primary)',
  color: 'white',
  border: 'none',
  borderRadius: '0.75rem',
  fontSize: '0.875rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease'
};

const miniSpinnerStyle = {
  width: '16px',
  height: '16px',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderTop: '2px solid white',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const forgotPasswordContainerStyle = {
  textAlign: 'center',
  marginBottom: '1rem'
};

const forgotPasswordLinkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  color: 'var(--primary-600)',
  textDecoration: 'none',
  fontSize: '0.875rem',
  fontWeight: '600',
  transition: 'all 0.3s ease',
  padding: '0.5rem'
};

const forgotPasswordIconStyle = {
  fontSize: '1rem'
};

export default Login;
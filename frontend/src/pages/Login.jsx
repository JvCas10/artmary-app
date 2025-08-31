// src/pages/Login.jsx - DISEÑO COMPLETAMENTE RESPONSIVE
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/artmary-logo.png';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function Login() {
  const { login, register, mensaje, setMensaje } = useAuth();
  const navigate = useNavigate();

  // Estados del formulario
  const [mostrarLogin, setMostrarLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [mensajeLocal, setMensajeLocal] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Estados de login
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');

  // Estados de registro
  const [nombreRegistro, setNombreRegistro] = useState('');
  const [correoRegistro, setCorreoRegistro] = useState('');
  const [contrasenaRegistro, setContrasenaRegistro] = useState('');

  // Estados del modal de verificación
  const [mostrarVerificacion, setMostrarVerificacion] = useState(false);
  const [emailNoVerificado, setEmailNoVerificado] = useState('');
  const [enviandoVerificacion, setEnviandoVerificacion] = useState(false);

  // Detectar tamaño de pantalla
  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      const newIsMobile = window.innerWidth <= 768;
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
      }
    };

    // Verificar al cargar
    checkMobile();

    // Agregar listener con throttling para mejor rendimiento
    let timeoutId;
    const throttledResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 100);
    };

    window.addEventListener('resize', throttledResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', throttledResize);
      clearTimeout(timeoutId);
    };
  }, [isMobile]); // ← IMPORTANTE: Agregar isMobile como dependencia

  // Limpiar mensajes
  useEffect(() => {
    if (mensaje) {
      setMensajeLocal(mensaje);
      const timer = setTimeout(() => {
        setMensaje('');
        setMensajeLocal('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [mensaje, setMensaje]);

  const isSuccessMessage = (msg) => {
    // Solo considera éxito si contiene palabras específicas de éxito Y el emoji de éxito
    return (
      msg.includes('✅') ||
      (msg.includes('exitoso') && !msg.includes('❌')) ||
      (msg.includes('registrado') && !msg.includes('❌')) ||
      (msg.includes('verificado') && !msg.includes('❌')) ||
      msg.includes('enviado')
    );
  };

  const handleLogin = async () => {
    if (!correo || !contrasena) {
      setMensajeLocal('⚠️ Por favor complete todos los campos');
      return;
    }

    setIsLoading(true);
    setMensajeLocal('');

    try {
      const result = await login(correo, contrasena);

      if (result.success) {
        setMensajeLocal('✅ Inicio de sesión exitoso');
        setTimeout(() => {
          navigate('/productos');
        }, 1000);
      } else {
        // Manejar diferentes tipos de error
        if (result.errorType === 'EMAIL_NO_VERIFICADO' && result.requiresVerification) {
          setEmailNoVerificado(result.email || correo);
          setMostrarVerificacion(true);
          setMensajeLocal(result.message);
        } else {
          setMensajeLocal(result.message);
        }
      }
    } catch (error) {
      console.error('Error en login:', error);
      setMensajeLocal('❌ Error inesperado. Intenta nuevamente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!nombreRegistro || !correoRegistro || !contrasenaRegistro) {
      setMensajeLocal('⚠️ Por favor complete todos los campos');
      return;
    }

    if (contrasenaRegistro.length < 6) {
      setMensajeLocal('⚠️ La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    setMensajeLocal('');

    try {
      const res = await register(nombreRegistro, correoRegistro, contrasenaRegistro);
      if (res?.success) {
        setMensajeLocal('✅ Registro exitoso. Revisa tu correo para verificar tu cuenta.');
      } else {
        setMensajeLocal(res?.message || '❌ Error al registrarse');
        return; // no limpies el formulario si falló
      }
      // Limpiar formulario
      setNombreRegistro('');
      setCorreoRegistro('');
      setContrasenaRegistro('');

      // Cambiar a login después de 3 segundos
      setTimeout(() => {
        setMostrarLogin(true);
      }, 3000);
    } catch (error) {
      console.error('Error en registro:', error);
      setMensajeLocal(error.response?.data?.mensaje || '❌ Error al registrar usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReenviarVerificacion = async () => {
    setEnviandoVerificacion(true);
    try {
      const response = await api.post('/auth/reenviar-verificacion', {
        correo: emailNoVerificado  // Cambio importante: usar 'correo' en lugar de 'email'
      });
      setMensajeLocal('✅ Email de verificación enviado. Revisa tu bandeja de entrada.');
      setMostrarVerificacion(false);
    } catch (error) {
      console.error('Error al reenviar verificación:', error);
      setMensajeLocal('❌ Error al enviar email de verificación. Inténtalo más tarde.');
    } finally {
      setEnviandoVerificacion(false);
    }
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter' && !isLoading) {
      if (action === 'login') {
        handleLogin();
      } else if (action === 'register') {
        handleRegister();
      }
    }
  };

  return (
    <div
      style={isMobile ? mobileContainerStyle : containerStyle}
      className={isMobile ? 'mobile-container' : 'desktop-container'}
    >
      <div style={isMobile ? mobileContentStyle : contentStyle}>
        {/* Sección del logo - responsiva */}
        <div style={isMobile ? mobileLogoSectionStyle : logoSectionStyle}>
          <div style={isMobile ? mobileLogoBrandStyle : logoBrandStyle}>
            <div style={isMobile ? mobileLogoContainerStyle : logoContainerStyle}>
              <img src={logo} alt="Art Mary Logo" style={isMobile ? mobileLogoStyle : logoStyle} />
              <div style={isMobile ? mobileLogoGlowStyle : logoGlowStyle}></div>
            </div>
            <div style={isMobile ? mobileBrandTextStyle : brandTextStyle}>
              <h1 style={isMobile ? mobileBrandNameStyle : brandNameStyle}>Art Mary</h1>
              <p style={isMobile ? mobileBrandTaglineStyle : brandTaglineStyle}>
                Tu librería y papelería de confianza • Calidad, creatividad y pasión en cada producto
              </p>
            </div>
          </div>
        </div>

        {/* Formulario - responsivo */}
        <div style={isMobile ? mobileFormCardStyle : formCardStyle}>
          {/* Encabezado del formulario */}
          <div style={isMobile ? mobileFormHeaderStyle : formHeaderStyle}>
            <h2 style={isMobile ? mobileFormTitleStyle : formTitleStyle}>
              {mostrarLogin ? '¡Bienvenido de nuevo!' : '¡Únete a nosotros!'}
            </h2>
            <p style={isMobile ? mobileFormSubtitleStyle : formSubtitleStyle}>
              {mostrarLogin
                ? 'Inicia sesión para explorar nuestro catálogo'
                : 'Crea tu cuenta y descubre productos increíbles'
              }
            </p>
          </div>

          {/* Botones de cambio */}
          <div style={isMobile ? mobileToggleContainerStyle : toggleContainerStyle}>
            <button
              onClick={() => setMostrarLogin(true)}
              style={{
                ...(isMobile ? mobileToggleButtonStyle : toggleButtonStyle),
                ...(mostrarLogin ? (isMobile ? mobileActiveToggleStyle : activeToggleStyle) : {})
              }}
              disabled={isLoading}
            >
              <span style={toggleIconStyle}>🔑</span>
              Iniciar Sesión
            </button>
            <button
              onClick={() => setMostrarLogin(false)}
              style={{
                ...(isMobile ? mobileToggleButtonStyle : toggleButtonStyle),
                ...(!mostrarLogin ? (isMobile ? mobileActiveToggleStyle : activeToggleStyle) : {})
              }}
              disabled={isLoading}
            >
              <span style={toggleIconStyle}>✨</span>
              Registrarse
            </button>
          </div>

          {mostrarLogin ? (
            /* Formulario de Login */
            <div style={isMobile ? mobileFormContentStyle : formContentStyle}>
              <div style={isMobile ? mobileInputGroupStyle : inputGroupStyle}>
                <label style={isMobile ? mobileLabelStyle : labelStyle}>
                  <span style={labelIconStyle}>📧</span>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'login')}
                  style={isMobile ? mobileInputStyle : inputStyle}
                  placeholder="tu@correo.com"
                  disabled={isLoading}
                  className="login-input"
                />
              </div>

              <div style={isMobile ? mobileInputGroupStyle : inputGroupStyle}>
                <label style={isMobile ? mobileLabelStyle : labelStyle}>
                  <span style={labelIconStyle}>🔒</span>
                  Contraseña
                </label>
                <input
                  type="password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'login')}
                  style={isMobile ? mobileInputStyle : inputStyle}
                  placeholder="Tu contraseña"
                  disabled={isLoading}
                  className="login-input"
                />
              </div>

              <div style={isMobile ? mobileForgotPasswordStyle : forgotPasswordStyle}>
                <Link
                  to="/solicitar-restablecimiento"
                  style={isMobile ? mobileForgotLinkStyle : forgotLinkStyle}
                  className="forgot-password-link"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button
                onClick={handleLogin}
                disabled={isLoading}
                style={{
                  ...(isMobile ? mobilePrimaryButtonStyle : primaryButtonStyle),
                  ...(isLoading ? loadingButtonStyle : {})
                }}
                className="login-button"
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
            <div style={isMobile ? mobileFormContentStyle : formContentStyle}>
              <div style={isMobile ? mobileInputGroupStyle : inputGroupStyle}>
                <label style={isMobile ? mobileLabelStyle : labelStyle}>
                  <span style={labelIconStyle}>👤</span>
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={nombreRegistro}
                  onChange={(e) => setNombreRegistro(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'register')}
                  style={isMobile ? mobileInputStyle : inputStyle}
                  placeholder="Tu nombre completo"
                  disabled={isLoading}
                  className="login-input"
                />
              </div>

              <div style={isMobile ? mobileInputGroupStyle : inputGroupStyle}>
                <label style={isMobile ? mobileLabelStyle : labelStyle}>
                  <span style={labelIconStyle}>📧</span>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={correoRegistro}
                  onChange={(e) => setCorreoRegistro(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'register')}
                  style={isMobile ? mobileInputStyle : inputStyle}
                  placeholder="tu@correo.com"
                  disabled={isLoading}
                  className="login-input"
                />
              </div>

              <div style={isMobile ? mobileInputGroupStyle : inputGroupStyle}>
                <label style={isMobile ? mobileLabelStyle : labelStyle}>
                  <span style={labelIconStyle}>🔑</span>
                  Contraseña
                </label>
                <input
                  type="password"
                  value={contrasenaRegistro}
                  onChange={(e) => setContrasenaRegistro(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'register')}
                  style={isMobile ? mobileInputStyle : inputStyle}
                  placeholder="Mínimo 6 caracteres"
                  disabled={isLoading}
                  className="login-input"
                />
              </div>

              <button
                onClick={handleRegister}
                disabled={isLoading}
                style={{
                  ...(isMobile ? mobilePrimaryButtonStyle : primaryButtonStyle),
                  ...(isLoading ? loadingButtonStyle : {})
                }}
                className="login-button"
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
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '500',
              background: isSuccessMessage(mensajeLocal)
                ? '#d4edda'  // Verde para éxito
                : '#f8d7da', // Rojo para error
              color: isSuccessMessage(mensajeLocal)
                ? '#155724'  // Texto verde oscuro para éxito
                : '#721c24', // Texto rojo oscuro para error
              border: `1px solid ${isSuccessMessage(mensajeLocal)
                ? '#c3e6cb'  // Borde verde para éxito
                : '#f5c6cb'  // Borde rojo para error
                }`
            }}>
              {mensajeLocal}
            </div>
          )}
        </div>

        {/* Decoraciones - solo desktop */}
        {!isMobile && (
          <div style={decorationsStyle}>
            <div style={floatingElementStyle}>💕</div>
            <div style={{ ...floatingElementStyle, ...floatingElement2Style }}>🌸</div>
            <div style={{ ...floatingElementStyle, ...floatingElement3Style }}>✨</div>
          </div>
        )}
      </div>

      {/* Modal de verificación */}
      {mostrarVerificacion && (
        <div style={modalOverlayStyle} onClick={() => setMostrarVerificacion(false)}>
          <div style={isMobile ? mobileModalContentStyle : modalContentStyle} onClick={(e) => e.stopPropagation()}>
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
            <div style={isMobile ? mobileModalActionsStyle : modalActionsStyle}>
              <button
                onClick={() => setMostrarVerificacion(false)}
                style={isMobile ? mobileModalCancelButtonStyle : modalCancelButtonStyle}
                disabled={enviandoVerificacion}
              >
                Cancelar
              </button>
              <button
                onClick={handleReenviarVerificacion}
                disabled={enviandoVerificacion}
                style={{
                  ...(isMobile ? mobileModalConfirmButtonStyle : modalConfirmButtonStyle),
                  opacity: enviandoVerificacion ? 0.7 : 1
                }}
              >
                {enviandoVerificacion ? (
                  <>
                    <div style={smallSpinnerStyle}></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <span>📧</span>
                    Reenviar Email
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

// ESTILOS DESKTOP
const containerStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #fdf2f8 0%, #fef3c7 25%, #fce7f3 50%, #e0e7ff 75%, #f3f4f6 100%)',
  padding: '2rem',
  paddingTop: '120px', // ← AGREGA ESTA LÍNEA
  fontFamily: 'Inter, system-ui, sans-serif',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const contentStyle = {
  display: 'flex',
  gap: '4rem',
  alignItems: 'center',
  maxWidth: '1200px',
  width: '100%'
};

const logoSectionStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center'
};

const logoBrandStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2rem'
};

const logoContainerStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const logoStyle = {
  height: '120px',
  width: '120px',
  objectFit: 'contain',
  borderRadius: '50%',
  transition: 'transform 0.3s ease',
  position: 'relative',
  zIndex: 2,
  boxShadow: '0 20px 40px rgba(236, 72, 153, 0.3)'
};

const logoGlowStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '150px',
  height: '150px',
  background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
  borderRadius: '50%',
  zIndex: 1,
  animation: 'pulse 3s ease-in-out infinite'
};

const brandTextStyle = {
  maxWidth: '500px'
};

const brandNameStyle = {
  fontSize: '3.5rem',
  fontWeight: '800',
  background: 'linear-gradient(135deg, #ec4899, #f472b6, #a855f7)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  margin: '0 0 1rem 0',
  lineHeight: 1.2,
  animation: 'rainbow 3s ease-in-out infinite'
};

const brandTaglineStyle = {
  fontSize: '1.25rem',
  color: '#6b7280',
  fontWeight: '500',
  lineHeight: 1.6,
  margin: 0
};

const formCardStyle = {
  flex: 1,
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  borderRadius: '2rem',
  padding: '3rem',
  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  minWidth: '450px',
  maxWidth: '500px',
  animation: 'slideIn 0.8s ease-out'
};

// ESTILOS MÓVIL
const mobileContainerStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #e0e7ff 100%)',
  padding: '1rem',
  paddingTop: '100px', // ← AGREGA ESTA LÍNEA
  fontFamily: 'Inter, system-ui, sans-serif'
};

const mobileContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem',
  minHeight: 'calc(100vh - 2rem)'
};

const mobileLogoSectionStyle = {
  textAlign: 'center',
  paddingTop: '2rem'
};

const mobileLogoBrandStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem'
};

const mobileLogoContainerStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const mobileLogoStyle = {
  height: '80px',
  width: '80px',
  objectFit: 'contain',
  borderRadius: '50%',
  boxShadow: '0 15px 30px rgba(236, 72, 153, 0.3)'
};

const mobileLogoGlowStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '100px',
  height: '100px',
  background: 'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%)',
  borderRadius: '50%',
  zIndex: 1
};

const mobileBrandTextStyle = {
  maxWidth: '100%'
};

const mobileBrandNameStyle = {
  fontSize: '2.5rem',
  fontWeight: '800',
  color: '#ec4899', // Color sólido directo
  margin: '0 0 0.5rem 0',
  lineHeight: 1.2,
  textShadow: '0 2px 4px rgba(236, 72, 153, 0.3)' // Sombra para darle más estilo
};

const mobileBrandTaglineStyle = {
  fontSize: '1rem',
  color: '#6b7280',
  fontWeight: '500',
  lineHeight: 1.5,
  margin: 0,
  padding: '0 1rem'
};

const mobileFormCardStyle = {
  flex: 1,
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  borderRadius: '1.5rem',
  padding: '2rem 1.5rem',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  margin: '0 auto',
  width: '100%',
  maxWidth: '400px'
};

// ESTILOS COMUNES ADAPTADOS
const formHeaderStyle = {
  textAlign: 'center',
  marginBottom: '2rem'
};

const mobileFormHeaderStyle = {
  textAlign: 'center',
  marginBottom: '1.5rem'
};

const formTitleStyle = {
  fontSize: '2rem',
  fontWeight: '700',
  color: '#1f2937',
  margin: '0 0 0.5rem 0'
};

const mobileFormTitleStyle = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: '#1f2937',
  margin: '0 0 0.5rem 0'
};

const formSubtitleStyle = {
  fontSize: '1rem',
  color: '#6b7280',
  margin: 0
};

const mobileFormSubtitleStyle = {
  fontSize: '0.9rem',
  color: '#6b7280',
  margin: 0
};

const toggleContainerStyle = {
  display: 'flex',
  background: '#f3f4f6',
  borderRadius: '1rem',
  padding: '0.5rem',
  marginBottom: '2rem',
  gap: '0.5rem'
};

const mobileToggleContainerStyle = {
  display: 'flex',
  background: '#f3f4f6',
  borderRadius: '0.75rem',
  padding: '0.25rem',
  marginBottom: '1.5rem',
  gap: '0.25rem'
};

const toggleButtonStyle = {
  flex: 1,
  padding: '0.75rem 1rem',
  background: 'transparent',
  border: 'none',
  borderRadius: '0.75rem',
  fontSize: '0.9rem',
  fontWeight: '600',
  color: '#6b7280',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem'
};

const mobileToggleButtonStyle = {
  flex: 1,
  padding: '0.6rem 0.75rem',
  background: 'transparent',
  border: 'none',
  borderRadius: '0.5rem',
  fontSize: '0.8rem',
  fontWeight: '600',
  color: '#6b7280',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.4rem'
};

const activeToggleStyle = {
  background: 'white',
  color: '#ec4899',
  boxShadow: '0 4px 12px rgba(236, 72, 153, 0.2)'
};

const mobileActiveToggleStyle = {
  background: 'white',
  color: '#ec4899',
  boxShadow: '0 2px 8px rgba(236, 72, 153, 0.2)'
};

const toggleIconStyle = {
  fontSize: '1rem'
};

const formContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
};

const mobileFormContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const mobileInputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem'
};

const labelStyle = {
  fontSize: '0.875rem',
  fontWeight: '600',
  color: '#374151',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const mobileLabelStyle = {
  fontSize: '0.8rem',
  fontWeight: '600',
  color: '#374151',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem'
};

const labelIconStyle = {
  fontSize: '1rem'
};

const inputStyle = {
  padding: '1rem',
  border: '2px solid #e5e7eb',
  borderRadius: '0.75rem',
  fontSize: '1rem',
  transition: 'all 0.3s ease',
  background: 'white'
};

const mobileInputStyle = {
  padding: '0.8rem',
  border: '2px solid #e5e7eb',
  borderRadius: '0.6rem',
  fontSize: '0.9rem',
  transition: 'all 0.3s ease',
  background: 'white'
};

const forgotPasswordStyle = {
  textAlign: 'right'
};

const mobileForgotPasswordStyle = {
  textAlign: 'center'
};

const forgotLinkStyle = {
  fontSize: '0.875rem',
  color: '#ec4899',
  textDecoration: 'none',
  fontWeight: '500',
  transition: 'all 0.3s ease'
};

const mobileForgotLinkStyle = {
  fontSize: '0.8rem',
  color: '#ec4899',
  textDecoration: 'none',
  fontWeight: '500',
  transition: 'all 0.3s ease'
};

const primaryButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  width: '100%',
  padding: '1rem 2rem',
  background: 'linear-gradient(135deg, #ec4899, #f472b6)',
  color: 'white',
  border: 'none',
  borderRadius: '0.75rem',
  fontSize: '1rem',
  fontWeight: '700',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 8px 20px rgba(236, 72, 153, 0.4)',
  marginTop: '1rem'
};

const mobilePrimaryButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.6rem',
  width: '100%',
  padding: '0.9rem 1.5rem',
  background: 'linear-gradient(135deg, #ec4899, #f472b6)',
  color: 'white',
  border: 'none',
  borderRadius: '0.6rem',
  fontSize: '0.9rem',
  fontWeight: '700',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 6px 16px rgba(236, 72, 153, 0.4)',
  marginTop: '1rem'
};

const loadingButtonStyle = {
  opacity: 0.7,
  cursor: 'not-allowed'
};

const buttonIconStyle = {
  fontSize: '1.1rem'
};

const spinnerStyle = {
  width: '20px',
  height: '20px',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderTop: '2px solid white',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const smallSpinnerStyle = {
  width: '16px',
  height: '16px',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderTop: '2px solid white',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const messageStyle = {
  padding: '1rem',
  borderRadius: '0.75rem',
  fontSize: '0.9rem',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  marginTop: '1rem',
  animation: 'slideIn 0.3s ease-out'
};

const mobileMessageStyle = {
  padding: '0.8rem',
  borderRadius: '0.6rem',
  fontSize: '0.8rem',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  marginTop: '1rem',
  animation: 'slideIn 0.3s ease-out'
};

const successMessageStyle = {
  background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
  color: '#166534',
  border: '1px solid #22c55e'
};

const errorMessageStyle = {
  background: 'linear-gradient(135deg, #fef2f2, #fecaca)',
  color: '#dc2626',
  border: '1px solid #ef4444'
};

const messageIconStyle = {
  fontSize: '1.2rem'
};

const decorationsStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  zIndex: 1
};

const floatingElementStyle = {
  position: 'absolute',
  fontSize: '2rem',
  opacity: 0.1,
  animation: 'float 6s ease-in-out infinite'
};

const floatingElement2Style = {
  top: '20%',
  right: '10%',
  animationDelay: '2s'
};

const floatingElement3Style = {
  bottom: '20%',
  left: '10%',
  animationDelay: '4s'
};

// ESTILOS DEL MODAL
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
  backdropFilter: 'blur(5px)',
  padding: '1rem'
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

const mobileModalContentStyle = {
  background: 'white',
  borderRadius: '1.2rem',
  padding: '1.5rem',
  maxWidth: '350px',
  width: '95%',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
  animation: 'slideIn 0.3s ease-out'
};

const modalHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  marginBottom: '1.5rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid #e5e7eb'
};

const modalIconStyle = {
  fontSize: '2rem'
};

const modalTitleStyle = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: '#1f2937',
  margin: 0
};

const modalBodyStyle = {
  marginBottom: '2rem'
};

const modalTextStyle = {
  fontSize: '1rem',
  color: '#6b7280',
  lineHeight: 1.6,
  marginBottom: '1rem'
};

const emailInfoStyle = {
  background: '#f3f4f6',
  padding: '1rem',
  borderRadius: '0.5rem',
  fontSize: '0.9rem',
  color: '#374151',
  marginBottom: '1rem'
};

const modalSubtextStyle = {
  fontSize: '0.9rem',
  color: '#9ca3af',
  lineHeight: 1.5,
  margin: 0
};

const modalActionsStyle = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'flex-end'
};

const mobileModalActionsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
};

const modalCancelButtonStyle = {
  padding: '0.75rem 1.5rem',
  background: '#f3f4f6',
  color: '#374151',
  border: 'none',
  borderRadius: '0.5rem',
  fontSize: '0.9rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease'
};

const mobileModalCancelButtonStyle = {
  padding: '0.8rem 1rem',
  background: '#f3f4f6',
  color: '#374151',
  border: 'none',
  borderRadius: '0.5rem',
  fontSize: '0.9rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease'
};

const modalConfirmButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1.5rem',
  background: 'linear-gradient(135deg, #ec4899, #f472b6)',
  color: 'white',
  border: 'none',
  borderRadius: '0.5rem',
  fontSize: '0.9rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease'
};

const mobileModalConfirmButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '0.8rem 1rem',
  background: 'linear-gradient(135deg, #ec4899, #f472b6)',
  color: 'white',
  border: 'none',
  borderRadius: '0.5rem',
  fontSize: '0.9rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease'
};

// ANIMACIONES CSS
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

@keyframes pulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 0.5;
  }
}

@keyframes rainbow {
  0%, 100% { filter: hue-rotate(0deg); }
  50% { filter: hue-rotate(30deg); }
}

.login-input:focus {
  border-color: #ec4899 !important;
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1) !important;
  outline: none;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(236, 72, 153, 0.5) !important;
}

.forgot-password-link:hover {
  color: #be185d !important;
  transform: translateY(-1px);
}

/* Responsive mejoras adicionales */
@media (max-width: 768px) {
  .login-content {
    flex-direction: column;
    gap: 2rem;
    padding: 1rem;
  }
  
  .login-form-card {
    min-width: auto;
    padding: 1.5rem;
  }
  
  .login-logo-section {
    order: -1;
  }

  /* Mejoras de touch para móvil */
  .login-input {
    -webkit-appearance: none;
    -webkit-tap-highlight-color: transparent;
  }
  
  .login-button {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
}

@media (max-width: 480px) {
  .mobile-form-card {
    padding: 1.2rem !important;
    border-radius: 1rem !important;
  }
  
  .mobile-brand-name {
    font-size: 2rem !important;
  }
  
  .mobile-form-title {
    font-size: 1.3rem !important;
  }
}

/* Mejoras para pantallas muy pequeñas */
@media (max-width: 320px) {
  .mobile-container {
    padding: 0.5rem !important;
  }
  
  .mobile-form-card {
    padding: 1rem !important;
  }
}
  /* Forzar re-render en cambios de viewport */
@media (min-width: 769px) {
  .mobile-container {
    display: none !important;
  }
}

@media (max-width: 768px) {
  .desktop-container {
    display: none !important;
  }
}

/* Arreglo para texto invisible en móvil */
@media (max-width: 768px) {
  .mobile-brand-name {
    background: linear-gradient(135deg, #ec4899, #f472b6) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
    color: #ec4899 !important; /* Fallback */
  }
  
  /* Si el gradiente falla, usar color sólido */
  @supports not (background-clip: text) {
    .mobile-brand-name {
      color: #ec4899 !important;
      background: none !important;
      -webkit-text-fill-color: #ec4899 !important;
    }
  }
}
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('login-responsive-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'login-responsive-styles';
    styleSheet.textContent = additionalStyles;
    document.head.appendChild(styleSheet);
  }
}

export default Login;
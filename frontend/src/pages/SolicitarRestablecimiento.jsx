// src/pages/SolicitarRestablecimiento.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import logo from '../assets/artmary-logo.png';

function SolicitarRestablecimiento() {
    const [correo, setCorreo] = useState('');
    const [estado, setEstado] = useState('formulario'); // 'formulario', 'cargando', 'enviado'
    const [mensaje, setMensaje] = useState('');

    const validarEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje('');

        if (!correo) {
            setMensaje('El correo electrónico es requerido.');
            return;
        }

        if (!validarEmail(correo)) {
            setMensaje('Por favor ingresa un correo electrónico válido.');
            return;
        }

        setEstado('cargando');

        try {
            const response = await axios.post('/auth/solicitar-restablecimiento', {
                correo
            });

            if (response.data.sent) {
                setEstado('enviado');
                setMensaje(response.data.mensaje);
            }
        } catch (error) {
            console.error('Error solicitando restablecimiento:', error);
            
            const errorMsg = error.response?.data?.mensaje || 'Error al enviar la solicitud.';
            
            if (error.response?.data?.requiresVerification) {
                setEstado('formulario');
                setMensaje('Tu cuenta necesita ser verificada primero. Revisa tu email para el enlace de verificación.');
            } else {
                setEstado('formulario');
                setMensaje(errorMsg);
            }
        }
    };

    if (estado === 'enviado') {
        return (
            <div style={containerStyle}>
                <div style={cardStyle}>
                    <div style={successContainerStyle}>
                        <div style={logoContainerStyle}>
                            <img src={logo} alt="Art Mary Logo" style={logoImageStyle} />
                        </div>
                        <div style={successIconStyle}>📧</div>
                        <h1 style={successTitleStyle}>¡Email Enviado!</h1>
                        <p style={successMessageStyle}>{mensaje}</p>
                        <div style={successDetailsStyle}>
                            <h4 style={detailsTitleStyle}>📋 Próximos pasos:</h4>
                            <ul style={detailsListStyle}>
                                <li>📨 Revisa tu bandeja de entrada</li>
                                <li>📁 Si no lo encuentras, revisa la carpeta de spam</li>
                                <li>🔗 Haz clic en el enlace del email</li>
                                <li>⏰ El enlace expira en 1 hora</li>
                            </ul>
                        </div>
                        <div style={actionButtonsStyle}>
                            <Link to="/login" style={primaryButtonStyle}>
                                <span style={buttonIconStyle}>🔑</span>
                                Volver al Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <div style={formContainerStyle}>
                    {/* Logo y título */}
                    <div style={logoContainerStyle}>
                        <img src={logo} alt="Art Mary Logo" style={logoImageStyle} />
                    </div>
                    
                    <div style={headerStyle}>
                        <h1 style={titleStyle}>
                            <span style={titleIconStyle}>🔐</span>
                            ¿Olvidaste tu Contraseña?
                        </h1>
                        <p style={subtitleStyle}>
                            No te preocupes, te ayudamos a recuperar el acceso a tu cuenta de Art Mary
                        </p>
                    </div>

                    {/* Información del proceso */}
                    <div style={infoBoxStyle}>
                        <div style={infoIconStyle}>💡</div>
                        <div style={infoContentStyle}>
                            <h4 style={infoTitleStyle}>¿Cómo funciona?</h4>
                            <p style={infoTextStyle}>
                                Ingresa tu correo electrónico y te enviaremos un enlace seguro para crear una nueva contraseña.
                            </p>
                        </div>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} style={formStyle}>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>
                                <span style={labelIconStyle}>📧</span>
                                Correo Electrónico
                            </label>
                            <input
                                type="email"
                                value={correo}
                                onChange={(e) => setCorreo(e.target.value)}
                                style={inputStyle}
                                placeholder="tu@correo.com"
                                disabled={estado === 'cargando'}
                                className="solicitar-input"
                            />
                            <div style={inputHelpStyle}>
                                Ingresa el correo con el que te registraste en Art Mary
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={estado === 'cargando'}
                            style={{
                                ...primaryButtonStyle,
                                ...(estado === 'cargando' ? loadingButtonStyle : {})
                            }}
                            className="solicitar-button"
                        >
                            {estado === 'cargando' ? (
                                <>
                                    <div style={spinnerStyle}></div>
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <span style={buttonIconStyle}>📨</span>
                                    Enviar Enlace de Restablecimiento
                                </>
                            )}
                        </button>

                        {/* Mensaje de error */}
                        {mensaje && estado === 'formulario' && (
                            <div style={{
                                ...messageBoxStyle,
                                ...(mensaje.includes('verificada') ? warningMessageStyle : errorMessageStyle)
                            }}>
                                <span style={messageIconStyle}>
                                    {mensaje.includes('verificada') ? '⚠️' : '❌'}
                                </span>
                                {mensaje}
                            </div>
                        )}
                    </form>

                    {/* Enlaces adicionales */}
                    <div style={linksContainerStyle}>
                        <div style={linkGroupStyle}>
                            <Link to="/login" style={linkStyle} className="solicitar-link">
                                <span style={linkIconStyle}>🔑</span>
                                Volver al Login
                            </Link>
                            <Link to="/login" style={linkStyle} className="solicitar-link">
                                <span style={linkIconStyle}>📧</span>
                                ¿Necesitas verificar tu cuenta?
                            </Link>
                        </div>
                    </div>

                    {/* Información de seguridad */}
                    <div style={securityInfoStyle}>
                        <div style={securityIconStyle}>🛡️</div>
                        <div style={securityTextStyle}>
                            <strong>Seguridad:</strong> El enlace de restablecimiento expira en 1 hora y solo puede usarse una vez.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Estilos
const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--gradient-background)',
    padding: '2rem',
    fontFamily: 'var(--font-sans)'
};

const cardStyle = {
    background: 'white',
    borderRadius: '2rem',
    padding: '3rem',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
    border: '1px solid var(--neutral-200)',
    maxWidth: '500px',
    width: '100%',
    animation: 'slideIn 0.6s ease-out'
};

const logoContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '2rem'
};

const logoImageStyle = {
    width: '80px',
    height: '80px',
    objectFit: 'contain',
    borderRadius: '1rem'
};

const formContainerStyle = {
    textAlign: 'center'
};

const headerStyle = {
    marginBottom: '2rem'
};

const titleStyle = {
    fontSize: '2rem',
    fontWeight: '800',
    color: 'var(--neutral-800)',
    margin: '0 0 1rem 0',
    fontFamily: 'var(--font-display)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem'
};

const titleIconStyle = {
    fontSize: '2rem'
};

const subtitleStyle = {
    fontSize: '1rem',
    color: 'var(--neutral-600)',
    margin: 0,
    lineHeight: 1.6
};

const infoBoxStyle = {
    display: 'flex',
    gap: '1rem',
    padding: '1.5rem',
    background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
    borderRadius: '1rem',
    border: '1px solid #3b82f6',
    marginBottom: '2rem',
    textAlign: 'left'
};

const infoIconStyle = {
    fontSize: '2rem',
    flexShrink: 0
};

const infoContentStyle = {
    flex: 1
};

const infoTitleStyle = {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#1e40af',
    margin: '0 0 0.5rem 0'
};

const infoTextStyle = {
    fontSize: '0.875rem',
    color: '#1e40af',
    margin: 0,
    lineHeight: 1.5,
    opacity: 0.9
};

const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    textAlign: 'left'
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

const inputHelpStyle = {
    fontSize: '0.75rem',
    color: 'var(--neutral-500)',
    fontStyle: 'italic'
};

const primaryButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '1rem 2rem',
    background: 'var(--gradient-primary)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--border-radius-xl)',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 25px rgba(236, 72, 153, 0.4)',
    textDecoration: 'none'
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

const messageBoxStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: 'var(--border-radius-xl)',
    border: '1px solid',
    fontSize: '0.875rem',
    fontWeight: '600'
};

const errorMessageStyle = {
    background: 'linear-gradient(135deg, #fef2f2, #fecaca)',
    color: '#dc2626',
    borderColor: '#ef4444'
};

const warningMessageStyle = {
    background: 'linear-gradient(135deg, #fefce8, #fef3c7)',
    color: '#d97706',
    borderColor: '#f59e0b'
};

const messageIconStyle = {
    fontSize: '1.25rem'
};

const linksContainerStyle = {
    marginTop: '2rem'
};

const linkGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    alignItems: 'center'
};

const linkStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--primary-600)',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.3s ease'
};

const linkIconStyle = {
    fontSize: '1rem'
};

const securityInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    background: 'var(--neutral-50)',
    borderRadius: '1rem',
    border: '1px solid var(--neutral-200)',
    marginTop: '2rem'
};

const securityIconStyle = {
    fontSize: '1.5rem',
    flexShrink: 0
};

const securityTextStyle = {
    fontSize: '0.75rem',
    color: 'var(--neutral-600)',
    lineHeight: 1.4
};

// Estados de éxito
const successContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    textAlign: 'center'
};

const successIconStyle = {
    fontSize: '4rem',
    animation: 'bounce 2s infinite'
};

const successTitleStyle = {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#22c55e',
    margin: 0,
    fontFamily: 'var(--font-display)'
};

const successMessageStyle = {
    fontSize: '1.125rem',
    color: 'var(--neutral-700)',
    margin: 0,
    lineHeight: 1.6
};

const successDetailsStyle = {
    background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
    padding: '1.5rem',
    borderRadius: '1rem',
    border: '1px solid #22c55e',
    textAlign: 'left',
    width: '100%'
};

const detailsTitleStyle = {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#166534',
    margin: '0 0 1rem 0'
};

const detailsListStyle = {
    margin: 0,
    paddingLeft: '1rem',
    color: '#166534'
};

const actionButtonsStyle = {
    display: 'flex',
    gap: '1rem',
    flexDirection: 'column',
    width: '100%'
};

// CSS adicional para animaciones
const additionalStyles = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.solicitar-input:focus {
  border-color: var(--primary-500) !important;
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1) !important;
}

.solicitar-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(236, 72, 153, 0.5) !important;
}

.solicitar-link:hover {
  color: var(--primary-700) !important;
  transform: translateX(2px);
}
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
    const existingStyle = document.getElementById('solicitar-restablecimiento-styles');
    if (!existingStyle) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'solicitar-restablecimiento-styles';
        styleSheet.textContent = additionalStyles;
        document.head.appendChild(styleSheet);
    }
}

export default SolicitarRestablecimiento;
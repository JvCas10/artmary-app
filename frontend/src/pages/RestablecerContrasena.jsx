// src/pages/RestablecerContrasena.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import logo from '../assets/artmary-logo.png';

function RestablecerContrasena() {
    const [searchParams] = useSearchParams();
    const [estado, setEstado] = useState('formulario'); // 'formulario', 'cargando', 'exito', 'error'
    const [nuevaContrasena, setNuevaContrasena] = useState('');
    const [confirmarContrasena, setConfirmarContrasena] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [mostrarContrasenas, setMostrarContrasenas] = useState(false);
    const navigate = useNavigate();

    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setEstado('error');
            setMensaje('Token de restablecimiento no encontrado en el enlace.');
        }
    }, [token]);

    const validarFormulario = () => {
        if (!nuevaContrasena) {
            setMensaje('La nueva contraseña es requerida.');
            return false;
        }
        if (nuevaContrasena.length < 6) {
            setMensaje('La contraseña debe tener al menos 6 caracteres.');
            return false;
        }
        if (nuevaContrasena !== confirmarContrasena) {
            setMensaje('Las contraseñas no coinciden.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje('');

        if (!validarFormulario()) {
            return;
        }

        setEstado('cargando');

        try {
            const response = await api.post(`/auth/restablecer-contrasena?token=${token}`, { nuevaContrasena });

            if (response.data.success) {
                setEstado('exito');
                setMensaje(response.data.mensaje);
                
                // Redirigir al login después de 3 segundos
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } catch (error) {
            console.error('Error restableciendo contraseña:', error);
            
            const errorMsg = error.response?.data?.mensaje || 'Error al restablecer la contraseña.';
            
            if (error.response?.data?.expired) {
                setEstado('error');
                setMensaje('El enlace de restablecimiento ha expirado. Solicita uno nuevo.');
            } else {
                setEstado('formulario');
                setMensaje(errorMsg);
            }
        }
    };

    if (!token || estado === 'error') {
        return (
            <div style={containerStyle}>
                <div style={cardStyle}>
                    <div style={errorContainerStyle}>
                        <div style={logoContainerStyle}>
                            <img src={logo} alt="Art Mary Logo" style={logoImageStyle} />
                        </div>
                        <div style={errorIconStyle}>❌</div>
                        <h1 style={errorTitleStyle}>Error</h1>
                        <p style={errorMessageStyle}>
                            {mensaje || 'Token de restablecimiento inválido o expirado.'}
                        </p>
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

    if (estado === 'exito') {
        return (
            <div style={containerStyle}>
                <div style={cardStyle}>
                    <div style={successContainerStyle}>
                        <div style={logoContainerStyle}>
                            <img src={logo} alt="Art Mary Logo" style={logoImageStyle} />
                        </div>
                        <div style={successIconStyle}>✅</div>
                        <h1 style={successTitleStyle}>¡Contraseña Restablecida!</h1>
                        <p style={successMessageStyle}>{mensaje}</p>
                        <div style={successDetailsStyle}>
                            <p>🎉 Tu contraseña ha sido actualizada exitosamente</p>
                            <p>🔐 Ya puedes iniciar sesión con tu nueva contraseña</p>
                            <p>🔄 Serás redirigido al login en unos segundos...</p>
                        </div>
                        <Link to="/login" style={primaryButtonStyle}>
                            <span style={buttonIconStyle}>🚀</span>
                            Ir al Login
                        </Link>
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
                            Restablecer Contraseña
                        </h1>
                        <p style={subtitleStyle}>
                            Ingresa tu nueva contraseña para Art Mary
                        </p>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} style={formStyle}>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>
                                <span style={labelIconStyle}>🔒</span>
                                Nueva Contraseña
                            </label>
                            <div style={passwordContainerStyle}>
                                <input
                                    type={mostrarContrasenas ? "text" : "password"}
                                    value={nuevaContrasena}
                                    onChange={(e) => setNuevaContrasena(e.target.value)}
                                    style={inputStyle}
                                    placeholder="Mínimo 6 caracteres"
                                    disabled={estado === 'cargando'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setMostrarContrasenas(!mostrarContrasenas)}
                                    style={togglePasswordStyle}
                                    disabled={estado === 'cargando'}
                                >
                                    {mostrarContrasenas ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                        </div>

                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>
                                <span style={labelIconStyle}>🔒</span>
                                Confirmar Nueva Contraseña
                            </label>
                            <input
                                type={mostrarContrasenas ? "text" : "password"}
                                value={confirmarContrasena}
                                onChange={(e) => setConfirmarContrasena(e.target.value)}
                                style={inputStyle}
                                placeholder="Repite la nueva contraseña"
                                disabled={estado === 'cargando'}
                            />
                        </div>

                        {/* Indicador de fortaleza de contraseña */}
                        {nuevaContrasena && (
                            <div style={passwordStrengthStyle}>
                                <div style={strengthLabelStyle}>Fortaleza de la contraseña:</div>
                                <div style={strengthBarContainerStyle}>
                                    <div 
                                        style={{
                                            ...strengthBarStyle,
                                            width: `${Math.min((nuevaContrasena.length / 12) * 100, 100)}%`,
                                            background: nuevaContrasena.length < 6 ? '#ef4444' : 
                                                       nuevaContrasena.length < 8 ? '#f59e0b' : '#22c55e'
                                        }}
                                    ></div>
                                </div>
                                <div style={strengthTextStyle}>
                                    {nuevaContrasena.length < 6 ? 'Débil' : 
                                     nuevaContrasena.length < 8 ? 'Media' : 'Fuerte'}
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={estado === 'cargando'}
                            style={{
                                ...primaryButtonStyle,
                                ...(estado === 'cargando' ? loadingButtonStyle : {}),
                                marginTop: '1rem'
                            }}
                        >
                            {estado === 'cargando' ? (
                                <>
                                    <div style={spinnerStyle}></div>
                                    Restableciendo...
                                </>
                            ) : (
                                <>
                                    <span style={buttonIconStyle}>🔐</span>
                                    Restablecer Contraseña
                                </>
                            )}
                        </button>

                        {/* Mensaje de error */}
                        {mensaje && estado === 'formulario' && (
                            <div style={errorMessageBoxStyle}>
                                <span style={messageIconStyle}>⚠️</span>
                                {mensaje}
                            </div>
                        )}
                    </form>

                    {/* Enlaces adicionales */}
                    <div style={linksContainerStyle}>
                        <Link to="/login" style={linkStyle}>
                            <span style={linkIconStyle}>🔑</span>
                            Volver al Login
                        </Link>
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
    lineHeight: 1.5
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

const passwordContainerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
};

const inputStyle = {
    flex: 1,
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

const togglePasswordStyle = {
    position: 'absolute',
    right: '1rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.25rem',
    color: 'var(--neutral-500)',
    padding: '0.25rem',
    borderRadius: '0.25rem',
    transition: 'all 0.2s ease'
};

const passwordStrengthStyle = {
    marginTop: '0.5rem'
};

const strengthLabelStyle = {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--neutral-600)',
    marginBottom: '0.5rem'
};

const strengthBarContainerStyle = {
    width: '100%',
    height: '4px',
    background: 'var(--neutral-200)',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '0.25rem'
};

const strengthBarStyle = {
    height: '100%',
    transition: 'all 0.3s ease',
    borderRadius: '2px'
};

const strengthTextStyle = {
    fontSize: '0.75rem',
    fontWeight: '500',
    color: 'var(--neutral-600)',
    textAlign: 'right'
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

const errorMessageBoxStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    background: 'linear-gradient(135deg, #fef2f2, #fecaca)',
    color: '#dc2626',
    borderRadius: 'var(--border-radius-xl)',
    border: '1px solid #ef4444',
    fontSize: '0.875rem',
    fontWeight: '600'
};

const messageIconStyle = {
    fontSize: '1.25rem'
};

const linksContainerStyle = {
    marginTop: '2rem',
    textAlign: 'center'
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

// Estados de éxito y error
const successContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    textAlign: 'center'
};

const successIconStyle = {
    fontSize: '4rem',
    animation: 'bounce 1s infinite'
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

const errorContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    textAlign: 'center'
};

const errorIconStyle = {
    fontSize: '4rem'
};

const errorTitleStyle = {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#ef4444',
    margin: 0,
    fontFamily: 'var(--font-display)'
};

const errorMessageStyle = {
    fontSize: '1.125rem',
    color: 'var(--neutral-700)',
    margin: 0,
    lineHeight: 1.6
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

.restablecer-input:focus {
  border-color: var(--primary-500) !important;
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1) !important;
}

.restablecer-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(236, 72, 153, 0.5) !important;
}

.toggle-password:hover {
  background: var(--neutral-100) !important;
  color: var(--primary-600) !important;
}

.restablecer-link:hover {
  color: var(--primary-700) !important;
  transform: translateX(2px);
}
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
    const existingStyle = document.getElementById('restablecer-contrasena-styles');
    if (!existingStyle) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'restablecer-contrasena-styles';
        styleSheet.textContent = additionalStyles;
        document.head.appendChild(styleSheet);
    }
}

export default RestablecerContrasena;
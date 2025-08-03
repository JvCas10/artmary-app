// src/pages/VerificarEmail.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function VerificarEmail() {
    const [searchParams] = useSearchParams();
    const [estado, setEstado] = useState('verificando'); // 'verificando', 'exito', 'error', 'expirado'
    const [mensaje, setMensaje] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const verificarToken = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setEstado('error');
                setMensaje('Token de verificación no encontrado en el enlace.');
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`http://localhost:5000/api/auth/verificar-email?token=${token}`);

                if (response.data.verified) {
                    setEstado('exito');
                    setMensaje(response.data.mensaje);

                    // Redirigir al login después de 3 segundos
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                }
            } catch (error) {
                console.error('Error verificando email:', error);

                const errorMsg = error.response?.data?.mensaje || '';

                // Si el mensaje contiene "expirado", es realmente expirado
                if (error.response?.data?.expired || errorMsg.toLowerCase().includes('expirado')) {
                    setEstado('expirado');
                    setMensaje('El enlace de verificación ha expirado.');
                }
                // Si dice "inválido", podría ser que ya se usó
                else if (errorMsg.toLowerCase().includes('inválido')) {
                    setEstado('error');
                    setMensaje('Este enlace ya fue usado o no es válido. Si ya verificaste tu cuenta, puedes iniciar sesión normalmente.');
                }
                else {
                    setEstado('error');
                    setMensaje(errorMsg || 'Error al verificar el email.');
                }
            }
        };

        verificarToken();
    }, [searchParams, navigate]);

    const handleReenviarVerificacion = async () => {
        // Esta función se implementará cuando tengamos el email del usuario
        // Por ahora redirigimos al login para que puedan solicitar reenvío
        navigate('/login');
    };

    if (loading) {
        return (
            <div style={containerStyle}>
                <div style={cardStyle}>
                    <div style={loadingContainerStyle}>
                        <div style={spinnerStyle}></div>
                        <h2 style={titleStyle}>Verificando tu email...</h2>
                        <p style={subtitleStyle}>Por favor espera un momento</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                {estado === 'exito' && (
                    <div style={successContainerStyle}>
                        <div style={successIconStyle}>✅</div>
                        <h1 style={successTitleStyle}>¡Email Verificado!</h1>
                        <p style={successMessageStyle}>{mensaje}</p>
                        <div style={successDetailsStyle}>
                            <p>🎉 Tu cuenta ha sido activada exitosamente</p>
                            <p>📧 Has recibido un email de bienvenida</p>
                            <p>🔄 Serás redirigido al login en unos segundos...</p>
                        </div>
                        <Link to="/login" style={primaryButtonStyle}>
                            <span style={buttonIconStyle}>🚀</span>
                            Ir al Login
                        </Link>
                    </div>
                )}

                {estado === 'error' && (
                    <div style={errorContainerStyle}>
                        <div style={errorIconStyle}>❌</div>
                        <h1 style={errorTitleStyle}>Error de Verificación</h1>
                        <p style={errorMessageStyle}>{mensaje}</p>
                        <div style={errorDetailsStyle}>
                            <p>Posibles causas:</p>
                            <ul>
                                <li>El enlace está malformado</li>
                                <li>El token no es válido</li>
                                <li>Ya se verificó anteriormente</li>
                            </ul>
                        </div>
                        <div style={actionButtonsStyle}>
                            <button
                                onClick={handleReenviarVerificacion}
                                style={secondaryButtonStyle}
                            >
                                <span style={buttonIconStyle}>📧</span>
                                Solicitar Nuevo Enlace
                            </button>
                            <Link to="/login" style={primaryButtonStyle}>
                                <span style={buttonIconStyle}>🔑</span>
                                Ir al Login
                            </Link>
                        </div>
                    </div>
                )}

                {estado === 'expirado' && (
                    <div style={expiredContainerStyle}>
                        <div style={expiredIconStyle}>⏰</div>
                        <h1 style={expiredTitleStyle}>Enlace Expirado</h1>
                        <p style={expiredMessageStyle}>{mensaje}</p>
                        <div style={expiredDetailsStyle}>
                            <p>🕐 Los enlaces de verificación expiran después de 24 horas por seguridad.</p>
                            <p>📧 Puedes solicitar un nuevo enlace de verificación.</p>
                        </div>
                        <div style={actionButtonsStyle}>
                            <button
                                onClick={handleReenviarVerificacion}
                                style={primaryButtonStyle}
                            >
                                <span style={buttonIconStyle}>📧</span>
                                Solicitar Nuevo Enlace
                            </button>
                            <Link to="/login" style={secondaryButtonStyle}>
                                <span style={buttonIconStyle}>🔑</span>
                                Ir al Login
                            </Link>
                        </div>
                    </div>
                )}
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
    textAlign: 'center',
    animation: 'slideIn 0.6s ease-out'
};

const loadingContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem'
};

const spinnerStyle = {
    width: '50px',
    height: '50px',
    border: '4px solid var(--secondary-200)',
    borderTop: '4px solid var(--primary-500)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
};

const titleStyle = {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: 'var(--neutral-800)',
    margin: 0
};

const subtitleStyle = {
    fontSize: '1rem',
    color: 'var(--neutral-600)',
    margin: 0
};

const successContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem'
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
    textAlign: 'left'
};

const errorContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem'
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

const errorDetailsStyle = {
    background: 'linear-gradient(135deg, #fef2f2, #fecaca)',
    padding: '1.5rem',
    borderRadius: '1rem',
    border: '1px solid #ef4444',
    textAlign: 'left',
    fontSize: '0.875rem',
    color: 'var(--neutral-600)'
};

const expiredContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem'
};

const expiredIconStyle = {
    fontSize: '4rem'
};

const expiredTitleStyle = {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#f59e0b',
    margin: 0,
    fontFamily: 'var(--font-display)'
};

const expiredMessageStyle = {
    fontSize: '1.125rem',
    color: 'var(--neutral-700)',
    margin: 0,
    lineHeight: 1.6
};

const expiredDetailsStyle = {
    background: 'linear-gradient(135deg, #fefce8, #fef3c7)',
    padding: '1.5rem',
    borderRadius: '1rem',
    border: '1px solid #f59e0b',
    textAlign: 'left',
    fontSize: '0.875rem',
    color: 'var(--neutral-600)'
};

const actionButtonsStyle = {
    display: 'flex',
    gap: '1rem',
    flexDirection: 'column',
    width: '100%'
};

const primaryButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '1rem 2rem',
    background: 'var(--gradient-primary)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '1rem',
    fontSize: '1rem',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 25px rgba(236, 72, 153, 0.4)',
    border: 'none',
    cursor: 'pointer'
};

const secondaryButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '1rem 2rem',
    background: 'transparent',
    color: 'var(--primary-600)',
    textDecoration: 'none',
    borderRadius: '1rem',
    fontSize: '1rem',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    border: '2px solid var(--primary-300)',
    cursor: 'pointer'
};

const buttonIconStyle = {
    fontSize: '1.25rem'
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
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
    const existingStyle = document.getElementById('verificar-email-styles');
    if (!existingStyle) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'verificar-email-styles';
        styleSheet.textContent = additionalStyles;
        document.head.appendChild(styleSheet);
    }
}

export default VerificarEmail;
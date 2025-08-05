// src/pages/VerificarEmail.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

function VerificarEmail() {
    const [searchParams] = useSearchParams();
    const [estado, setEstado] = useState('verificando');
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
                const response = await api.get(`/auth/verificar-email?token=${token}`);

                if (response.data.verified) {
                    setEstado('exito');
                    setMensaje(response.data.mensaje);

                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                }
            } catch (error) {
                console.error('Error verificando email:', error);

                const errorMsg = error.response?.data?.mensaje || '';

                if (error.response?.data?.expired || errorMsg.toLowerCase().includes('expirado')) {
                    setEstado('expirado');
                    setMensaje('El enlace de verificación ha expirado.');
                } else if (errorMsg.toLowerCase().includes('inválido')) {
                    setEstado('error');
                    setMensaje('Este enlace ya fue usado o no es válido. Si ya verificaste tu cuenta, puedes iniciar sesión normalmente.');
                } else {
                    setEstado('error');
                    setMensaje(errorMsg || 'Error al verificar el email.');
                }
            } finally {
                setLoading(false);
            }
        };

        verificarToken();
    }, [searchParams, navigate]);

    const handleReenviarVerificacion = () => {
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
                            <button onClick={handleReenviarVerificacion} style={secondaryButtonStyle}>
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
                            <button onClick={handleReenviarVerificacion} style={secondaryButtonStyle}>
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '2rem'
};

const cardStyle = {
    background: 'white',
    borderRadius: '20px',
    padding: '3rem',
    boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center'
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
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #ec4899',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
};

const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#374151',
    margin: 0
};

const subtitleStyle = {
    fontSize: '1rem',
    color: '#6b7280',
    margin: 0
};

const successContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem'
};

const successIconStyle = {
    fontSize: '4rem'
};

const successTitleStyle = {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#22c55e',
    margin: 0
};

const successMessageStyle = {
    fontSize: '1.125rem',
    color: '#374151',
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
    margin: 0
};

const errorMessageStyle = {
    fontSize: '1.125rem',
    color: '#374151',
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
    color: '#6b7280'
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
    margin: 0
};

const expiredMessageStyle = {
    fontSize: '1.125rem',
    color: '#374151',
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
    color: '#6b7280'
};

const actionButtonsStyle = {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap'
};

const primaryButtonStyle = {
    background: 'linear-gradient(135deg, #ec4899, #f472b6)',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: 'none',
    cursor: 'pointer'
};

const secondaryButtonStyle = {
    background: 'transparent',
    color: '#6b7280',
    padding: '12px 24px',
    borderRadius: '8px',
    border: '2px solid #d1d5db',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
};

const buttonIconStyle = {
    fontSize: '16px'
};

export default VerificarEmail;
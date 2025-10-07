// src/pages/CrearProducto.jsx - DISEÑO MODERNO ART MARY
import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useLocation, useNavigate, Link } from 'react-router-dom';

function CrearProducto() {
  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    precioCompra: '',
    precioVenta: '',
    categoria: '',
    stock: '',
    // CAMPOS PARA SISTEMA DUAL
    tieneConjunto: false,
    nombreConjunto: '',
    unidadesPorConjunto: '',
    precioConjunto: ''
    // stockConjuntos se calcula automáticamente
  });

  const [imagen, setImagen] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [productId, setProductId] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get('id');

    if (id) {
      setIsEditing(true);
      setProductId(id);
      const obtenerProductoParaEditar = async () => {
        try {
          setIsLoading(true);
          const token = localStorage.getItem('token');
          const response = await axios.get(`/productos/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          const productoData = response.data;
          setFormulario({
            nombre: productoData.nombre || '',
            descripcion: productoData.descripcion || '',
            precioCompra: productoData.precioCompra || '',
            precioVenta: productoData.precioVenta || '',
            categoria: productoData.categoria || '',
            stock: productoData.stock || '',
            // CAMPOS DEL SISTEMA DUAL
            tieneConjunto: productoData.tieneConjunto || false,
            nombreConjunto: productoData.nombreConjunto || '',
            unidadesPorConjunto: productoData.unidadesPorConjunto || '',
            precioConjunto: productoData.precioConjunto || ''
          });
          if (productoData.imagenUrl) {
            setPreviewImage(productoData.imagenUrl);
          }
          setError('');
        } catch (err) {
          console.error("Error al obtener producto para edición:", err);
          setError('No se pudo cargar el producto para edición 😓');
          setFormulario({ nombre: '', descripcion: '', precioCompra: '', precioVenta: '', categoria: '', stock: '', tieneConjunto: false, nombreConjunto: '', unidadesPorConjunto: '', precioConjunto: '' });
        } finally {
          setIsLoading(false);
        }
      };
      obtenerProductoParaEditar();
    } else {
      setIsEditing(false);
      setProductId(null);
      setFormulario({
        nombre: '',
        descripcion: '',
        precioCompra: '',
        precioVenta: '',
        categoria: '',
        stock: '',
        tieneConjunto: false,
        nombreConjunto: '',
        unidadesPorConjunto: '',
        precioConjunto: ''
      });
      setImagen(null);
      setPreviewImage(null);
    }
  }, [location.search]);

  const handleChange = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value
    });
    if (validationErrors[e.target.name]) {
      setValidationErrors(prevErrors => ({ ...prevErrors, [e.target.name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImagen(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formulario.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio.';
    if (!formulario.precioCompra || isNaN(formulario.precioCompra) || parseFloat(formulario.precioCompra) <= 0) {
      newErrors.precioCompra = 'El precio de compra debe ser un número positivo.';
    }
    if (!formulario.precioVenta || isNaN(formulario.precioVenta) || parseFloat(formulario.precioVenta) <= 0) {
      newErrors.precioVenta = 'El precio de venta debe ser un número positivo.';
    }
    if (formulario.stock && (isNaN(formulario.stock) || parseInt(formulario.stock) < 0)) {
      newErrors.stock = 'El stock debe ser un número entero no negativo.';
    }
    // Validaciones para sistema dual
    if (formulario.tieneConjunto) {
      if (!formulario.nombreConjunto || formulario.nombreConjunto.trim() === '') {
        newErrors.nombreConjunto = 'El nombre del conjunto es requerido.';
      }

      if (!formulario.unidadesPorConjunto || isNaN(formulario.unidadesPorConjunto) || parseInt(formulario.unidadesPorConjunto) <= 0) {
        newErrors.unidadesPorConjunto = 'Las unidades por conjunto deben ser un número mayor a 0.';
      }

      if (!formulario.precioConjunto || isNaN(formulario.precioConjunto) || parseFloat(formulario.precioConjunto) < 0) {
        newErrors.precioConjunto = 'El precio del conjunto debe ser un número no negativo.';
      }
    }
    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    if (!validateForm()) {
      setError('Por favor, corrige los errores en el formulario.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    for (let key in formulario) {
      formData.append(key, formulario[key]);
    }
    if (imagen) {
      formData.append('imagen', imagen);
    }

    try {
      let response;
      if (isEditing) {
        response = await axios.put(`/productos/${productId}`, formData);
        setMensaje('Producto actualizado exitosamente');
      } else {
        response = await axios.post('/productos', formData);
        setMensaje('Producto creado exitosamente');
      }

      setError('');

      if (!isEditing) {
        setFormulario({
          nombre: '',
          descripcion: '',
          precioCompra: '',
          precioVenta: '',
          categoria: '',
          stock: '',
          tieneConjunto: false,
          nombreConjunto: '',
          unidadesPorConjunto: '',
          precioConjunto: ''
        });
        setImagen(null);
        setPreviewImage(null);
      }

      setValidationErrors({});

      // Auto-limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setMensaje('');
        if (isEditing) {
          navigate('/admin-panel');
        }
      }, 3000);

    } catch (err) {
      setError('❌ Error al guardar producto: ' + (err.response?.data?.error || err.message));
      setMensaje('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin-panel');
  };

  if (isLoading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={loadingSpinnerStyle}>
          <div style={spinnerIconStyle}>📦</div>
        </div>
        <p style={loadingTextStyle}>
          {isEditing ? 'Cargando producto...' : 'Guardando producto...'}
        </p>
      </div>
    );
  }

  return (
    <div style={pageWrapperStyle}>
      {/* Hero Header */}
      <br/>
      <br/>
      <br/>
      <br/>
      <div style={heroHeaderStyle}>
        <div style={heroContentStyle}>
          <h1 style={heroTitleStyle}>
            <span style={heroIconStyle}>{isEditing ? '✏️' : '➕'}</span>
            {isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}
          </h1>
          <p style={heroSubtitleStyle}>
            {isEditing
              ? 'Actualiza la información de tu producto'
              : 'Agrega un nuevo producto a tu inventario de Art Mary'
            }
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={mainContentStyle} className="main-content">
        {/* Breadcrumb */}
        <div style={breadcrumbStyle}>
          <Link to="/admin-panel" style={breadcrumbLinkStyle}>
            Panel Admin
          </Link>
          <span style={breadcrumbSeparatorStyle}>›</span>
          <span style={breadcrumbCurrentStyle}>
            {isEditing ? 'Editar Producto' : 'Crear Producto'}
          </span>
        </div>

        {/* Mensajes de notificación */}
        {mensaje && (
          <div style={{
            ...notificationStyle,
            background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
            color: '#166534',
            borderColor: '#22c55e'
          }}>
            <span style={notificationIconStyle}>✅</span>
            {mensaje}
          </div>
        )}

        {error && (
          <div style={{
            ...notificationStyle,
            background: 'linear-gradient(135deg, #fef2f2, #fecaca)',
            color: '#dc2626',
            borderColor: '#ef4444'
          }}>
            <span style={notificationIconStyle}>⚠️</span>
            {error}
          </div>
        )}

        {/* Formulario */}
        <div style={formContainerStyle}>
          <form onSubmit={handleSubmit} style={formStyle}>
            <div style={formGridStyle} className="form-grid">
              {/* Columna izquierda - Información básica */}
              <div style={formSectionStyle}>
                <h3 style={sectionTitleStyle}>
                  <span style={sectionIconStyle}>📝</span>
                  Información Básica
                </h3>

                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Nombre del Producto *</label>
                  <input
                    name="nombre"
                    value={formulario.nombre}
                    onChange={handleChange}
                    placeholder="Ej. Cuaderno universitario A4"
                    style={{
                      ...inputStyle,
                      ...(validationErrors.nombre ? errorInputStyle : {})
                    }}
                  />
                  {validationErrors.nombre && (
                    <span style={errorTextStyle}>{validationErrors.nombre}</span>
                  )}
                </div>

                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Descripción</label>
                  <textarea
                    name="descripcion"
                    value={formulario.descripcion}
                    onChange={handleChange}
                    placeholder="Describe las características del producto..."
                    style={textareaStyle}
                    rows={4}
                  />
                </div>

                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Categoría</label>
                  <input
                    name="categoria"
                    value={formulario.categoria}
                    onChange={handleChange}
                    placeholder="Ej. Papelería, Arte, Oficina"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Columna derecha - Precios e inventario */}
              <div style={formSectionStyle}>
                <h3 style={sectionTitleStyle}>
                  <span style={sectionIconStyle}>💰</span>
                  Precios e Inventario
                </h3>

                <div style={priceRowStyle} className="price-row">
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Precio de Compra *</label>
                    <div style={inputWithPrefixStyle}>
                      <span style={currencyPrefixStyle}>Q</span>
                      <input
                        name="precioCompra"
                        type="number"
                        step="0.01"
                        value={formulario.precioCompra}
                        onChange={handleChange}
                        placeholder="0.00"
                        style={{
                          ...inputWithPrefixInputStyle,
                          ...(validationErrors.precioCompra ? errorInputStyle : {})
                        }}
                      />
                    </div>
                    {validationErrors.precioCompra && (
                      <span style={errorTextStyle}>{validationErrors.precioCompra}</span>
                    )}
                  </div>

                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Precio de Venta *</label>
                    <div style={inputWithPrefixStyle}>
                      <span style={currencyPrefixStyle}>Q</span>
                      <input
                        name="precioVenta"
                        type="number"
                        step="0.01"
                        value={formulario.precioVenta}
                        onChange={handleChange}
                        placeholder="0.00"
                        style={{
                          ...inputWithPrefixInputStyle,
                          ...(validationErrors.precioVenta ? errorInputStyle : {})
                        }}
                      />
                    </div>
                    {validationErrors.precioVenta && (
                      <span style={errorTextStyle}>{validationErrors.precioVenta}</span>
                    )}
                  </div>
                </div>

                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Stock Inicial</label>
                  <input
                    name="stock"
                    type="number"
                    value={formulario.stock}
                    onChange={handleChange}
                    placeholder="0"
                    style={{
                      ...inputStyle,
                      ...(validationErrors.stock ? errorInputStyle : {})
                    }}
                  />
                  {validationErrors.stock && (
                    <span style={errorTextStyle}>{validationErrors.stock}</span>
                  )}
                </div>

                {/* ===== NUEVOS CAMPOS PARA SISTEMA DUAL ===== */}
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>
                    <input
                      type="checkbox"
                      name="tieneConjunto"
                      checked={formulario.tieneConjunto}
                      onChange={(e) => setFormulario(prev => ({
                        ...prev,
                        tieneConjunto: e.target.checked,
                        // Limpiar campos si se deshabilita
                        nombreConjunto: e.target.checked ? prev.nombreConjunto : '',
                        unidadesPorConjunto: e.target.checked ? prev.unidadesPorConjunto : '',
                        precioConjunto: e.target.checked ? prev.precioConjunto : ''
                      }))}
                      style={{ marginRight: '8px' }}
                    />
                    ¿Se vende también por conjuntos? (Ej: cajas, resmas, bolsas)
                  </label>
                </div>

                {/* Campos adicionales solo si tieneConjunto es true */}
                {formulario.tieneConjunto && (
                  <div style={{
                    border: '2px dashed #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    marginTop: '12px',
                    backgroundColor: '#f9fafb'
                  }}>
                    <h4 style={{ margin: '0 0 16px 0', color: '#374151', fontSize: '16px' }}>
                      📦 Configuración de Conjunto
                    </h4>

                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>Nombre del Conjunto *</label>
                      <input
                        name="nombreConjunto"
                        value={formulario.nombreConjunto}
                        onChange={handleChange}
                        placeholder="Ej. Caja, Resma, Bolsa, Paquete"
                        style={inputStyle}
                        required={formulario.tieneConjunto}
                      />
                    </div>

                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>Unidades por Conjunto *</label>
                      <input
                        name="unidadesPorConjunto"
                        type="number"
                        min="1"
                        value={formulario.unidadesPorConjunto}
                        onChange={handleChange}
                        placeholder="Ej. 100"
                        style={inputStyle}
                        required={formulario.tieneConjunto}
                      />
                    </div>

                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>Precio del Conjunto *</label>
                      <input
                        name="precioConjunto"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formulario.precioConjunto}
                        onChange={handleChange}
                        placeholder="Ej. 85.00"
                        style={inputStyle}
                        required={formulario.tieneConjunto}
                      />
                      {formulario.precioVenta && formulario.unidadesPorConjunto && formulario.precioConjunto && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                          Precio por unidad en conjunto: Q{(formulario.precioConjunto / formulario.unidadesPorConjunto).toFixed(2)}
                          {formulario.precioVenta && (
                            <span style={{ color: '#059669', fontWeight: 'bold' }}>
                              {' '}(Descuento: {(((formulario.precioVenta - (formulario.precioConjunto / formulario.unidadesPorConjunto)) / formulario.precioVenta) * 100).toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sección de imagen */}
                <div style={imageSection}>
                  <h4 style={imageSectionTitleStyle}>
                    <span style={sectionIconStyle}>📸</span>
                    Imagen del Producto
                  </h4>

                  <div style={imageUploadContainerStyle}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={hiddenInputStyle}
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" style={imageUploadLabelStyle}>
                      {previewImage ? (
                        <div style={imagePreviewContainerStyle}>
                          <img
                            src={previewImage}
                            alt="Preview"
                            style={imagePreviewStyle}
                          />
                          <div style={imageOverlayStyle}>
                            <span style={imageOverlayTextStyle}>Cambiar imagen</span>
                          </div>
                        </div>
                      ) : (
                        <div style={imageUploadPlaceholderStyle}>
                          <span style={imageUploadIconStyle}>📸</span>
                          <span style={imageUploadTextStyle}>
                            Hacer clic para subir imagen
                          </span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div style={actionsContainerStyle} className="actions-container">
              <button
                type="button"
                onClick={handleCancel}
                style={cancelButtonStyle}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--neutral-200)';
                  e.target.style.color = 'var(--neutral-700)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'var(--neutral-600)';
                }}
              >
                <span style={buttonIconStyle}>❌</span>
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  ...submitButtonStyle,
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 12px 30px rgba(236, 72, 153, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 25px rgba(236, 72, 153, 0.3)';
                  }
                }}
              >
                <span style={buttonIconStyle}>
                  {isLoading ? '⏳' : (isEditing ? '💾' : '✅')}
                </span>
                {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Producto' : 'Crear Producto')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Estilos
const pageWrapperStyle = {
  minHeight: '100vh',
  background: 'var(--gradient-background)',
  fontFamily: 'var(--font-sans)',
  paddingBottom: '2rem'
};

const heroHeaderStyle = {
  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
  color: 'white',
  padding: '3rem 2rem',
  textAlign: 'center'
};

const heroContentStyle = {
  maxWidth: '800px',
  margin: '0 auto'
};

const heroTitleStyle = {
  fontSize: 'clamp(2rem, 4vw, 3rem)',
  fontWeight: '800',
  marginBottom: '1rem',
  fontFamily: 'var(--font-display)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1rem'
};

const heroIconStyle = {
  fontSize: '3rem'
};

const heroSubtitleStyle = {
  fontSize: '1.125rem',
  opacity: 0.9,
  fontWeight: '500',
  maxWidth: '600px',
  margin: '0 auto'
};

const mainContentStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 2rem',
  marginTop: '5rem', 
  position: 'relative',
  zIndex: 2
};

const loadingContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  background: 'var(--gradient-background)',
  color: 'var(--neutral-700)'
};

const loadingSpinnerStyle = {
  marginBottom: '2rem'
};

const spinnerIconStyle = {
  fontSize: '4rem',
  animation: 'bounce 1s infinite'
};

const loadingTextStyle = {
  fontSize: '1.25rem',
  fontWeight: '600'
};

const breadcrumbStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '2rem',
  background: 'white',
  padding: '1rem 1.5rem',
  borderRadius: '1rem',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)'
};

const breadcrumbLinkStyle = {
  color: 'var(--primary-600)',
  textDecoration: 'none',
  fontWeight: '500',
  fontSize: '0.875rem',
  transition: 'color 0.2s ease'
};

const breadcrumbSeparatorStyle = {
  color: 'var(--neutral-400)',
  fontSize: '1rem'
};

const breadcrumbCurrentStyle = {
  color: 'var(--neutral-600)',
  fontSize: '0.875rem',
  fontWeight: '500'
};

const notificationStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '1rem 1.5rem',
  borderRadius: '1rem',
  border: '1px solid',
  marginBottom: '2rem',
  fontSize: '1rem',
  fontWeight: '600',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  animation: 'slideInDown 0.5s ease-out'
};

const notificationIconStyle = {
  fontSize: '1.25rem'
};

const formContainerStyle = {
  background: 'white',
  borderRadius: '2rem',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
  border: '1px solid var(--neutral-200)',
  overflow: 'hidden'
};

const formStyle = {
  padding: '3rem'
};

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '3rem',
  marginBottom: '3rem',
  '@media (max-width: 768px)': {
    gridTemplateColumns: '1fr',
    gap: '2rem'
  }
};

const formSectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
};

const sectionTitleStyle = {
  fontSize: '1.25rem',
  fontWeight: '700',
  color: 'var(--neutral-800)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  marginBottom: '0.5rem',
  paddingBottom: '0.75rem',
  borderBottom: '1px solid var(--neutral-200)'
};

const sectionIconStyle = {
  fontSize: '1.25rem'
};

const fieldGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const labelStyle = {
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'var(--neutral-700)',
  marginBottom: '0.25rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.875rem 1rem',
  borderRadius: '0.75rem',
  border: '1px solid var(--neutral-300)',
  background: 'var(--neutral-50)',
  color: 'var(--neutral-800)',
  fontSize: '1rem',
  transition: 'all 0.2s ease',
  boxSizing: 'border-box'
};

const errorInputStyle = {
  borderColor: '#ef4444',
  background: '#fef2f2'
};

const errorTextStyle = {
  color: '#ef4444',
  fontSize: '0.75rem',
  fontWeight: '500',
  marginTop: '0.25rem'
};

const textareaStyle = {
  ...inputStyle,
  minHeight: '100px',
  resize: 'vertical',
  fontFamily: 'inherit'
};

const priceRowStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem'
};

const inputWithPrefixStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center'
};

const currencyPrefixStyle = {
  position: 'absolute',
  left: '1rem',
  zIndex: 1,
  color: 'var(--neutral-500)',
  fontWeight: '600',
  fontSize: '1rem'
};

const inputWithPrefixInputStyle = {
  ...inputStyle,
  paddingLeft: '2.5rem'
};

const imageSection = {
  marginTop: '1rem'
};

const imageSectionTitleStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'var(--neutral-700)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '1rem'
};

const imageUploadContainerStyle = {
  position: 'relative'
};

const hiddenInputStyle = {
  display: 'none'
};

const imageUploadLabelStyle = {
  display: 'block',
  cursor: 'pointer',
  borderRadius: '0.75rem',
  overflow: 'hidden',
  transition: 'all 0.3s ease'
};

const imagePreviewContainerStyle = {
  position: 'relative',
  width: '100%',
  height: '200px'
};

const imagePreviewStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: '0.75rem',
  border: '2px solid var(--neutral-200)'
};

const imageOverlayStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  transition: 'opacity 0.3s ease',
  borderRadius: '0.75rem'
};

const imageOverlayTextStyle = {
  color: 'white',
  fontWeight: '600',
  fontSize: '0.875rem'
};

const imageUploadPlaceholderStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '200px',
  border: '2px dashed var(--neutral-300)',
  borderRadius: '0.75rem',
  background: 'var(--neutral-50)',
  transition: 'all 0.3s ease'
};

const imageUploadIconStyle = {
  fontSize: '3rem',
  marginBottom: '0.5rem',
  opacity: 0.6
};

const imageUploadTextStyle = {
  color: 'var(--neutral-600)',
  fontWeight: '500',
  fontSize: '0.875rem'
};

const actionsContainerStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '1rem',
  paddingTop: '2rem',
  borderTop: '1px solid var(--neutral-200)',
  '@media (max-width: 768px)': {
    flexDirection: 'column',
    justifyContent: 'center',
  }
};

const cancelButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.875rem 1.5rem',
  background: 'transparent',
  color: 'var(--neutral-600)',
  border: '1px solid var(--neutral-300)',
  borderRadius: '0.75rem',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  flex: 1,
};

const submitButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.875rem 2rem',
  background: 'var(--gradient-primary)',
  color: 'white',
  border: 'none',
  borderRadius: '0.75rem',
  fontSize: '1rem',
  fontWeight: '700',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 8px 25px rgba(236, 72, 153, 0.3)',
  flex: 1,
};

const buttonIconStyle = {
  fontSize: '1.125rem'
};

// CSS adicional para efectos y media queries
const additionalStyles = `
@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
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

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr !important;
    gap: 2rem !important;
  }
  
  .price-row {
    grid-template-columns: 1fr !important;
  }
  
  .actions-container {
    flex-direction: column !important;
  }
  
  .hero-title {
    flex-direction: column !important;
    gap: 0.5rem !important;
  }
  
  .main-content {
    padding-top: 5rem !important; /* Ajuste para compensar el header en móviles */
    margin-top: 0 !important;
  }
}

.input:focus,
.textarea:focus {
  outline: none !important;
  border-color: var(--primary-500) !important;
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1) !important;
  background: white !important;
}

.image-upload-label:hover .image-placeholder {
  border-color: var(--primary-400) !important;
  background: var(--primary-50) !important;
}

.image-upload-label:hover .image-overlay {
  opacity: 1 !important;
}

.breadcrumb-link:hover {
  color: var(--primary-700) !important;
}

.form-section {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('crear-producto-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'crear-producto-styles';
    styleSheet.textContent = additionalStyles;
    document.head.appendChild(styleSheet);
  }
}

export default CrearProducto;
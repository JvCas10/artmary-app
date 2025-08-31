// src/components/ProductFilters.jsx - DISEÑO MODERNO PREMIUM
import React, { useState, useEffect } from 'react';

function ProductFilters({
    onFiltersChange,
    categorias = [],
    filtrosAplicados = {},
    totalProductos = 0
}) {
    const [localFilters, setLocalFilters] = useState({
        categoria: filtrosAplicados.categoria || '',
        precioMin: filtrosAplicados.precioMin || '',
        precioMax: filtrosAplicados.precioMax || '',
        disponibilidad: filtrosAplicados.disponibilidad || '',
        sortBy: filtrosAplicados.sortBy || 'default'
    });

    const [appliedFilters, setAppliedFilters] = useState({ ...localFilters });
    const [isOpen, setIsOpen] = useState(false);

    // Rangos de precio predefinidos
    const rangosPrecios = [
        { label: 'Menos de Q50', min: 0, max: 50, icon: '💰' },
        { label: 'Q50 - Q100', min: 50, max: 100, icon: '💵' },
        { label: 'Q100 - Q200', min: 100, max: 200, icon: '💸' },
        { label: 'Q200 - Q500', min: 200, max: 500, icon: '💎' },
        { label: 'Más de Q500', min: 500, max: null, icon: '👑' }
    ];

    // Sincronizar con filtros externos cuando cambien
    useEffect(() => {
        setLocalFilters({
            categoria: filtrosAplicados.categoria || '',
            precioMin: filtrosAplicados.precioMin || '',
            precioMax: filtrosAplicados.precioMax || '',
            disponibilidad: filtrosAplicados.disponibilidad || '',
            sortBy: filtrosAplicados.sortBy || 'default'
        });
        setAppliedFilters({
            categoria: filtrosAplicados.categoria || '',
            precioMin: filtrosAplicados.precioMin || '',
            precioMax: filtrosAplicados.precioMax || '',
            disponibilidad: filtrosAplicados.disponibilidad || '',
            sortBy: filtrosAplicados.sortBy || 'default'
        });
    }, [filtrosAplicados]);

    const handleFilterChange = (filterName, value) => {
        setLocalFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
    };

    // Solo el ordenamiento se aplica inmediatamente
    const handleSortChange = (value) => {
        const newFilters = { ...localFilters, sortBy: value };
        setLocalFilters(newFilters);
        setAppliedFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const handleRangoPrecio = (min, max) => {
        setLocalFilters(prev => ({
            ...prev,
            precioMin: min,
            precioMax: max === null ? '' : max
        }));
    };

    // Aplicar todos los filtros excepto ordenamiento
    const aplicarFiltros = () => {
        setAppliedFilters({ ...localFilters });
        onFiltersChange(localFilters);
        setIsOpen(false);
    };

    const limpiarFiltros = () => {
        const filtrosLimpios = {
            categoria: '',
            precioMin: '',
            precioMax: '',
            disponibilidad: '',
            sortBy: 'default'
        };
        setLocalFilters(filtrosLimpios);
        setAppliedFilters(filtrosLimpios);
        onFiltersChange(filtrosLimpios);
    };

    const contarFiltrosActivos = () => {
        let count = 0;
        if (appliedFilters.categoria) count++;
        if (appliedFilters.precioMin || appliedFilters.precioMax) count++;
        if (appliedFilters.disponibilidad) count++;
        if (appliedFilters.sortBy && appliedFilters.sortBy !== 'default') count++;
        return count;
    };

    const hayFiltrosPendientes = () => {
        return JSON.stringify(localFilters) !== JSON.stringify(appliedFilters);
    };

    const isRangeActive = (min, max) => {
        return localFilters.precioMin == min &&
            (max === null ? localFilters.precioMax === '' : localFilters.precioMax == max);
    };

    const getDisponibilidadIcon = (value) => {
        switch (value) {
            case 'en_stock': return '✅';
            case 'stock_bajo': return '⚠️';
            case 'agotado': return '❌';
            default: return '📦';
        }
    };

    const getSortIcon = (value) => {
        switch (value) {
            case 'price_asc': return '💰⬆️';
            case 'price_desc': return '💰⬇️';
            case 'name_asc': return '🔤⬆️';
            case 'name_desc': return '🔤⬇️';
            case 'stock_desc': return '📦⬇️';
            case 'stock_asc': return '📦⬆️';
            default: return '🆕';
        }
    };

    return (
        <div style={containerStyle}>
            {/* Header de filtros moderno */}
            <div style={headerStyle}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        ...toggleButtonStyle,
                        background: contarFiltrosActivos() > 0
                            ? 'var(--gradient-secondary)'
                            : 'var(--gradient-primary)'
                    }}
                >
                    <span style={toggleIconStyle}>🎛️</span>
                    <span style={toggleTextStyle}>
                        Filtros {contarFiltrosActivos() > 0 && `(${contarFiltrosActivos()})`}
                    </span>
                    {hayFiltrosPendientes() && <div style={pendingDotStyle}></div>}
                    <span style={{
                        ...toggleArrowStyle,
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}>
                        ⬇️
                    </span>
                </button>

                {contarFiltrosActivos() > 0 && (
                    <button
                        onClick={limpiarFiltros}
                        style={clearButtonStyle}
                    >
                        <span style={clearIconStyle}>🗑️</span>
                        Limpiar
                    </button>
                )}
            </div>

            {/* Panel de filtros con animación */}
            <div style={{
                ...panelContainerStyle,
                maxHeight: isOpen ? 'none' : '0', // ← CAMBIA 'none' en lugar de '1000px'
                height: isOpen ? 'auto' : '0', // ← AGREGA esta línea
                opacity: isOpen ? 1 : 0,
                visibility: isOpen ? 'visible' : 'hidden'
            }}>
                <div style={panelStyle}>
                    {/* Mensaje informativo elegante */}
                    <div style={infoCardStyle}>
                        <div style={infoIconStyle}>💡</div>
                        <div style={infoTextStyle}>
                            <strong>Tip:</strong> Ajusta múltiples filtros y presiona "Aplicar" para ver resultados.
                            El ordenamiento se aplica al instante.
                        </div>
                    </div>

                    {/* Grid de filtros principales */}
                    <div style={filtersGridStyle}>
                        {/* Filtro por Categoría */}
                        <div style={filterCardStyle}>
                            <label style={filterLabelStyle}>
                                <span style={filterIconStyle}>🏷️</span>
                                Categoría
                            </label>
                            <select
                                value={localFilters.categoria}
                                onChange={(e) => handleFilterChange('categoria', e.target.value)}
                                style={selectStyle}
                            >
                                <option value="">Todas las categorías</option>
                                {categorias.map((categoria) => (
                                    <option key={categoria} value={categoria}>
                                        {categoria}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro por Disponibilidad */}
                        <div style={filterCardStyle}>
                            <label style={filterLabelStyle}>
                                <span style={filterIconStyle}>📦</span>
                                Disponibilidad
                            </label>
                            <select
                                value={localFilters.disponibilidad}
                                onChange={(e) => handleFilterChange('disponibilidad', e.target.value)}
                                style={selectStyle}
                            >
                                <option value="">Todos los productos</option>
                                <option value="en_stock">✅ Solo en stock</option>
                                <option value="stock_bajo">⚠️ Stock bajo (&lt; 5)</option>
                                <option value="agotado">❌ Productos agotados</option>
                            </select>
                        </div>

                        {/* Filtro por Ordenamiento - SE APLICA INMEDIATAMENTE */}
                        <div style={{ ...filterCardStyle, ...immediateFilterStyle }}>
                            <label style={filterLabelStyle}>
                                <span style={filterIconStyle}>🔄</span>
                                Ordenar por
                                <span style={immediateTagStyle}>INMEDIATO</span>
                            </label>
                            <select
                                value={localFilters.sortBy}
                                onChange={(e) => handleSortChange(e.target.value)}
                                style={{ ...selectStyle, borderColor: 'var(--accent-green)' }}
                            >
                                <option value="default">🆕 Más recientes</option>
                                <option value="price_asc">💰⬆️ Precio: Menor a mayor</option>
                                <option value="price_desc">💰⬇️ Precio: Mayor a menor</option>
                                <option value="name_asc">🔤⬆️ Nombre: A-Z</option>
                                <option value="name_desc">🔤⬇️ Nombre: Z-A</option>
                                <option value="stock_desc">📦⬇️ Mayor stock</option>
                                <option value="stock_asc">📦⬆️ Menor stock</option>
                            </select>
                        </div>
                    </div>

                    {/* Sección de precios moderna */}
                    <div style={priceFilterSectionStyle}>
                        <h4 style={sectionTitleStyle}>
                            <span style={sectionIconStyle}>💰</span>
                            Rango de Precio
                        </h4>

                        {/* Inputs de precio personalizado */}
                        <div style={priceInputsContainerStyle}>
                            <div style={priceInputGroupStyle}>
                                <label style={priceInputLabelStyle}>Mínimo</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={localFilters.precioMin}
                                    onChange={(e) => handleFilterChange('precioMin', e.target.value)}
                                    style={priceInputStyle}
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div style={priceSeparatorStyle}>—</div>

                            <div style={priceInputGroupStyle}>
                                <label style={priceInputLabelStyle}>Máximo</label>
                                <input
                                    type="number"
                                    placeholder="∞"
                                    value={localFilters.precioMax}
                                    onChange={(e) => handleFilterChange('precioMax', e.target.value)}
                                    style={priceInputStyle}
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        {/* Rangos rápidos modernos */}
                        <div style={quickRangesStyle}>
                            <span style={quickRangesLabelStyle}>Rangos rápidos:</span>
                            <div style={rangeButtonsGridStyle}>
                                {rangosPrecios.map((rango, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleRangoPrecio(rango.min, rango.max)}
                                        style={{
                                            ...rangeButtonStyle,
                                            ...(isRangeActive(rango.min, rango.max) ? activeRangeStyle : {})
                                        }}
                                    >
                                        <span style={rangeIconStyle}>{rango.icon}</span>
                                        <span style={rangeLabelStyle}>{rango.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Botones de acción modernos */}
                    <div style={actionButtonsStyle}>
                        <button
                            onClick={aplicarFiltros}
                            disabled={!hayFiltrosPendientes()}
                            style={{
                                ...applyButtonStyle,
                                ...(hayFiltrosPendientes() ? {} : disabledApplyButtonStyle)
                            }}
                        >
                            <span style={buttonIconStyle}>✨</span>
                            <span>Aplicar Filtros</span>
                            {hayFiltrosPendientes() && <div style={pendingBadgeStyle}></div>}
                        </button>

                        <button
                            onClick={() => setIsOpen(false)}
                            style={closeButtonStyle}
                        >
                            <span style={buttonIconStyle}>👆</span>
                            Cerrar Panel
                        </button>
                    </div>

                    {/* Filtros activos elegantes */}
                    {contarFiltrosActivos() > 0 && (
                        <div style={activeFiltersContainerStyle}>
                            <div style={activeFiltersTitleStyle}>
                                <span style={activeFiltersIconStyle}>🎯</span>
                                <strong>Filtros Aplicados</strong>
                            </div>
                            <div style={activeFiltersListStyle}>
                                {appliedFilters.categoria && (
                                    <div style={activeFilterTagStyle}>
                                        <span style={tagIconStyle}>🏷️</span>
                                        <span>Categoría: {appliedFilters.categoria}</span>
                                        <button
                                            onClick={() => {
                                                handleFilterChange('categoria', '');
                                                const newFilters = { ...localFilters, categoria: '' };
                                                setAppliedFilters(newFilters);
                                                onFiltersChange(newFilters);
                                            }}
                                            style={removeTagButtonStyle}
                                        >×</button>
                                    </div>
                                )}
                                {appliedFilters.disponibilidad && (
                                    <div style={activeFilterTagStyle}>
                                        <span style={tagIconStyle}>
                                            {getDisponibilidadIcon(appliedFilters.disponibilidad)}
                                        </span>
                                        <span>
                                            {appliedFilters.disponibilidad === 'en_stock' && 'Solo en stock'}
                                            {appliedFilters.disponibilidad === 'stock_bajo' && 'Stock bajo'}
                                            {appliedFilters.disponibilidad === 'agotado' && 'Agotados'}
                                        </span>
                                        <button
                                            onClick={() => {
                                                handleFilterChange('disponibilidad', '');
                                                const newFilters = { ...localFilters, disponibilidad: '' };
                                                setAppliedFilters(newFilters);
                                                onFiltersChange(newFilters);
                                            }}
                                            style={removeTagButtonStyle}
                                        >×</button>
                                    </div>
                                )}
                                {(appliedFilters.precioMin || appliedFilters.precioMax) && (
                                    <div style={activeFilterTagStyle}>
                                        <span style={tagIconStyle}>💰</span>
                                        <span>
                                            Q{appliedFilters.precioMin || '0'} - Q{appliedFilters.precioMax || '∞'}
                                        </span>
                                        <button
                                            onClick={() => {
                                                handleFilterChange('precioMin', '');
                                                handleFilterChange('precioMax', '');
                                                const newFilters = { ...localFilters, precioMin: '', precioMax: '' };
                                                setAppliedFilters(newFilters);
                                                onFiltersChange(newFilters);
                                            }}
                                            style={removeTagButtonStyle}
                                        >×</button>
                                    </div>
                                )}
                                {appliedFilters.sortBy && appliedFilters.sortBy !== 'default' && (
                                    <div style={activeFilterTagStyle}>
                                        <span style={tagIconStyle}>
                                            {getSortIcon(appliedFilters.sortBy)}
                                        </span>
                                        <span>Ordenado</span>
                                        <button
                                            onClick={() => handleSortChange('default')}
                                            style={removeTagButtonStyle}
                                        >×</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Estilos modernos
const containerStyle = {
    margin: '2rem auto',
    maxWidth: '1280px',
    padding: '0 2rem',
    fontFamily: 'var(--font-sans)'
};

const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap'
};

const toggleButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 1.5rem',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--border-radius-xl)',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: 'var(--shadow-lg)',
    position: 'relative',
    minWidth: '180px'
};

const toggleIconStyle = {
    fontSize: '1.25rem'
};

const toggleTextStyle = {
    flex: 1
};

const pendingDotStyle = {
    width: '8px',
    height: '8px',
    background: '#fbbf24',
    borderRadius: '50%',
    animation: 'pulse 1.5s ease-in-out infinite'
};

const toggleArrowStyle = {
    fontSize: '1rem',
    transition: 'transform 0.3s ease'
};

const statsContainerStyle = {
    display: 'flex',
    gap: '2rem',
    flex: 1,
    justifyContent: 'center'
};

const statsItemStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem'
};

const statsNumberStyle = {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: 'var(--primary-600)',
    lineHeight: 1
};

const statsLabelStyle = {
    fontSize: '0.75rem',
    color: 'var(--secondary-500)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
};

const clearButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    background: 'var(--gradient-danger)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--border-radius-lg)',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: 'var(--shadow-md)'
};

const clearIconStyle = {
    fontSize: '1rem'
};

const panelContainerStyle = {
    overflow: 'visible', // ← CAMBIA de 'hidden' a 'visible'
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '0 0 var(--border-radius-2xl) var(--border-radius-2xl)',
    border: '1px solid var(--secondary-200)',
    borderTop: 'none',
    // ← QUITA cualquier maxHeight que esté aquí
    zIndex: 1000 // ← AGREGA esto para que aparezca encima
};

const panelStyle = {
    padding: '1.5rem', // ← Reduce el padding
    minHeight: 'auto', // ← AGREGA esto
    height: 'auto' // ← AGREGA esto
};

const infoCardStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 1.5rem',
    background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
    borderRadius: 'var(--border-radius-xl)',
    border: '1px solid #93c5fd',
    marginBottom: '2rem'
};

const infoIconStyle = {
    fontSize: '1.5rem'
};

const infoTextStyle = {
    fontSize: '0.875rem',
    color: '#1e40af',
    lineHeight: 1.5
};

const filtersGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
};

const filterCardStyle = {
    padding: '1.5rem',
    background: 'var(--secondary-50)',
    borderRadius: 'var(--border-radius-xl)',
    border: '1px solid var(--secondary-200)',
    transition: 'all 0.3s ease'
};

const immediateFilterStyle = {
    background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
    border: '1px solid var(--accent-green)'
};

const filterLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--secondary-700)'
};

const filterIconStyle = {
    fontSize: '1rem'
};

const immediateTagStyle = {
    marginLeft: 'auto',
    padding: '0.125rem 0.5rem',
    background: 'var(--accent-green)',
    color: 'white',
    borderRadius: 'var(--border-radius-sm)',
    fontSize: '0.625rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
};

const selectStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--border-radius-lg)',
    border: '1px solid var(--secondary-300)',
    background: 'white',
    color: 'var(--secondary-700)',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    outline: 'none'
};

const priceFilterSectionStyle = {
    padding: '2rem',
    background: 'linear-gradient(135deg, #fefce8, #fef3c7)',
    borderRadius: 'var(--border-radius-xl)',
    border: '1px solid #fbbf24',
    marginBottom: '2rem'
};

const sectionTitleStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1.125rem',
    fontWeight: '700',
    color: 'var(--secondary-800)',
    marginBottom: '1.5rem'
};

const sectionIconStyle = {
    fontSize: '1.5rem'
};

const priceInputsContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap'
};

const priceInputGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
    minWidth: '120px'
};

const priceInputLabelStyle = {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--secondary-600)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
};

const priceInputStyle = {
    padding: '0.875rem 1rem',
    borderRadius: 'var(--border-radius-lg)',
    border: '1px solid var(--secondary-300)',
    background: 'white',
    color: 'var(--secondary-700)',
    fontSize: '0.875rem',
    fontWeight: '500',
    outline: 'none',
    transition: 'all 0.3s ease'
};

const priceSeparatorStyle = {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--secondary-400)',
    marginTop: '1.25rem'
};

const quickRangesStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
};

const quickRangesLabelStyle = {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--secondary-700)'
};

const rangeButtonsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '0.75rem'
};

const rangeButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    background: 'white',
    color: 'var(--secondary-700)',
    border: '1px solid var(--secondary-300)',
    borderRadius: 'var(--border-radius-lg)',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    textAlign: 'left',
    whiteSpace: 'nowrap'
};

const activeRangeStyle = {
    background: 'var(--gradient-primary)',
    color: 'white',
    borderColor: 'var(--primary-500)',
    boxShadow: 'var(--shadow-md)',
    transform: 'translateY(-2px)'
};

const rangeIconStyle = {
    fontSize: '1rem'
};

const rangeLabelStyle = {
    fontSize: '0.75rem',
    fontWeight: '600'
};

const actionButtonsStyle = {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap'
};

const applyButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 2rem',
    background: 'var(--gradient-success)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--border-radius-xl)',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    boxShadow: 'var(--shadow-lg)',
    position: 'relative',
    minWidth: '180px',
    justifyContent: 'center'
};

const disabledApplyButtonStyle = {
    background: 'var(--secondary-300)',
    cursor: 'not-allowed',
    boxShadow: 'none'
};

const closeButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem 1.5rem',
    background: 'var(--secondary-500)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--border-radius-xl)',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: 'var(--shadow-md)'
};

const buttonIconStyle = {
    fontSize: '1rem'
};

const pendingBadgeStyle = {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    width: '12px',
    height: '12px',
    background: '#fbbf24',
    borderRadius: '50%',
    animation: 'pulse 1.5s ease-in-out infinite'
};

const activeFiltersContainerStyle = {
    padding: '1.5rem',
    background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
    borderRadius: 'var(--border-radius-xl)',
    border: '1px solid var(--accent-green)'
};

const activeFiltersTitleStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
    fontSize: '0.875rem',
    fontWeight: '700',
    color: 'var(--accent-green)'
};

const activeFiltersIconStyle = {
    fontSize: '1.25rem'
};

const activeFiltersListStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem'
};

const activeFilterTagStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    background: 'white',
    color: 'var(--secondary-700)',
    borderRadius: 'var(--border-radius-lg)',
    fontSize: '0.75rem',
    fontWeight: '600',
    border: '1px solid var(--secondary-200)',
    boxShadow: 'var(--shadow-sm)'
};

const tagIconStyle = {
    fontSize: '0.875rem'
};

const removeTagButtonStyle = {
    background: 'none',
    border: 'none',
    color: 'var(--accent-red)',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '700',
    padding: '0 0.25rem',
    borderRadius: 'var(--border-radius-sm)',
    transition: 'all 0.2s ease',
    marginLeft: '0.25rem'
};

// Media queries para responsive
// Media queries para responsive
const mediaQueries = `
@media (max-width: 768px) {
    .filters-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }
    
    .filters-grid {
        grid-template-columns: 1fr !important;
        gap: 1rem !important;
    }
    
    .range-buttons-grid {
        grid-template-columns: 1fr 1fr !important;
        gap: 0.5rem !important;
    }
    
    .action-buttons {
        flex-direction: column;
        gap: 0.75rem !important;
    }
}

/* Forzar altura automática en móvil */
@media (max-width: 768px) {
    .panel-container {
        max-height: none !important;
        height: auto !important;
        overflow: visible !important;
    }
}
`;

// Inyectar media queries
if (typeof document !== 'undefined') {
    const existingStyle = document.getElementById('filters-responsive-styles');
    if (!existingStyle) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'filters-responsive-styles';
        styleSheet.textContent = mediaQueries;
        document.head.appendChild(styleSheet);
    }
}

export default ProductFilters;
import { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

// Funciones para manejar localStorage
const CARRITO_STORAGE_KEY = 'artmary_carrito';

const guardarCarritoEnStorage = (carrito) => {
  try {
    localStorage.setItem(CARRITO_STORAGE_KEY, JSON.stringify(carrito));
  } catch (error) {
    console.warn('No se pudo guardar el carrito en localStorage:', error);
  }
};

const cargarCarritoDeStorage = () => {
  try {
    const carritoGuardado = localStorage.getItem(CARRITO_STORAGE_KEY);
    return carritoGuardado ? JSON.parse(carritoGuardado) : [];
  } catch (error) {
    console.warn('No se pudo cargar el carrito de localStorage:', error);
    return [];
  }
};

export const CartProvider = ({ children }) => {
  // Inicializar el carrito cargando desde localStorage
  const [carrito, setCarrito] = useState(() => {
    return cargarCarritoDeStorage();
  });

  // Guardar en localStorage cada vez que el carrito cambie
  useEffect(() => {
    guardarCarritoEnStorage(carrito);
  }, [carrito]);

  const agregarAlCarrito = (producto) => {
    setCarrito((prev) => {
      // Calcular stock ya usado en el carrito para este producto
      const itemsDelProducto = prev.filter(item => item._id === producto._id);
      const unidadesUsadasIndividual = itemsDelProducto
        .filter(item => item.tipoVenta === 'individual')
        .reduce((total, item) => total + item.cantidad, 0);
      const conjuntosUsados = itemsDelProducto
        .filter(item => item.tipoVenta === 'conjunto')
        .reduce((total, item) => total + item.cantidad, 0);

      // Calcular unidades totales ya ocupadas
      const unidadesTotalesOcupadas = unidadesUsadasIndividual + (conjuntosUsados * (producto.unidadesPorConjunto || 0));

      // Calcular cuántas unidades totales están disponibles
      const stockTotalDisponible = producto.stock || 0;
      const unidadesDisponibles = stockTotalDisponible - unidadesTotalesOcupadas;

      const tipoVenta = producto.tipoVenta || 'individual';
      const cantidadAAgregar = producto.cantidad || 1;

      // Validaciones específicas por tipo
      if (tipoVenta === 'conjunto') {
        const unidadesQueNecesita = cantidadAAgregar * (producto.unidadesPorConjunto || 0);

        // Verificar que hay suficientes unidades disponibles
        if (unidadesQueNecesita > unidadesDisponibles) {
          console.warn(`No hay suficientes unidades disponibles. Necesita: ${unidadesQueNecesita}, Disponible: ${unidadesDisponibles}`);
          return prev;
        }

        // Verificar que se pueden formar suficientes conjuntos completos
        const conjuntosDisponibles = Math.floor(unidadesDisponibles / (producto.unidadesPorConjunto || 1));
        if (cantidadAAgregar > conjuntosDisponibles) {
          console.warn(`No hay suficientes ${producto.nombreConjunto}s disponibles. Disponible: ${conjuntosDisponibles}, Solicitado: ${cantidadAAgregar}`);
          return prev;
        }
      } else {
        // Para venta individual
        if (cantidadAAgregar > unidadesDisponibles) {
          console.warn(`No hay suficientes unidades disponibles. Necesita: ${cantidadAAgregar}, Disponible: ${unidadesDisponibles}`);
          return prev;
        }
      }

      // Buscar item existente del mismo tipo
      const existente = prev.find(item =>
        item._id === producto._id && item.tipoVenta === tipoVenta
      );

      if (existente) {
        // Actualizar cantidad del item existente
        return prev.map(item =>
          item._id === producto._id && item.tipoVenta === tipoVenta
            ? { ...item, cantidad: item.cantidad + cantidadAAgregar }
            : item
        );
      } else {
        // Crear nuevo item
        const nuevoItem = {
          ...producto,
          tipoVenta,
          cantidad: cantidadAAgregar,
          claveUnica: `${producto._id}-${tipoVenta}`,
          precioUnitario: tipoVenta === 'conjunto' ?
            (producto.precioConjunto / producto.unidadesPorConjunto) :
            producto.precioVenta,
          precioDisplay: tipoVenta === 'conjunto' ?
            producto.precioConjunto :
            producto.precioVenta
        };

        return [...prev, nuevoItem];
      }
    });
  };

  const aumentarCantidad = (id, tipoVenta = 'individual') => {
    setCarrito((prev) => {
      // Encontrar el producto en el carrito
      const productoEnCarrito = prev.find(item => item._id === id && item.tipoVenta === tipoVenta);
      if (!productoEnCarrito) return prev;

      // Calcular stock ya usado en el carrito para este producto
      const itemsDelProducto = prev.filter(item => item._id === id);
      const unidadesUsadasIndividual = itemsDelProducto
        .filter(item => item.tipoVenta === 'individual')
        .reduce((total, item) => total + item.cantidad, 0);
      const conjuntosUsados = itemsDelProducto
        .filter(item => item.tipoVenta === 'conjunto')
        .reduce((total, item) => total + item.cantidad, 0);

      // Calcular unidades totales ya ocupadas (sin contar el item actual)
      let unidadesTotalesOcupadas = unidadesUsadasIndividual + (conjuntosUsados * (productoEnCarrito.unidadesPorConjunto || 0));

      // Restar las unidades del item actual para calcular disponibles
      if (tipoVenta === 'conjunto') {
        unidadesTotalesOcupadas -= productoEnCarrito.cantidad * (productoEnCarrito.unidadesPorConjunto || 0);
      } else {
        unidadesTotalesOcupadas -= productoEnCarrito.cantidad;
      }

      const stockTotalDisponible = productoEnCarrito.stock || 0;
      const unidadesDisponibles = stockTotalDisponible - unidadesTotalesOcupadas;

      if (tipoVenta === 'conjunto') {
        const unidadesQueNecesitaria = (productoEnCarrito.cantidad + 1) * (productoEnCarrito.unidadesPorConjunto || 0);
        const conjuntosDisponibles = Math.floor(unidadesDisponibles / (productoEnCarrito.unidadesPorConjunto || 1));

        if (unidadesQueNecesitaria > unidadesDisponibles ||
          (productoEnCarrito.cantidad + 1) > conjuntosDisponibles) {
          console.warn('No se puede aumentar: stock insuficiente');
          return prev;
        }
      } else {
        if ((productoEnCarrito.cantidad + 1) > unidadesDisponibles) {
          console.warn('No se puede aumentar: stock insuficiente');
          return prev;
        }
      }

      // Aumentar cantidad
      return prev.map(item =>
        item._id === id && item.tipoVenta === tipoVenta
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      );
    });
  };

  const disminuirCantidad = (id, tipoVenta = 'individual') => {
    setCarrito((prev) =>
      prev.map((item) =>
        item._id === id && item.tipoVenta === tipoVenta && item.cantidad > 1
          ? { ...item, cantidad: item.cantidad - 1 }
          : item
      )
    );
  };

  const eliminarDelCarrito = (id, tipoVenta = 'individual') => {
    setCarrito((prev) => prev.filter((item) =>
      !(item._id === id && item.tipoVenta === tipoVenta)
    ));
  };
  const vaciarCarrito = () => setCarrito([]);

  return (
    <CartContext.Provider value={{
      carrito,
      agregarAlCarrito,
      eliminarDelCarrito,
      vaciarCarrito,
      aumentarCantidad,
      disminuirCantidad
    }}>
      {children}
    </CartContext.Provider>
  );
};
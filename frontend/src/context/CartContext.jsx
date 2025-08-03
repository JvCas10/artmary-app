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
      const existente = prev.find((item) => item._id === producto._id);
      if (existente) {
        return prev.map((item) =>
          item._id === producto._id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      } else {
        return [...prev, { ...producto, cantidad: 1 }];
      }
    });
  };

  const aumentarCantidad = (id) => {
    setCarrito((prev) =>
      prev.map((item) =>
        item._id === id && item.cantidad < item.stock
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      )
    );
  };

  const disminuirCantidad = (id) => {
    setCarrito((prev) =>
      prev.map((item) =>
        item._id === id && item.cantidad > 1
          ? { ...item, cantidad: item.cantidad - 1 }
          : item
      )
    );
  };

  const eliminarDelCarrito = (id) => {
    setCarrito((prev) => prev.filter((item) => item._id !== id));
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
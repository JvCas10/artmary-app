// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Catalogo from './pages/Catalogo';
import CrearProducto from './pages/CrearProducto';
import Carrito from './pages/Carrito';
import ConfirmarPedido from './pages/ConfirmarPedido';
import AdminPanel from './pages/AdminPanel';
import MisPedidos from './pages/MisPedidos';
import NotFoundPage from './pages/NotFoundPage'; // <-- ¡IMPORTA NotFoundPage!
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import VerificarEmail from './pages/VerificarEmail';
import SolicitarRestablecimiento from './pages/SolicitarRestablecimiento';
import RestablecerContrasena from './pages/RestablecerContrasena';

function App() {
  return (
    <>
      <Header />
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verificar-email" element={<VerificarEmail />} />
        <Route path="/solicitar-restablecimiento" element={<SolicitarRestablecimiento />} />
        <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />

        {/* Rutas protegidas para cualquier usuario autenticado */}
        <Route element={<PrivateRoute />}>
          <Route path="/productos" element={<Catalogo />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/confirmar" element={<ConfirmarPedido />} />
          <Route path="/mis-pedidos" element={<MisPedidos />} />
        </Route>

        {/* Rutas protegidas SOLO para usuarios con rol 'admin' */}
        <Route element={<AdminRoute />}>
          <Route path="/admin-panel" element={<AdminPanel />} />
          <Route path="/crear-producto" element={<CrearProducto />} />
        </Route>

        {/* Ruta para 404 Not Found (SIEMPRE VA AL FINAL) */}
        <Route path="*" element={<NotFoundPage />} /> {/* <-- ¡AÑADE ESTA RUTA! */}
      </Routes>
    </>
  );
}

export default App;
// src/App.jsx - VERSIÓN DE DIAGNÓSTICO
import { Routes, Route, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Catalogo from './pages/Catalogo';
import CrearProducto from './pages/CrearProducto';
import Carrito from './pages/Carrito';
import ConfirmarPedido from './pages/ConfirmarPedido';
import AdminPanel from './pages/AdminPanel';
import MisPedidos from './pages/MisPedidos';
import NotFoundPage from './pages/NotFoundPage';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import VerificarEmail from './pages/VerificarEmail';
import SolicitarRestablecimiento from './pages/SolicitarRestablecimiento';
import RestablecerContrasena from './pages/RestablecerContrasena';

// Componente de prueba simple
function PruebaVerificacion() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0f8ff',
      color: '#000',
      fontSize: '24px',
      fontWeight: 'bold',
      flexDirection: 'column'
    }}>
      <h1>🎉 RUTA DE VERIFICACIÓN FUNCIONANDO!</h1>
      <p>URL actual: {window.location.href}</p>
      <p>Token: {new URLSearchParams(window.location.search).get('token')}</p>
    </div>
  );
}

function App() {
  const location = useLocation();
  
  // DEBUG
  console.log('🔍 Ruta actual en App:', location.pathname);
  console.log('🔍 Search params en App:', location.search);
  
  // Rutas que NO deben mostrar el Header
  const rutasSinHeader = ['/login', '/', '/verificar-email', '/solicitar-restablecimiento', '/restablecer-contrasena'];
  const mostrarHeader = !rutasSinHeader.includes(location.pathname);
  
  console.log('🔍 Mostrar header:', mostrarHeader);

  return (
    <>
      {mostrarHeader && <Header />}
      
      {/* MENSAJE DE DEBUG VISIBLE */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        background: 'yellow',
        color: 'black',
        padding: '10px',
        zIndex: 9999,
        fontSize: '12px'
      }}>
        DEBUG: Ruta actual = {location.pathname} | Search = {location.search}
      </div>
      
      <Routes>
        {/* RUTA DE VERIFICACIÓN CON COMPONENTE SIMPLE */}
        <Route path="/verificar-email" element={<PruebaVerificacion />} />
        
        {/* Rutas públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
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
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
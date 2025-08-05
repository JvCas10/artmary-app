// src/App.jsx - VERSIÓN TEMPORAL SIMPLIFICADA
import { Routes, Route } from 'react-router-dom';

// Componente de prueba simple para verificar email
function VerificarEmailSimple() {
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
      flexDirection: 'column',
      padding: '20px'
    }}>
      <h1>🎉 ¡VERIFICACIÓN DE EMAIL FUNCIONANDO!</h1>
      <p>URL actual: {window.location.href}</p>
      <p>Token: {new URLSearchParams(window.location.search).get('token')}</p>
      <p>Si ves esto, la ruta funciona correctamente.</p>
      <a href="/login" style={{
        background: 'blue',
        color: 'white',
        padding: '10px 20px',
        textDecoration: 'none',
        borderRadius: '5px',
        marginTop: '20px'
      }}>
        Ir al Login
      </a>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Solo la ruta de verificación por ahora */}
      <Route path="/verificar-email" element={<VerificarEmailSimple />} />
      
      {/* Para cualquier otra ruta, mostrar mensaje */}
      <Route path="*" element={
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'white',
          color: 'black',
          fontSize: '18px'
        }}>
          <div>
            <h2>Página en construcción</h2>
            <p>Ruta actual: {window.location.pathname}</p>
            <a href="/verificar-email?token=test123">Probar verificar-email</a>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default App;
const express = require('express');
const router = express.Router();
const { registrarUsuario, iniciarSesion, verificarEmail, reenviarVerificacion, solicitarRestablecimiento, restablecerContrasena } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Rutas públicas (no necesitan token)
router.post('/register', registrarUsuario);
router.post('/login', iniciarSesion);

// RUTAS para verificación de email
router.get('/verificar-email', verificarEmail);
router.post('/reenviar-verificacion', reenviarVerificacion);

// NUEVAS RUTAS para restablecimiento de contraseña
router.post('/solicitar-restablecimiento', solicitarRestablecimiento);
router.post('/restablecer-contrasena', restablecerContrasena);

// Rutas protegidas (necesitan token)
// Ruta para obtener información del usuario autenticado
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      usuario: {
        id: req.user._id,
        nombre: req.user.nombre,
        correo: req.user.correo,
        rol: req.user.rol,
        isVerified: req.user.isVerified
      }
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor'
    });
  }
});

// Ruta para verificar si el token es válido
router.get('/verify-token', authMiddleware, (req, res) => {
  res.json({
    success: true,
    mensaje: 'Token válido',
    usuario: {
      id: req.user._id,
      nombre: req.user.nombre,
      correo: req.user.correo,
      rol: req.user.rol,
      isVerified: req.user.isVerified
    }
  });
});

// Ruta para cerrar sesión
router.post('/logout', authMiddleware, (req, res) => {
  // En esta implementación, el logout se maneja desde el frontend
  // eliminando el token del localStorage
  res.json({
    success: true,
    mensaje: 'Sesión cerrada exitosamente'
  });
});

module.exports = router;
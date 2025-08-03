// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        mensaje: 'Acceso denegado. No se proporcionó token.' 
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar el usuario en la base de datos
    const user = await User.findById(decoded.id).select('-contraseña');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        mensaje: 'Token inválido. Usuario no encontrado.' 
      });
    }

    // Agregar la información del usuario a la request
    req.user = user;
    next();
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return res.status(401).json({ 
      success: false, 
      mensaje: 'Token inválido o expirado.' 
    });
  }
};

module.exports = authMiddleware;
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../config/emailConfig');

// Registro con verificación por email
exports.registrarUsuario = async (req, res) => {
  try {
    const { nombre, correo, contraseña } = req.body;

    const usuarioExistente = await User.findOne({ correo });
    if (usuarioExistente) {
      return res.status(400).json({ mensaje: 'El correo ya está registrado.' });
    }

    const hashedPass = await bcrypt.hash(contraseña, 10);

    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiration = new Date();
    tokenExpiration.setHours(tokenExpiration.getHours() + 24); // Expira en 24 horas

    const nuevoUsuario = new User({
      nombre,
      correo,
      contraseña: hashedPass,
      isVerified: false,
      verificationToken: verificationToken,
      verificationTokenExpires: tokenExpiration
    });

    await nuevoUsuario.save();

    // Enviar email de verificación
    try {
      await sendVerificationEmail(correo, verificationToken, nombre);
      
      res.status(201).json({ 
        mensaje: 'Usuario registrado con éxito. Por favor verifica tu correo electrónico.',
        requiresVerification: true
      });
    } catch (emailError) {
      console.error('Error enviando email de verificación:', emailError);
      
      // Si falla el email, eliminamos el usuario creado
      await User.findByIdAndDelete(nuevoUsuario._id);
      
      res.status(500).json({ 
        mensaje: 'Error al enviar email de verificación. Intenta registrarte nuevamente.',
        error: 'EMAIL_SEND_FAILED'
      });
    }

  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ mensaje: 'Error al registrar usuario.', error: error.message });
  }
};

// Verificar email
exports.verificarEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ mensaje: 'Token de verificación requerido.' });
    }

    const usuario = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }
    });

    if (!usuario) {
      return res.status(400).json({ 
        mensaje: 'Token de verificación inválido o expirado.',
        expired: true
      });
    }

    // Verificar usuario
    usuario.isVerified = true;
    usuario.verificationToken = null;
    usuario.verificationTokenExpires = null;
    await usuario.save();

    // Enviar email de bienvenida
    try {
      await sendWelcomeEmail(usuario.correo, usuario.nombre);
    } catch (emailError) {
      console.error('Error enviando email de bienvenida:', emailError);
      // No fallar la verificación si el email de bienvenida falla
    }

    res.status(200).json({ 
      mensaje: 'Email verificado con éxito. Ya puedes iniciar sesión.',
      verified: true
    });

  } catch (error) {
    console.error('Error al verificar email:', error);
    res.status(500).json({ mensaje: 'Error al verificar email.', error: error.message });
  }
};

// Reenviar email de verificación
exports.reenviarVerificacion = async (req, res) => {
  try {
    const { correo } = req.body;

    const usuario = await User.findOne({ correo });

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    if (usuario.isVerified) {
      return res.status(400).json({ mensaje: 'El usuario ya está verificado.' });
    }

    // Generar nuevo token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiration = new Date();
    tokenExpiration.setHours(tokenExpiration.getHours() + 24);

    usuario.verificationToken = verificationToken;
    usuario.verificationTokenExpires = tokenExpiration;
    await usuario.save();

    // Reenviar email
    try {
      await sendVerificationEmail(correo, verificationToken, usuario.nombre);
      
      res.status(200).json({ 
        mensaje: 'Email de verificación reenviado con éxito.',
        sent: true
      });
    } catch (emailError) {
      console.error('Error reenviando email:', emailError);
      res.status(500).json({ 
        mensaje: 'Error al reenviar email de verificación.',
        error: 'EMAIL_SEND_FAILED'
      });
    }

  } catch (error) {
    console.error('Error al reenviar verificación:', error);
    res.status(500).json({ mensaje: 'Error al reenviar verificación.', error: error.message });
  }
};

// NUEVA FUNCIÓN: Solicitar restablecimiento de contraseña
exports.solicitarRestablecimiento = async (req, res) => {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({ mensaje: 'El correo es requerido.' });
    }

    const usuario = await User.findOne({ correo });

    if (!usuario) {
      // Por seguridad, no revelamos si el email existe o no
      return res.status(200).json({ 
        mensaje: 'Si el correo existe en nuestro sistema, recibirás un email con instrucciones.',
        sent: true
      });
    }

    if (!usuario.isVerified) {
      return res.status(400).json({ 
        mensaje: 'Debes verificar tu cuenta antes de restablecer la contraseña.',
        requiresVerification: true
      });
    }

    // Generar token de restablecimiento
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiration = new Date();
    tokenExpiration.setHours(tokenExpiration.getHours() + 1); // Expira en 1 hora

    usuario.passwordResetToken = resetToken;
    usuario.passwordResetExpires = tokenExpiration;
    await usuario.save();

    // Enviar email de restablecimiento
    try {
      await sendPasswordResetEmail(correo, resetToken, usuario.nombre);
      
      res.status(200).json({ 
        mensaje: 'Si el correo existe en nuestro sistema, recibirás un email con instrucciones.',
        sent: true
      });
    } catch (emailError) {
      console.error('Error enviando email de restablecimiento:', emailError);
      res.status(500).json({ 
        mensaje: 'Error al enviar email de restablecimiento.',
        error: 'EMAIL_SEND_FAILED'
      });
    }

  } catch (error) {
    console.error('Error al solicitar restablecimiento:', error);
    res.status(500).json({ mensaje: 'Error al procesar solicitud.', error: error.message });
  }
};

// NUEVA FUNCIÓN: Restablecer contraseña
exports.restablecerContrasena = async (req, res) => {
  try {
    const { token } = req.query;
    const { nuevaContrasena } = req.body;

    if (!token) {
      return res.status(400).json({ mensaje: 'Token de restablecimiento requerido.' });
    }

    if (!nuevaContrasena || nuevaContrasena.length < 6) {
      return res.status(400).json({ mensaje: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    const usuario = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!usuario) {
      return res.status(400).json({ 
        mensaje: 'Token de restablecimiento inválido o expirado.',
        expired: true
      });
    }

    // Actualizar contraseña
    const hashedPass = await bcrypt.hash(nuevaContrasena, 10);
    usuario.contraseña = hashedPass;
    usuario.passwordResetToken = null;
    usuario.passwordResetExpires = null;
    await usuario.save();

    res.status(200).json({ 
      mensaje: 'Contraseña restablecida con éxito. Ya puedes iniciar sesión.',
      success: true
    });

  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ mensaje: 'Error al restablecer contraseña.', error: error.message });
  }
};

// Login modificado para verificar email
exports.iniciarSesion = async (req, res) => {
  try {
    const { correo, contraseña } = req.body;

    console.log('REQ BODY:', req.body);

    const usuario = await User.findOne({ correo });

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Correo no registrado.' });
    }

    console.log('Usuario encontrado:', usuario);

    // Verificar si el email está verificado
    if (!usuario.isVerified) {
      return res.status(401).json({ 
        mensaje: 'Debes verificar tu correo electrónico antes de iniciar sesión.',
        requiresVerification: true,
        email: correo
      });
    }

    const contrasenaValida = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!contrasenaValida) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta.' });
    }

    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        isVerified: usuario.isVerified
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ mensaje: 'Error al iniciar sesión.', error: error.message });
  }
};
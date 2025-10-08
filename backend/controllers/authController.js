const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../config/emailConfig');

// ✅ REGISTRO CON ENVÍO DE EMAIL NO BLOQUEANTE
exports.registrarUsuario = async (req, res) => {
  try {
    const { nombre, correo, contraseña } = req.body;

    console.log('📝 Intento de registro para:', correo);

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
    console.log('✅ Usuario guardado en DB:', correo);

    // ✅ RESPONDER INMEDIATAMENTE AL CLIENTE (SIN ESPERAR EL EMAIL)
    res.status(201).json({ 
      mensaje: 'Usuario registrado con éxito. Por favor verifica tu correo electrónico.',
      requiresVerification: true
    });

    // 🔄 ENVIAR EMAIL EN SEGUNDO PLANO (NO BLOQUEANTE)
    // Usamos setImmediate o Promise sin await para no bloquear
    setImmediate(async () => {
      try {
        console.log('📧 Enviando email de verificación a:', correo);
        await sendVerificationEmail(correo, verificationToken, nombre);
        console.log('✅ Email de verificación enviado exitosamente a:', correo);
      } catch (emailError) {
        console.error('❌ Error enviando email de verificación:', emailError.message);
        // El usuario ya está creado, solo logueamos el error
        // Podríamos guardar en DB que el email falló para reintentarlo después
      }
    });

  } catch (error) {
    console.error('❌ Error al registrar usuario:', error);
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

    usuario.isVerified = true;
    usuario.verificationToken = null;
    usuario.verificationTokenExpires = null;
    await usuario.save();

    res.status(200).json({ 
      mensaje: 'Email verificado con éxito. Ya puedes iniciar sesión.',
      verified: true
    });

    // Enviar email de bienvenida en segundo plano
    setImmediate(async () => {
      try {
        await sendWelcomeEmail(usuario.correo, usuario.nombre);
        console.log('✅ Email de bienvenida enviado a:', usuario.correo);
      } catch (emailError) {
        console.error('❌ Error enviando email de bienvenida:', emailError);
      }
    });

  } catch (error) {
    console.error('Error al verificar email:', error);
    res.status(500).json({ mensaje: 'Error al verificar email.', error: error.message });
  }
};

// Reenviar verificación
exports.reenviarVerificacion = async (req, res) => {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({ mensaje: 'El correo es requerido.' });
    }

    const usuario = await User.findOne({ correo });

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    if (usuario.isVerified) {
      return res.status(400).json({ mensaje: 'Este correo ya está verificado.' });
    }

    // Generar nuevo token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiration = new Date();
    tokenExpiration.setHours(tokenExpiration.getHours() + 24);

    usuario.verificationToken = verificationToken;
    usuario.verificationTokenExpires = tokenExpiration;
    await usuario.save();

    // ✅ RESPONDER INMEDIATAMENTE
    res.status(200).json({ 
      mensaje: 'Email de verificación reenviado. Revisa tu bandeja de entrada.',
      sent: true
    });

    // 🔄 ENVIAR EMAIL EN SEGUNDO PLANO
    setImmediate(async () => {
      try {
        await sendVerificationEmail(correo, verificationToken, usuario.nombre);
        console.log('✅ Email de verificación reenviado a:', correo);
      } catch (emailError) {
        console.error('❌ Error reenviando email:', emailError);
      }
    });

  } catch (error) {
    console.error('Error al reenviar verificación:', error);
    res.status(500).json({ mensaje: 'Error al reenviar verificación.', error: error.message });
  }
};

// Solicitar restablecimiento de contraseña
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

    // ✅ RESPONDER INMEDIATAMENTE
    res.status(200).json({ 
      mensaje: 'Si el correo existe en nuestro sistema, recibirás un email con instrucciones.',
      sent: true
    });

    // 🔄 ENVIAR EMAIL EN SEGUNDO PLANO
    setImmediate(async () => {
      try {
        await sendPasswordResetEmail(correo, resetToken, usuario.nombre);
        console.log('✅ Email de restablecimiento enviado a:', correo);
      } catch (emailError) {
        console.error('❌ Error enviando email de restablecimiento:', emailError);
      }
    });

  } catch (error) {
    console.error('Error al solicitar restablecimiento:', error);
    res.status(500).json({ mensaje: 'Error al procesar solicitud.', error: error.message });
  }
};

// Restablecer contraseña
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

    console.log('🔐 Intento de login para:', correo);

    const usuario = await User.findOne({ correo });

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Correo no registrado.' });
    }

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

    console.log('✅ Login exitoso para:', correo);

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
    console.error('❌ Error en login:', error);
    res.status(500).json({ mensaje: 'Error al iniciar sesión.', error: error.message });
  }
};
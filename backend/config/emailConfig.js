// backend/config/emailConfig.js
const nodemailer = require('nodemailer');

// Configuración del transportador de email
const createTransport = () => {
  // Para Gmail
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // tu_email@gmail.com
      pass: process.env.EMAIL_PASS  // la contraseña de aplicación (no tu contraseña normal)
    }
  });
};

// Función para enviar email de verificación
const sendVerificationEmail = async (email, verificationToken, userName) => {
  const transporter = createTransport();

  // backend/config/emailConfig.js - LÍNEA A CAMBIAR
  const verificationUrl = `${process.env.FRONTEND_URL}/#/verificar-email?token=${verificationToken}`;

  const mailOptions = {
    from: {
      name: 'Art Mary - Librería y Papelería',
      address: process.env.EMAIL_USER
    },
    to: email,
    subject: '✨ Verifica tu cuenta en Art Mary',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verificación de Email - Art Mary</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #ec4899, #f472b6); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .welcome { font-size: 18px; margin-bottom: 20px; color: #2d3748; }
          .message { margin-bottom: 30px; color: #4a5568; line-height: 1.7; }
          .button-container { text-align: center; margin: 30px 0; }
          .verify-button { display: inline-block; background: linear-gradient(135deg, #ec4899, #f472b6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: transform 0.2s; }
          .verify-button:hover { transform: translateY(-2px); }
          .footer { background: #f7fafc; padding: 20px; text-align: center; font-size: 14px; color: #718096; border-top: 1px solid #e2e8f0; }
          .warning { background: #fef5e7; border-left: 4px solid #f6ad55; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .warning strong { color: #c05621; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎨 Art Mary</h1>
            <p>Librería y Papelería</p>
          </div>
          
          <div class="content">
            <div class="welcome">¡Hola ${userName}! 👋</div>
            
            <div class="message">
              Gracias por registrarte en <strong>Art Mary</strong>. Para completar tu registro y comenzar a disfrutar de todos nuestros productos, necesitas verificar tu dirección de correo electrónico.
            </div>
            
            <div class="button-container">
              <a href="${verificationUrl}" class="verify-button">
                ✨ Verificar mi Email
              </a>
            </div>
            
            <div class="warning">
              <strong>⏰ Importante:</strong> Este enlace de verificación expirará en 24 horas por seguridad. Si no verificas tu cuenta dentro de este tiempo, tendrás que registrarte nuevamente.
            </div>
            
            <div class="message">
              Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
              <a href="${verificationUrl}" style="color: #ec4899; word-break: break-all;">${verificationUrl}</a>
            </div>
            
            <div class="message">
              Si no te registraste en Art Mary, puedes ignorar este email de forma segura.
            </div>
          </div>
          
          <div class="footer">
            <p>© 2024 Art Mary - Librería y Papelería</p>
            <p>Donde tus ideas cobran vida ✨</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de verificación enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error enviando email de verificación:', error);
    throw error;
  }
};

// Función para enviar email de bienvenida (después de verificar)
const sendWelcomeEmail = async (email, userName) => {
  const transporter = createTransport();

  const mailOptions = {
    from: {
      name: 'Art Mary - Librería y Papelería',
      address: process.env.EMAIL_USER
    },
    to: email,
    subject: '🎉 ¡Bienvenido a Art Mary!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido - Art Mary</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 40px 30px; text-align: center; }
          .welcome { font-size: 24px; margin-bottom: 20px; color: #2d3748; }
          .message { margin-bottom: 30px; color: #4a5568; line-height: 1.7; }
          .button-container { text-align: center; margin: 30px 0; }
          .shop-button { display: inline-block; background: linear-gradient(135deg, #ec4899, #f472b6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: transform 0.2s; }
          .footer { background: #f7fafc; padding: 20px; text-align: center; font-size: 14px; color: #718096; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 ¡Cuenta Verificada!</h1>
          </div>
          
          <div class="content">
            <div class="welcome">¡Bienvenido ${userName}! 🎨</div>
            
            <div class="message">
              Tu cuenta ha sido verificada exitosamente. Ya puedes acceder a todo nuestro catálogo de productos de librería y papelería.
            </div>
            
            <div class="message">
              Explora nuestra amplia selección de:
              <br>📚 Libros y materiales educativos
              <br>✏️ Útiles escolares y de oficina  
              <br>🎨 Materiales de arte y manualidades
              <br>📝 Papelería especializada
            </div>
            
            <div class="button-container">
              <a href="${process.env.FRONTEND_URL}/productos" class="shop-button">
                🛍️ Comenzar a Comprar
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2024 Art Mary - Librería y Papelería</p>
            <p>Donde tus ideas cobran vida ✨</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de bienvenida enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error enviando email de bienvenida:', error);
    throw error;
  }
};

// NUEVA FUNCIÓN: Enviar email de restablecimiento de contraseña
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  const transporter = createTransport();

  const resetUrl = `${process.env.FRONTEND_URL}/restablecer-contrasena?token=${resetToken}`;

  const mailOptions = {
    from: {
      name: 'Art Mary - Librería y Papelería',
      address: process.env.EMAIL_USER
    },
    to: email,
    subject: '🔐 Restablece tu contraseña en Art Mary',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecer Contraseña - Art Mary</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .welcome { font-size: 18px; margin-bottom: 20px; color: #2d3748; }
          .message { margin-bottom: 30px; color: #4a5568; line-height: 1.7; }
          .button-container { text-align: center; margin: 30px 0; }
          .reset-button { display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: transform 0.2s; }
          .reset-button:hover { transform: translateY(-2px); }
          .footer { background: #f7fafc; padding: 20px; text-align: center; font-size: 14px; color: #718096; border-top: 1px solid #e2e8f0; }
          .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .warning strong { color: #dc2626; }
          .security { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .security strong { color: #1d4ed8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Art Mary</h1>
            <p>Restablecimiento de Contraseña</p>
          </div>
          
          <div class="content">
            <div class="welcome">Hola ${userName} 👋</div>
            
            <div class="message">
              Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Art Mary</strong>. Si fuiste tú quien solicitó este cambio, haz clic en el botón de abajo para crear una nueva contraseña.
            </div>
            
            <div class="button-container">
              <a href="${resetUrl}" class="reset-button">
                🔐 Restablecer Contraseña
              </a>
            </div>
            
            <div class="warning">
              <strong>⏰ Tiempo limitado:</strong> Este enlace expirará en 1 hora por seguridad. Si no restableces tu contraseña dentro de este tiempo, tendrás que solicitar un nuevo enlace.
            </div>
            
            <div class="security">
              <strong>🛡️ Seguridad:</strong> Si no solicitaste este restablecimiento, puedes ignorar este email de forma segura. Tu contraseña actual permanecerá sin cambios.
            </div>
            
            <div class="message">
              Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
              <a href="${resetUrl}" style="color: #f59e0b; word-break: break-all;">${resetUrl}</a>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2024 Art Mary - Librería y Papelería</p>
            <p>Donde tus ideas cobran vida ✨</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de restablecimiento enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error enviando email de restablecimiento:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
};
// backend/config/emailConfig.js - CON SENDGRID
const sgMail = require('@sendgrid/mail');

// Configurar SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendVerificationEmail = async (email, token, nombre) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verificar-email?token=${token}`;
  
  const msg = {
    to: email,
    from: process.env.SENDGRID_VERIFIED_EMAIL,
    subject: 'Verifica tu cuenta - ArtMary',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a ArtMary!</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre},</h2>
            <p>Gracias por registrarte en ArtMary, tu librería y papelería de confianza.</p>
            <p>Para completar tu registro y verificar tu cuenta, haz clic en el siguiente botón:</p>
            <center>
              <a href="${verificationUrl}" class="button">Verificar mi cuenta</a>
            </center>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            <p><strong>Este enlace expirará en 24 horas.</strong></p>
            <p>Si no creaste esta cuenta, puedes ignorar este correo.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 ArtMary. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Email de verificación enviado exitosamente a:', email);
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    if (error.response) {
      console.error('📧 Response body:', error.response.body);
    }
    throw error;
  }
};

const sendWelcomeEmail = async (email, nombre) => {
  const msg = {
    to: email,
    from: process.env.SENDGRID_VERIFIED_EMAIL,
    subject: '¡Cuenta verificada! - ArtMary',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Cuenta Verificada!</h1>
          </div>
          <div class="content">
            <h2>¡Hola ${nombre}! 🎉</h2>
            <p>Tu cuenta ha sido verificada exitosamente.</p>
            <p>Ya puedes iniciar sesión y explorar nuestro catálogo completo.</p>
            <center>
              <a href="${process.env.FRONTEND_URL}/login" class="button">Iniciar Sesión</a>
            </center>
            <p>¡Gracias por unirte a ArtMary!</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Email de bienvenida enviado a:', email);
  } catch (error) {
    console.error('❌ Error enviando email de bienvenida:', error);
    throw error;
  }
};

const sendPasswordResetEmail = async (email, token, nombre) => {
  const resetUrl = `${process.env.FRONTEND_URL}/restablecer-contrasena?token=${token}`;
  
  const msg = {
    to: email,
    from: process.env.SENDGRID_VERIFIED_EMAIL,
    subject: 'Restablece tu contraseña - ArtMary',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Restablecer Contraseña</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre},</h2>
            <p>Recibimos una solicitud para restablecer tu contraseña.</p>
            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
            <center>
              <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
            </center>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Este enlace expirará en 1 hora</li>
                <li>Si no solicitaste esto, ignora este correo</li>
              </ul>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Email de restablecimiento enviado a:', email);
  } catch (error) {
    console.error('❌ Error enviando email de restablecimiento:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};
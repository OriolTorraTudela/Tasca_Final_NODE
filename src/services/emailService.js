const nodemailer = require('nodemailer');

/**
 * Crea el transportador d'email (nodemailer).
 * En desenvolupament usa Ethereal (email fals, no envia res real).
 */
const createTransporter = () => {
  if (process.env.NODE_ENV === 'test' || !process.env.EMAIL_USER || process.env.EMAIL_USER === 'test@example.com') {
    // Transportador fals per a dev/test: registra el token a la consola
    return {
      sendMail: async (options) => {
        console.log('📧 [EMAIL SIMULAT] Per a:', options.to);
        console.log('📧 [EMAIL SIMULAT] Assumpte:', options.subject);
        if (options.text) console.log('📧 [EMAIL SIMULAT] Contingut:', options.text);
        return { messageId: 'simulat-' + Date.now() };
      }
    };
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Envia l'email de recuperació de contrasenya amb el token
 * @param {string} to - email del destinatari
 * @param {string} resetToken - token de reset
 */
const sendPasswordResetEmail = async (to, resetToken) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.FRONTEND_URL}/api/auth/reset-password/${resetToken}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@projecte-t9.com',
    to,
    subject: 'Recuperació de contrasenya - Projecte T9',
    text: `Has sol·licitat recuperar la contrasenya.\n\nFes clic al següent enllaç (vàlid 1 hora):\n${resetUrl}\n\nSi no has sol·licitat això, ignora aquest email.`,
    html: `<p>Has sol·licitat recuperar la contrasenya.</p><p><a href="${resetUrl}">Restablir contrasenya</a> (vàlid 1 hora)</p><p>Si no has sol·licitat això, ignora aquest email.</p>`,
  });
};

module.exports = { sendPasswordResetEmail };

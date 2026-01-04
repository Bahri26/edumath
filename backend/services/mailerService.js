const nodemailer = require('nodemailer');

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const emailFrom = process.env.EMAIL_FROM || 'no-reply@edumath.local';

let transporter;
if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: { user: smtpUser, pass: smtpPass },
  });
} else {
  // Fallback: log-only transporter (no external SMTP)
  transporter = {
    sendMail: async (options) => {
      console.log('📧 [MAIL LOG ONLY] To:', options.to);
      console.log('Subject:', options.subject);
      console.log('Text:', options.text);
      console.log('HTML:', options.html);
      return { messageId: 'log-only', previewUrl: null };
    }
  };
}

exports.sendMail = async ({ to, subject, text, html }) => {
  const info = await transporter.sendMail({
    from: emailFrom,
    to,
    subject,
    text,
    html,
  });
  return info;
};

module.exports = exports;
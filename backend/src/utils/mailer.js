'use strict';
// mailer.js — thin nodemailer wrapper
// Configure via .env:
//   MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM
//
// For local dev / testing: set MAIL_HOST=smtp.ethereal.email and use
// a free Ethereal test account (https://ethereal.email) — no real emails sent.
// For production: use SendGrid SMTP, Mailgun, AWS SES, etc.

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST   || 'smtp.ethereal.email',
  port:   parseInt(process.env.MAIL_PORT || '587', 10),
  secure: process.env.MAIL_PORT === '465',  // true for port 465, false for others
  auth: {
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || '',
  },
});

/**
 * sendPasswordReset
 * Sends a password reset email with a one-click link.
 *
 * @param {string} to    - recipient email address
 * @param {string} token - the raw reset token (NOT hashed)
 */
async function sendPasswordReset(to, token) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  await transporter.sendMail({
    from:    process.env.MAIL_FROM || '"Plxyground" <no-reply@plxyground.com>',
    to,
    subject: 'Reset your Plxyground password',
    text: `Hi,\n\nYou requested a password reset.\n\nClick this link to reset your password (expires in 1 hour):\n${resetLink}\n\nIf you did not request this, ignore this email.`,
    html: `
      <p>Hi,</p>
      <p>You requested a password reset for your Plxyground account.</p>
      <p>
        <a href="${resetLink}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
          Reset Password
        </a>
      </p>
      <p style="color:#64748b;font-size:13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}

module.exports = { sendPasswordReset };

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { winston } from '../lib.js';

dotenv.config({ path: '../../.env' });

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to, subject, text, html) => {
  const mailOptions = {
    from: `"L.I.F - Love Is Free" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    winston.info(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    winston.error(`Email sending failed: ${error.message}`);
    throw new Error('Failed to send email');
  }
};
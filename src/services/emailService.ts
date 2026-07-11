import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

export interface EmailResult {
  ok: boolean;
  errorMessage?: string | null;
  /** Nodemailer / SMTP-specific error code, if any. */
  code?: string | number | null;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  try {
    await transporter.sendMail({
      from: `"ScaleUpStores" <${env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    return { ok: true };
  } catch (error: any) {
    const message = error?.message || 'unknown error';
    const code = error?.code ?? null;
    console.error(
      `[Email] send failed to=${to} code=${code} message=${message}`
    );
    return { ok: false, errorMessage: message, code };
  }
}

export async function sendOtpEmail(
  email: string,
  otp: string
): Promise<EmailResult> {
  const html = `<div style="font-family:Arial;max-width:600px;margin:0 auto;"><h2>Email Verification</h2><p>Your OTP is:</p><h1 style="color:#4CAF50;font-size:32px;letter-spacing:5px;">${otp}</h1><p>Valid for 10 minutes.</p></div>`;
  return sendEmail(email, 'Email Verification - ScaleUpStores', html);
}

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<EmailResult> {
  const html = `<div style="font-family:Arial;max-width:600px;margin:0 auto;"><h2>Password Reset</h2><p>Click to reset:</p><a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#4CAF50;color:white;text-decoration:none;border-radius:4px;">Reset Password</a><p>Link valid for 1 hour.</p></div>`;
  return sendEmail(email, 'Password Reset - ScaleUpStores', html);
}

export async function sendOrderConfirmationEmail(
  email: string,
  orderNumber: string,
  details: string
): Promise<EmailResult> {
  const html = `<div style="font-family:Arial;max-width:600px;margin:0 auto;"><h2>Order Confirmed</h2><p>Order <strong>#${orderNumber}</strong> confirmed.</p>${details}<p>Thank you!</p></div>`;
  return sendEmail(email, `Order #${orderNumber} Confirmed`, html);
}

export async function sendBackInStockEmail(
  email: string,
  productName: string,
  productId: number
): Promise<EmailResult> {
  const html = `<div style="font-family:Arial;max-width:600px;margin:0 auto;"><h2>Back in Stock!</h2><p>Good news! <strong>${productName}</strong> is back in stock.</p><a href="${env.FRONTEND_URL}/products/${productId}" style="display:inline-block;padding:12px 24px;background:#4CAF50;color:white;text-decoration:none;border-radius:4px;">Shop Now</a></div>`;
  return sendEmail(email, `${productName} is back in stock!`, html);
}

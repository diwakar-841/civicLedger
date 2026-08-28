import { logger } from "./logger";
import { env } from "../config/env";

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Warn at startup if production without SMTP
if (env.NODE_ENV === "production" && !env.SMTP_HOST) {
  logger.warn(
    "WARNING: NODE_ENV=production but SMTP_HOST is not set. Email sending will fall back to logger.info (no emails sent). Set SMTP_HOST/SMTP_USER/SMTP_PASSWORD/APP_BASE_URL to enable real email delivery."
  );
}

// FIX: Create a single shared transporter instead of a new one per email.
// Creating a fresh transporter (and TCP connection) for every email was slow
// and caused requests to hang while waiting for the SMTP handshake.
import nodemailer from "nodemailer";

const hasSmtp = !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD);

// Singleton transporter — reuses the TCP connection across emails.
// Connection timeouts prevent a slow/unreachable SMTP server from hanging
// the Node process indefinitely.
const transporter = hasSmtp
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
      // FIX: Hard limits so a slow Gmail connection fails fast instead of
      // blocking the event loop for 30+ seconds.
      connectionTimeout: 5_000,  // 5 s to establish TCP connection
      greetingTimeout: 5_000,    // 5 s for SMTP greeting
      socketTimeout: 10_000,     // 10 s per socket operation
    })
  : null;

async function sendEmail(opts: EmailOptions): Promise<void> {
  if (transporter) {
    await transporter.sendMail({
      from: env.SMTP_FROM ?? env.SMTP_USER,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    logger.info("Email sent", { to: opts.to, subject: opts.subject });
  } else {
    if (env.NODE_ENV === "production") {
      logger.warn("SMTP not configured in production - email not sent (logging instead)", {
        to: opts.to,
        subject: opts.subject,
      });
    }
    logger.info("Dev email (would be sent in production)", {
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    });
  }
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const baseUrl = env.APP_BASE_URL ?? "http://localhost:5173";
  const link = `${baseUrl}/verify-email/${token}`;
  await sendEmail({
    to,
    subject: "Verify your email address – Civic Ledger",
    text: `Please verify your Gmail address by clicking the following link:\n\n${link}\n\nThis link expires in 24 hours. If you do not complete phone verification within 24 hours of registration, your pending registration will be deleted and you can register again.`,
    html: `<p>Please verify your Gmail address by clicking the link below:</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours. If you do not complete phone verification within 24 hours of registration, your pending registration will be deleted and you can register again.</p>`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const baseUrl = env.APP_BASE_URL ?? "http://localhost:5173";
  const link = `${baseUrl}/reset-password/${token}`;
  await sendEmail({
    to,
    subject: "Reset your password – Civic Ledger",
    text: `You requested a password reset. Click the following link to reset your password:\n\n${link}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.`,
    html: `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${link}">${link}</a></p><p>This link expires in 1 hour. If you did not request this, ignore this email.</p>`,
  });
}

export async function sendKycOtpEmail(to: string, otp: string): Promise<void> {
  await sendEmail({
    to,
    subject: "Your Civic Ledger login verification code",
    text: `Your one-time verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\nIf you did not attempt to log in, please change your password immediately.`,
    html: `
      <p>Your one-time login verification code is:</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px 0;">${otp}</p>
      <p>This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <p style="color:#666;">If you did not attempt to log in, please change your password immediately.</p>
    `,
  });
}

/** Sent during registration — OTP to verify email ownership before setting password */
export async function sendRegistrationOtpEmail(to: string, name: string, otp: string): Promise<void> {
  await sendEmail({
    to,
    subject: "Your Civic Ledger registration code",
    text: `Hi ${name},\n\nYour registration verification code is: ${otp}\n\nThis code expires in 10 minutes. Enter it on the registration page to set your password.\n\nIf you did not register for Civic Ledger, please ignore this email.`,
    html: `
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your registration verification code is:</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px 0;">${otp}</p>
      <p>This code expires in <strong>10 minutes</strong>. Enter it on the registration page to set your password.</p>
      <p style="color:#666;">If you did not register for Civic Ledger, please ignore this email.</p>
    `,
  });
}

/**
 * Sent when the user chooses "Verify via email link" during registration.
 * The link carries a short-lived token the frontend exchanges for a password-set token.
 */
export async function sendRegistrationLinkEmail(to: string, name: string, link: string): Promise<void> {
  await sendEmail({
    to,
    subject: "Complete your Civic Ledger registration",
    text: `Hi ${name},\n\nClick the link below to set your password and complete registration:\n\n${link}\n\nThis link expires in 24 hours. Pending registrations are deleted after 24 hours.\n\nIf you did not request this, please ignore this email.`,
    html: `
      <p>Hi <strong>${name}</strong>,</p>
      <p>Click the button below to set your password and complete your registration:</p>
      <p style="text-align:center;padding:16px 0;">
        <a href="${link}" style="background:#d4a600;color:#0a1628;padding:12px 28px;border-radius:8px;font-weight:700;text-decoration:none;display:inline-block;">
          Set my password
        </a>
      </p>
      <p>Or copy this link into your browser:</p>
      <p><a href="${link}">${link}</a></p>
      <p>This link expires in <strong>24 hours</strong>. Pending registrations are deleted after 24 hours.</p>
      <p style="color:#666;">If you did not register for Civic Ledger, please ignore this email.</p>
    `,
  });
}

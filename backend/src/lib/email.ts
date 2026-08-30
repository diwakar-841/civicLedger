import { logger } from "./logger";
import { env } from "../config/env";

// Sent via SendGrid's HTTP API (https://sendgrid.com) instead of raw SMTP.
// Hosts like Render and Vercel block outbound SMTP ports (25/465/587) on
// their free tiers, which caused OTP/verification emails to silently fail
// or time out after deployment even though everything worked locally.
// An HTTP API call goes out over normal port 443, so it isn't affected.
//
// EMAIL_FROM must be an address verified in SendGrid under
// Settings -> Sender Authentication -> Single Sender Verification (or an
// address on a domain you've verified there). Unverified senders are
// rejected by SendGrid's API.
const hasSendgrid = !!(env.SENDGRID_API_KEY && env.EMAIL_FROM);

// Parses "Name <email@example.com>" or a bare "email@example.com" into the
// {name, email} shape SendGrid's API expects.
function parseFrom(from: string): { name?: string; email: string } {
  const match = from.match(/^(.*)<(.+)>$/);
  if (match) {
    const name = match[1].trim().replace(/^"|"$/g, "");
    return { name: name || undefined, email: match[2].trim() };
  }
  return { email: from.trim() };
}

interface SendEmailOpts {
  to: string;
  subject: string;
  text: string;
  html: string;
}

async function sendEmail(opts: SendEmailOpts): Promise<void> {
  if (hasSendgrid) {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: opts.to }] }],
        from: parseFrom(env.EMAIL_FROM as string),
        subject: opts.subject,
        content: [
          { type: "text/plain", value: opts.text },
          { type: "text/html", value: opts.html },
        ],
      }),
      // Fail fast rather than hanging the request if SendGrid is unreachable.
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`SendGrid API error ${res.status}: ${body}`);
    }

    logger.info("Email sent", { to: opts.to, subject: opts.subject });
  } else {
    if (env.NODE_ENV === "production") {
      logger.warn("SendGrid not configured in production - email not sent (logging instead)", {
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

// Warn at startup if production without SendGrid configured
if (env.NODE_ENV === "production" && !env.SENDGRID_API_KEY) {
  logger.warn(
    "WARNING: NODE_ENV=production but SENDGRID_API_KEY is not set. Email sending will fall back to logger.info (no emails sent). Set SENDGRID_API_KEY/EMAIL_FROM/APP_BASE_URL to enable real email delivery."
  );
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

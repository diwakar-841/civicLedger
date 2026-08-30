import emailjs, { EmailJSResponseStatus } from "@emailjs/nodejs";
import { logger } from "./logger";
import { env } from "../config/env";

// ─────────────────────────────────────────────────────────────────────────
// Sends via EmailJS's HTTPS API (never SMTP), so outbound-SMTP-blocking
// hosts like Render aren't a problem.
//
// IMPORTANT — different model from Resend/SendGrid: EmailJS does NOT take
// raw HTML strings from your code. You design ONE template in the EmailJS
// dashboard (Email Templates → Create New Template) with placeholder
// variables, and this file just fills those variables in and fires the
// send. The variables used below are: to_email, subject, message, otp_code,
// action_url, user_name — add matching {{tags}} in your template.
//
// One-time EmailJS dashboard setup:
//   1. Email Services → Add New Service (Gmail/Outlook/custom SMTP) → copy
//      the Service ID.
//   2. Email Templates → Create New Template → use {{to_email}}, {{subject}},
//      {{message}}, {{otp_code}}, {{action_url}}, {{user_name}} as needed →
//      copy the Template ID. Set the "To email" field on the template to
//      {{to_email}}, or sends will only go to your own test address.
//   3. Account → General → copy your Public Key.
//   4. Account → Security → API Keys → turn ON "Allow non-browser requests".
//      This is OFF by default and is the #1 reason server-side sends fail
//      with a 403 ("API calls in the non-browser applications are
//      disabled") even with correct keys.
//   5. Account → Security → copy/create your Private Key. Always pass it
//      from the server — it authenticates the request instead of relying
//      on the public key + an allowlisted domain (which a backend has
//      none of).
//
// Free tier: 200 emails/month, ~1 request/second. If you expect more OTP
// volume than that, EmailJS may not be the right long-term fit.
// ─────────────────────────────────────────────────────────────────────────

let initialized = false;
function ensureInit() {
  if (initialized) return;
  emailjs.init({
    publicKey: env.EMAILJS_PUBLIC_KEY!,
    privateKey: env.EMAILJS_PRIVATE_KEY!,
  });
  initialized = true;
}

function isConfigured(): boolean {
  return !!(
    env.EMAILJS_SERVICE_ID &&
    env.EMAILJS_TEMPLATE_ID &&
    env.EMAILJS_PUBLIC_KEY &&
    env.EMAILJS_PRIVATE_KEY
  );
}

interface TemplateParams {
  to_email: string;
  subject: string;
  message: string;
  otp_code?: string;
  action_url?: string;
  user_name?: string;
}

async function sendEmail(params: TemplateParams): Promise<void> {
  if (!isConfigured()) {
    if (env.NODE_ENV === "production") {
      logger.warn("EmailJS not fully configured in production - email not sent (logging instead)", {
        to: params.to_email,
        subject: params.subject,
      });
    }
    logger.info("Dev email (would be sent in production)", params as unknown as Record<string, unknown>);
    return;
  }

  ensureInit();

  try {
    const res = await emailjs.send(env.EMAILJS_SERVICE_ID!, env.EMAILJS_TEMPLATE_ID!, { ...params });
    logger.info("Email sent via EmailJS", { to: params.to_email, subject: params.subject, status: res.status });
  } catch (err) {
    // EmailJS throws EmailJSResponseStatus with .status / .text on API errors
    // (e.g. 403 = non-browser requests not enabled, 400 = bad service/template id)
    if (err instanceof EmailJSResponseStatus) {
      logger.error("EmailJS send failed", { to: params.to_email, subject: params.subject, status: err.status, text: err.text });
    } else {
      logger.error("EmailJS send failed", { to: params.to_email, subject: params.subject, err });
    }
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Public API — same signatures as before, nothing else needs to change.
// ─────────────────────────────────────────────────────────────────────────

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const baseUrl = env.APP_BASE_URL ?? "http://localhost:5173";
  const link = `${baseUrl}/verify-email/${token}`;
  await sendEmail({
    to_email: to,
    subject: "Verify your email address – Civic Ledger",
    message:
      "Please verify your email address using the link below. This link expires in 24 hours. If you do not complete phone verification within 24 hours of registration, your pending registration will be deleted and you can register again.",
    action_url: link,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const baseUrl = env.APP_BASE_URL ?? "http://localhost:5173";
  const link = `${baseUrl}/reset-password/${token}`;
  await sendEmail({
    to_email: to,
    subject: "Reset your password – Civic Ledger",
    message:
      "You requested a password reset. Use the link below to reset your password. This link expires in 1 hour. If you did not request this, ignore this email.",
    action_url: link,
  });
}

export async function sendKycOtpEmail(to: string, otp: string): Promise<void> {
  await sendEmail({
    to_email: to,
    subject: "Your Civic Ledger login verification code",
    message:
      "Your one-time verification code is below. It expires in 10 minutes. Do not share it with anyone. If you did not attempt to log in, please change your password immediately.",
    otp_code: otp,
  });
}

/** Sent during registration — OTP to verify email ownership before setting password */
export async function sendRegistrationOtpEmail(to: string, name: string, otp: string): Promise<void> {
  await sendEmail({
    to_email: to,
    subject: "Your Civic Ledger registration code",
    message:
      "Your registration verification code is below. It expires in 10 minutes. Enter it on the registration page to set your password. If you did not register for Civic Ledger, please ignore this email.",
    otp_code: otp,
    user_name: name,
  });
}

/**
 * Sent when the user chooses "Verify via email link" during registration.
 * The link carries a short-lived token the frontend exchanges for a password-set token.
 */
export async function sendRegistrationLinkEmail(to: string, name: string, link: string): Promise<void> {
  await sendEmail({
    to_email: to,
    subject: "Complete your Civic Ledger registration",
    message:
      "Use the link below to set your password and complete your registration. This link expires in 24 hours. Pending registrations are deleted after 24 hours. If you did not request this, please ignore this email.",
    action_url: link,
    user_name: name,
  });
}

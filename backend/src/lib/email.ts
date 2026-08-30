import emailjs, { EmailJSResponseStatus } from "@emailjs/nodejs";
import { logger } from "./logger";
import { env } from "../config/env";

// ─────────────────────────────────────────────────────────────────────────
// Sends via EmailJS's HTTPS API (never SMTP), so Render's outbound-SMTP
// block isn't a problem.
//
// Uses TWO of EmailJS's pre-built templates from the template gallery
// (Email Templates → Create New → Browse pre-built templates), so the
// variable names below match EmailJS's own schema instead of a custom one:
//
//   EMAILJS_OTP_TEMPLATE_ID  → the "One-Time Password" template.
//     Variables: email (To Email field), passcode, time.
//     Static placeholder [Company Name] must be edited directly in the
//     template body — it is not a {{variable}}.
//
//   EMAILJS_LINK_TEMPLATE_ID → a link-style template (e.g. "Password Reset").
//     Variables: email (To Email field), link.
//
// One-time EmailJS dashboard setup (already done for the OTP template):
//   1. Email Services → note the Service ID.
//   2. Email Templates → create/pick each template above → note its ID.
//   3. Account → General → copy the Public Key.
//   4. Account → Security → turn ON "Allow non-browser requests" (off by
//      default; causes 403s otherwise) → copy/create the Private Key.
//
// Free tier: 200 emails/month, ~1 request/second.
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

function hasCoreConfig(): boolean {
  return !!(env.EMAILJS_SERVICE_ID && env.EMAILJS_PUBLIC_KEY && env.EMAILJS_PRIVATE_KEY);
}

async function send(templateId: string | undefined, params: Record<string, string>): Promise<void> {
  const to = params.email;

  if (!hasCoreConfig() || !templateId) {
    if (env.NODE_ENV === "production") {
      logger.warn("EmailJS not fully configured in production - email not sent (logging instead)", { to });
    }
    logger.info("Dev email (would be sent in production)", { to, ...params });
    return;
  }

  ensureInit();

  try {
    const res = await emailjs.send(env.EMAILJS_SERVICE_ID!, templateId, params);
    logger.info("Email sent via EmailJS", { to, templateId, status: res.status });
  } catch (err) {
    // EmailJS throws EmailJSResponseStatus with .status / .text on API errors
    // (403 = non-browser requests not enabled, 412 = Gmail service needs
    // reconnect, 400 = bad service/template id)
    if (err instanceof EmailJSResponseStatus) {
      logger.error("EmailJS send failed", { to, templateId, status: err.status, text: err.text });
    } else {
      logger.error("EmailJS send failed", { to, templateId, err });
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
  await send(env.EMAILJS_LINK_TEMPLATE_ID, { email: to, link });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const baseUrl = env.APP_BASE_URL ?? "http://localhost:5173";
  const link = `${baseUrl}/reset-password/${token}`;
  await send(env.EMAILJS_LINK_TEMPLATE_ID, { email: to, link });
}

export async function sendKycOtpEmail(to: string, otp: string): Promise<void> {
  await send(env.EMAILJS_OTP_TEMPLATE_ID, { email: to, passcode: otp, time: "10 minutes" });
}

/** Sent during registration — OTP to verify email ownership before setting password */
export async function sendRegistrationOtpEmail(to: string, name: string, otp: string): Promise<void> {
  await send(env.EMAILJS_OTP_TEMPLATE_ID, { email: to, passcode: otp, time: "10 minutes", name });
}

/**
 * Sent when the user chooses "Verify via email link" during registration.
 * The link carries a short-lived token the frontend exchanges for a password-set token.
 */
export async function sendRegistrationLinkEmail(to: string, name: string, link: string): Promise<void> {
  await send(env.EMAILJS_LINK_TEMPLATE_ID, { email: to, link, name });
}

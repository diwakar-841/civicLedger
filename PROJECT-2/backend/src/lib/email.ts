import emailjs, { EmailJSResponseStatus } from "@emailjs/nodejs";
import { logger } from "./logger";
import { env } from "../config/env";

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
  return !!(
    env.EMAILJS_SERVICE_ID &&
    env.EMAILJS_PUBLIC_KEY &&
    env.EMAILJS_PRIVATE_KEY
  );
}

async function send(
  templateId: string | undefined,
  params: Record<string, string>,
): Promise<void> {
  const to = params.email;

  if (!hasCoreConfig() || !templateId) {
    if (env.NODE_ENV === "production") {
      // Never fall through to "log the message and pretend it was sent" in
      // production: the params contain OTPs and password-reset links, and the
      // caller would tell the user an email was delivered when it was not.
      logger.error("EmailJS is not fully configured - email NOT sent", {
        to,
        templateConfigured: Boolean(templateId),
      });
      throw new Error("Email delivery is not configured");
    }
    logger.info("Dev email (would be sent in production)", { to, ...params });
    return;
  }

  ensureInit();

  try {
    const res = await emailjs.send(env.EMAILJS_SERVICE_ID!, templateId, params);
    logger.info("Email sent via EmailJS", {
      to,
      templateId,
      status: res.status,
    });
  } catch (err) {
    if (err instanceof EmailJSResponseStatus) {
      logger.error("EmailJS send failed", {
        to,
        templateId,
        status: err.status,
        text: err.text,
      });
    } else {
      logger.error("EmailJS send failed", { to, templateId, err });
    }
    throw err;
  }
}

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  const baseUrl = env.APP_BASE_URL ?? "http://localhost:5173";
  const link = `${baseUrl}/verify-email/${token}`;
  await send(env.EMAILJS_LINK_TEMPLATE_ID, { email: to, link });
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
): Promise<void> {
  const baseUrl = env.APP_BASE_URL ?? "http://localhost:5173";
  const link = `${baseUrl}/reset-password/${token}`;
  await send(env.EMAILJS_LINK_TEMPLATE_ID, { email: to, link });
}

export async function sendKycOtpEmail(to: string, otp: string): Promise<void> {
  await send(env.EMAILJS_OTP_TEMPLATE_ID, {
    email: to,
    passcode: otp,
    time: "10 minutes",
  });
}

export async function sendRegistrationOtpEmail(
  to: string,
  name: string,
  otp: string,
): Promise<void> {
  await send(env.EMAILJS_OTP_TEMPLATE_ID, {
    email: to,
    passcode: otp,
    time: "10 minutes",
    name,
  });
}

export async function sendRegistrationLinkEmail(
  to: string,
  name: string,
  link: string,
): Promise<void> {
  await send(env.EMAILJS_LINK_TEMPLATE_ID, { email: to, link, name });
}

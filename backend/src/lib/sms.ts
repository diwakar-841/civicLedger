import { env } from "../config/env";
import { logger } from "./logger";

export async function sendPhoneVerificationOtp(
  to: string,
  otp: string,
): Promise<{ delivered: boolean }> {
  const {
    TWILIO_ACCOUNT_SID: accountSid,
    TWILIO_AUTH_TOKEN: authToken,
    TWILIO_FROM_NUMBER: from,
  } = env;

  if (!accountSid || !authToken || !from) {
    if (env.NODE_ENV === "production") {
      throw new Error("SMS delivery is not configured");
    }
    logger.info("Dev SMS (would be sent in production)", {
      to,
      message: `Your Civic Ledger phone verification code is ${otp}. It expires in 10 minutes.`,
    });
    return { delivered: false };
  }

  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: `Your Civic Ledger phone verification code is ${otp}. It expires in 10 minutes. Do not share it.`,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Twilio SMS request failed (${response.status}): ${detail.slice(0, 300)}`,
    );
  }

  logger.info("Phone verification SMS sent", { to });
  return { delivered: true };
}

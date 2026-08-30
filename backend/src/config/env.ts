import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(5000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    JWT_SECRET: z
      .string()
      .min(32, "JWT_SECRET must be at least 32 characters - generate one with `openssl rand -hex 32`"),
    AADHAAR_PEPPER: z
      .string()
      .min(16, "AADHAAR_PEPPER must be at least 16 characters - generate one with `openssl rand -hex 16`"),
    RPC_URL: z.string().url("RPC_URL must be a valid URL"),
    VOTING_CONTRACT_ADDRESS: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "VOTING_CONTRACT_ADDRESS must be a valid 0x-prefixed address"),
    DEPLOYER_PRIVATE_KEY: z
      .string()
      .regex(/^(0x)?[a-fA-F0-9]{64}$/, "DEPLOYER_PRIVATE_KEY must be a 32-byte hex private key"),
    WALLET_ENCRYPTION_KEY: z
      .string()
      .min(32, "WALLET_ENCRYPTION_KEY must be at least 32 characters - generate one with `openssl rand -hex 32`"),
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
    TOTP_ENCRYPTION_KEY: z
      .string()
      .min(32, "TOTP_ENCRYPTION_KEY must be at least 32 characters - generate one with `openssl rand -hex 32`"),

    // Email — sent via Resend's HTTP API instead of raw SMTP so it isn't
    // affected by hosts (Render/Vercel free tiers, etc.) that block outbound
    // SMTP ports 25/465/587.
    //
    // Until a domain is verified in Resend, EMAIL_FROM must stay
    // "onboarding@resend.dev" — Resend will only actually deliver to the
    // address used to sign up for the Resend account in that case. Once a
    // domain (even a free one, e.g. from eu.org) is verified in Resend's
    // dashboard, switch EMAIL_FROM to an address on that domain and it will
    // deliver to any real user.
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().optional(), // e.g. "Civic Ledger <onboarding@resend.dev>"
    APP_BASE_URL: z.string().url().optional(),

    // SMS config used for the post-login phone verification OTP.
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_FROM_NUMBER: z.string().optional(),

    // WebAuthn / biometric config
    WEBAUTHN_RP_NAME: z.string().default("Civic Ledger"),
    WEBAUTHN_RP_ID: z.string().default("localhost"),
    WEBAUTHN_ORIGIN: z.string().default("http://localhost:5173"),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production") {
      if (!data.RESEND_API_KEY) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["RESEND_API_KEY"], message: "RESEND_API_KEY is required in production" });
      }
      if (!data.EMAIL_FROM) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["EMAIL_FROM"], message: "EMAIL_FROM is required in production" });
      }
      if (!data.APP_BASE_URL) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["APP_BASE_URL"], message: "APP_BASE_URL is required in production" });
      }
      if (!data.TWILIO_ACCOUNT_SID || !data.TWILIO_AUTH_TOKEN || !data.TWILIO_FROM_NUMBER) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["TWILIO_ACCOUNT_SID"],
          message: "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER are required in production",
        });
      }
    }
  });

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid or missing environment configuration:");
    for (const issue of parsed.error.issues) {
      console.error(` - ${issue.path.join(".")}: ${issue.message}`);
    }
    console.error("\nCopy backend/.env.example to backend/.env and fill in real values.");
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
export const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

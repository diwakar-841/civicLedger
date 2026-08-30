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

    // Email — sent via EmailJS's HTTPS API (never raw SMTP), so it isn't
    // affected by hosts (Render/Vercel free tiers, etc.) that block outbound
    // SMTP ports 25/465/587. See backend/src/lib/email.ts for the required
    // one-time EmailJS dashboard setup (service, template, and — critically —
    // enabling "Allow non-browser requests" under Account > Security).
    EMAILJS_SERVICE_ID: z.string().optional(),
    EMAILJS_TEMPLATE_ID: z.string().optional(),
    EMAILJS_PUBLIC_KEY: z.string().optional(),
    EMAILJS_PRIVATE_KEY: z.string().optional(),
    APP_BASE_URL: z.string().url().optional(),

    // SMS config used for the post-login phone verification OTP.
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_FROM_NUMBER: z.string().optional(),

    // Set to "true" to skip starting the blockchain event indexer job on boot.
    SKIP_INDEXER: z.string().optional(),

    // WebAuthn / biometric config
    WEBAUTHN_RP_NAME: z.string().default("Civic Ledger"),
    WEBAUTHN_RP_ID: z.string().default("localhost"),
    WEBAUTHN_ORIGIN: z.string().default("http://localhost:5173"),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production") {
      if (!data.EMAILJS_SERVICE_ID || !data.EMAILJS_TEMPLATE_ID || !data.EMAILJS_PUBLIC_KEY || !data.EMAILJS_PRIVATE_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["EMAILJS_SERVICE_ID"],
          message: "EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, and EMAILJS_PRIVATE_KEY are required in production",
        });
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

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
    /**
     * Secret used to encrypt every user's server-managed wallet private key
     * before storing it in the database.
     *
     * Generate one with:  openssl rand -hex 32
     *
     * CRITICAL — treat this like the JWT_SECRET:
     *   • Never commit it to version control.
     *   • Back it up securely. Losing it means losing access to all
     *     server-managed user wallets (votes would be permanently blocked).
     *   • If you rotate it you must re-encrypt all existing encrypted_private_key
     *     values in the database before the old value is discarded.
     */
    WALLET_ENCRYPTION_KEY: z
      .string()
      .min(32, "WALLET_ENCRYPTION_KEY must be at least 32 characters - generate one with `openssl rand -hex 32`"),
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
    // TOTP encryption key - required, at least 32 chars
    TOTP_ENCRYPTION_KEY: z
      .string()
      .min(32, "TOTP_ENCRYPTION_KEY must be at least 32 characters - generate one with `openssl rand -hex 32`"),
    // SMTP / email config - optional in dev, required in production
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM: z.string().optional(),
    APP_BASE_URL: z.string().url().optional(),
    // SMS config used for the post-login phone verification OTP.
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_FROM_NUMBER: z.string().optional(),
    // WebAuthn / biometric config
    WEBAUTHN_RP_NAME: z.string().default("Civic Ledger"),
    WEBAUTHN_RP_ID: z.string().default("localhost"),
    WEBAUTHN_ORIGIN: z.string().default("http://localhost:5173"),
    // Whether to skip starting the blockchain indexer and on-chain reconciliation
    // Useful for deployments where no RPC node is available (e.g. Render without a node).
    SKIP_INDEXER: z.coerce.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production") {
      if (!data.SMTP_HOST) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["SMTP_HOST"], message: "SMTP_HOST is required in production" });
      }
      if (!data.SMTP_USER) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["SMTP_USER"], message: "SMTP_USER is required in production" });
      }
      if (!data.SMTP_PASSWORD) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["SMTP_PASSWORD"], message: "SMTP_PASSWORD is required in production" });
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

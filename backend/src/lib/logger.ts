import pino from "pino";
import { env } from "../config/env";

/**
 * Structured logger with automatic redaction of secrets and PII. Previous
 * implementation was a bare console.log wrapper with no redaction, which
 * risked leaking JWTs, password hashes, and private keys into logs if a
 * caller ever passed them in metadata.
 */
const base = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "password",
      "passwordHash",
      "voterPrivateKey",
      "signature",
      "token",
      "authorization",
      "*.password",
      "*.passwordHash",
      "*.voterPrivateKey",
      "*.signature",
      "*.token",
    ],
    censor: "[REDACTED]",
  },
  base: undefined,
});

type Meta = Record<string, unknown>;

// Thin wrapper keeps the existing call-site signature (message first, meta
// second) used throughout the codebase, while gaining pino's structured
// output and redaction underneath.
export const logger = {
  info: (message: string, meta?: Meta) => base.info(meta ?? {}, message),
  warn: (message: string, meta?: Meta) => base.warn(meta ?? {}, message),
  error: (message: string, meta?: Meta) => base.error(meta ?? {}, message),
  debug: (message: string, meta?: Meta) => base.debug(meta ?? {}, message),
};

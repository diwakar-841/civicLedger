import pino from "pino";
import { env } from "../config/env";

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

export const logger = {
  info: (message: string, meta?: Meta) => base.info(meta ?? {}, message),
  warn: (message: string, meta?: Meta) => base.warn(meta ?? {}, message),
  error: (message: string, meta?: Meta) => base.error(meta ?? {}, message),
  debug: (message: string, meta?: Meta) => base.debug(meta ?? {}, message),
};

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
    "*.token"],

    censor: "[REDACTED]"
  },
  base: undefined
});

export const logger = {
  info: (message, meta) => {return base.info(meta ?? {}, message);},
  warn: (message, meta) => {return base.warn(meta ?? {}, message);},
  error: (message, meta) => {return base.error(meta ?? {}, message);},
  debug: (message, meta) => {return base.debug(meta ?? {}, message);}
};
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

type LogMeta = Record<string, unknown>;
type LogMessage = string | LogMeta;

function writeLog(
  method: "info" | "warn" | "error" | "debug",
  messageOrMeta: LogMessage,
  maybeMeta?: LogMeta
) {
  if (typeof messageOrMeta === "string") {
    return base[method](maybeMeta ?? {}, messageOrMeta);
  }
  return base[method](messageOrMeta);
}

export const logger = {
  info: (messageOrMeta: LogMessage, meta?: LogMeta) =>
    writeLog("info", messageOrMeta, meta),
  warn: (messageOrMeta: LogMessage, meta?: LogMeta) =>
    writeLog("warn", messageOrMeta, meta),
  error: (messageOrMeta: LogMessage, meta?: LogMeta) =>
    writeLog("error", messageOrMeta, meta),
  debug: (messageOrMeta: LogMessage, meta?: LogMeta) =>
    writeLog("debug", messageOrMeta, meta)
};
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger";
import { AppError } from "../lib/errors";
import { env } from "../config/env";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}

/**
 * Centralized error handling. Previous version always responded 400 and
 * echoed `err.message` verbatim to the client for every error, including
 * unexpected DB/RPC failures - which can leak connection strings, SQL
 * fragments, or internal file paths. Now: known operational errors (AppError)
 * return their safe message and correct status; anything else is logged in
 * full server-side and only a generic message crosses the wire in production.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    logger.warn("Validation error", { path: req.path });
    return res.status(400).json({ error: "Validation failed", details: err.flatten() });
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { path: req.path, stack: err.stack });
    } else {
      logger.warn(err.message, { path: req.path, status: err.statusCode });
    }
    return res.status(err.statusCode).json({ error: err.message });
  }

  const message = err instanceof Error ? err.message : "Unknown error";
  logger.error(message, { path: req.path, stack: err instanceof Error ? err.stack : undefined });

  return res.status(500).json({
    error: env.NODE_ENV === "production" ? "Something went wrong. Please try again." : message,
  });
}

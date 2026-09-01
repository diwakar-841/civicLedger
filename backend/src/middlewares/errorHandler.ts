import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger";
import { AppError } from "../lib/errors";
import { env } from "../config/env";

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}

export function errorHandler(err, req, res, _next) {
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

  return res.status(500).json({ error: env.NODE_ENV === "production" ? "Something went wrong. Please try again." : message });
}
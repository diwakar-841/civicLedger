import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger";
import { AppError } from "../lib/errors";
import { env } from "../config/env";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    logger.warn("Validation error", { path: req.path });
    return res
      .status(400)
      .json({ error: "Validation failed", details: err.flatten() });
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { path: req.path, stack: err.stack });
    } else {
      logger.warn(err.message, { path: req.path, status: err.statusCode });
    }
    return res.status(err.statusCode).json({ error: err.message });
  }

  // body-parser / express.json errors carry an HTTP status (400 malformed
  // JSON, 413 payload too large). They are client errors, not server faults.
  const httpErr = err as { status?: number; statusCode?: number; type?: string };
  const clientStatus = httpErr?.status ?? httpErr?.statusCode;
  if (
    typeof clientStatus === "number" &&
    clientStatus >= 400 &&
    clientStatus < 500
  ) {
    logger.warn("Client error", { path: req.path, status: clientStatus });
    return res.status(clientStatus).json({
      error:
        httpErr.type === "entity.parse.failed"
          ? "Malformed JSON in request body"
          : httpErr.type === "entity.too.large"
            ? "Request body is too large"
            : "Bad request",
    });
  }

  const message = err instanceof Error ? err.message : "Unknown error";
  logger.error(message, {
    path: req.path,
    stack: err instanceof Error ? err.stack : undefined,
  });

  return res.status(500).json({
    error:
      env.NODE_ENV === "production"
        ? "Something went wrong. Please try again."
        : message,
  });
}

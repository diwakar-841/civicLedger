import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

type Target = "body" | "params" | "query";

/**
 * Validates and replaces `req[target]` with the parsed/coerced data.
 * Zod errors are passed to `next()` so the central error handler formats
 * them consistently instead of every route re-implementing `flatten()`.
 */
export function validate(schema: ZodSchema, target: Target = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return next(result.error);
    }
    (req as unknown as Record<Target, unknown>)[target] = result.data;
    next();
  };
}

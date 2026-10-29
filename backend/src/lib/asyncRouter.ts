import { Router, RequestHandler } from "express";

/**
 * Express 4 does not catch rejected promises returned by async route
 * handlers. A single DB error (e.g. an invalid UUID in a path param, an FK
 * violation) inside an un-wrapped `async (req, res) => {}` handler therefore
 * leaves the request hanging until the server timeout, and only shows up as
 * an "unhandledRejection" log line.
 *
 * `safeRouter()` returns a normal Router whose verb methods wrap every
 * handler so a rejected promise is forwarded to `next(err)` and reaches the
 * central errorHandler.
 */
const VERBS = ["get", "post", "put", "patch", "delete"] as const;

function wrap(handler: any): any {
  if (typeof handler !== "function") return handler;
  // Error-handling middleware (4 args) must keep its arity.
  if (handler.length >= 4) return handler;
  return function wrapped(req: any, res: any, next: any) {
    try {
      const result = handler(req, res, next);
      if (result && typeof result.catch === "function") {
        result.catch(next);
      }
    } catch (err) {
      next(err);
    }
  };
}

function wrapAll(args: any[]): any[] {
  return args.map((arg) => (Array.isArray(arg) ? wrapAll(arg) : wrap(arg)));
}

export function safeRouter(): Router {
  const router = Router();
  for (const verb of VERBS) {
    const original = (router as any)[verb].bind(router);
    (router as any)[verb] = (path: any, ...handlers: RequestHandler[]) =>
      original(path, ...wrapAll(handlers as any[]));
  }
  return router;
}

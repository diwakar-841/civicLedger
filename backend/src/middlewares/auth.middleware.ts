import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UnauthorizedError, ForbiddenError } from "../lib/errors";

export interface AuthedRequest extends Request {
  user?: { userId: string; role: "voter" | "admin" };
}

export interface KycRequest extends Request {
  kycUserId?: string;
  kycRole?: string;
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Missing authorization token"));
  }
  try {
    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as {
      userId: string;
      role: "voter" | "admin";
      purpose?: string;
    };

    if (payload.purpose) {
      return next(new UnauthorizedError("Invalid or expired token"));
    }
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

export function requireKycToken(purpose: string) {
  return (req: KycRequest, res: Response, next: NextFunction) => {
    const token: string | undefined = req.body?.kycToken;
    if (!token) return next(new UnauthorizedError("Missing KYC token"));
    try {
      const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as {
        userId: string;
        purpose: string;
        role: string;
      };
      if (payload.purpose !== purpose)
        return next(new UnauthorizedError("Invalid token for this step"));
      req.kycUserId = payload.userId;
      req.kycRole = payload.role;
      next();
    } catch {
      next(new UnauthorizedError("Invalid or expired KYC token"));
    }
  };
}

export function requireSetupToken(
  req: KycRequest,
  res: Response,
  next: NextFunction,
) {
  const token: string | undefined = req.body?.setupToken;
  if (!token) return next(new UnauthorizedError("Missing setup token"));
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as {
      userId: string;
      purpose: string;
      role: string;
    };
    if (payload.purpose !== "biometric-setup")
      return next(new UnauthorizedError("Invalid setup token"));
    req.kycUserId = payload.userId;
    req.kycRole = payload.role;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired setup token"));
  }
}

export function optionalAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();
  try {
    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as {
      userId: string;
      role: "voter" | "admin";
      purpose?: string;
    };
    if (!payload.purpose) {
      req.user = { userId: payload.userId, role: payload.role };
    }
  } catch {}
  next();
}

export function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  if (req.user?.role !== "admin") {
    return next(new ForbiddenError("Admin access required"));
  }
  next();
}

export function requireTwoFactor(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  checkTwoFactorAsync(req, next);
}

async function checkTwoFactorAsync(req: AuthedRequest, next: NextFunction) {
  try {
    const { db, users } = await import("@voting/database");
    const { eq } = await import("drizzle-orm");
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user!.userId),
    });
    if (!user?.isTwoFactorEnabled) {
      return next(
        new ForbiddenError(
          "Admin accounts must have two-factor authentication enabled. Please set up 2FA first.",
        ),
      );
    }
    next();
  } catch (err) {
    next(err);
  }
}

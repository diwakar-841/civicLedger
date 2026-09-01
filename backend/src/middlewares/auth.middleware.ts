import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UnauthorizedError, ForbiddenError } from "../lib/errors";

export interface AuthenticatedUser {
  userId: string;
  role?: string;
}

export type AuthedRequest = Request & {
  user: AuthenticatedUser;
};

type AuthTokenPayload = jwt.JwtPayload & {
  userId: string;
  role?: string;
  purpose?: string;
};

function verifyAuthToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, env.JWT_SECRET);
  if (typeof payload === "string") {
    throw new UnauthorizedError("Invalid or expired token");
  }
  return payload as AuthTokenPayload;
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Missing authorization token"));
  }
  try {
    const token = header.slice("Bearer ".length);
    const payload = verifyAuthToken(token);

    if (payload.purpose) {
      return next(new UnauthorizedError("Invalid or expired token"));
    }
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

export function requireKycToken(purpose) {
  return (req, res, next) => {
    const token = req.body?.kycToken;
    if (!token) {return next(new UnauthorizedError("Missing KYC token"));}
    try {
      const payload = verifyAuthToken(token);
      if (payload.purpose !== purpose) {return next(new UnauthorizedError("Invalid token for this step"));}
      req.kycUserId = payload.userId;
      req.kycRole = payload.role;
      next();
    } catch {
      next(new UnauthorizedError("Invalid or expired KYC token"));
    }
  };
}

export function requireSetupToken(req, res, next) {
  const token = req.body?.setupToken;
  if (!token) {return next(new UnauthorizedError("Missing setup token"));}
  try {
    const payload = verifyAuthToken(token);
    if (payload.purpose !== "biometric-setup") {return next(new UnauthorizedError("Invalid setup token"));}
    req.kycUserId = payload.userId;
    req.kycRole = payload.role;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired setup token"));
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {return next();}
  try {
    const token = header.slice("Bearer ".length);
    const payload = verifyAuthToken(token);
    if (!payload.purpose) {
      req.user = { userId: payload.userId, role: payload.role };
    }
  } catch {

  }
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return next(new ForbiddenError("Admin access required"));
  }
  next();
}

export function requireTwoFactor(req, res, next) {
  checkTwoFactorAsync(req, next);
}

async function checkTwoFactorAsync(req, next) {
  try {
    const { db, users } = await import("@voting/database");
    const { eq } = await import("drizzle-orm");
    const user = await db.query.users.findFirst({ where: eq(users.id, req.user.userId) });
    if (!user?.isTwoFactorEnabled) {
      return next(new ForbiddenError("Admin accounts must have two-factor authentication enabled. Please set up 2FA first."));
    }
    next();
  } catch (err) {
    next(err);
  }
}
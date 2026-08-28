import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in a few minutes." },
});

export const authSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 3,
  delayMs: (hits) => hits * 500,
});

export const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many voting attempts. Please slow down." },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

export const walletLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many wallet requests. Please try again later." },
});

export const resendVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many verification requests. Please try again later." },
});

// Rate limiter for KYC steps (identity check + OTP)
export const kycLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many verification attempts. Please try again later." },
});

// Rate limiter for vote challenge / biometric auth
export const voteAuthLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many vote auth attempts. Please try again in a few minutes." },
});

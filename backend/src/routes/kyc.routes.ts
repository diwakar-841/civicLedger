import { Router } from "express";
import { z } from "zod";
import { kycLimiter, voteAuthLimiter } from "../middlewares/rateLimit";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  verifyIdentityHandler,
  verifyOtpHandler,
  resendOtpHandler,
  biometricRegisterOptionsHandler,
  biometricRegisterVerifyHandler,
  biometricLoginChallengeHandler,
  biometricLoginVerifyHandler,
  voteChallengeHandler,
  voteVerifyHandler,
  votePinVerifyHandler,
  candidateRequestChallengeHandler,
  candidateRequestVerifyHandler,
  candidateRequestPinHandler,
} from "../controllers/kyc.controller";

const router = Router();

const votePinSchema = z.object({
  pin: z.string().regex(/^\d{6}$/, "Voting PIN must be exactly 6 digits"),
});

const identitySchema = z.object({
  kycToken: z.string().min(1),
  phone: z.string().trim().regex(/^(?:\+91)?\d{10}$/, "Phone number must be a valid 10-digit number"),
  dob: z.string().min(1),
});

const phoneOtpSchema = z.object({
  kycToken: z.string().min(1),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

const resendOtpSchema = z.object({
  kycToken: z.string().min(1),
});

// ─── Phone + DOB identity verification (first login only) ─────────────────────
router.post("/kyc/verify-identity", kycLimiter, validate(identitySchema), verifyIdentityHandler);
router.post("/kyc/verify-otp",      kycLimiter, validate(phoneOtpSchema), verifyOtpHandler);
router.post("/kyc/resend-otp",      kycLimiter, validate(resendOtpSchema), resendOtpHandler);

// ─── Biometric setup (first login — token-gated, no session yet) ──────────────
router.post("/biometric/register-options", kycLimiter, biometricRegisterOptionsHandler);
router.post("/biometric/register-verify",  kycLimiter, biometricRegisterVerifyHandler);

// ─── Biometric login (subsequent logins — replaces KYC) ──────────────────────
router.post("/biometric/login-challenge", voteAuthLimiter, biometricLoginChallengeHandler);
router.post("/biometric/login-verify",    voteAuthLimiter, biometricLoginVerifyHandler);

// ─── Candidate nomination acceptance authentication ───────────────────────────
router.post("/candidate-request/challenge", requireAuth, voteAuthLimiter, candidateRequestChallengeHandler);
router.post("/candidate-request/verify", requireAuth, voteAuthLimiter, candidateRequestVerifyHandler);
router.post("/candidate-request/verify-pin", requireAuth, voteAuthLimiter, candidateRequestPinHandler);

// ─── Vote authentication (requires active session) ────────────────────────────
router.post("/vote/challenge",    requireAuth, voteAuthLimiter, voteChallengeHandler);
router.post("/vote/verify",       requireAuth, voteAuthLimiter, voteVerifyHandler);
router.post("/vote/verify-pin",   requireAuth, voteAuthLimiter, validate(votePinSchema), votePinVerifyHandler);

export default router;

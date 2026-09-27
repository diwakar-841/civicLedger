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
  biometricSetupTokenHandler,
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
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+91)?\d{10}$/, "Phone number must be a valid 10-digit number"),
  dob: z.string().min(1),
  aadhaar: z
    .string()
    .trim()
    .regex(/^\d{12}$/, "Aadhaar number must be exactly 12 digits"),
});

const phoneOtpSchema = z.object({
  kycToken: z.string().min(1),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

const resendOtpSchema = z.object({
  kycToken: z.string().min(1),
});

router.post(
  "/kyc/verify-identity",
  kycLimiter,
  validate(identitySchema),
  verifyIdentityHandler,
);
router.post(
  "/kyc/verify-otp",
  kycLimiter,
  validate(phoneOtpSchema),
  verifyOtpHandler,
);
router.post(
  "/kyc/resend-otp",
  kycLimiter,
  validate(resendOtpSchema),
  resendOtpHandler,
);

router.post(
  "/biometric/setup-token",
  requireAuth,
  biometricSetupTokenHandler,
);
router.post(
  "/biometric/register-options",
  kycLimiter,
  biometricRegisterOptionsHandler,
);
router.post(
  "/biometric/register-verify",
  kycLimiter,
  biometricRegisterVerifyHandler,
);

router.post(
  "/biometric/login-challenge",
  voteAuthLimiter,
  biometricLoginChallengeHandler,
);
router.post(
  "/biometric/login-verify",
  voteAuthLimiter,
  biometricLoginVerifyHandler,
);

router.post(
  "/candidate-request/challenge",
  requireAuth,
  voteAuthLimiter,
  candidateRequestChallengeHandler,
);
router.post(
  "/candidate-request/verify",
  requireAuth,
  voteAuthLimiter,
  candidateRequestVerifyHandler,
);
router.post(
  "/candidate-request/verify-pin",
  requireAuth,
  voteAuthLimiter,
  candidateRequestPinHandler,
);

router.post(
  "/vote/challenge",
  requireAuth,
  voteAuthLimiter,
  voteChallengeHandler,
);
router.post("/vote/verify", requireAuth, voteAuthLimiter, voteVerifyHandler);
router.post(
  "/vote/verify-pin",
  requireAuth,
  voteAuthLimiter,
  validate(votePinSchema),
  votePinVerifyHandler,
);

export default router;

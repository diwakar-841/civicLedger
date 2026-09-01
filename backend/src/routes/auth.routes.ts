import { Router } from "express";
import { z } from "zod";
import {
  registerInitiate,
  registerVerifyOtp,
  registerSetPassword,
  login,
  login2faHandler,
  loginPinHandler,
  setupPinsHandler,
  me,
  refresh,
  logout,
  logoutAll,
  listSessions,
  revokeSession,
  setup2fa,
  enable2fa,
  disable2fa,
  verifyEmailHandler,
  resendVerificationHandler,
  resendVerificationPublicHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  sessionPinHandler 
} from
"../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { requireAuth } from "../middlewares/auth.middleware";
import { authLimiter, authSlowDown, resendVerifyLimiter } from "../middlewares/rateLimit";

const router = Router();

export const passwordSchema = z.
string().
min(10, "Password must be at least 10 characters").
max(128).
regex(/[a-z]/, "Password must include a lowercase letter").
regex(/[A-Z]/, "Password must include an uppercase letter").
regex(/[0-9]/, "Password must include a number");

function isOldEnough(dob, minAge) {
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) {return false;}
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - minAge);
  return birth <= cutoff;
}

const registerInitiateSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.
  string().
  trim().
  toLowerCase().
  email().
  refine((value) => {return value.endsWith("@gmail.com");}, "Please use a Gmail address"),
  dob: z.
  string().
  refine((v) => {return isOldEnough(v, 16);}, { message: "You must be at least 16 years old to register" }),
  emailVerificationMethod: z.enum(["otp", "link"]).default("otp")
});

const registerVerifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  otp: z.string().regex(/^\d{6}$/, "Email verification code must be 6 digits")
});

const registerSetPasswordSchema = z.object({
  setPasswordToken: z.string().min(1),
  password: passwordSchema
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1)
});

const login2faSchema = z.object({
  challengeToken: z.string().min(1),
  code: z.string().min(1)
});

const loginPinSchema = z.object({
  loginToken: z.string().min(1),
  pin: z.string().regex(/^\d{6}$/, "PIN must be exactly 6 digits")
});

const setupPinsSchema = z.object({
  loginPin: z.string().regex(/^\d{6}$/, "Login PIN must be exactly 6 digits"),
  votingPin: z.string().regex(/^\d{6}$/, "Voting PIN must be exactly 6 digits")
});

const totpCodeSchema = z.object({ code: z.string().min(1) });

const forgotPasswordSchema = z.object({ email: z.string().trim().toLowerCase().email() });

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema
});

const resendVerificationPublicSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  method: z.enum(["otp", "link"]).optional()
});

router.post("/register/initiate", authLimiter, authSlowDown, validate(registerInitiateSchema), registerInitiate);
router.post("/register/verify-otp", authLimiter, authSlowDown, validate(registerVerifyOtpSchema), registerVerifyOtp);
router.post("/register/set-password", authLimiter, validate(registerSetPasswordSchema), registerSetPassword);

router.post("/login", authLimiter, authSlowDown, validate(loginSchema), login);
router.post("/login/2fa", authLimiter, authSlowDown, validate(login2faSchema), login2faHandler);
router.post("/login-pin", authLimiter, authSlowDown, validate(loginPinSchema), loginPinHandler);
router.get("/me", requireAuth, me);

router.post("/pins/setup", requireAuth, authLimiter, validate(setupPinsSchema), setupPinsHandler);

router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/logout-all", requireAuth, logoutAll);
router.get("/sessions", requireAuth, listSessions);
router.delete("/sessions/:id", requireAuth, revokeSession);

router.post("/2fa/setup", requireAuth, setup2fa);
router.post("/2fa/enable", requireAuth, validate(totpCodeSchema), enable2fa);
router.post("/2fa/disable", requireAuth, validate(totpCodeSchema), disable2fa);

router.get("/verify-email/:token", verifyEmailHandler);
router.post("/resend-verification", requireAuth, resendVerifyLimiter, resendVerificationHandler);
router.post(
  "/resend-verification-public",
  resendVerifyLimiter,
  validate(resendVerificationPublicSchema),
  resendVerificationPublicHandler
);

router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), forgotPasswordHandler);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), resetPasswordHandler);

const sessionPinSchema = z.object({ pin: z.string().regex(/^\d{6}$/, "PIN must be exactly 6 digits") });
router.post("/session-pin", requireAuth, authLimiter, validate(sessionPinSchema), sessionPinHandler);

export default router;
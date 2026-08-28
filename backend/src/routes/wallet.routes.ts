import { Router } from "express";
import { z } from "zod";
import { generate, nonce, verify } from "../controllers/wallet.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { walletLimiter } from "../middlewares/rateLimit";

const router = Router();

const verifySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  signature: z.string().min(1),
});

/**
 * POST /wallet/generate
 *
 * Recommended for Android / mobile users.
 * Creates a server-managed Ethereum wallet automatically — no wallet app needed.
 * The user just taps "Set Up Wallet" and can vote immediately after.
 */
router.post("/generate", requireAuth, walletLimiter, generate);

/**
 * POST /wallet/nonce  +  POST /wallet/verify
 *
 * Manual external-wallet binding (MetaMask / hardware wallet).
 * Power-user flow — most users should use /generate above.
 */
router.post("/nonce",   requireAuth, walletLimiter, nonce);
router.post("/verify",  requireAuth, walletLimiter, validate(verifySchema), verify);

export default router;

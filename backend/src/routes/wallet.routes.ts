import { Router } from "express";
import { z } from "zod";
import { generate, nonce, verify } from "../controllers/wallet.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { walletLimiter } from "../middlewares/rateLimit";

const router = Router();

const verifySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  signature: z.string().min(1)
});

router.post("/generate", requireAuth, walletLimiter, generate);

router.post("/nonce", requireAuth, walletLimiter, nonce);
router.post("/verify", requireAuth, walletLimiter, validate(verifySchema), verify);

export default router;
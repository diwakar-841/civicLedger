import { Router } from "express";
import { z } from "zod";
import {
  vote,
  myVoteStatus,
  contractInfo,
} from "../controllers/votes.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { voteLimiter } from "../middlewares/rateLimit";

const router = Router();

const voteSchema = z.object({
  electionId: z.string().uuid("Invalid election id"),
  candidateId: z.string().uuid("Invalid candidate id"),
  voteToken: z
    .string()
    .min(
      1,
      "A vote token is required — authenticate with your PIN or biometric first",
    ),
});

const electionIdParamSchema = z.object({
  electionId: z.string().uuid("Invalid election id"),
});

router.get("/contract-info", requireAuth, contractInfo);

router.get(
  "/my-vote/:electionId",
  requireAuth,
  validate(electionIdParamSchema, "params"),
  myVoteStatus,
);

router.post("/", requireAuth, voteLimiter, validate(voteSchema), vote);

export default router;

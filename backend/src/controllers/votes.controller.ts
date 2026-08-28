import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthedRequest } from "../middlewares/auth.middleware";
import { castVote, getMyVoteStatus } from "../services/vote.service";
import { getPublicContractInfo } from "../services/blockchain.service";
import { env } from "../config/env";
import { UnauthorizedError } from "../lib/errors";

export async function vote(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { electionId, candidateId, voteToken } = req.body;

    // Verify the short-lived voteToken issued by POST /auth/vote/verify
    let votePayload: { userId: string; purpose: string };
    try {
      votePayload = jwt.verify(voteToken, env.JWT_SECRET) as { userId: string; purpose: string };
    } catch {
      throw new UnauthorizedError(
        "Invalid or expired vote token — please re-authenticate with your PIN or biometric"
      );
    }
    if (votePayload.purpose !== "vote") {
      throw new UnauthorizedError("Invalid vote token");
    }
    if (votePayload.userId !== req.user!.userId) {
      throw new UnauthorizedError("Vote token does not match the authenticated user");
    }

    const result = await castVote({
      userId: req.user!.userId,
      electionId,
      candidateId,
      ipAddress: req.ip,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /votes/my-vote/:electionId
 *
 * Call this on every election page load.
 * Returns { hasVoted: false } → show the voting form.
 * Returns { hasVoted: true, vote: { ... } } → show "Voted successfully ✓" with details.
 */
export async function myVoteStatus(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { electionId } = req.params;
    const status = await getMyVoteStatus({ userId: req.user!.userId, electionId });
    res.json(status);
  } catch (err) {
    next(err);
  }
}

export function contractInfo(_req: AuthedRequest, res: Response) {
  res.json(getPublicContractInfo());
}

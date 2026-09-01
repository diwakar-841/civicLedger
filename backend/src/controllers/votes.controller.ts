import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthedRequest } from "../middlewares/auth.middleware";
import { castVote, getMyVoteStatus } from "../services/vote.service";
import { getPublicContractInfo } from "../services/blockchain.service";
import { env } from "../config/env";
import { UnauthorizedError } from "../lib/errors";
import { verifyJwtPayload } from "../lib/jwt";

export async function vote(req, res, next) {
  try {
    const { electionId, candidateId, voteToken } = req.body;

    let votePayload;
    try {
      votePayload = verifyJwtPayload(voteToken, env.JWT_SECRET);
    } catch {
      throw new UnauthorizedError(
        "Invalid or expired vote token — please re-authenticate with your PIN or biometric"
      );
    }
    if (votePayload.purpose !== "vote") {
      throw new UnauthorizedError("Invalid vote token");
    }
    if (votePayload.userId !== req.user.userId) {
      throw new UnauthorizedError("Vote token does not match the authenticated user");
    }

    const result = await castVote({
      userId: req.user.userId,
      electionId,
      candidateId,
      ipAddress: req.ip
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function myVoteStatus(req, res, next) {
  try {
    const { electionId } = req.params;
    const status = await getMyVoteStatus({ userId: req.user.userId, electionId });
    res.json(status);
  } catch (err) {
    next(err);
  }
}

export function contractInfo(_req, res) {
  res.json(getPublicContractInfo());
}
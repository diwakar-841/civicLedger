import { Request, Response, NextFunction } from "express";
import { AuthedRequest } from "../middlewares/auth.middleware";
import { rowsOf } from "../lib/dbRows";
import {
  createElection,
  scheduleElection,
  listElections,
  getElectionWithCandidates,
  addCandidate,
  searchVoters,
  adminSearch,
  AdminSearchType,
  setElectionVisibility,
  deleteElection 
} from
"../services/election.service";
import { verifyAdminStepUp } from "../services/auth.service";
import { NotFoundError } from "../lib/errors";

export async function create(req, res, next) {
  try {
    const election = await createElection(req.body, req.user.userId);
    res.status(201).json(election);
  } catch (err) {
    next(err);
  }
}

export async function schedule(req, res, next) {
  try {
    const { startTime, endTime, nominationDeadline } = req.body;
    const election = await scheduleElection(
      req.params.id,
      {
        startTime,
        endTime,

        nominationDeadline: nominationDeadline ?? undefined
      },
      req.user.userId
    );
    res.json(election);
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const isAdmin = req.user?.role === "admin";
    res.json(await listElections({ includeHidden: isAdmin, userId: req.user?.userId }));
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const election = await getElectionWithCandidates(req.params.id);
    const isAdmin = req.user?.role === "admin";
    if (!isAdmin && election.electionType === "group") {
      const membership = await (await import("@voting/database")).db.execute(
        (await import("drizzle-orm")).sql`SELECT 1 FROM group_members WHERE group_id=${election.groupId} AND user_id=${req.user?.userId} LIMIT 1`
      );
      if (!rowsOf(membership).length) {throw new NotFoundError("Election not found");}
    }

    if ((election.isHidden || election.status === "draft") && !isAdmin) {
      throw new NotFoundError("Election not found");
    }
    res.json(election);
  } catch (err) {
    next(err);
  }
}

export async function createCandidate(req, res, next) {
  try {
    const { name, party, voterUserId, photoUrl, bio, qualification, supports } = req.body;
    const candidate = await addCandidate(
      req.params.id,
      { name, party, voterUserId, photoUrl, bio, qualification, supports },
      req.user.userId
    );
    res.status(201).json(candidate);
  } catch (err) {
    next(err);
  }
}

export async function searchVotersHandler(req, res, next) {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    res.json(await searchVoters(q));
  } catch (err) {
    next(err);
  }
}

export async function searchHandler(req, res, next) {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const rawType = typeof req.query.type === "string" ? req.query.type : "all";
    const type = ["all", "election", "user", "admin", "group"].includes(rawType) ?
    rawType :
    "all";
    const isAdmin = req.user?.role === "admin";
    res.json(await adminSearch(q, type, isAdmin, req.user?.userId));
  } catch (err) {
    next(err);
  }
}

export async function setVisibility(req, res, next) {
  try {
    const election = await setElectionVisibility(req.params.id, req.body.hidden, req.user.userId);
    res.json(election);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const { password, code } = req.body;
    await verifyAdminStepUp(req.user.userId, password, code, req.ip);
    const result = await deleteElection(req.params.id, req.user.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
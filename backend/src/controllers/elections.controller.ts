import { Request, Response, NextFunction } from "express";
import { AuthedRequest } from "../middlewares/auth.middleware";
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
  deleteElection,
} from "../services/election.service";
import { verifyAdminStepUp } from "../services/auth.service";
import { NotFoundError } from "../lib/errors";

export async function create(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const election = await createElection(req.body, req.user!.userId);
    res.status(201).json(election);
  } catch (err) {
    next(err);
  }
}

export async function schedule(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { startTime, endTime, nominationDeadline } = req.body;
    const election = await scheduleElection(
      req.params.id,
      {
        startTime,
        endTime,
        // Pass through only when present — undefined means "direct candidate" flow
        nominationDeadline: nominationDeadline ?? undefined,
      },
      req.user!.userId
    );
    res.json(election);
  } catch (err) {
    next(err);
  }
}

export async function list(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const isAdmin = req.user?.role === "admin";
    res.json(await listElections({ includeHidden: isAdmin, userId: req.user?.userId }));
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const election = await getElectionWithCandidates(req.params.id);
    const isAdmin = req.user?.role === "admin";
    if (!isAdmin && election.electionType === "group") {
      const membership = await (await import("@voting/database")).db.execute(
        (await import("drizzle-orm")).sql`SELECT 1 FROM group_members WHERE group_id=${election.groupId} AND user_id=${req.user?.userId} LIMIT 1`
      );
      if (!((membership as any).rows ?? membership).length) throw new NotFoundError("Election not found");
    }
    // Hidden elections are excluded from the list for voters — also block
    // direct-link access to the detail/ballot endpoint, or hiding would be
    // trivially bypassed by anyone who has (or guesses) the URL.
    if ((election.isHidden || election.status === "draft") && !isAdmin) {
      throw new NotFoundError("Election not found");
    }
    res.json(election);
  } catch (err) {
    next(err);
  }
}

export async function createCandidate(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { name, party, voterUserId, photoUrl, bio, qualification, supports } = req.body;
    const candidate = await addCandidate(
      req.params.id,
      { name, party, voterUserId, photoUrl, bio, qualification, supports },
      req.user!.userId
    );
    res.status(201).json(candidate);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /elections/search-voters?q=<query>
 *
 * Returns up to 10 verified voters whose name or voter ID matches the query.
 * Admin-only — used by the admin UI to pick a real registered user as a candidate.
 */
export async function searchVotersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    res.json(await searchVoters(q));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /elections/search?q=<query>&type=all|election|user|admin
 *
 * The global search bar — open to every signed-in user, who can search
 * elections, voters, and admins alike. Admins additionally see draft and
 * hidden elections in results (see adminSearch() in election.service.ts for
 * the exact scoping — enforced there, not just by hiding options in the UI).
 */
export async function searchHandler(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const rawType = typeof req.query.type === "string" ? req.query.type : "all";
    const type: AdminSearchType = ["all", "election", "user", "admin", "group"].includes(rawType)
      ? (rawType as AdminSearchType)
      : "all";
    const isAdmin = req.user?.role === "admin";
    res.json(await adminSearch(q, type, isAdmin, req.user?.userId));
  } catch (err) {
    next(err);
  }
}

/** PATCH /elections/:id/visibility — body: { hidden: boolean } */
export async function setVisibility(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const election = await setElectionVisibility(req.params.id, req.body.hidden, req.user!.userId);
    res.json(election);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /elections/:id — body: { password: string, code: string }
 *
 * Irreversible. Requires the admin to re-confirm their password + current
 * 2FA code (step-up auth) before anything is deleted.
 */
export async function remove(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { password, code } = req.body;
    await verifyAdminStepUp(req.user!.userId, password, code, req.ip);
    const result = await deleteElection(req.params.id, req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

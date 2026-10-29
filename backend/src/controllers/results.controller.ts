import { Request, Response, NextFunction } from "express";
import { AuthedRequest } from "../middlewares/auth.middleware";
import {
  getElectionWithCandidates,
  isResultsPublished,
} from "../services/election.service";
import { getElectionSummary } from "../services/results.service";
import { NotFoundError } from "../lib/errors";
import { csvRow } from "../lib/csv";
import { db } from "@voting/database";
import { sql } from "drizzle-orm";

export async function results(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const election = await getElectionWithCandidates(req.params.electionId);

    const isAdmin = req.user?.role === "admin";
    if (!isAdmin && (election.isHidden || election.status === "draft")) {
      throw new NotFoundError("Election not found");
    }

    // Group elections are private to the group. getOne() enforces that, but
    // the results endpoint did not, so any signed-in user could read a group
    // election's candidates and (once published) vote counts by id.
    if (!isAdmin && election.electionType === "group") {
      const membership = await db.execute(
        sql`SELECT 1 FROM group_members WHERE group_id=${election.groupId} AND user_id=${req.user!.userId} LIMIT 1`,
      );
      if (!((membership as any).rows ?? membership).length) {
        throw new NotFoundError("Election not found");
      }
    }

    if (!isAdmin && !isResultsPublished(election)) {
      const message = election.resultsReleaseAt
        ? `Results will be available on ${new Date(election.resultsReleaseAt).toLocaleString()}.`
        : "Results have not been released yet.";
      return res.json({ resultsAvailable: false, message, rows: [] });
    }

    const summary = await getElectionSummary(req.params.electionId);
    const rows = summary.candidates.map((candidate) => ({
      candidateId: candidate.id,
      name: candidate.name,
      party: candidate.party,
      votes: candidate.votes,
    }));

    res.json({ resultsAvailable: true, rows });
  } catch (err) {
    next(err);
  }
}

export async function resultsSummary(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const summary = await getElectionSummary(req.params.id);
    res.json(summary);
  } catch (err) {
    next(err);
  }
}

export async function resultsExportCsv(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const summary = await getElectionSummary(req.params.id);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="election-${req.params.id}-results.csv"`,
    );

    // Candidate names/parties are user-supplied text: escape per RFC 4180 and
    // neutralise spreadsheet formulas (=, +, -, @) so opening the export in
    // Excel/Sheets cannot execute a malicious name.
    const headers = "id,name,party,votes,percent\n";
    const rows = summary.candidates
      .map((c) => csvRow([c.id, c.name, c.party ?? "", c.votes, c.percent]))
      .join("\n");
    res.send(headers + rows);
  } catch (err) {
    next(err);
  }
}

import { Request, Response, NextFunction } from "express";
import { AuthedRequest } from "../middlewares/auth.middleware";
import {
  getElectionWithCandidates,
  isResultsPublished,
} from "../services/election.service";
import { getElectionSummary } from "../services/results.service";
import { NotFoundError } from "../lib/errors";

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

    const headers = "id,name,party,votes,percent\n";
    const rows = summary.candidates
      .map(
        (c) =>
          `${c.id},${JSON.stringify(c.name)},${JSON.stringify(c.party ?? "")},${c.votes},${c.percent}`,
      )
      .join("\n");
    res.send(headers + rows);
  } catch (err) {
    next(err);
  }
}

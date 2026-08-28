import { Router } from "express";
import { z } from "zod";
import {
  create,
  schedule,
  list,
  getOne,
  searchVotersHandler,
  searchHandler,
  setVisibility,
  remove,
} from "../controllers/elections.controller";
import { requireAuth, requireAdmin, optionalAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  MIN_ALLOWANCE_MINUTES,
  MIN_GAP_MINUTES,
  MIN_VOTING_MINUTES,
  MINUTE_MS,
  MAX_VOTING_MINUTES,
} from "../lib/electionTiming";


const router = Router();

// Step 1: just the basics. Candidates get added next; the voting window is
// set afterwards via /schedule, once the ballot is actually final.
const electionSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(1, "Description is required").max(2000),
  electionType: z.enum(["public", "group"]).default("public"),
  groupId: z.string().uuid().optional(),
}).refine((data) => data.electionType !== "group" || !!data.groupId, {
  message: "A group is required for a group election", path: ["groupId"],
});

// Final step: set the voting window.
//
// nominationDeadline is required for the nomination-invite flow. Set it when
// candidates are sent requests: every request uses this one shared deadline,
// and nominees must accept or decline before the voting window opens. When present:
//   • The backend skips the "≥2 candidates already exist" check — accepted
//     nominations are verified by the scheduler at activation time instead.
//   • startTime must be ≥ nominationDeadline (voting can only open after
//     nominations have closed).
//
// When nominationDeadline is omitted the admin adds candidates directly and
// must have ≥2 in place before setting the voting window (original flow).
const scheduleSchema = z
  .object({
    nominationDeadline: z.coerce.date().optional(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  })
  .refine(
    (d) => d.endTime.getTime() - d.startTime.getTime() >= MIN_VOTING_MINUTES * MINUTE_MS,
    {
      message: `Voting must stay open for at least ${MIN_VOTING_MINUTES} minutes`,
      path: ["endTime"],
    }
  )
  .refine(
    (d) => d.endTime.getTime() - d.startTime.getTime() <= MAX_VOTING_MINUTES * MINUTE_MS,
    {
      message: "Voting cannot stay open longer than 7 days",
      path: ["endTime"],
    }
  )
  // The candidate allowance period itself must last at least 10 minutes.
  .refine(
    (d) =>
      !d.nominationDeadline ||
      d.nominationDeadline.getTime() - Date.now() >= MIN_ALLOWANCE_MINUTES * MINUTE_MS,
    {
      message: `The candidate allowance period must last at least ${MIN_ALLOWANCE_MINUTES} minutes`,
      path: ["nominationDeadline"],
    }
  )
  // And voting must start at least 10 minutes after it closes.
  .refine(
    (d) =>
      !d.nominationDeadline ||
      d.startTime.getTime() - d.nominationDeadline.getTime() >= MIN_GAP_MINUTES * MINUTE_MS,
    {
      message: `Voting must start at least ${MIN_GAP_MINUTES} minutes after the candidate allowance period ends`,
      path: ["startTime"],
    }
  );


const idParamSchema = z.object({ id: z.string().uuid("Invalid election id") });

const visibilitySchema = z.object({ hidden: z.boolean() });

// Step-up auth required before an irreversible delete
const deleteAuthSchema = z.object({
  password: z.string().min(1, "Password is required"),
  code: z.string().trim().min(6, "Authentication code is required").max(10),
});

// IMPORTANT: /search-voters and /search must be declared BEFORE /:id routes
// or Express will try to match them as an election id and fail.
router.get("/search-voters", requireAuth, requireAdmin, searchVotersHandler);

// Global search bar — elections, voters, admins. Open to every signed-in
// user (not just admins): voters get election results only, scoped to the
// same elections they can already see; admins get everything. See
// adminSearch() in election.service.ts for the exact scoping.
router.get("/search", requireAuth, searchHandler);

// optionalAuth so admins get hidden elections included, without requiring
// voters to be logged in just to browse the public elections list.
router.get("/", optionalAuth, list);
router.get("/:id", optionalAuth, validate(idParamSchema, "params"), getOne);
// Draft creation is reversible. The single step-up confirmation is shown at
// the final candidate/allowance submission before nomination requests are sent.
router.post("/", requireAuth, requireAdmin, validate(electionSchema), create);
router.post(
  "/:id/schedule",
  requireAuth,
  requireAdmin,
  validate(idParamSchema, "params"),
  validate(scheduleSchema),
  schedule
);
// Candidate details are submitted by the candidate after accepting a request.
// Keep the old endpoint explicit so older clients cannot bypass that workflow.
router.post(
  "/:id/candidates",
  requireAuth,
  requireAdmin,
  validate(idParamSchema, "params"),
  (_req, res) =>
    res.status(410).json({
      error: "Direct candidate creation is disabled. Send a nomination request instead.",
    })
);

// ── Election settings (admin) ─────────────────────────────────────────────────

router.patch(
  "/:id/visibility",
  requireAuth,
  requireAdmin,
  validate(idParamSchema, "params"),
  validate(visibilitySchema),
  setVisibility
);
router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  validate(idParamSchema, "params"),
  validate(deleteAuthSchema),
  remove
);

export default router;

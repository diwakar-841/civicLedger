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
import {
  requireAuth,
  requireAdmin,
  optionalAuth,
} from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  MIN_ALLOWANCE_MINUTES,
  MIN_GAP_MINUTES,
  MIN_VOTING_MINUTES,
  MINUTE_MS,
  MAX_VOTING_MINUTES,
} from "../lib/electionTiming";

const router = Router();

const electionSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().min(1, "Description is required").max(2000),
    electionType: z.enum(["public", "group"]).default("public"),
    groupId: z.string().uuid().optional(),
  })
  .refine((data) => data.electionType !== "group" || !!data.groupId, {
    message: "A group is required for a group election",
    path: ["groupId"],
  });

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
    (d) =>
      d.endTime.getTime() - d.startTime.getTime() >=
      MIN_VOTING_MINUTES * MINUTE_MS,
    {
      message: `Voting must stay open for at least ${MIN_VOTING_MINUTES} minutes`,
      path: ["endTime"],
    },
  )
  .refine(
    (d) =>
      d.endTime.getTime() - d.startTime.getTime() <=
      MAX_VOTING_MINUTES * MINUTE_MS,
    {
      message: "Voting cannot stay open longer than 7 days",
      path: ["endTime"],
    },
  )

  .refine(
    (d) =>
      !d.nominationDeadline ||
      d.nominationDeadline.getTime() - Date.now() >=
        MIN_ALLOWANCE_MINUTES * MINUTE_MS,
    {
      message: `The candidate allowance period must last at least ${MIN_ALLOWANCE_MINUTES} minutes`,
      path: ["nominationDeadline"],
    },
  )

  .refine(
    (d) =>
      !d.nominationDeadline ||
      d.startTime.getTime() - d.nominationDeadline.getTime() >=
        MIN_GAP_MINUTES * MINUTE_MS,
    {
      message: `Voting must start at least ${MIN_GAP_MINUTES} minutes after the candidate allowance period ends`,
      path: ["startTime"],
    },
  );

const idParamSchema = z.object({ id: z.string().uuid("Invalid election id") });

const visibilitySchema = z.object({ hidden: z.boolean() });

const deleteAuthSchema = z.object({
  password: z.string().min(1, "Password is required"),
  code: z.string().trim().min(6, "Authentication code is required").max(10),
});

router.get("/search-voters", requireAuth, requireAdmin, searchVotersHandler);

router.get("/search", requireAuth, searchHandler);

router.get("/", optionalAuth, list);
router.get("/:id", optionalAuth, validate(idParamSchema, "params"), getOne);

router.post("/", requireAuth, requireAdmin, validate(electionSchema), create);
router.post(
  "/:id/schedule",
  requireAuth,
  requireAdmin,
  validate(idParamSchema, "params"),
  validate(scheduleSchema),
  schedule,
);

router.post(
  "/:id/candidates",
  requireAuth,
  requireAdmin,
  validate(idParamSchema, "params"),
  (_req, res) =>
    res.status(410).json({
      error:
        "Direct candidate creation is disabled. Send a nomination request instead.",
    }),
);

router.patch(
  "/:id/visibility",
  requireAuth,
  requireAdmin,
  validate(idParamSchema, "params"),
  validate(visibilitySchema),
  setVisibility,
);
router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  validate(idParamSchema, "params"),
  validate(deleteAuthSchema),
  remove,
);

export default router;

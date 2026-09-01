import { Router } from "express";
import { z } from "zod";
import { results, resultsSummary, resultsExportCsv } from "../controllers/results.controller";
import { validate } from "../middlewares/validate.middleware";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware";

const router = Router();

const paramsSchema = z.object({ electionId: z.string().uuid("Invalid election id") });
const idParamSchema = z.object({ id: z.string().uuid("Invalid election id") });

router.get("/:electionId", requireAuth, validate(paramsSchema, "params"), results);

router.get("/:id/summary", requireAuth, requireAdmin, validate(idParamSchema, "params"), resultsSummary);
router.get("/:id/export.csv", requireAuth, requireAdmin, validate(idParamSchema, "params"), resultsExportCsv);

export default router;
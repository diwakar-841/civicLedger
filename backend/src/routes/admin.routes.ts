import { Router } from "express";
import { requireAuth, requireAdmin, requireTwoFactor } from "../middlewares/auth.middleware";
import { getAuditLog, verifyAuditLog, exportAuditLogCsv } from "../controllers/admin.controller";
import { db } from "../../../database/index";
import { elections } from "../../../database/schema/elections";
import { candidates } from "../../../database/schema/candidates";
import { candidateRequests } from "../../../database/schema/candidateRequests";
import { countDistinct, desc, eq, and, count } from "drizzle-orm";
import draftElectionRoutes from "./admin.draftElections.routes";

const router = Router();

router.use(requireAuth, requireAdmin, requireTwoFactor);

router.get("/elections", async (req, res) => {
  try {
    const allElections = await db.
    select({
      id: elections.id,
      title: elections.title,
      description: elections.description,
      startTime: elections.startTime,
      endTime: elections.endTime,
      nominationDeadline: elections.nominationDeadline,
      isHidden: elections.isHidden,
      candidateCount: countDistinct(candidates.id)
    }).
    from(elections).
    leftJoin(candidates, eq(elections.id, candidates.electionId)).
    groupBy(
      elections.id,
      elections.title,
      elections.description,
      elections.startTime,
      elections.endTime,
      elections.nominationDeadline,
      elections.isHidden
    ).
    orderBy(desc(elections.startTime));

    res.json(allElections);
  } catch (error) {
    res.status(500).json({ message: "Failed to load elections" });
  }
});

router.use("/elections", draftElectionRoutes);

router.get("/audit-log", getAuditLog);
router.get("/audit-log/verify", verifyAuditLog);
router.get("/audit-log/export.csv", exportAuditLogCsv);

export default router;
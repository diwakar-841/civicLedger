import { Router } from "express";
import authRoutes from "./auth.routes";
import kycRoutes from "./kyc.routes";
import walletRoutes from "./wallet.routes";
import electionRoutes from "./elections.routes";
import candidateRoutes from "./candidates.routes";
import candidateRequestRoutes from "./candidateRequests.routes";
import voteRoutes from "./votes.routes";
import resultRoutes from "./results.routes";
import adminRoutes from "./admin.routes";
import notificationRoutes from "./notifications.routes";
import userProfileRoutes from "./userProfile.routes";
import groupRoutes from "./groups.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/auth", kycRoutes);
router.use("/wallet", walletRoutes);
router.use("/elections", electionRoutes);
router.use("/candidates", candidateRoutes);
router.use("/candidate-requests", candidateRequestRoutes);
router.use("/votes", voteRoutes);
router.use("/results", resultRoutes);
router.use("/admin", adminRoutes);
router.use("/notifications", notificationRoutes);
router.use("/users", userProfileRoutes);
router.use("/groups", groupRoutes);

export default router;
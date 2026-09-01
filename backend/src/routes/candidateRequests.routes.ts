import { Router, Request, Response } from "express";
import { candidateRequestService } from "../services/candidateRequest.service";
import { notificationService } from "../services/notification.service";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware";
import { db } from "../../../database/index";
import { rowsOf } from "../lib/dbRows";
import { users } from "../../../database/schema/users";
import { elections } from "../../../database/schema/elections";
import { eq, sql } from "drizzle-orm";

const router = Router();

async function notifyAdminsOfAcceptance(
electionId,
electionTitle,
candidateName)
{
  const admins = await db.
  select({ id: users.id }).
  from(users).
  where(eq(users.role, "admin"));

  for (const admin of admins) {
    await notificationService.createNotification(
      admin.id,
      "candidateAccepted",
      `Candidate accepted — ${electionTitle}`,
      `${candidateName} accepted the nomination.`,
      electionId,
      { electionId, candidateName }
    );
  }
}

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const allowedKeys = new Set(["electionId", "userId"]);
    const unexpectedKeys = Object.keys(req.body ?? {}).filter((key) => {return !allowedKeys.has(key);});
    if (unexpectedKeys.length > 0) {
      return res.status(400).json({ error: "Nomination requests may contain only an election and nominee" });
    }

    const { electionId, userId } = req.body;

    if (!electionId || !userId) {
      return res.status(400).json({ error: "electionId and userId are required" });
    }

    const [election] = await db.
    select({ id: elections.id, title: elections.title, status: elections.status }).
    from(elections).
    where(eq(elections.id, electionId));

    if (!election) {
      return res.status(404).json({ error: "Election not found" });
    }
    const electionAccess = await db.execute(sql`SELECT election_type, group_id FROM elections WHERE id=${electionId}`);
    const access = electionAccess.rows?.[0] ?? electionAccess[0];
    if (access?.election_type === "group") {
      const member = await db.execute(sql`SELECT 1 FROM group_members WHERE group_id=${access.group_id} AND user_id=${userId} LIMIT 1`);
      if (!rowsOf(member).length) {return res.status(400).json({ error: "Candidates must be members of the election group" });}
    }
    if (election.status !== "draft") {
      return res.status(400).json({ error: "Nominations can only be sent for draft elections" });
    }
    const [electionTiming] = await db.
    select({ nominationDeadline: elections.nominationDeadline }).
    from(elections).
    where(eq(elections.id, electionId));
    if (!electionTiming?.nominationDeadline) {
      return res.status(400).json({ error: "Set the shared nomination deadline before sending requests" });
    }
    if (electionTiming.nominationDeadline <= new Date()) {
      return res.status(400).json({ error: "The shared nomination deadline has passed" });
    }

    const [targetUser] = await db.
    select({ id: users.id, fullName: users.fullName, isVerified: users.isVerified, role: users.role }).
    from(users).
    where(eq(users.id, userId));

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!targetUser.isVerified || targetUser.role === "admin") {
      return res.status(400).json({ error: "Nominee must be a verified registered voter" });
    }

    const existingRequests = await candidateRequestService.getElectionRequests(electionId);
    const alreadyPending = existingRequests.find(
      (r) => {return r.userId === userId && (r.status === "pending" || r.status === "accepted");}
    );
    if (alreadyPending) {
      return res.status(409).json({
        error:
        alreadyPending.status === "accepted" ?
        "This person has already accepted a nomination for this election" :
        "This person already has a pending nomination for this election"
      });
    }

    const request = await candidateRequestService.createRequest(
      electionId,
      userId,
      electionTiming.nominationDeadline
    );

    await notificationService.createNotification(
      userId,
      "candidateNomination",
      "You've been nominated as a candidate",
      `You have been nominated as a candidate for "${election.title}". All nominees must accept or decline by ${electionTiming.nominationDeadline.toLocaleString()}.`,
      electionId,
      { electionId, requestId: request.id }
    );

    res.status(201).json(request);
  } catch (error) {
    console.error("[candidateRequests] Error creating request:", error);
    res.status(500).json({ error: "Failed to create nomination request" });
  }
});

async function validateAndFetchRequest(requestId, actingUserId, res) {
  const [request] = await candidateRequestService.getRawRequest(requestId);

  if (!request) {
    res.status(404).json({ error: "Nomination request not found" });
    return null;
  }

  if (request.userId !== actingUserId) {
    res.status(403).json({ error: "You can only respond to your own nomination requests" });
    return null;
  }

  if (request.status !== "pending") {
    res.status(400).json({
      error:
      request.status === "accepted" ?
      "You have already accepted this nomination" :
      request.status === "rejected" ?
      "You have already declined this nomination" :
      "This nomination has expired and can no longer be responded to"
    });
    return null;
  }

  const [election] = await db.
  select({ nominationDeadline: elections.nominationDeadline }).
  from(elections).
  where(eq(elections.id, request.electionId));
  if (!election?.nominationDeadline || election.nominationDeadline <= new Date()) {

    await candidateRequestService.expireRequest(requestId);
    res.status(400).json({ error: "The shared nomination deadline has passed. Contact the election admin to request an extension." });
    return null;
  }

  return request;
}

async function requireCandidateAcceptanceAuth(
requestId,
actingUserId,
authToken,
res)
{
  if (typeof authToken !== "string" || !authToken) {
    res.status(401).json({ error: "Biometric or Login PIN verification is required before accepting this request" });
    return false;
  }
  try {
    candidateRequestService.verifyAcceptAuthToken(authToken, actingUserId, requestId);
    return true;
  } catch (error) {
    res.status(error?.statusCode ?? 401).json({ error: error?.message ?? "Acceptance authentication failed" });
    return false;
  }
}

async function acceptRequestHandler(req, res) {
  try {
    const actingUserId = req.user.userId;
    const request = await validateAndFetchRequest(req.params.id ?? req.params.requestId, actingUserId, res);
    if (!request) {return;}
    const requestId = req.params.id ?? req.params.requestId;
    if (!(await requireCandidateAcceptanceAuth(requestId, actingUserId, req.body?.authToken, res))) {return;}

    await candidateRequestService.acceptRequest(requestId);

    await notificationService.createNotification(
      request.userId,
      "nominationAccepted",
      "Nomination accepted",
      "Your acceptance was recorded. Complete your candidate profile to appear on the ballot.",
      request.electionId
    );

    const [election] = await db.
    select({ title: elections.title }).
    from(elections).
    where(eq(elections.id, request.electionId));
    const [nominee] = await db.
    select({ fullName: users.fullName }).
    from(users).
    where(eq(users.id, request.userId));

    await notifyAdminsOfAcceptance(
      request.electionId,
      election?.title ?? "Unknown election",
      nominee?.fullName ?? "A nominee"
    );
    res.json({ success: true, profileRequired: true });
  } catch (error) {
    console.error("[candidateRequests] Error accepting request:", error);
    res.status(500).json({ error: "Failed to accept nomination" });
  }
}

router.put("/:id/accept", requireAuth, acceptRequestHandler);

router.put("/:id/reject", requireAuth, async (req, res) => {
  try {
    const actingUserId = req.user.userId;
    const request = await validateAndFetchRequest(req.params.id, actingUserId, res);
    if (!request) {return;}

    const { reason } = req.body;
    await candidateRequestService.rejectRequest(req.params.id);

    await notificationService.createNotification(
      request.userId,
      "nominationDeclined",
      "Nomination Declined",
      `You have declined your candidacy${reason ? `: "${reason}"` : "."}`,
      request.electionId
    );

    res.json({ success: true });
  } catch (error) {
    console.error("[candidateRequests] Error rejecting request:", error);
    res.status(500).json({ error: "Failed to decline nomination" });
  }
});

router.post("/:requestId/accept", requireAuth, acceptRequestHandler);

router.post("/:requestId/reject", requireAuth, async (req, res) => {
  try {
    const actingUserId = req.user.userId;
    const request = await validateAndFetchRequest(req.params.requestId, actingUserId, res);
    if (!request) {return;}

    const { reason } = req.body;
    await candidateRequestService.rejectRequest(req.params.requestId);

    await notificationService.createNotification(
      request.userId,
      "nominationDeclined",
      "Nomination Declined",
      `You have declined your candidacy${reason ? `: "${reason}"` : "."}`,
      request.electionId
    );

    res.json({ success: true });
  } catch (error) {
    console.error("[candidateRequests] Error rejecting request:", error);
    res.status(500).json({ error: "Failed to decline nomination" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const isAdmin = req.user.role === "admin";
    const requests = isAdmin ?
    await candidateRequestService.getAllRequestsForAdmin() :
    await candidateRequestService.getRequestsForUser(userId);
    res.json(requests);
  } catch (error) {
    console.error("[candidateRequests] Error fetching user requests:", error);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

router.get("/election/:electionId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { electionId } = req.params;
    const requests = await candidateRequestService.getElectionRequests(electionId);
    res.json(requests);
  } catch (error) {
    console.error("[candidateRequests] Error fetching election requests:", error);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

router.post("/:id/profile", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { party, photoUrl, bio, qualification, supports } = req.body ?? {};

    for (const [label, value, max] of [
    ["Party / team", party, 200],
    ["Photo", photoUrl, 700_000],
    ["Short bio", bio, 1000],
    ["Qualification", qualification, 500],
    ["Agenda / what you support", supports, 500]])
    {
      if (typeof value !== "string" || !value.trim() || value.length > max) {
        return res.status(400).json({ error: `${label} is required` });
      }
    }

    const isDataImage = /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(photoUrl);
    const isHttp = /^https?:\/\/.+/i.test(photoUrl);
    if (!isDataImage && !isHttp) {
      return res.status(400).json({ error: "Photo must be an image upload or an image URL" });
    }

    const candidate = await candidateRequestService.completeCandidateProfile(req.params.id, userId, {
      party: party.trim(),
      photoUrl: photoUrl.trim(),
      bio: bio.trim(),
      qualification: qualification.trim(),
      supports: supports.trim()
    });
    res.status(201).json(candidate);
  } catch (error) {
    const status = error?.statusCode ?? 500;
    res.status(status).json({ error: error?.message ?? "Failed to save candidate profile" });
  }
});

export default router;
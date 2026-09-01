import { db } from "@voting/database";
import { candidateRequests } from "../../../database/schema/candidateRequests";
import { elections } from "../../../database/schema/elections";
import { users } from "../../../database/schema/users";
import { eq, and, lt, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { BadRequestError, UnauthorizedError } from "../lib/errors";
import { addCandidate } from "./election.service";

export const candidateRequestService = {
  async createRequest(electionId, userId, nominationDeadline) {
    const result = await db.insert(candidateRequests).values({
      electionId,
      userId,

      expiresAt: nominationDeadline
    }).returning();

    return result[0];
  },

  async getRawRequest(requestId) {
    return db.
    select().
    from(candidateRequests).
    where(eq(candidateRequests.id, requestId));
  },

  async acceptRequest(requestId) {
    const [request] = await db.
    select().
    from(candidateRequests).
    where(eq(candidateRequests.id, requestId));

    if (!request) {throw new Error("Request not found");}

    if (request.status !== "pending") {
      throw new Error(
        request.status === "accepted" ?
        "This nomination has already been accepted" :
        request.status === "rejected" ?
        "This nomination has already been declined" :
        "This nomination has expired"
      );
    }

    const [election] = await db.
    select({ nominationDeadline: elections.nominationDeadline }).
    from(elections).
    where(eq(elections.id, request.electionId));
    const sharedDeadline = election?.nominationDeadline;
    if (!sharedDeadline || sharedDeadline <= new Date()) {

      await db.
      update(candidateRequests).
      set({ status: "expired", updatedAt: new Date() }).
      where(eq(candidateRequests.id, requestId));
      throw new Error("The shared nomination deadline has passed");
    }

    const [updated] = await db.
    update(candidateRequests).
    set({
      status: "accepted",
      respondedAt: new Date(),
      updatedAt: new Date()
    }).
    where(eq(candidateRequests.id, requestId)).
    returning();

    return updated;
  },

  async createAcceptAuthToken(userId, requestId, pin) {
    const [request] = await db.
    select().
    from(candidateRequests).
    where(and(eq(candidateRequests.id, requestId), eq(candidateRequests.userId, userId)));
    if (!request) {throw new UnauthorizedError("Nomination request not found");}
    if (request.status !== "pending") {throw new BadRequestError("This nomination is no longer pending");}
    const [election] = await db.
    select({ nominationDeadline: elections.nominationDeadline }).
    from(elections).
    where(eq(elections.id, request.electionId));
    if (!election?.nominationDeadline || election.nominationDeadline <= new Date()) {
      await this.expireRequest(requestId);
      throw new BadRequestError("The shared nomination deadline has passed");
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user?.loginPinHash) {
      throw new BadRequestError("Login PIN is not set up. Use biometric authentication instead.");
    }
    if (!(await bcrypt.compare(pin.trim(), user.loginPinHash))) {
      throw new UnauthorizedError("Incorrect Login PIN");
    }

    return jwt.sign(
      { userId, requestId, purpose: "candidate-accept" },
      env.JWT_SECRET,
      { expiresIn: "5m" }
    );
  },

  verifyAcceptAuthToken(token, userId, requestId) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET);

      if (
      payload.purpose !== "candidate-accept" ||
      payload.userId !== userId ||
      payload.requestId !== requestId)
      {
        throw new Error("wrong token");
      }
    } catch {
      throw new UnauthorizedError("Candidate acceptance authentication expired. Please try again.");
    }
  },

  async rejectRequest(requestId) {
    const [request] = await db.
    select().
    from(candidateRequests).
    where(eq(candidateRequests.id, requestId));

    if (!request) {throw new Error("Request not found");}

    if (request.status !== "pending") {
      throw new Error(
        request.status === "accepted" ?
        "This nomination has already been accepted" :
        request.status === "rejected" ?
        "This nomination has already been declined" :
        "This nomination has expired and cannot be declined"
      );
    }

    const [updated] = await db.
    update(candidateRequests).
    set({
      status: "rejected",
      respondedAt: new Date(),
      updatedAt: new Date()
    }).
    where(eq(candidateRequests.id, requestId)).
    returning();

    return updated;
  },

  async expireRequest(requestId) {
    await db.
    update(candidateRequests).
    set({
      status: "expired",
      updatedAt: new Date()
    }).
    where(eq(candidateRequests.id, requestId));
  },

  async getRequestsForUser(userId) {
    const rows = await db.
    select({
      id: candidateRequests.id,
      electionId: candidateRequests.electionId,
      electionTitle: elections.title,
      electionDescription: elections.description,
      status: candidateRequests.status,
      expiresAt: elections.nominationDeadline,
      respondedAt: candidateRequests.respondedAt,
      profileCompletedAt: candidateRequests.profileCompletedAt,
      createdAt: candidateRequests.createdAt
    }).
    from(candidateRequests).
    leftJoin(elections, eq(candidateRequests.electionId, elections.id)).
    where(eq(candidateRequests.userId, userId));

    return rows.map((r) => {return {
        ...r,
        electionTitle: r.electionTitle ?? "Unknown election",
        nominatedByName: "Election administrator",
        profileCompleted: Boolean(r.profileCompletedAt)
      };});
  },

  async getPendingRequests(userId) {
    return this.getRequestsForUser(userId);
  },

  async getElectionRequests(electionId) {
    return db.
    select({
      id: candidateRequests.id,
      electionId: candidateRequests.electionId,
      userId: candidateRequests.userId,
      candidateName: users.fullName,
      candidatePhotoUrl: users.profilePhotoUrl,
      candidateWalletLinked: users.walletAddress,
      status: candidateRequests.status,
      expiresAt: elections.nominationDeadline,
      respondedAt: candidateRequests.respondedAt,
      profileCompletedAt: candidateRequests.profileCompletedAt,
      createdAt: candidateRequests.createdAt
    }).
    from(candidateRequests).
    leftJoin(users, eq(candidateRequests.userId, users.id)).
    leftJoin(elections, eq(candidateRequests.electionId, elections.id)).
    where(eq(candidateRequests.electionId, electionId));
  },

  async getAllRequestsForAdmin() {
    const rows = await db.
    select({
      id: candidateRequests.id,
      electionId: candidateRequests.electionId,
      electionTitle: elections.title,
      electionDescription: elections.description,
      userId: candidateRequests.userId,
      candidateName: users.fullName,
      candidatePhotoUrl: users.profilePhotoUrl,
      candidateWalletLinked: users.walletAddress,
      status: candidateRequests.status,
      expiresAt: elections.nominationDeadline,
      respondedAt: candidateRequests.respondedAt,
      profileCompletedAt: candidateRequests.profileCompletedAt,
      createdAt: candidateRequests.createdAt,
      electionStatus: elections.status
    }).
    from(candidateRequests).
    leftJoin(elections, eq(candidateRequests.electionId, elections.id)).
    leftJoin(users, eq(candidateRequests.userId, users.id)).
    orderBy(desc(candidateRequests.createdAt));

    return rows.map((row) => {return {
        ...row,
        electionTitle: row.electionTitle ?? "Unknown election",
        candidateName: row.candidateName ?? "Unknown voter",
        candidateWalletLinked: Boolean(row.candidateWalletLinked),
        profileCompleted: Boolean(row.profileCompletedAt)
      };});
  },

  async markProfileCompleted(requestId) {
    const [updated] = await db.
    update(candidateRequests).
    set({ profileCompletedAt: new Date(), updatedAt: new Date() }).
    where(eq(candidateRequests.id, requestId)).
    returning();
    return updated;
  },

  async completeCandidateProfile(
  requestId,
  userId,
  profile)

  {
    const [request] = await db.
    select().
    from(candidateRequests).
    where(and(eq(candidateRequests.id, requestId), eq(candidateRequests.userId, userId)));
    if (!request) {throw new UnauthorizedError("Nomination request not found");}
    if (request.status !== "accepted") {
      throw new BadRequestError("Accept the nomination before completing your candidate profile");
    }
    if (request.profileCompletedAt) {
      throw new BadRequestError("Your candidate profile has already been submitted");
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) {throw new UnauthorizedError("User not found");}

    const candidate = await addCandidate(
      request.electionId,
      {
        name: user.fullName,
        voterUserId: userId,
        party: profile.party,
        photoUrl: profile.photoUrl,
        bio: profile.bio,
        qualification: profile.qualification,
        supports: profile.supports
      },
      userId
    );

    await this.markProfileCompleted(requestId);
    return candidate;
  },

  async expireOutdatedRequests() {
    const now = new Date();
    await db.
    update(candidateRequests).
    set({
      status: "expired",
      updatedAt: now
    }).
    where(
      and(
        eq(candidateRequests.status, "pending"),
        lt(candidateRequests.expiresAt, now)
      )
    );
  },

  async getAcceptedCandidateCount(electionId) {
    const result = await db.
    select().
    from(candidateRequests).
    where(
      and(
        eq(candidateRequests.electionId, electionId),
        eq(candidateRequests.status, "accepted")
      )
    );

    return result.length;
  }
};
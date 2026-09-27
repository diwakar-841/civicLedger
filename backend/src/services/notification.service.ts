import { db, elections, groupMembers, users } from "@voting/database";
import {
  notifications,
  notificationSettings,
} from "../../../database/schema/notifications";
import { eq, and, desc, sql } from "drizzle-orm";

export const notificationService = {
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    relatedId?: string,
    metadata?: Record<string, any>,
  ) {
    const result = await db
      .insert(notifications)
      .values({
        userId,
        type,
        title,
        message,
        relatedId,
        metadata,
      })
      .returning();

    return result[0];
  },

  async getUserNotifications(userId: string) {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  },

  async getUnreadNotifications(userId: string) {
    return db
      .select()
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      )
      .orderBy(desc(notifications.createdAt));
  },

  async markAsRead(notificationId: string, userId: string) {
    await db
      .update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
        ),
      );
  },

  async markAllAsRead(userId: string) {
    await db
      .update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(eq(notifications.userId, userId));
  },

  async deleteNotification(notificationId: string, userId: string) {
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
        ),
      );
  },

  // Notifies everyone *eligible* to have taken part in this election — not
  // just people who actually voted. The old version only queried
  // votes_cache, so non-voters (often the majority, and exactly the people
  // most likely to want a nudge that results are out) never got notified.
  async notifyElectionParticipants(
    electionId: string,
    title: string,
    message: string,
  ) {
    const election = await db.query.elections.findFirst({
      where: eq(elections.id, electionId),
    });
    if (!election) return;

    let recipientIds: string[];
    if (election.electionType === "group" && election.groupId) {
      const members = await db
        .select({ userId: groupMembers.userId })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, election.groupId));
      recipientIds = members.map((m) => m.userId);
    } else {
      const voters = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.isVerified, true));
      recipientIds = voters.map((v) => v.id);
    }

    for (const userId of recipientIds) {
      await this.createNotification(
        userId,
        "resultsAnnounced",
        `Results announced — ${title}`,
        message,
        electionId,
        { electionId },
      );
    }
  },

  async existsForElection(electionId: string, type: string): Promise<boolean> {
    const rows = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.relatedId, electionId),
          eq(notifications.type, type),
        ),
      )
      .limit(1);
    return rows.length > 0;
  },

  async getOrCreateSettings(userId: string) {
    const existing = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId));

    if (existing.length > 0) return existing[0];

    const result = await db
      .insert(notificationSettings)
      .values({ userId })
      .returning();
    return result[0];
  },

  async updateSettings(
    userId: string,
    settings: { candidateNominationEmails?: boolean; reminderEmails?: boolean },
  ) {
    await db
      .update(notificationSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(notificationSettings.userId, userId));
  },
};

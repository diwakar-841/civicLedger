import { db } from "@voting/database";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

/**
 * Activity trail for a group (member + election history).
 *
 * Every important admin/member action is appended here so the admin can see
 * a timeline of "what happened, who it involved and when" on the
 * Manage members page.
 */
export type GroupActivityType =
  | "group_created"
  | "group_updated"
  | "group_deleted"
  | "invitation_sent"
  | "invitation_accepted"
  | "invitation_rejected"
  | "member_removed"
  | "election_created"
  | "admin_action";

export async function runGroupActivityMigrations() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS group_activity (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id UUID NOT NULL,
      type TEXT NOT NULL,
      actor_id UUID,
      actor_name TEXT,
      target_user_id UUID,
      target_name TEXT,
      target_email TEXT,
      detail TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS group_activity_group_idx ON group_activity (group_id, created_at DESC)`);
}

export async function logGroupActivity(entry: {
  groupId: string;
  type: GroupActivityType;
  actorId?: string | null;
  actorName?: string | null;
  targetUserId?: string | null;
  targetName?: string | null;
  targetEmail?: string | null;
  detail?: string | null;
}) {
  try {
    await db.execute(sql`
      INSERT INTO group_activity (group_id, type, actor_id, actor_name, target_user_id, target_name, target_email, detail)
      VALUES (
        ${entry.groupId}, ${entry.type}, ${entry.actorId ?? null}, ${entry.actorName ?? null},
        ${entry.targetUserId ?? null}, ${entry.targetName ?? null}, ${entry.targetEmail ?? null}, ${entry.detail ?? null}
      )
    `);
  } catch (err) {
    // History must never break the action it describes.
    logger.error("Could not record group activity", { err });
}
}

/** Convenience: resolve a user's display name/email for the activity row. */
export async function describeUser(userId: string) {
  const result: any = await db.execute(sql`SELECT id, full_name, email FROM users WHERE id=${userId}`);
  const row = (result.rows ?? result)[0];
  return row ? { name: row.full_name as string, email: row.email as string } : { name: null, email: null };
}

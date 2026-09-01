import { Router } from "express";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware";
import { db } from "../../../database";
import { notificationService } from "../services/notification.service";
import { sql } from "drizzle-orm";
import {
  logGroupActivity,
  runGroupActivityMigrations,
  describeUser,
} from "../lib/groupActivity";

const router = Router();
const rows = (result: any) => result.rows ?? result;

export async function runGroupMigrations() {
  await db.execute(
    sql`DO $$ BEGIN CREATE TYPE group_request_status AS ENUM ('pending','accepted','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  );
  await db.execute(
    sql`CREATE TABLE IF NOT EXISTS groups (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, description TEXT NOT NULL, created_by UUID NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
  );
  await db.execute(
    sql`ALTER TABLE groups ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''`,
  );
  await db.execute(
    sql`ALTER TABLE groups ADD COLUMN IF NOT EXISTS photo_url TEXT`,
  );
  await db.execute(
    sql`CREATE TABLE IF NOT EXISTS group_members (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, joined_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(group_id,user_id))`,
  );
  await db.execute(
    sql`CREATE TABLE IF NOT EXISTS group_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, status group_request_status NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), responded_at TIMESTAMPTZ, UNIQUE(group_id,user_id))`,
  );
  await db.execute(
    sql`ALTER TABLE elections ADD COLUMN IF NOT EXISTS election_type TEXT NOT NULL DEFAULT 'public'`,
  );
  await db.execute(
    sql`ALTER TABLE elections ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL`,
  );

  try {
    await db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS groups_name_unique_idx ON groups (LOWER(name))`,
    );
  } catch (err) {
    console.error(
      "[groups] Could not create unique name index — duplicate group names may exist",
      err,
    );
  }
  await runGroupActivityMigrations();
}

/** Name of the signed-in admin, used to label history entries. */
async function actorName(userId: string) {
  const result: any = await db.execute(
    sql`SELECT full_name FROM users WHERE id=${userId}`,
  );
  return (result.rows ?? result)[0]?.full_name ?? "Administrator";
}

router.get("/", requireAuth, requireAdmin, async (req: any, res) => {
  const result = await db.execute(sql`
    SELECT g.id, g.name, g.description, g.photo_url, g.created_by, g.created_at,
      COUNT(gm.id)::int AS member_count
    FROM groups g LEFT JOIN group_members gm ON gm.group_id = g.id
    GROUP BY g.id ORDER BY g.created_at DESC
  `);
  res.json(rows(result));
});

router.post("/", requireAuth, requireAdmin, async (req: any, res) => {
  const name = String(req.body?.name ?? "").trim();
  const description = String(req.body?.description ?? "").trim();
  const userIds = Array.isArray(req.body?.userIds)
    ? req.body.userIds.filter((id: any) => typeof id === "string")
    : [];
  if (name.length < 2 || name.length > 120)
    return res
      .status(400)
      .json({ error: "Group title must be 2-120 characters" });
  if (!description)
    return res.status(400).json({ error: "Group description is required" });

  // Case-insensitive duplicate check ("Ward 12" collides with "ward 12") so
  // admins get a clear, friendly error instead of a raw DB constraint
  // failure. The unique index created in runGroupMigrations() is the
  // backstop for the race between this check and the insert below.
  const duplicate = rows(
    await db.execute(
      sql`SELECT id FROM groups WHERE LOWER(name) = LOWER(${name}) LIMIT 1`,
    ),
  )[0];
  if (duplicate)
    return res
      .status(409)
      .json({
        error:
          "A group with this name already exists. Please choose a different name.",
      });

  let created;
  try {
    created = await db.execute(
      sql`INSERT INTO groups (name, description, created_by) VALUES (${name}, ${description}, ${req.user.userId}) RETURNING *`,
    );
  } catch (err: any) {
    if (err?.code === "23505")
      return res
        .status(409)
        .json({
          error:
            "A group with this name already exists. Please choose a different name.",
        });
    throw err;
  }
  const group = rows(created)[0];
  const admin = await actorName(req.user.userId);
  await logGroupActivity({
    groupId: group.id,
    type: "group_created",
    actorId: req.user.userId,
    actorName: admin,
    detail: `Group "${name}" was created`,
  });
  let invitationsSent = 0;
  for (const userId of userIds) {
    const request = rows(
      await db.execute(
        sql`INSERT INTO group_requests (group_id,user_id) SELECT ${group.id}, id FROM users WHERE id=${userId} AND role='voter' AND is_verified=true ON CONFLICT DO NOTHING RETURNING id`,
      ),
    )[0];
    if (request) {
      invitationsSent++;
      const invitee = await describeUser(userId);
      await logGroupActivity({
        groupId: group.id,
        type: "invitation_sent",
        actorId: req.user.userId,
        actorName: admin,
        targetUserId: userId,
        targetName: invitee.name,
        targetEmail: invitee.email,
        detail: `Invitation sent to ${invitee.name ?? "a voter"}`,
      });
      await notificationService.createNotification(
        userId,
        "groupInvitation",
        `Invitation to join ${name}`,
        `An administrator invited you to join the group "${name}".`,
        request.id,
        { groupId: group.id },
      );
    }
  }
  res.status(201).json({ ...group, invitationsSent });
});

router.post(
  "/:groupId/requests",
  requireAuth,
  requireAdmin,
  async (req: any, res) => {
    const { groupId } = req.params;
    const userId = req.body?.userId;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const group = rows(
      await db.execute(sql`SELECT id, name FROM groups WHERE id=${groupId}`),
    )[0];
    const user = rows(
      await db.execute(
        sql`SELECT id, full_name FROM users WHERE id=${userId} AND role='voter' AND is_verified=true`,
      ),
    )[0];
    if (!group || !user)
      return res
        .status(404)
        .json({ error: "Group or verified voter not found" });
    const alreadyMember = rows(
      await db.execute(
        sql`SELECT id FROM group_members WHERE group_id=${groupId} AND user_id=${userId}`,
      ),
    )[0];
    if (alreadyMember)
      return res
        .status(409)
        .json({ error: `${user.full_name} is already a member of this group` });
    const alreadyInvited = rows(
      await db.execute(
        sql`SELECT id FROM group_requests WHERE group_id=${groupId} AND user_id=${userId} AND status='pending'`,
      ),
    )[0];
    if (alreadyInvited)
      return res
        .status(409)
        .json({ error: `${user.full_name} already has a pending invitation` });
    const result = await db.execute(sql`
    INSERT INTO group_requests (group_id, user_id) VALUES (${groupId}, ${userId})
    ON CONFLICT (group_id, user_id) DO UPDATE SET status='pending', responded_at=NULL
    RETURNING *
  `);
    const invitee = await describeUser(userId);
    await logGroupActivity({
      groupId,
      type: "invitation_sent",
      actorId: req.user.userId,
      actorName: await actorName(req.user.userId),
      targetUserId: userId,
      targetName: invitee.name,
      targetEmail: invitee.email,
      detail: `Invitation sent to ${invitee.name ?? user.full_name}`,
    });
    await notificationService.createNotification(
      userId,
      "groupInvitation",
      `Invitation to join ${group.name}`,
      `An administrator invited you to join the group "${group.name}".`,
      rows(result)[0].id,
      { groupId },
    );
    res.status(201).json(rows(result)[0]);
  },
);

router.get(
  "/:groupId/requests",
  requireAuth,
  requireAdmin,
  async (req: any, res) => {
    const result = await db.execute(sql`
    SELECT r.id, r.user_id, r.status, r.created_at, r.responded_at,
      u.full_name, u.email
    FROM group_requests r
    JOIN users u ON u.id = r.user_id
    WHERE r.group_id=${req.params.groupId}
    ORDER BY r.created_at DESC
  `);
    res.json(rows(result));
  },
);

router.delete(
  "/:groupId/members/:userId",
  requireAuth,
  requireAdmin,
  async (req: any, res) => {
    const { groupId, userId } = req.params;
    const member = rows(
      await db.execute(sql`
    SELECT u.id, u.full_name, u.email FROM group_members gm JOIN users u ON u.id=gm.user_id
    WHERE gm.group_id=${groupId} AND gm.user_id=${userId}
  `),
    )[0];
    if (!member)
      return res.status(404).json({ error: "Group member not found" });

    // Authentic removal: the admin must confirm the member's full name and give
    // a reason, so a member can never be dropped by an accidental tap.
    const confirmName = String(req.body?.confirmName ?? "").trim();
    const reason = String(req.body?.reason ?? "").trim();
    if (
      confirmName.toLowerCase() !==
      String(member.full_name).trim().toLowerCase()
    ) {
      return res
        .status(400)
        .json({
          error: "Type the member's full name exactly to confirm removal",
        });
    }
    if (reason.length < 3)
      return res
        .status(400)
        .json({ error: "A short reason for removal is required" });

    await db.execute(
      sql`DELETE FROM group_members WHERE group_id=${groupId} AND user_id=${userId}`,
    );
    await db.execute(
      sql`DELETE FROM group_requests WHERE group_id=${groupId} AND user_id=${userId}`,
    );
    await logGroupActivity({
      groupId,
      type: "member_removed",
      actorId: req.user.userId,
      actorName: await actorName(req.user.userId),
      targetUserId: userId,
      targetName: member.full_name,
      targetEmail: member.email,
      detail: `Removed from the group — reason: ${reason}`,
    });
    res.json({ success: true });
  },
);

/** Full activity/history timeline for a group. */
router.get(
  "/:groupId/activity",
  requireAuth,
  requireAdmin,
  async (req: any, res) => {
    const result = await db.execute(sql`
    SELECT id, group_id, type, actor_id, actor_name, target_user_id, target_name, target_email, detail, created_at
    FROM group_activity WHERE group_id=${req.params.groupId}
    ORDER BY created_at DESC LIMIT 200
  `);
    res.json(rows(result));
  },
);

router.get("/requests", requireAuth, async (req: any, res) => {
  const result = await db.execute(sql`
    SELECT r.*, g.name AS group_name, g.description AS group_description, g.photo_url AS group_photo_url,
      (SELECT COUNT(*)::int FROM group_members gm WHERE gm.group_id = g.id) AS group_member_count
    FROM group_requests r JOIN groups g ON g.id=r.group_id
    WHERE r.user_id=${req.user.userId} ORDER BY r.created_at DESC
  `);
  res.json(rows(result));
});

router.put(
  "/requests/:requestId/:action",
  requireAuth,
  async (req: any, res) => {
    const { requestId, action } = req.params;
    if (!["accept", "reject"].includes(action))
      return res.status(400).json({ error: "Invalid action" });
    const request = rows(
      await db.execute(
        sql`SELECT * FROM group_requests WHERE id=${requestId} AND user_id=${req.user.userId} AND status='pending'`,
      ),
    )[0];
    if (!request)
      return res.status(404).json({ error: "Pending group request not found" });
    await db.execute(
      sql`UPDATE group_requests SET status=${action === "accept" ? "accepted" : "rejected"}, responded_at=now() WHERE id=${requestId}`,
    );
    if (action === "accept")
      await db.execute(
        sql`INSERT INTO group_members (group_id, user_id) VALUES (${request.group_id}, ${req.user.userId}) ON CONFLICT DO NOTHING`,
      );
    const responder = await describeUser(req.user.userId);
    await logGroupActivity({
      groupId: request.group_id,
      type: action === "accept" ? "invitation_accepted" : "invitation_rejected",
      actorId: req.user.userId,
      actorName: responder.name,
      targetUserId: req.user.userId,
      targetName: responder.name,
      targetEmail: responder.email,
      detail:
        action === "accept"
          ? "Accepted the group invitation"
          : "Declined the group invitation",
    });
    res.json({
      success: true,
      status: action === "accept" ? "accepted" : "rejected",
    });
  },
);

async function isGroupMember(groupId: string, userId: string) {
  const membership = rows(
    await db.execute(
      sql`SELECT id FROM group_members WHERE group_id=${groupId} AND user_id=${userId}`,
    ),
  )[0];
  return !!membership;
}

// Groups the signed-in voter belongs to — the "My groups" list on their home
// screen. Unlike GET "/", this is scoped to memberships, not every group in
// the system, so ordinary voters can call it without admin rights.
router.get("/mine", requireAuth, async (req: any, res) => {
  const result = await db.execute(sql`
    SELECT g.id, g.name, g.description, g.photo_url, g.created_by, g.created_at, gm.joined_at,
      COUNT(gm2.id)::int AS member_count
    FROM groups g
    JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = ${req.user.userId}
    LEFT JOIN group_members gm2 ON gm2.group_id = g.id
    GROUP BY g.id, gm.joined_at
    ORDER BY gm.joined_at DESC
  `);
  res.json(rows(result));
});

// A group's own details — open to admins (any group) or to a member of that
// specific group (their own group only), so voters can view groups they
// belong to without gaining broader admin access.
router.get("/:groupId", requireAuth, async (req: any, res) => {
  if (
    req.user.role !== "admin" &&
    !(await isGroupMember(req.params.groupId, req.user.userId))
  ) {
    return res
      .status(403)
      .json({ error: "You are not a member of this group" });
  }
  const group = rows(
    await db.execute(sql`
    SELECT g.id, g.name, g.description, g.photo_url, g.created_by, g.created_at,
      COUNT(gm.id)::int AS member_count
    FROM groups g LEFT JOIN group_members gm ON gm.group_id = g.id
    WHERE g.id=${req.params.groupId}
    GROUP BY g.id
  `),
  )[0];
  if (!group) return res.status(404).json({ error: "Group not found" });
  res.json(group);
});

// Member list for a group — same access rule as above: admins see any
// group's roster, members see the roster of groups they're actually in.
router.get("/:groupId/members", requireAuth, async (req: any, res) => {
  if (
    req.user.role !== "admin" &&
    !(await isGroupMember(req.params.groupId, req.user.userId))
  ) {
    return res
      .status(403)
      .json({ error: "You are not a member of this group" });
  }
  const result = await db.execute(sql`
    SELECT u.id, u.full_name, u.email, u.phone, u.profile_photo_url, u.is_verified, u.wallet_address,
      u.last_login_at, gm.joined_at
    FROM group_members gm JOIN users u ON u.id=gm.user_id
    WHERE gm.group_id=${req.params.groupId} ORDER BY u.full_name
  `);
  res.json(rows(result));
});

router.delete("/:groupId", requireAuth, requireAdmin, async (req: any, res) => {
  const group = rows(
    await db.execute(
      sql`SELECT id, name FROM groups WHERE id=${req.params.groupId}`,
    ),
  )[0];
  if (!group) return res.status(404).json({ error: "Group not found" });
  await db.execute(
    sql`UPDATE elections SET group_id=NULL WHERE group_id=${group.id}`,
  );
  await db.execute(sql`DELETE FROM group_requests WHERE group_id=${group.id}`);
  await db.execute(sql`DELETE FROM group_members WHERE group_id=${group.id}`);
  await db.execute(sql`DELETE FROM groups WHERE id=${group.id}`);
  await logGroupActivity({
    groupId: group.id,
    type: "group_deleted",
    actorId: req.user.userId,
    actorName: await actorName(req.user.userId),
    detail: `Group "${group.name}" was deleted`,
  });
  res.json({ success: true });
});

router.put("/:groupId", requireAuth, requireAdmin, async (req: any, res) => {
  const { groupId } = req.params;
  const existing = rows(
    await db.execute(sql`SELECT * FROM groups WHERE id=${groupId}`),
  )[0];
  if (!existing) return res.status(404).json({ error: "Group not found" });

  const name =
    req.body?.name === undefined ? existing.name : String(req.body.name).trim();
  const description =
    req.body?.description === undefined
      ? existing.description
      : String(req.body.description).trim();
  let photoUrl = existing.photo_url ?? null;
  if (req.body?.photoUrl !== undefined) {
    if (req.body.photoUrl === null || req.body.photoUrl === "") photoUrl = null;
    else {
      const value = String(req.body.photoUrl);
      const isDataImage = /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(
        value,
      );
      const isHttp = /^https?:\/\//i.test(value);
      if (!isDataImage && !isHttp)
        return res
          .status(400)
          .json({ error: "Photo must be an image upload or an image URL" });
      if (value.length > 700_000)
        return res
          .status(413)
          .json({
            error: "Photo is too large. Please choose a smaller image.",
          });
      photoUrl = value;
    }
  }

  if (name.length < 2 || name.length > 120)
    return res
      .status(400)
      .json({ error: "Group title must be 2-120 characters" });
  if (!description)
    return res.status(400).json({ error: "Group description is required" });
  if (description.length > 500)
    return res
      .status(400)
      .json({ error: "Description must be 500 characters or fewer" });

  const duplicate = rows(
    await db.execute(
      sql`SELECT id FROM groups WHERE LOWER(name) = LOWER(${name}) AND id != ${groupId} LIMIT 1`,
    ),
  )[0];
  if (duplicate)
    return res
      .status(409)
      .json({
        error:
          "A group with this name already exists. Please choose a different name.",
      });

  let updatedResult;
  try {
    updatedResult = await db.execute(sql`
      UPDATE groups SET name=${name}, description=${description}, photo_url=${photoUrl}
      WHERE id=${groupId} RETURNING *
    `);
  } catch (err: any) {
    if (err?.code === "23505")
      return res
        .status(409)
        .json({
          error:
            "A group with this name already exists. Please choose a different name.",
        });
    throw err;
  }
  const updated = rows(updatedResult)[0];
  await logGroupActivity({
    groupId,
    type: "group_updated",
    actorId: req.user.userId,
    actorName: await actorName(req.user.userId),
    detail: `Group details updated (name: "${name}")`,
  });
  const count = rows(
    await db.execute(
      sql`SELECT COUNT(*)::int AS member_count FROM group_members WHERE group_id=${groupId}`,
    ),
  )[0];
  res.json({ ...updated, member_count: count?.member_count ?? 0 });
});

export default router;

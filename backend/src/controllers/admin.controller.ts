import { Response, NextFunction } from "express";
import { AuthedRequest } from "../middlewares/auth.middleware";
import { db, auditLog } from "@voting/database";
import { desc, eq, and, count, SQL } from "drizzle-orm";
import { computeHash } from "../lib/audit";

export async function getAuditLog(req, res, next) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const rawPageSize = parseInt(String(req.query.pageSize ?? "50"), 10) || 50;
    const pageSize = Math.min(100, Math.max(1, rawPageSize));
    const actor = typeof req.query.actor === "string" ? req.query.actor : undefined;
    const action = typeof req.query.action === "string" ? req.query.action : undefined;

    const conditions = [];
    if (actor) {conditions.push(eq(auditLog.actor, actor));}
    if (action) {conditions.push(eq(auditLog.action, action));}

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [entries, [{ total }]] = await Promise.all([
    db.query.auditLog.findMany({
      where,
      orderBy: [desc(auditLog.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
      columns: {
        id: true,
        actor: true,
        action: true,
        metadata: true,
        txHash: true,
        ipAddress: true,
        createdAt: true
      }
    }),
    db.select({ total: count() }).from(auditLog).where(where)]
    );

    res.json({ page, pageSize, entries, total });
  } catch (err) {
    next(err);
  }
}

export async function verifyAuditLog(req, res, next) {
  try {
    const rows = await db.query.auditLog.findMany({
      orderBy: [auditLog.createdAt],
      columns: {
        id: true,
        actor: true,
        action: true,
        metadata: true,
        txHash: true,
        prevHash: true,
        hash: true,
        createdAt: true
      }
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const expectedPrevHash = i === 0 ? null : rows[i - 1].hash;

      const computed = computeHash(
        expectedPrevHash ?? null,
        row.actor,
        row.action,
        row.metadata ?? undefined,
        row.txHash ?? undefined,
        row.createdAt
      );

      if (computed !== row.hash || row.prevHash !== expectedPrevHash) {
        return res.json({ valid: false, brokenAtId: row.id });
      }
    }

    res.json({ valid: true });
  } catch (err) {
    next(err);
  }
}

export async function exportAuditLogCsv(req, res, next) {
  try {
    const rows = await db.query.auditLog.findMany({
      orderBy: [auditLog.createdAt],
      columns: {
        id: true,
        actor: true,
        action: true,
        metadata: true,
        txHash: true,
        ipAddress: true,
        createdAt: true,
        hash: true
      }
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=\"audit-log.csv\"");

    const header = "id,actor,action,metadata,txHash,ipAddress,createdAt,hash\n";
    const body = rows.
    map((r) =>
    {return [
      r.id,
      JSON.stringify(r.actor),
      JSON.stringify(r.action),
      JSON.stringify(JSON.stringify(r.metadata ?? {})),
      JSON.stringify(r.txHash ?? ""),
      JSON.stringify(r.ipAddress ?? ""),
      r.createdAt.toISOString(),
      r.hash ?? ""].
      join(",");}
    ).
    join("\n");

    res.send(header + body);
  } catch (err) {
    next(err);
  }
}
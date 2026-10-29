import { TooManyRequestsError } from "./errors";

/**
 * Small in-process failed-attempt limiter for secrets that have a tiny search
 * space (6-digit PINs / OTPs). The per-IP express-rate-limit middleware alone
 * does not stop a distributed guesser, because it counts per client IP, not
 * per account. This counts per *account* (or any caller-chosen key).
 *
 * It is process-local (resets on restart, not shared between instances). That
 * is still a large improvement over nothing; for multi-instance deployments
 * back it with Redis or a DB table.
 */

interface Entry {
  failures: number;
  firstFailureAt: number;
  lockedUntil: number;
}

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

const entries = new Map<string, Entry>();

function prune(now: number) {
  for (const [key, entry] of entries) {
    const expired =
      entry.lockedUntil <= now && now - entry.firstFailureAt > WINDOW_MS;
    if (expired) entries.delete(key);
  }
}

const pruneTimer = setInterval(() => prune(Date.now()), 5 * 60 * 1000);
pruneTimer.unref?.();

/** Throws 429 if `key` is currently locked out. Call BEFORE checking the secret. */
export function assertNotLockedOut(key: string): void {
  const entry = entries.get(key);
  if (!entry) return;
  const now = Date.now();
  if (entry.lockedUntil > now) {
    const minutes = Math.max(1, Math.ceil((entry.lockedUntil - now) / 60_000));
    throw new TooManyRequestsError(
      `Too many incorrect attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    );
  }
}

/** Record a failed attempt. Locks the key once MAX_FAILURES is reached. */
export function recordFailure(key: string): void {
  const now = Date.now();
  let entry = entries.get(key);
  if (!entry || now - entry.firstFailureAt > WINDOW_MS) {
    entry = { failures: 0, firstFailureAt: now, lockedUntil: 0 };
    entries.set(key, entry);
  }
  entry.failures += 1;
  if (entry.failures >= MAX_FAILURES) {
    entry.lockedUntil = now + LOCK_MS;
    entry.failures = 0;
    entry.firstFailureAt = now;
  }
}

/** Clear the counter after a successful attempt. */
export function recordSuccess(key: string): void {
  entries.delete(key);
}

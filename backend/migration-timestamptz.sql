-- ============================================================================
-- Fix: all datetime columns were "timestamp without time zone".
--
-- Drizzle writes JS Date values as UTC strings, but node-postgres reads
-- "timestamp without time zone" back as *local* server time. On a server in
-- UTC+05:30 every stored time came back 5h30m earlier than it was written, so
-- a voting window scheduled 5 minutes in the future was already in the past
-- the moment it was saved — the scheduler then activated the election
-- immediately ("voting starts right after setting the times"). The same shift
-- corrupted nomination deadlines, request expiry, session expiry and OTP
-- expiry.
--
-- Converting every column to timestamptz makes the values absolute. Existing
-- values were written as UTC, so they are re-interpreted with `AT TIME ZONE
-- 'UTC'` to keep them correct.
-- ============================================================================

BEGIN;

ALTER TABLE elections
  ALTER COLUMN start_time            TYPE timestamptz USING start_time            AT TIME ZONE 'UTC',
  ALTER COLUMN end_time              TYPE timestamptz USING end_time              AT TIME ZONE 'UTC',
  ALTER COLUMN nomination_deadline   TYPE timestamptz USING nomination_deadline    AT TIME ZONE 'UTC',
  ALTER COLUMN results_release_at    TYPE timestamptz USING results_release_at     AT TIME ZONE 'UTC',
  ALTER COLUMN results_published_at  TYPE timestamptz USING results_published_at   AT TIME ZONE 'UTC',
  ALTER COLUMN created_at            TYPE timestamptz USING created_at             AT TIME ZONE 'UTC';

ALTER TABLE candidate_requests
  ALTER COLUMN expires_at           TYPE timestamptz USING expires_at            AT TIME ZONE 'UTC',
  ALTER COLUMN responded_at         TYPE timestamptz USING responded_at          AT TIME ZONE 'UTC',
  ALTER COLUMN profile_completed_at TYPE timestamptz USING profile_completed_at  AT TIME ZONE 'UTC',
  ALTER COLUMN created_at           TYPE timestamptz USING created_at            AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at           TYPE timestamptz USING updated_at            AT TIME ZONE 'UTC';

ALTER TABLE users
  ALTER COLUMN locked_until                      TYPE timestamptz USING locked_until                      AT TIME ZONE 'UTC',
  ALTER COLUMN last_login_at                     TYPE timestamptz USING last_login_at                     AT TIME ZONE 'UTC',
  ALTER COLUMN email_verification_expires_at     TYPE timestamptz USING email_verification_expires_at     AT TIME ZONE 'UTC',
  ALTER COLUMN password_reset_expires_at         TYPE timestamptz USING password_reset_expires_at         AT TIME ZONE 'UTC',
  ALTER COLUMN kyc_otp_expires_at                TYPE timestamptz USING kyc_otp_expires_at                AT TIME ZONE 'UTC',
  ALTER COLUMN created_at                        TYPE timestamptz USING created_at                        AT TIME ZONE 'UTC';

ALTER TABLE sessions
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN expires_at TYPE timestamptz USING expires_at AT TIME ZONE 'UTC',
  ALTER COLUMN revoked_at TYPE timestamptz USING revoked_at AT TIME ZONE 'UTC';

ALTER TABLE notifications
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE notification_settings
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE candidates
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';

ALTER TABLE votes_cache
  ALTER COLUMN voted_at TYPE timestamptz USING voted_at AT TIME ZONE 'UTC';

ALTER TABLE audit_log
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';

ALTER TABLE webauthn_credentials
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';

COMMIT;

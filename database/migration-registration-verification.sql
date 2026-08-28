-- Registration verification flow
-- Run once against an existing database before deploying the updated backend.

ALTER TABLE users
  ALTER COLUMN aadhaar_hash DROP NOT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verification_method text NOT NULL DEFAULT 'otp',
  ADD COLUMN IF NOT EXISTS email_verification_otp_hash text,
  ADD COLUMN IF NOT EXISTS email_verification_otp_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS password_set_at timestamptz,
  ADD COLUMN IF NOT EXISTS registration_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS phone_verification_otp_hash text,
  ADD COLUMN IF NOT EXISTS phone_verification_otp_expires_at timestamptz;

-- Existing accounts already passed the old verification gate. Preserve their
-- access while making the new verification flags accurate.
UPDATE users
SET email_verified = true,
    password_set_at = COALESCE(password_set_at, created_at),
    phone_verified = CASE WHEN is_verified THEN true ELSE phone_verified END
WHERE is_verified = true;

-- A pending registration expires 24 hours after it was started. A partial
-- unique index allows multiple users with no phone while preventing reuse of
-- a verified or pending phone number.
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique_idx
  ON users (phone)
  WHERE phone IS NOT NULL;
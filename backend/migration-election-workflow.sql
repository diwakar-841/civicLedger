-- Election workflow: decision periods, single allowance extension, cancellation.
-- Safe to run repeatedly.

ALTER TYPE election_status ADD VALUE IF NOT EXISTS 'cancelled';

ALTER TABLE elections
  ADD COLUMN IF NOT EXISTS decision_phase TEXT NOT NULL DEFAULT 'initial',
  ADD COLUMN IF NOT EXISTS allowance_extended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS allowance_extension_minutes TEXT,
  ADD COLUMN IF NOT EXISTS decision_period_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

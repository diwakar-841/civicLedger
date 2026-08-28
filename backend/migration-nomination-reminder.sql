-- One-time nomination reminders.
-- Adds the column that records when a nominee received their single reminder.
-- Safe to run more than once.
ALTER TABLE candidate_requests
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

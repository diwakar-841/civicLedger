-- Migration: add voter_user_id to votes_cache
-- Run once against your database:
--   psql $DATABASE_URL -f migration-add-voter-user-id.sql
--
-- This column links each cached vote back to the user who cast it so the
-- backend can answer "has THIS user already voted?" without an on-chain
-- round-trip on every page load.

ALTER TABLE votes_cache
  ADD COLUMN IF NOT EXISTS voter_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index for fast look-ups: "has user X voted in election Y?"
CREATE INDEX IF NOT EXISTS idx_votes_cache_voter_election
  ON votes_cache (voter_user_id, election_id);

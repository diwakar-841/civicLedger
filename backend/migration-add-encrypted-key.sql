-- Migration: add encrypted_private_key column to users table
-- Run this ONCE against your database before restarting the backend.
--
--   psql $DATABASE_URL -f backend/migration-add-encrypted-key.sql
--
-- The column stores each user's server-generated Ethereum private key
-- encrypted with AES-256-GCM (see backend/src/lib/crypto.ts).
-- It is NULL for users who linked an external wallet (MetaMask etc.)
-- instead of using the auto-generate flow.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS encrypted_private_key TEXT;

-- Optional index is not needed (looked up only by primary key).
-- Verify the column was added:
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'users' AND column_name = 'encrypted_private_key';

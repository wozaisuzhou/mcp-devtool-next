-- Migration 004: add password_hash to registered_users
ALTER TABLE registered_users
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

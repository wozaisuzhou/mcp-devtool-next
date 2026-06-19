-- Migration 003: registered_users
-- Simple email-based sign-up gate for the Save Session feature.
-- No passwords — just records who has opted in.

CREATE TABLE IF NOT EXISTS registered_users (
  email      VARCHAR(255) PRIMARY KEY,
  name       VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

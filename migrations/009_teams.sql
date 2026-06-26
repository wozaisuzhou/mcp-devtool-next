-- Migration 009: teams
-- Teams allow users to share saved sessions and test suites with colleagues.
-- A user can belong to multiple teams. The owner is also a member (role='owner').
-- invite_code is a short slug used to join without an email invite.

CREATE TABLE IF NOT EXISTS teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255) NOT NULL REFERENCES registered_users(email) ON DELETE CASCADE,
  invite_code VARCHAR(20) UNIQUE NOT NULL DEFAULT substring(gen_random_uuid()::text, 1, 8),
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_email  VARCHAR(255) NOT NULL REFERENCES registered_users(email) ON DELETE CASCADE,
  role        VARCHAR(20) NOT NULL DEFAULT 'member', -- 'owner' | 'member'
  joined_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, user_email)
);

CREATE INDEX IF NOT EXISTS idx_teams_owner_email    ON teams(owner_email);
CREATE INDEX IF NOT EXISTS idx_team_members_email   ON team_members(user_email);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);

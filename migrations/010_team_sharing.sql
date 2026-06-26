-- Migration 010: team sharing
-- Adds team_id to saved_sessions and test_suites so they can be shared
-- with a team. NULL = private (owner only). Set = visible to all team members.

ALTER TABLE saved_sessions
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

ALTER TABLE test_suites
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_saved_sessions_team_id ON saved_sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_test_suites_team_id    ON test_suites(team_id);

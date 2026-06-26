-- Migration 011: team join requests
-- When a user joins via invite code, a pending request is created.
-- The owner must approve before the user becomes a full member.

CREATE TABLE IF NOT EXISTS team_join_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_email   VARCHAR(255) NOT NULL REFERENCES registered_users(email) ON DELETE CASCADE,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (team_id, user_email)
);

CREATE INDEX IF NOT EXISTS idx_team_join_requests_team_id    ON team_join_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_user_email ON team_join_requests(user_email);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_status     ON team_join_requests(team_id, status);

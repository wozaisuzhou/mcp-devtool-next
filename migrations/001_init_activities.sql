-- PostgreSQL migrations for MCP DevTool activity storage

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activity_type VARCHAR(50) NOT NULL CHECK(activity_type IN ('tool_call', 'resource_read', 'connection', 'error', 'chat')),
  server_id VARCHAR(255) NOT NULL,
  tool_name VARCHAR(255),
  input JSONB,
  output JSONB,
  error TEXT,
  status VARCHAR(50) CHECK(status IN ('success', 'error', 'timeout')),
  duration_ms INTEGER,
  session_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_activities_timestamp ON activities(timestamp DESC);
CREATE INDEX idx_activities_user_type ON activities(user_id, activity_type);
CREATE INDEX idx_activities_server ON activities(server_id);
CREATE INDEX idx_activities_session ON activities(session_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE,
  server_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_started_at ON sessions(started_at DESC);

-- Analytics view
CREATE VIEW activity_stats AS
SELECT
  user_id,
  activity_type,
  status,
  COUNT(*) as total,
  AVG(duration_ms) as avg_duration_ms,
  MIN(duration_ms) as min_duration_ms,
  MAX(duration_ms) as max_duration_ms,
  DATE_TRUNC('hour', timestamp) as hour
FROM activities
GROUP BY user_id, activity_type, status, DATE_TRUNC('hour', timestamp);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

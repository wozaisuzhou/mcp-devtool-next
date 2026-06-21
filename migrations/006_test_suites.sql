-- Migration 006: test_suites
-- Persists user-created test suites and their test cases server-side.
-- Cases are stored as JSONB so the schema stays flexible as test case
-- fields evolve without requiring further migrations.

CREATE TABLE IF NOT EXISTS test_suites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email  VARCHAR(255) REFERENCES registered_users(email) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  cases       JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_test_suites_user_email ON test_suites(user_email);
CREATE INDEX IF NOT EXISTS idx_test_suites_created_at ON test_suites(created_at DESC);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_test_suites_updated_at
  BEFORE UPDATE ON test_suites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

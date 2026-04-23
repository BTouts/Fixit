-- Enable RLS on all tables.
-- No explicit policies = anon role is denied by default.
-- The service role key used server-side bypasses RLS entirely,
-- so existing server code is unaffected.
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

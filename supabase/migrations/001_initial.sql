CREATE TABLE apps (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  github_repo      text,
  api_key_hash     text        NOT NULL,
  vercel_project_id text,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE bug_reports (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id      uuid        REFERENCES apps(id) ON DELETE CASCADE,
  description text        NOT NULL,
  url         text,
  user_agent  text,
  context     jsonb       DEFAULT '{}',
  status      text        NOT NULL DEFAULT 'open',
  created_at  timestamptz DEFAULT now(),

  CONSTRAINT bug_reports_status_check
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'))
);

CREATE INDEX idx_bug_reports_app_id    ON bug_reports (app_id);
CREATE INDEX idx_bug_reports_status    ON bug_reports (status);
CREATE INDEX idx_bug_reports_created_at ON bug_reports (created_at DESC);

ALTER TABLE apps        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

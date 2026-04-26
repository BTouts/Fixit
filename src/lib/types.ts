export type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type FixSuggestionStatus = 'pending' | 'ready' | 'failed';

export interface App {
  id: string;
  name: string;
  github_repo: string | null;
  api_key_hash: string;
  vercel_project_id: string | null;
  auto_suggest: boolean;
  created_at: string;
}

export interface FixSuggestion {
  id: string;
  bug_report_id: string;
  diff: string | null;
  files_used: string[];
  model: string | null;
  status: FixSuggestionStatus;
  error: string | null;
  created_at: string;
}

export interface BugReport {
  id: string;
  app_id: string;
  description: string;
  url: string | null;
  user_agent: string | null;
  context: Record<string, unknown> | null;
  status: BugStatus;
  created_at: string;
}

export interface BugReportWithApp extends BugReport {
  apps: Pick<App, 'name'> | null;
}

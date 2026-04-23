export type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface App {
  id: string;
  name: string;
  github_repo: string | null;
  api_key_hash: string;
  vercel_project_id: string | null;
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

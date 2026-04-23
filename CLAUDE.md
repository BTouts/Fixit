# fixit

A personal bug tracking and automated fixing platform. Accepts bug reports from any connected app via a standardized API endpoint, surfaces AI-generated fix suggestions for review, and — only after explicit approval — applies fixes and opens a branch for preview deployment testing.

## Core Principle

**No code is touched without explicit human approval.** The flow is always: report → AI suggests fix → owner reviews → owner approves → fix is applied.

## Architecture

### Components

- **fixit app** — Next.js (App Router) + Supabase + Vercel. The central dashboard where bug reports are reviewed and fix suggestions are inspected.
- **Bug report API** (`POST /api/report`) — authenticated endpoint that any connected app posts bug reports to. Each connected app has its own API key.
- **Fix suggestion engine** — on report receipt (or on demand), calls the Anthropic API with relevant source files (pulled via GitHub API) + bug description to generate a proposed diff. No code is written to any repo at this stage.
- **Fix application** — after owner approval, triggers a GitHub Actions workflow dispatch on the target repo, which applies the approved diff, pushes a branch, and does NOT merge.
- **Vercel preview integration** — after branch push, polls the Vercel API for the preview deployment URL and surfaces it in fixit + sends it via email.
- **Email notifications** — Resend. Fires on: new bug report received, fix suggestion ready, preview deployment ready.

### End-to-End Flow

```
Connected app → POST /api/report (with API key)
  → bug stored in Supabase
  → Anthropic API called with relevant source files → diff suggestion generated
  → email sent: "new bug + suggested fix ready for review"
  → owner opens fixit, reviews bug + diff
  → owner clicks Approve
  → GitHub Actions workflow dispatched → branch created, diff applied, pushed
  → Vercel builds preview
  → fixit polls Vercel API → preview URL captured
  → email sent: "fix branch ready, here's your preview link"
  → owner reviews preview → merges (or closes) PR manually
```

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | Consistent with connected apps; API routes + UI in one repo |
| Database | Supabase (Postgres) | Dogfoods the same stack as the test app; auth included |
| Hosting | Vercel | Same deployment pattern as connected apps |
| AI | Anthropic API (claude-sonnet-4-6) | Fix suggestion generation; prompt caching on source files |
| Email | Resend | First-class Next.js/Vercel integration |
| GitHub automation | GitHub Actions (workflow_dispatch) | Ephemeral, secrets-managed, no long-running server needed |
| Auth | Supabase Auth | Owner login to fixit dashboard |

## Data Model (Key Entities)

- **App** — a connected application (`id`, `name`, `github_repo`, `api_key`, `vercel_project_id`)
- **BugReport** — a submitted bug (`id`, `app_id`, `description`, `context_json`, `status`, `created_at`)
- **FixSuggestion** — an AI-proposed diff (`id`, `bug_report_id`, `diff`, `files_used`, `model`, `created_at`)
- **FixApplication** — a triggered fix run (`id`, `fix_suggestion_id`, `branch_name`, `pr_url`, `preview_url`, `status`)

## Bug Report Widget Integration

Connected apps send a POST to fixit with their API key:

```json
POST https://fixit.vercel.app/api/report
Authorization: Bearer <app-api-key>

{
  "description": "User-provided bug description",
  "url": "https://myapp.com/page-where-it-happened",
  "user_agent": "...",
  "context": {}
}
```

The widget can be a simple fetch call, a copy-paste snippet, or eventually an npm package.

## Development Phases

### Phase 1 — MVP
- [ ] fixit Next.js app scaffolded, deployed to Vercel
- [ ] Supabase schema (App, BugReport tables)
- [ ] `POST /api/report` endpoint with API key auth
- [ ] Basic dashboard: list bug reports per app
- [ ] Resend email on new bug report

### Phase 2 — Fix Suggestions
- [ ] GitHub API integration (pull source files for a given repo)
- [ ] Anthropic API integration: generate diff suggestion from bug + source files
- [ ] FixSuggestion stored, diff rendered in dashboard UI
- [ ] Email: "fix suggestion ready"

### Phase 3 — Fix Application
- [ ] GitHub Actions workflow template (manually added to each connected repo — fixit does not write this file automatically)
- [ ] `POST /api/apply` — owner-only endpoint that dispatches workflow
- [ ] Branch naming convention, PR creation
- [ ] Vercel API polling for preview URL
- [ ] Email: "preview ready" with link

### Phase 4 — Polish
- [ ] npm package or embeddable widget snippet
- [ ] Per-app settings (which files/dirs Claude should look at)
- [ ] Fix rejection + feedback loop
- [ ] Audit log of all approvals and applications

## Connected Apps

- **Test app**: Supabase backend, Vercel deployment (first integration target)

## Key Constraints

- Owner must approve before any repo is modified
- Fix branches are never auto-merged
- All Anthropic API calls should use prompt caching where source files are reused across suggestions
- API keys are per-app, rotatable, stored hashed in Supabase

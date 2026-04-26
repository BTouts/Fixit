import 'server-only';

const GITHUB_API = 'https://api.github.com';

const SOURCE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.rb', '.go', '.java', '.cs', '.php', '.swift', '.kt', '.rs',
]);

const IGNORE_DIRS = new Set([
  'node_modules', '.next', 'dist', 'build', '.git', 'coverage',
  '__pycache__', '.cache', 'vendor', '.turbo', 'out',
]);

function githubHeaders() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN env var is not set');
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

type TreeItem = { path: string; type: string };

export async function fetchRepoFileList(repo: string): Promise<string[]> {
  const res = await fetch(`${GITHUB_API}/repos/${repo}/git/trees/HEAD?recursive=1`, {
    headers: githubHeaders(),
  });

  if (!res.ok) {
    throw new Error(`GitHub API error fetching tree: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { tree: TreeItem[]; truncated?: boolean };

  return data.tree
    .filter((item) => {
      if (item.type !== 'blob') return false;
      const parts = item.path.split('/');
      if (parts.some((p) => IGNORE_DIRS.has(p))) return false;
      const dotIndex = item.path.lastIndexOf('.');
      if (dotIndex === -1) return false;
      return SOURCE_EXTENSIONS.has(item.path.slice(dotIndex));
    })
    .map((item) => item.path)
    .slice(0, 300);
}

export async function fetchFileContents(
  repo: string,
  paths: string[],
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  await Promise.all(
    paths.map(async (path) => {
      try {
        const res = await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
          headers: githubHeaders(),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { content?: string; encoding?: string };
        if (data.encoding === 'base64' && data.content) {
          results[path] = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8');
        }
      } catch {
        // skip files that fail to fetch
      }
    }),
  );

  return results;
}

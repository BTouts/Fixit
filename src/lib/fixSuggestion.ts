import 'server-only';
import { Resend } from 'resend';
import { getSupabase } from '@/lib/supabase';
import { fetchRepoFileList } from '@/lib/github';

// STUB MODE: Anthropic API calls are stubbed out to avoid costs during development.
// To enable real AI generation, set ANTHROPIC_API_KEY and swap these stubs for the
// real implementations in the commented-out block below.
const MODEL = 'stub';

const STUB_DELAY_MS = 3000;

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

async function selectRelevantFiles(fileList: string[]): Promise<string[]> {
  await new Promise((r) => setTimeout(r, STUB_DELAY_MS));
  return fileList.slice(0, 5);
}

async function generateDiff(
  relevantPaths: string[],
  bugDescription: string,
): Promise<string> {
  const firstFile = relevantPaths[0] ?? 'src/example.ts';
  return [
    `--- a/${firstFile}`,
    `+++ b/${firstFile}`,
    '@@ -1,5 +1,6 @@',
    ' // existing code',
    `-// TODO: fix bug related to: ${bugDescription.slice(0, 60)}`,
    `+// STUB: this is a placeholder diff — enable Anthropic API for real suggestions`,
    `+// Bug: ${bugDescription.slice(0, 80)}`,
    ' ',
    ' export default function example() {',
    '   return null;',
    ' }',
  ].join('\n');
}

type BugWithApp = {
  description: string;
  apps: { name: string } | null;
};

export async function runFixSuggestion(
  suggestionId: string,
  bugReportId: string,
  repo: string,
): Promise<void> {
  const supabase = getSupabase();

  try {
    const { data: bug } = await supabase
      .from('bug_reports')
      .select('description, apps(name)')
      .eq('id', bugReportId)
      .single<BugWithApp>();

    if (!bug) throw new Error('Bug report not found');

    const fileList = await fetchRepoFileList(repo);
    const relevantPaths = await selectRelevantFiles(fileList);
    const diff = await generateDiff(relevantPaths, bug.description);

    await supabase
      .from('fix_suggestions')
      .update({ diff, files_used: relevantPaths, model: MODEL, status: 'ready' })
      .eq('id', suggestionId);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fixit.vercel.app';
    await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'fixit <onboarding@resend.dev>',
      to: process.env.OWNER_EMAIL!,
      subject: `[fixit] Fix suggestion ready: ${bug.apps?.name ?? 'unknown app'}`,
      text: [
        'A fix suggestion is ready for review.',
        '',
        `App:  ${bug.apps?.name ?? 'Unknown'}`,
        `Bug:  ${bug.description.slice(0, 200)}${bug.description.length > 200 ? '…' : ''}`,
        '',
        `Review: ${appUrl}/bugs/${bugReportId}`,
      ].join('\n'),
    });
  } catch (err) {
    await getSupabase()
      .from('fix_suggestions')
      .update({
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      .eq('id', suggestionId);
  }
}

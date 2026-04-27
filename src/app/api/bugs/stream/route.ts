import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();
  let removeChannel: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const supabase = getSupabase();
      const channel = supabase
        .channel(`sse_bugs_${crypto.randomUUID()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bug_reports' }, () => {
          try {
            controller.enqueue(encoder.encode('data: ping\n\n'));
          } catch {
            // client already disconnected
          }
        })
        .subscribe();

      controller.enqueue(encoder.encode(': connected\n\n'));
      removeChannel = () => supabase.removeChannel(channel);
    },
    cancel() {
      removeChannel?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}

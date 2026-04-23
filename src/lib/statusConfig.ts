import type { BugStatus } from '@/lib/types';

export const STATUS_LABELS: Record<BugStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const STATUS_CLASSES: Record<BugStatus, string> = {
  open: 'bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30',
  in_progress: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
  resolved: 'bg-green-500/15 text-green-400 ring-1 ring-green-500/30',
  closed: 'bg-gray-500/15 text-gray-400 ring-1 ring-gray-500/30',
};

interface DiffViewerProps {
  diff: string;
}

type LineType = 'add' | 'remove' | 'hunk' | 'file' | 'context';

function classifyLine(line: string): LineType {
  if (line.startsWith('+++') || line.startsWith('---')) return 'file';
  if (line.startsWith('@@')) return 'hunk';
  if (line.startsWith('+')) return 'add';
  if (line.startsWith('-')) return 'remove';
  return 'context';
}

const LINE_CLASSES: Record<LineType, string> = {
  add: 'bg-green-950/60 text-green-300',
  remove: 'bg-red-950/60 text-red-300',
  hunk: 'bg-blue-950/40 text-blue-400',
  file: 'text-gray-300 font-semibold',
  context: 'text-gray-400',
};

export default function DiffViewer({ diff }: DiffViewerProps) {
  const lines = diff.split('\n');

  return (
    <div className="rounded-md bg-gray-950 border border-gray-800 overflow-x-auto">
      <pre className="text-xs font-mono leading-relaxed">
        {lines.map((line, i) => {
          const type = classifyLine(line);
          return (
            <div key={i} className={`px-4 py-px ${LINE_CLASSES[type]}`}>
              {line || ' '}
            </div>
          );
        })}
      </pre>
    </div>
  );
}

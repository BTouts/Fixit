import type { ReactNode } from 'react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <aside className="fixed inset-y-0 left-0 w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="h-14 flex items-center px-5 border-b border-gray-800 shrink-0">
          <Link href="/bugs" className="text-lg font-bold tracking-tight text-white">
            fix<span className="text-red-500">it</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <Link
            href="/bugs"
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 shrink-0 text-gray-400"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            Bug Reports
          </Link>
        </nav>
      </aside>

      <div className="pl-56">
        <main className="min-h-screen p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

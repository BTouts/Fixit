import type { ReactNode } from 'react';
import Link from 'next/link';
import NavLinks from '@/components/NavLinks';
import LogoutButton from '@/components/LogoutButton';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <aside className="fixed inset-y-0 left-0 w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="h-14 flex items-center px-5 border-b border-gray-800 shrink-0">
          <Link href="/bugs" className="text-lg font-bold tracking-tight text-white">
            fix<span className="text-red-500">it</span>
          </Link>
        </div>

        <NavLinks />

        <div className="px-3 py-3 border-t border-gray-800 shrink-0">
          <LogoutButton />
        </div>
      </aside>

      <div className="pl-56">
        <main className="min-h-screen p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

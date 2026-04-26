'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  {
    href: '/bugs',
    label: 'Bug Reports',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: '/apps',
    label: 'Apps',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
        <path d="M3.25 4A2.25 2.25 0 001 6.25v7.5A2.25 2.25 0 003.25 16h13.5A2.25 2.25 0 0019 13.75v-7.5A2.25 2.25 0 0016.75 4H3.25z" />
      </svg>
    ),
  },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {links.map(({ href, label, icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? 'bg-red-500/10 text-red-400'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {icon}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

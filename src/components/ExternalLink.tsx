'use client';

interface ExternalLinkProps {
  href: string;
  className?: string;
  title?: string;
  children: React.ReactNode;
}

export default function ExternalLink({ href, className, title, children }: ExternalLinkProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} title={title}>
      {children}
    </a>
  );
}

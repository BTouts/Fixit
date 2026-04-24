'use client';

interface ExternalLinkProps {
  href: string;
  className?: string;
  title?: string;
  children: React.ReactNode;
}

function isSafeUrl(href: string): boolean {
  try {
    const { protocol } = new URL(href);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

export default function ExternalLink({ href, className, title, children }: ExternalLinkProps) {
  const safehref = isSafeUrl(href) ? href : '#';
  return (
    <a href={safehref} target="_blank" rel="noopener noreferrer" className={className} title={title}>
      {children}
    </a>
  );
}

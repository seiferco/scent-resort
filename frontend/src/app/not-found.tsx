import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="font-display text-6xl font-bold text-foreground uppercase tracking-tight">404</h1>
      <p className="mt-4 text-foreground-secondary">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        href="/"
        className="mt-6 inline-block bg-foreground text-background px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] hover:opacity-80 transition-opacity"
      >
        Back to Home
      </Link>
    </div>
  );
}

'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="font-display text-4xl font-bold text-foreground uppercase tracking-tight">Something went wrong</h1>
      <p className="mt-4 text-foreground-secondary">An unexpected error occurred. Please try again.</p>
      <button
        onClick={reset}
        className="mt-6 inline-block bg-foreground text-background px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] hover:opacity-80 transition-opacity"
      >
        Try Again
      </button>
    </div>
  );
}

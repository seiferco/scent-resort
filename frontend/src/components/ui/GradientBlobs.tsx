export function GradientBlobs({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className="blob blob-red" style={{ top: '-20%', left: '-10%' }} />
      <div className="blob blob-orange" style={{ top: '10%', right: '-15%' }} />
      <div className="blob blob-pink" style={{ bottom: '-10%', left: '20%' }} />
    </div>
  );
}

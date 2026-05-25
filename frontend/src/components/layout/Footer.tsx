import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 relative overflow-hidden">
        {/* Massive year indicator */}
        <div className="absolute right-0 bottom-0 font-display text-[20vw] sm:text-[15vw] font-bold leading-none text-background/5 select-none pointer-events-none">
          {year}
        </div>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="font-display text-xl font-bold text-background uppercase tracking-[0.05em]">
              SCENTRESORT
            </Link>
            <p className="mt-4 text-sm text-background/60 leading-relaxed max-w-xs">
              A curated marketplace for authentic luxury and niche fragrances.
              Built by collectors, for collectors.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="text-xs font-bold text-background uppercase tracking-[0.2em] mb-5">Marketplace</h3>
            <ul className="space-y-3">
              <li><Link href="/listings" className="text-sm text-background/60 hover:text-accent transition-colors">Browse Fragrances</Link></li>
              <li><Link href="/listings/create" className="text-sm text-background/60 hover:text-accent transition-colors">Sell a Fragrance</Link></li>
              <li><Link href="/messages" className="text-sm text-background/60 hover:text-accent transition-colors">Messages</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-xs font-bold text-background uppercase tracking-[0.2em] mb-5">Account</h3>
            <ul className="space-y-3">
              <li><Link href="/dashboard" className="text-sm text-background/60 hover:text-accent transition-colors">Dashboard</Link></li>
              <li><Link href="/profile" className="text-sm text-background/60 hover:text-accent transition-colors">Profile</Link></li>
              <li><Link href="/register" className="text-sm text-background/60 hover:text-accent transition-colors">Create Account</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-xs font-bold text-background uppercase tracking-[0.2em] mb-5">Community</h3>
            <ul className="space-y-3">
              <li><Link href="/safety" className="text-sm text-background/60 hover:text-accent transition-colors">Safety & Trust</Link></li>
              <li><Link href="/terms" className="text-sm text-background/60 hover:text-accent transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-sm text-background/60 hover:text-accent transition-colors">Privacy Policy</Link></li>
              <li><Link href="/refund-policy" className="text-sm text-background/60 hover:text-accent transition-colors">Refund Policy</Link></li>
              <li><a href="mailto:scentresort@icloud.com" className="text-sm text-background/60 hover:text-accent transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-background/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <p className="text-xs text-background/40 uppercase tracking-[0.15em]">
            &copy; {year} ScentResort. All rights reserved.
          </p>
          <p className="text-xs text-background/40 uppercase tracking-[0.15em]">
            Made for fragrance enthusiasts everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
}

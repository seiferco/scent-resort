'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function WheelPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight">
          Mystery Wheel
        </h1>
        <p className="mt-4 text-lg text-foreground-secondary">
          Coming Soon
        </p>
        <p className="mt-2 text-foreground-muted">
          Spin for a chance to win luxury fragrances, samples, and more. Stay tuned!
        </p>
        <Link
          href="/listings"
          className="mt-8 inline-block border border-border px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors"
        >
          Browse Listings
        </Link>
      </motion.div>
    </div>
  );
}

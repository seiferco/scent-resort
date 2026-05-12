'use client';

import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { ListingCard } from './ListingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Listing } from '@scentresort/shared';

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } },
};

export function ListingGrid({ listings }: { listings: Listing[] }) {
  if (listings.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No listings found"
        description="Try adjusting your filters or check back later."
      />
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8"
    >
      {listings.map((listing) => (
        <motion.div key={listing.id} variants={fadeUp}>
          <ListingCard listing={listing} />
        </motion.div>
      ))}
    </motion.div>
  );
}

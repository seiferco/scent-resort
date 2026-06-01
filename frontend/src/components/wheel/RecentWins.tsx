'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

interface RecentSpin {
  id: string;
  userDisplayName: string;
  prizeName: string;
  prizeValue: number;
  createdAt: any;
}

export function RecentWins() {
  const [spins, setSpins] = useState<RecentSpin[]>([]);

  useEffect(() => {
    api.get<{ spins: RecentSpin[] }>('/wheel/spins/recent')
      .then((data) => setSpins(data.spins))
      .catch(() => {});
  }, []);

  if (spins.length === 0) return null;

  return (
    <div className="border border-border p-4">
      <h3 className="font-display text-sm font-bold uppercase tracking-[0.05em] text-foreground-secondary mb-3">
        Recent Wins
      </h3>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        <AnimatePresence>
          {spins.slice(0, 10).map((spin) => (
            <motion.div
              key={spin.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0"
            >
              <span className="text-foreground-secondary">
                <span className="font-medium text-foreground">{spin.userDisplayName}</span> won{' '}
                <span className="font-medium text-accent">{spin.prizeName}</span>
              </span>
              <span className="text-xs text-foreground-muted">
                ${(spin.prizeValue / 100).toFixed(0)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';

interface BadgeCounts {
  offers: number;
  messages: number;
  orders: number;
}

const POLL_INTERVAL = 30_000; // 30 seconds

export function useBadgeCounts() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<BadgeCounts>({ offers: 0, messages: 0, orders: 0 });

  const refresh = useCallback(() => {
    if (!user) return;
    api.get<BadgeCounts>('/badges')
      .then(setCounts)
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCounts({ offers: 0, messages: 0, orders: 0 });
      return;
    }

    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [user, refresh]);

  return counts;
}

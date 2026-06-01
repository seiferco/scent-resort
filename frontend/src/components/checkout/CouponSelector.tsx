'use client';

import { useEffect, useState } from 'react';
import { Tag, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { UserCoupon } from '@scentresort/shared';

interface Props {
  onSelect: (couponIds: string[], totalDiscount: number) => void;
  maxDiscount: number; // platform fee cap in cents
}

export function CouponSelector({ onSelect, maxDiscount }: Props) {
  const [coupons, setCoupons] = useState<(UserCoupon & { id: string })[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ coupons: (UserCoupon & { id: string })[] }>('/coupons')
      .then((data) => setCoupons(data.coupons))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function toggle(id: string, amount: number) {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);

    // Calculate total discount (capped at maxDiscount)
    let total = 0;
    for (const c of coupons) {
      if (next.has(c.id)) total += c.amountOff;
    }
    total = Math.min(total, maxDiscount);
    onSelect(Array.from(next), total);
  }

  if (loading || coupons.length === 0) return null;

  return (
    <div className="border border-border p-4">
      <h3 className="text-xs font-bold text-foreground uppercase tracking-[0.15em] mb-3 flex items-center gap-1.5">
        <Tag className="h-3.5 w-3.5" />
        Your Coupons
      </h3>
      <div className="space-y-2">
        {coupons.map((coupon) => {
          const isSelected = selected.has(coupon.id);
          const expiresDate = new Date(coupon.expiresAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });

          return (
            <button
              key={coupon.id}
              onClick={() => toggle(coupon.id, coupon.amountOff)}
              className={`w-full flex items-center gap-3 p-3 border text-left transition-colors ${
                isSelected
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-foreground/30'
              }`}
            >
              <div
                className={`h-5 w-5 border-2 flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'border-accent bg-accent' : 'border-foreground/30'
                }`}
              >
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {coupon.description}
                </p>
                <p className="text-xs text-foreground-muted">
                  {coupon.type === 'free_shipping' ? 'Free shipping' : 'Site credit'} · Expires {expiresDate}
                </p>
              </div>
              <span className="text-sm font-bold text-accent flex-shrink-0">
                -{formatPrice(Math.min(coupon.amountOff, maxDiscount))}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-foreground-muted mt-2">
        Coupons discount the 10% service fee, not the item price. The seller always receives their full payout.
      </p>
    </div>
  );
}

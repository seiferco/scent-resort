'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, ShoppingBag } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/lib/utils';
import type { Order, OrderStatus } from '@scentresort/shared';

type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'error' | 'muted';

const statusConfig: Record<OrderStatus, { label: string; variant: BadgeVariant }> = {
  pending_payment: { label: 'Pending Payment', variant: 'muted' },
  paid: { label: 'Paid', variant: 'accent' },
  shipped: { label: 'Shipped', variant: 'warning' },
  delivered: { label: 'Delivered', variant: 'default' },
  completed: { label: 'Completed', variant: 'success' },
  disputed: { label: 'Disputed', variant: 'error' },
  refunded: { label: 'Refunded', variant: 'muted' },
  cancelled: { label: 'Cancelled', variant: 'muted' },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } },
};

function OrdersContent() {
  const [tab, setTab] = useState<'buyer' | 'seller'>('buyer');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<{ orders: Order[] }>(`/orders?role=${tab}`)
      .then((res) => setOrders(res.orders))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground uppercase tracking-tight">
          Orders
        </h1>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 border-b border-border">
          {(['buyer', 'seller'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] transition-colors ${
                tab === t
                  ? 'text-foreground border-b-2 border-foreground'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              {t === 'buyer' ? 'Purchases' : 'Sales'}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="mt-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={tab === 'buyer' ? ShoppingBag : Package}
              title={tab === 'buyer' ? 'No purchases yet' : 'No sales yet'}
              description={
                tab === 'buyer'
                  ? 'When you buy a fragrance, it will appear here.'
                  : 'When someone buys your listing, it will appear here.'
              }
            >
              <Link href="/listings">
                <Button size="sm">Browse Listings</Button>
              </Link>
            </EmptyState>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => {
                const config = statusConfig[order.status];
                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex items-center gap-4 border border-border p-3 sm:p-4 hover:border-foreground transition-colors"
                  >
                    {order.listingImage ? (
                      <img
                        src={order.listingImage}
                        alt={order.listingTitle}
                        className="h-16 w-16 object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-border/50 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{order.listingTitle}</p>
                      <p className="text-sm text-foreground-secondary">
                        {tab === 'buyer' ? `Seller: ${order.sellerDisplayName}` : `Buyer: ${order.buyerDisplayName}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-display font-bold text-foreground">{formatPrice(order.amount)}</p>
                      <Badge variant={config.variant} className="mt-1">{config.label}</Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersContent />
    </ProtectedRoute>
  );
}

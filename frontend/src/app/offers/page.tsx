'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Tag, ShoppingBag, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice, formatDate } from '@/lib/utils';
import type { Offer, OfferStatus } from '@scentresort/shared';

type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'error' | 'muted';

const statusConfig: Record<OfferStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Pending', variant: 'warning' },
  accepted: { label: 'Accepted', variant: 'success' },
  declined: { label: 'Declined', variant: 'muted' },
  expired: { label: 'Expired', variant: 'muted' },
  withdrawn: { label: 'Withdrawn', variant: 'muted' },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } },
};

function OffersContent() {
  const [tab, setTab] = useState<'seller' | 'buyer'>('seller');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get<{ offers: Offer[] }>(`/offers?role=${tab}`)
      .then((res) => setOffers(res.offers))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab]);

  async function handleAction(offerId: string, action: 'accept' | 'decline' | 'withdraw') {
    setActionLoading(offerId);
    try {
      await api.post(`/offers/${offerId}/${action}`);
      // Refresh
      const res = await api.get<{ offers: Offer[] }>(`/offers?role=${tab}`);
      setOffers(res.offers);
    } catch (err: any) {
      alert(err.message || `Failed to ${action} offer`);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground uppercase tracking-tight">
          Offers
        </h1>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 border-b border-border">
          {(['seller', 'buyer'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] transition-colors ${
                tab === t
                  ? 'text-foreground border-b-2 border-foreground'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              {t === 'seller' ? 'Received' : 'Sent'}
            </button>
          ))}
        </div>

        {/* Offers List */}
        <div className="mt-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : offers.length === 0 ? (
            <EmptyState
              icon={tab === 'seller' ? Tag : ShoppingBag}
              title={tab === 'seller' ? 'No offers received' : 'No offers sent'}
              description={
                tab === 'seller'
                  ? 'When a buyer is interested in your listing, their offer will appear here.'
                  : 'When you make an offer on a listing, it will appear here.'
              }
            >
              <Link href="/listings">
                <Button size="sm">Browse Listings</Button>
              </Link>
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => {
                const config = statusConfig[offer.status];
                return (
                  <div key={offer.id} className="border border-border p-4">
                    <div className="flex items-start gap-4">
                      <Link href={`/listings/${offer.listingId}`} className="flex-shrink-0">
                        {offer.listingImage ? (
                          <img src={offer.listingImage} alt={offer.listingTitle} className="h-16 w-16 object-cover" />
                        ) : (
                          <div className="h-16 w-16 bg-border/50" />
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/listings/${offer.listingId}`} className="font-medium text-foreground hover:text-accent transition-colors truncate block">
                          {offer.listingTitle}
                        </Link>
                        <p className="text-sm text-foreground-secondary mt-0.5">
                          {tab === 'seller' ? (
                            <>From: <Link href={`/users/${offer.buyerId}`} className="text-accent hover:opacity-70">{offer.buyerDisplayName}</Link></>
                          ) : (
                            <>To: <Link href={`/users/${offer.sellerId}`} className="text-accent hover:opacity-70">{offer.sellerDisplayName}</Link></>
                          )}
                        </p>
                        {offer.message && (
                          <p className="text-sm text-foreground-secondary mt-1 italic">&ldquo;{offer.message}&rdquo;</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-display font-bold text-foreground">{formatPrice(offer.amount)}</p>
                        <Badge variant={config.variant} className="mt-1">{config.label}</Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    {offer.status === 'pending' && tab === 'seller' && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 gap-1"
                          loading={actionLoading === offer.id}
                          onClick={() => handleAction(offer.id, 'accept')}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Accept
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 gap-1"
                          loading={actionLoading === offer.id}
                          onClick={() => handleAction(offer.id, 'decline')}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Decline
                        </Button>
                      </div>
                    )}

                    {offer.status === 'pending' && tab === 'buyer' && (
                      <div className="mt-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full gap-1 text-red-500 hover:text-red-400"
                          loading={actionLoading === offer.id}
                          onClick={() => handleAction(offer.id, 'withdraw')}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Withdraw Offer
                        </Button>
                      </div>
                    )}

                    {offer.status === 'accepted' && tab === 'buyer' && !offer.orderId && (
                      <div className="mt-3">
                        <Link href={`/checkout/${offer.listingId}`}>
                          <Button size="sm" className="w-full gap-1">
                            <ShoppingBag className="h-3.5 w-3.5" />
                            Proceed to Checkout
                          </Button>
                        </Link>
                      </div>
                    )}

                    {offer.status === 'accepted' && offer.orderId && (
                      <div className="mt-3">
                        <Link href={`/orders/${offer.orderId}`}>
                          <Button variant="secondary" size="sm" className="w-full gap-1">
                            <ShoppingBag className="h-3.5 w-3.5" />
                            View Order
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function OffersPage() {
  return (
    <ProtectedRoute>
      <OffersContent />
    </ProtectedRoute>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Flag, CheckCircle, Trash2, Ban } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/lib/utils';
import type { Listing } from '@scentresort/shared';

function AdminContent() {
  const [flaggedListings, setFlaggedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ listings: Listing[] }>('/admin/flagged-listings')
      .then((res) => setFlaggedListings(res.listings))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleListingAction(listingId: string, action: 'reinstate' | 'remove') {
    try {
      await api.post(`/admin/listings/${listingId}/${action}`);
      setFlaggedListings((prev) => prev.filter((l) => l.id !== listingId));
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleBan(sellerId: string) {
    const reason = prompt('Reason for ban:');
    if (!reason || reason.length < 5) return;
    try {
      await api.post(`/admin/users/${sellerId}/ban`, { reason });
      alert('Seller banned.');
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-accent/10">
            <Shield className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-tight">Admin</h1>
            <p className="text-sm text-foreground-secondary">Moderation and community safety</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border border-border p-4">
            <div className="flex items-center gap-2 mb-1">
              <Flag className="h-4 w-4 text-accent" />
              <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">Flagged</span>
            </div>
            <p className="text-3xl font-display font-bold text-foreground">{flaggedListings.length}</p>
          </div>
        </div>

        {/* Flagged listings */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-foreground uppercase tracking-[0.05em]">
            Flagged Listings
          </h2>

          {loading ? (
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : flaggedListings.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="All clear"
              description="No flagged listings to review."
              className="mt-4"
            />
          ) : (
            <div className="mt-4 space-y-3">
              {flaggedListings.map((listing) => (
                <div
                  key={listing.id}
                  className="border border-accent/30 p-4 sm:p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {listing.images[0] && (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="h-16 w-16 object-cover flex-shrink-0 border border-border"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{listing.title}</p>
                        <p className="text-sm text-foreground-secondary mt-0.5">
                          {listing.brand} &middot; {formatPrice(listing.price)} &middot; {listing.sellerDisplayName}
                        </p>
                        <Badge variant="error" className="mt-2">
                          {listing.flagCount} flag{listing.flagCount !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleListingAction(listing.id, 'reinstate')}
                        className="gap-1.5"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Reinstate
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleListingAction(listing.id, 'remove')}
                        className="gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleBan(listing.sellerId)}
                        className="gap-1.5 text-accent hover:text-accent"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        Ban
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </motion.div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute requireRole="admin">
      <AdminContent />
    </ProtectedRoute>
  );
}

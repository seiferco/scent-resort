'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Flag, CheckCircle, Trash2, Ban, Clock, XCircle, Eye, Disc, Truck, DollarSign } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/lib/utils';
import type { Listing } from '@scentresort/shared';

interface WheelSpin {
  id: string;
  userId: string;
  userDisplayName: string;
  prizeName: string;
  prizeType: string;
  prizeValue: number;
  status: string;
  shippingAddress?: { fullName: string; line1: string; line2?: string; city: string; state: string; postalCode: string; country: string };
  trackingNumber?: string;
  createdAt: any;
}

interface WheelStats {
  totalSpins: number;
  paidSpins: number;
  revenue: number;
  pendingFulfillment: number;
}

function AdminContent() {
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [flaggedListings, setFlaggedListings] = useState<Listing[]>([]);
  const [wheelSpins, setWheelSpins] = useState<WheelSpin[]>([]);
  const [wheelStats, setWheelStats] = useState<WheelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [shippingSpinId, setShippingSpinId] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingCarrier, setTrackingCarrier] = useState('');

  useEffect(() => {
    let done = 0;
    const checkDone = () => { done++; if (done === 3) setLoading(false); };

    api.get<{ listings: Listing[] }>('/admin/pending-listings')
      .then((res) => setPendingListings(res.listings))
      .catch(console.error)
      .finally(checkDone);

    api.get<{ listings: Listing[] }>('/admin/flagged-listings')
      .then((res) => setFlaggedListings(res.listings))
      .catch(console.error)
      .finally(checkDone);

    api.get<{ spins: WheelSpin[]; stats: WheelStats }>('/admin/wheel/spins')
      .then((res) => { setWheelSpins(res.spins); setWheelStats(res.stats); })
      .catch(console.error)
      .finally(checkDone);
  }, []);

  async function handleApprove(listingId: string) {
    setActionLoading(listingId);
    try {
      await api.post(`/admin/listings/${listingId}/approve`);
      setPendingListings((prev) => prev.filter((l) => l.id !== listingId));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(listingId: string) {
    if (rejectReason.length < 5) {
      alert('Please provide a reason (at least 5 characters).');
      return;
    }
    setActionLoading(listingId);
    try {
      await api.post(`/admin/listings/${listingId}/reject`, { reason: rejectReason });
      setPendingListings((prev) => prev.filter((l) => l.id !== listingId));
      setRejectingId(null);
      setRejectReason('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  }

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

  async function handleShipPrize(spinId: string) {
    if (!trackingNumber) {
      alert('Enter a tracking number');
      return;
    }
    setActionLoading(spinId);
    try {
      await api.post(`/admin/wheel/spins/${spinId}/ship`, {
        trackingNumber,
        trackingCarrier,
      });
      setWheelSpins((prev) =>
        prev.map((s) => s.id === spinId ? { ...s, status: 'fulfilled', trackingNumber } : s)
      );
      setShippingSpinId(null);
      setTrackingNumber('');
      setTrackingCarrier('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
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
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="border border-border p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-accent" />
              <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">Pending Review</span>
            </div>
            <p className="text-3xl font-display font-bold text-foreground">{pendingListings.length}</p>
          </div>
          <div className="border border-border p-4">
            <div className="flex items-center gap-2 mb-1">
              <Flag className="h-4 w-4 text-accent" />
              <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">Flagged</span>
            </div>
            <p className="text-3xl font-display font-bold text-foreground">{flaggedListings.length}</p>
          </div>
        </div>

        {/* Pending Review */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-foreground uppercase tracking-[0.05em]">
            Pending Review
          </h2>

          {loading ? (
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : pendingListings.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="No pending listings"
              description="All listings have been reviewed."
              className="mt-4"
            />
          ) : (
            <div className="mt-4 space-y-3">
              {pendingListings.map((listing) => (
                <div key={listing.id} className="border border-border p-4 sm:p-5">
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
                          {listing.brand} &middot; {listing.fragranceName} &middot; {listing.size}
                        </p>
                        <p className="text-sm text-foreground-secondary mt-0.5">
                          {formatPrice(listing.price)} &middot; by {listing.sellerDisplayName}
                        </p>
                        <p className="text-xs text-foreground-muted mt-1 line-clamp-2">
                          {listing.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-shrink-0">
                      <Link href={`/listings/${listing.id}`} target="_blank">
                        <Button size="sm" variant="secondary" className="w-full gap-1.5">
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(listing.id)}
                        loading={actionLoading === listing.id}
                        className="gap-1.5"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                      {rejectingId === listing.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection..."
                            className="w-full min-w-[200px] border border-border bg-background text-sm text-foreground p-2 resize-none h-20 focus:outline-none focus:border-foreground"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleReject(listing.id)}
                              loading={actionLoading === listing.id}
                              className="flex-1 gap-1.5"
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => { setRejectingId(null); setRejectReason(''); }}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setRejectingId(listing.id)}
                          className="gap-1.5"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

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

        {/* Mystery Wheel Fulfillment */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-foreground uppercase tracking-[0.05em] flex items-center gap-2">
            <Disc className="h-5 w-5" />
            Mystery Wheel
          </h2>

          {wheelStats && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="border border-border p-3">
                <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">Total Spins</span>
                <p className="text-2xl font-display font-bold text-foreground">{wheelStats.totalSpins}</p>
              </div>
              <div className="border border-border p-3">
                <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">Paid Spins</span>
                <p className="text-2xl font-display font-bold text-foreground">{wheelStats.paidSpins}</p>
              </div>
              <div className="border border-border p-3">
                <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">Revenue</span>
                <p className="text-2xl font-display font-bold text-foreground">{formatPrice(wheelStats.revenue)}</p>
              </div>
              <div className="border border-border p-3">
                <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">Pending Ship</span>
                <p className="text-2xl font-display font-bold text-accent">{wheelStats.pendingFulfillment}</p>
              </div>
            </div>
          )}

          {wheelSpins.filter((s) => s.status === 'prize_shipped').length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3">
                Awaiting Shipment
              </h3>
              <div className="space-y-3">
                {wheelSpins
                  .filter((s) => s.status === 'prize_shipped')
                  .map((spin) => (
                    <div key={spin.id} className="border border-accent/30 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground">{spin.prizeName}</p>
                          <p className="text-sm text-foreground-secondary">
                            Won by <span className="font-medium">{spin.userDisplayName}</span> &middot; {formatPrice(spin.prizeValue)} value
                          </p>
                          {spin.shippingAddress && (
                            <div className="mt-2 text-xs text-foreground-muted">
                              <p>{spin.shippingAddress.fullName}</p>
                              <p>{spin.shippingAddress.line1}{spin.shippingAddress.line2 ? `, ${spin.shippingAddress.line2}` : ''}</p>
                              <p>{spin.shippingAddress.city}, {spin.shippingAddress.state} {spin.shippingAddress.postalCode}</p>
                            </div>
                          )}
                        </div>
                        <div className="sm:flex-shrink-0">
                          {shippingSpinId === spin.id ? (
                            <div className="space-y-2 min-w-[200px]">
                              <input
                                type="text"
                                placeholder="Tracking number"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                className="w-full border border-border bg-background text-sm p-2 focus:outline-none focus:border-foreground"
                              />
                              <input
                                type="text"
                                placeholder="Carrier (optional)"
                                value={trackingCarrier}
                                onChange={(e) => setTrackingCarrier(e.target.value)}
                                className="w-full border border-border bg-background text-sm p-2 focus:outline-none focus:border-foreground"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleShipPrize(spin.id)}
                                  loading={actionLoading === spin.id}
                                  className="flex-1 gap-1.5"
                                >
                                  <Truck className="h-3.5 w-3.5" />
                                  Ship
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => { setShippingSpinId(null); setTrackingNumber(''); setTrackingCarrier(''); }}
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => setShippingSpinId(spin.id)}
                              className="gap-1.5"
                            >
                              <Truck className="h-3.5 w-3.5" />
                              Mark Shipped
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {wheelSpins.filter((s) => s.status === 'fulfilled').length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-bold text-foreground-secondary uppercase tracking-wide mb-3">
                Recently Fulfilled
              </h3>
              <div className="space-y-2">
                {wheelSpins
                  .filter((s) => s.status === 'fulfilled')
                  .slice(0, 10)
                  .map((spin) => (
                    <div key={spin.id} className="border border-border p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{spin.prizeName}</p>
                        <p className="text-xs text-foreground-muted">
                          {spin.userDisplayName} {spin.trackingNumber ? `· ${spin.trackingNumber}` : ''}
                        </p>
                      </div>
                      <Badge variant="success">Shipped</Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {!loading && wheelSpins.length === 0 && (
            <EmptyState
              icon={Disc}
              title="No spins yet"
              description="Wheel spins will appear here when users start playing."
              className="mt-4"
            />
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

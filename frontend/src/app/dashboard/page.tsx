'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageCircle, Package, TrendingUp, Tag, Clock, X, Trash2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getFirebaseAuth } from '@/lib/firebase';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/lib/utils';
import type { Listing, ListingCondition } from '@scentresort/shared';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } },
};

const conditionLabels: Record<ListingCondition, string> = {
  new_sealed: 'New (Sealed)',
  new_open_box: 'New (Open Box)',
  lightly_used: 'Lightly Used',
  partially_used: 'Partially Used',
};

function statusBadgeVariant(status: string) {
  if (status === 'active') return 'accent' as const;
  if (status === 'pending_review') return 'warning' as const;
  if (status === 'rejected') return 'error' as const;
  if (status === 'sold') return 'success' as const;
  return 'muted' as const;
}

function statusLabel(status: string) {
  if (status === 'pending_review') return 'In Review';
  return status;
}

function DashboardContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const justSubmitted = searchParams.get('submitted') === '1';
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [pendingOffers, setPendingOffers] = useState<number | null>(null);
  const [previewListing, setPreviewListing] = useState<Listing | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ listings: Listing[] }>('/listings/mine')
      .then((res) => setListings(res.listings))
      .catch(console.error)
      .finally(() => setLoading(false));

    api.get<{ offers: any[] }>('/offers?role=seller')
      .then((res) => setPendingOffers(res.offers.filter((o) => o.status === 'pending').length))
      .catch(console.error);

    const db = getFirestore(getFirebaseAuth().app);
    const q = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', user.uid),
    );
    getDocs(q)
      .then((snapshot) => {
        let count = 0;
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const isBuyer = user.uid === data.buyerId;
          if (isBuyer ? data.buyerUnread : data.sellerUnread) count++;
        });
        setUnreadCount(count);
      })
      .catch(console.error);
  }, [user]);

  async function handleCancelListing(listingId: string) {
    setCancellingId(listingId);
    try {
      await api.delete(`/listings/${listingId}`);
      setListings((prev) => prev.filter((l) => l.id !== listingId));
      setPreviewListing(null);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel listing');
    } finally {
      setCancellingId(null);
    }
  }

  if (!user) return null;

  const activeCount = listings.filter((l) => l.status === 'active').length;
  const soldCount = listings.filter((l) => l.status === 'sold').length;
  const pendingReviewCount = listings.filter((l) => l.status === 'pending_review').length;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Welcome */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Avatar src={user.photoURL} name={user.displayName} size="lg" />
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-foreground-secondary">
              {user.displayName}
            </p>
          </div>
        </div>
        <Link href="/listings/create" className="hidden sm:block">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Listing
          </Button>
        </Link>
      </motion.div>

      {/* Submitted banner */}
      {justSubmitted && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mt-6">
          <div className="border border-accent/30 bg-accent/5 p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Listing submitted for review</p>
              <p className="text-sm text-foreground-secondary mt-0.5">
                Your listing is being reviewed by our team. You&apos;ll see it go live once approved.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4"
      >
        {[
          { label: 'Active', value: activeCount, icon: Package, href: '' },
          { label: 'In Review', value: pendingReviewCount, icon: Clock, href: '' },
          { label: 'Sold', value: soldCount, icon: TrendingUp, href: '' },
          { label: 'Offers', value: pendingOffers ?? '--', icon: Tag, href: '/offers' },
          { label: 'Unread', value: unreadCount ?? '--', icon: MessageCircle, href: '/messages' },
        ].map((stat) => {
          const content = (
            <>
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className="h-4 w-4 text-accent" />
                <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">
                  {stat.label}
                </span>
              </div>
              <p className="text-3xl font-display font-bold text-foreground">{stat.value}</p>
            </>
          );
          const cls = "border border-border p-4 sm:p-5 hover:border-foreground transition-colors";
          return stat.href ? (
            <Link key={stat.label} href={stat.href} className={cls}>{content}</Link>
          ) : (
            <div key={stat.label} className={cls}>{content}</div>
          );
        })}
      </motion.div>

      {/* Mobile new listing button */}
      <div className="mt-4 sm:hidden">
        <Link href="/listings/create">
          <Button className="w-full gap-2">
            <Plus className="h-4 w-4" />
            New Listing
          </Button>
        </Link>
      </div>

      {/* Listings */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mt-10">
        <h2 className="font-display text-xl font-bold text-foreground uppercase tracking-[0.05em] mb-4">Your Listings</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No listings yet"
            description="Start selling by creating your first listing."
          >
            <Link href="/listings/create">
              <Button size="sm" className="gap-2">
                <Plus className="h-3.5 w-3.5" />
                Create Listing
              </Button>
            </Link>
          </EmptyState>
        ) : (
          <div className="space-y-2">
            {listings.map((listing) => {
              const isNonPublic = listing.status === 'pending_review' || listing.status === 'rejected';
              const card = (
                <div className="flex items-center gap-4 border border-border p-3 sm:p-4 hover:border-foreground transition-colors cursor-pointer">
                  {listing.images[0] ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="h-14 w-14 sm:h-16 sm:w-16 object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-14 sm:h-16 sm:w-16 bg-border/50 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{listing.title}</p>
                    <p className="text-sm text-foreground-secondary">
                      {listing.brand} &middot; {formatPrice(listing.price)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Badge variant={statusBadgeVariant(listing.status)}>
                      {statusLabel(listing.status)}
                    </Badge>
                    {listing.status === 'rejected' && listing.rejectionReason && (
                      <p className="text-xs text-red-500 mt-1 max-w-[150px] text-right">
                        {listing.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              );

              if (isNonPublic) {
                return (
                  <div key={listing.id} onClick={() => setPreviewListing(listing)}>
                    {card}
                  </div>
                );
              }

              return (
                <Link key={listing.id} href={`/listings/${listing.id}`}>
                  {card}
                </Link>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewListing && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewListing(null)}
              className="fixed inset-0 z-50 bg-foreground/60"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 bg-background border border-border sm:max-w-lg sm:w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-foreground uppercase tracking-tight">Listing Preview</h3>
                  <Badge variant={statusBadgeVariant(previewListing.status)}>
                    {statusLabel(previewListing.status)}
                  </Badge>
                </div>
                <button onClick={() => setPreviewListing(null)} className="hover:opacity-70">
                  <X className="h-5 w-5 text-foreground-secondary" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Images */}
                {previewListing.images.length > 0 && (
                  <div className="space-y-2">
                    <img
                      src={previewListing.images[0]}
                      alt={previewListing.title}
                      className="w-full aspect-square object-cover"
                    />
                    {previewListing.images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto">
                        {previewListing.images.slice(1).map((img, i) => (
                          <img key={i} src={img} alt="" className="h-20 w-20 object-cover flex-shrink-0" />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Details */}
                <div>
                  <h4 className="font-display text-xl font-bold text-foreground">{previewListing.title}</h4>
                  <p className="text-2xl font-display font-bold text-foreground mt-1">{formatPrice(previewListing.price)}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">Brand</span>
                    <p className="text-foreground mt-0.5">{previewListing.brand}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">Fragrance</span>
                    <p className="text-foreground mt-0.5">{previewListing.fragranceName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">Size</span>
                    <p className="text-foreground mt-0.5">{previewListing.size}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">Condition</span>
                    <p className="text-foreground mt-0.5">{conditionLabels[previewListing.condition]}</p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">Description</span>
                  <p className="text-sm text-foreground-secondary mt-1 whitespace-pre-wrap">{previewListing.description}</p>
                </div>

                {/* Rejection reason */}
                {previewListing.status === 'rejected' && previewListing.rejectionReason && (
                  <div className="border border-red-500/30 bg-red-500/5 p-3">
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em]">Rejection Reason</span>
                    <p className="text-sm text-foreground mt-1">{previewListing.rejectionReason}</p>
                  </div>
                )}

                {/* Cancel button */}
                {(previewListing.status === 'pending_review' || previewListing.status === 'rejected') && (
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full gap-2"
                    loading={cancellingId === previewListing.id}
                    onClick={() => handleCancelListing(previewListing.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Cancel Listing
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

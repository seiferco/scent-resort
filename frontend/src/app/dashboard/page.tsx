'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, MessageCircle, Package, TrendingUp } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/lib/utils';
import type { Listing } from '@scentresort/shared';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } },
};

function DashboardContent() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ listings: Listing[] }>('/listings')
      .then((res) => {
        setListings(res.listings.filter((l) => l.sellerId === user.uid));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const activeCount = listings.filter((l) => l.status === 'active').length;
  const soldCount = listings.filter((l) => l.status === 'sold').length;

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

      {/* Stats */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mt-8 grid grid-cols-3 gap-3 sm:gap-4"
      >
        {[
          { label: 'Active', value: activeCount, icon: Package, href: '' },
          { label: 'Sold', value: soldCount, icon: TrendingUp, href: '' },
          { label: 'Messages', value: '--', icon: MessageCircle, href: '/messages' },
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
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="flex items-center gap-4 border border-border p-3 sm:p-4 hover:border-foreground transition-colors"
              >
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
                <Badge variant={listing.status === 'active' ? 'accent' : 'muted'}>
                  {listing.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
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

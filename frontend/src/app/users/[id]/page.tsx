'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, Calendar, CreditCard, Package, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { ListingCard } from '@/components/listings/ListingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import type { Listing } from '@scentresort/shared';

interface PublicUser {
  uid: string;
  displayName: string;
  photoURL: string | null;
  bio: string;
  location: string;
  preferredPayment: string;
  createdAt: string;
}

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [soldListings, setSoldListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active');

  useEffect(() => {
    async function load() {
      try {
        const userData = await api.get<{ user: PublicUser }>(`/users/${id}`);
        setProfile(userData.user);
      } catch (err) {
        console.error('Failed to load user profile:', err);
      }
      try {
        const [listingsData, soldData] = await Promise.all([
          api.get<{ listings: Listing[] }>(`/users/${id}/listings`),
          api.get<{ listings: Listing[] }>(`/users/${id}/sold`),
        ]);
        setListings(listingsData.listings);
        setSoldListings(soldData.listings);
      } catch (err) {
        console.error('Failed to load user listings:', err);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start gap-5">
          <Skeleton className="h-20 w-20" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-full max-w-md" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="text-foreground-secondary">User not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
        className="border border-border p-6 sm:p-8"
      >
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <Avatar src={profile.photoURL} name={profile.displayName} size="xl" />
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground uppercase tracking-tight">
              {profile.displayName}
            </h1>

            <div className="mt-2 flex flex-wrap gap-3 text-sm text-foreground-secondary">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Member since {new Date(typeof profile.createdAt === 'object' && '_seconds' in (profile.createdAt as any) ? (profile.createdAt as any)._seconds * 1000 : profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                {listings.length} listing{listings.length !== 1 ? 's' : ''}
              </span>
              {soldListings.length > 0 && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {soldListings.length} sale{soldListings.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {profile.bio && (
              <p className="mt-3 text-foreground-secondary leading-relaxed">{profile.bio}</p>
            )}

            {profile.preferredPayment && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-foreground-secondary">
                <CreditCard className="h-3.5 w-3.5" />
                <span className="font-bold text-foreground">Accepts:</span> {profile.preferredPayment}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Listings tabs */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
        className="mt-10"
      >
        <div className="flex gap-6 border-b border-border mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 text-sm font-bold uppercase tracking-[0.05em] transition-colors ${
              activeTab === 'active'
                ? 'text-foreground border-b-2 border-foreground'
                : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            Listings ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('sold')}
            className={`pb-3 text-sm font-bold uppercase tracking-[0.05em] transition-colors ${
              activeTab === 'sold'
                ? 'text-foreground border-b-2 border-foreground'
                : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            Past Sales ({soldListings.length})
          </button>
        </div>

        {activeTab === 'active' && (
          <>
            {listings.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No active listings"
                description="This seller doesn't have any active listings right now."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'sold' && (
          <>
            {soldListings.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title="No sales yet"
                description="This seller hasn't completed any sales yet."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
                {soldListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Reviews */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
        className="mt-10"
      >
        <ReviewsList sellerId={id} />
      </motion.div>
    </div>
  );
}

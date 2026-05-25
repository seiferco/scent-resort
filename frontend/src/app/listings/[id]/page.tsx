'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageCircle, MapPin, CreditCard, Calendar, ChevronLeft, Pencil, Trash2, ShoppingBag, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';
import { ReportButton } from '@/components/listings/ReportButton';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPrice, formatDate } from '@/lib/utils';
import { Textarea } from '@/components/ui/Input';
import type { Listing, Offer } from '@scentresort/shared';

interface SellerProfile {
  uid: string;
  displayName: string;
  photoURL: string | null;
  location: string;
  preferredPayment: string;
  stripeAccountStatus: string;
  createdAt: string;
}

function conditionLabel(c: string) {
  return c.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [myOffer, setMyOffer] = useState<Offer | null>(null);
  const [offerLoading, setOfferLoading] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerMessage, setOfferMessage] = useState('');
  const [offerSubmitting, setOfferSubmitting] = useState(false);

  useEffect(() => {
    api
      .get<Listing>(`/listings/${id}`)
      .then((data) => {
        setListing(data);
        return api.get<{ user: SellerProfile }>(`/users/${data.sellerId}`);
      })
      .then((res) => setSeller(res.user))
      .catch(() => router.push('/listings'))
      .finally(() => setLoading(false));
  }, [id, router]);

  // Fetch buyer's existing offer on this listing
  useEffect(() => {
    if (!user || !listing || user.uid === listing.sellerId) return;
    api.get<{ offer: Offer | null }>(`/offers/listing/${id}/mine`)
      .then((res) => setMyOffer(res.offer))
      .catch(() => {});
  }, [user, listing, id]);

  async function handleSubmitOffer() {
    setOfferSubmitting(true);
    try {
      await api.post('/offers', { listingId: id, message: offerMessage.trim() });
      // Refresh offer status
      const res = await api.get<{ offer: Offer | null }>(`/offers/listing/${id}/mine`);
      setMyOffer(res.offer);
      setShowOfferForm(false);
      setOfferMessage('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit offer');
    } finally {
      setOfferSubmitting(false);
    }
  }

  async function handleWithdrawOffer() {
    if (!myOffer || !confirm('Withdraw your offer?')) return;
    try {
      await api.post(`/offers/${myOffer.id}/withdraw`);
      setMyOffer(null);
    } catch (err: any) {
      alert(err.message || 'Failed to withdraw offer');
    }
  }

  async function handleMessageSeller() {
    if (!user) {
      router.push('/login');
      return;
    }
    setMessaging(true);
    try {
      const res = await api.post<{ conversationId: string }>('/conversations', {
        listingId: id,
      });
      router.push(`/messages/${res.conversationId}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setMessaging(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3"><Skeleton className="aspect-square" /></div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const isSeller = user?.uid === listing.sellerId;
  const images = listing.images.length > 0 ? listing.images : [];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Back button */}
      <Link
        href="/listings"
        className="inline-flex items-center gap-1 text-xs font-bold text-foreground-secondary hover:text-foreground uppercase tracking-[0.15em] mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to listings
      </Link>

      <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
        {/* Images */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          className="lg:col-span-3"
        >
          {images.length > 0 ? (
            <div className="space-y-3">
              <ImageLightbox
                images={images}
                initialIndex={selectedImage}
                trigger={
                  <div className="aspect-square overflow-hidden bg-border/30 cursor-zoom-in">
                    <img
                      src={images[selectedImage]}
                      alt={listing.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                }
              />
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`flex-shrink-0 h-16 w-16 sm:h-20 sm:w-20 overflow-hidden border-2 transition-colors ${
                        i === selectedImage ? 'border-accent' : 'border-border hover:border-foreground'
                      }`}
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-square bg-border/30 flex items-center justify-center">
              <span className="text-foreground-muted">No images</span>
            </div>
          )}
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Title & price */}
          <div>
            <p className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">
              {listing.brand}
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-tight">
              {listing.title}
            </h1>
            <p className="text-foreground-secondary">{listing.fragranceName}</p>

            <p className="mt-4 font-display text-4xl font-bold text-foreground">
              {formatPrice(listing.price)}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{listing.size}</Badge>
              <Badge>{conditionLabel(listing.condition)}</Badge>
              <Badge variant={listing.status === 'active' ? 'accent' : 'muted'}>
                {listing.status === 'active' ? 'Available' : listing.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>

          {/* CTA */}
          {listing.status === 'active' && !isSeller && (
            <div className="space-y-2">
              {seller?.stripeAccountStatus === 'active' ? (
                <>
                  {myOffer?.status === 'accepted' ? (
                    <>
                      <div className="border border-accent/30 bg-accent/5 p-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                        <p className="text-sm font-medium text-foreground">Offer accepted! Complete your purchase.</p>
                      </div>
                      <Link href={`/checkout/${listing.id}`}>
                        <Button size="lg" className="w-full gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          Proceed to Checkout &mdash; {formatPrice(listing.price)}
                        </Button>
                      </Link>
                    </>
                  ) : myOffer?.status === 'pending' ? (
                    <>
                      <div className="border border-border bg-border/10 p-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-foreground-secondary flex-shrink-0" />
                        <p className="text-sm text-foreground-secondary">Your offer is pending seller approval.</p>
                      </div>
                      <Button
                        variant="secondary"
                        size="lg"
                        className="w-full gap-2 text-red-500 hover:text-red-400"
                        onClick={handleWithdrawOffer}
                      >
                        <XCircle className="h-4 w-4" />
                        Withdraw Offer
                      </Button>
                    </>
                  ) : showOfferForm ? (
                    <div className="border border-border p-4 space-y-3">
                      <h3 className="text-xs font-bold text-foreground uppercase tracking-[0.15em]">Make an Offer</h3>
                      <p className="text-sm text-foreground-secondary">
                        Price: <span className="font-bold text-foreground">{formatPrice(listing.price)}</span>
                      </p>
                      <Textarea
                        id="offerMessage"
                        label="Message (optional)"
                        rows={3}
                        value={offerMessage}
                        onChange={(e) => setOfferMessage(e.target.value)}
                        placeholder="Introduce yourself or ask a question..."
                        maxLength={500}
                      />
                      <div className="flex gap-2">
                        <Button variant="secondary" className="flex-1" onClick={() => setShowOfferForm(false)}>
                          Cancel
                        </Button>
                        <Button className="flex-1 gap-2" loading={offerSubmitting} onClick={handleSubmitOffer}>
                          <Send className="h-4 w-4" />
                          Submit Offer
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="lg" className="w-full gap-2" onClick={() => {
                      if (!user) { router.push('/login'); return; }
                      setShowOfferForm(true);
                    }}>
                      <ShoppingBag className="h-4 w-4" />
                      Make Offer &mdash; {formatPrice(listing.price)}
                    </Button>
                  )}
                </>
              ) : (
                <div className="border border-border py-3 text-center text-xs font-bold text-foreground-muted uppercase tracking-[0.15em]">
                  Seller has not set up payments yet
                </div>
              )}
              <Button
                variant="secondary"
                size="lg"
                loading={messaging}
                onClick={handleMessageSeller}
                className="w-full gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Message Seller
              </Button>
            </div>
          )}

          {(listing.status === 'sold' || listing.status === 'pending_sale') && (
            <div className="border border-border py-3 text-center text-xs font-bold text-foreground-secondary uppercase tracking-[0.15em]">
              {listing.status === 'sold' ? 'This item has been sold' : 'This item is pending sale'}
            </div>
          )}

          {isSeller && listing.status === 'active' && (
            <div className="space-y-2">
              <div className="border border-accent py-3 text-center text-xs font-bold text-accent uppercase tracking-[0.15em]">
                This is your listing
              </div>
              <Link href={`/listings/${id}/edit`}>
                <Button variant="secondary" className="w-full gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit Listing
                </Button>
              </Link>
              <Button
                variant="secondary"
                className="w-full"
                onClick={async () => {
                  if (confirm('Mark this listing as sold?')) {
                    await api.post(`/listings/${id}/mark-sold`);
                    setListing({ ...listing, status: 'sold' });
                  }
                }}
              >
                Mark as Sold
              </Button>
              <Button
                variant="secondary"
                className="w-full gap-2 text-red-500 hover:text-red-400"
                onClick={async () => {
                  if (confirm('Are you sure you want to remove this listing? This cannot be undone.')) {
                    await api.delete(`/listings/${id}`);
                    router.push('/dashboard');
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
                Remove Listing
              </Button>
            </div>
          )}

          {/* Seller card */}
          {seller && (
            <div className="border border-border p-6">
              <div className="flex items-center gap-4">
                <Link href={`/users/${seller.uid}`}>
                  <Avatar src={seller.photoURL} name={seller.displayName} size="lg" />
                </Link>
                <div>
                  <Link
                    href={`/users/${seller.uid}`}
                    className="text-base font-display font-bold text-foreground hover:text-accent transition-colors uppercase tracking-[0.05em]"
                  >
                    {seller.displayName}
                  </Link>
                  {seller.location && (
                    <p className="flex items-center gap-1.5 text-sm text-foreground-secondary mt-0.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {seller.location}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5 text-sm text-foreground-secondary mt-0.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Member since {new Date(seller.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              {seller.preferredPayment && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="flex items-center gap-1.5 text-sm text-foreground-secondary">
                    <CreditCard className="h-4 w-4" />
                    <span className="font-bold">Accepts:</span> {seller.preferredPayment}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h2 className="text-xs font-bold text-foreground uppercase tracking-[0.15em] mb-3">Description</h2>
            <p className="text-base text-foreground-secondary whitespace-pre-wrap leading-relaxed">
              {listing.description}
            </p>
          </div>

          <ReportButton listingId={id} />
        </motion.div>
      </div>
    </div>
  );
}

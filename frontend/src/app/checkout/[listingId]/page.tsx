'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ShieldCheck, Lock } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/lib/api';
import stripePromise from '@/lib/stripe';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPrice } from '@/lib/utils';
import type { Listing } from '@scentresort/shared';

interface CheckoutData {
  orderId: string;
  clientSecret: string;
  amount: number;
  platformFee: number;
  sellerPayout: number;
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } },
};

function PaymentForm({ orderId, amount }: { orderId: string; amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders/${orderId}`,
      },
    });

    if (stripeError) {
      setError(stripeError.message || 'Payment failed');
      setLoading(false);
    }
    // If successful, Stripe redirects to return_url
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <div className="border border-accent p-3 text-sm text-accent font-medium">
          {error}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full gap-2" loading={loading} disabled={!stripe}>
        <Lock className="h-4 w-4" />
        Pay {formatPrice(amount)}
      </Button>

      <p className="text-xs text-foreground-muted text-center">
        Your payment is processed securely by Stripe. Funds are held in escrow
        until you confirm delivery.
      </p>
    </form>
  );
}

function CheckoutContent() {
  const { listingId } = useParams<{ listingId: string }>();
  const router = useRouter();
  const { resendVerificationEmail } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        // Fetch listing details
        const listingData = await api.get<Listing>(`/listings/${listingId}`);
        setListing(listingData);

        // Create checkout session
        const checkoutData = await api.post<CheckoutData>('/orders/checkout', {
          listingId,
        });
        setCheckout(checkoutData);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize checkout');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [listingId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const isEmailError = error.toLowerCase().includes('verify your email');

  if (error || !listing || !checkout) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground uppercase tracking-tight">
          Checkout Error
        </h1>
        <p className="mt-4 text-sm text-foreground-secondary">{error || 'Something went wrong'}</p>
        {isEmailError && (
          <div className="mt-4">
            {verificationSent ? (
              <p className="text-sm text-accent font-medium">Verification email sent! Check your inbox.</p>
            ) : (
              <button
                onClick={async () => {
                  setSendingVerification(true);
                  try {
                    await resendVerificationEmail();
                    setVerificationSent(true);
                  } catch {
                    // silently fail
                  } finally {
                    setSendingVerification(false);
                  }
                }}
                disabled={sendingVerification}
                className="text-sm font-bold text-accent hover:opacity-70 transition-opacity"
              >
                {sendingVerification ? 'Sending...' : 'Resend verification email'}
              </button>
            )}
          </div>
        )}
        <Button variant="secondary" className="mt-6" onClick={() => router.push('/listings')}>
          Back to Listings
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground uppercase tracking-tight mb-8">
          Checkout
        </h1>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Order Summary */}
          <div>
            <h2 className="text-xs font-bold text-foreground uppercase tracking-[0.15em] mb-4">
              Order Summary
            </h2>

            <div className="border border-border p-4 flex gap-4">
              {listing.images[0] ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="h-24 w-24 object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-24 w-24 bg-border/50 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">
                  {listing.brand}
                </p>
                <p className="font-medium text-foreground truncate">{listing.title}</p>
                <p className="text-sm text-foreground-secondary">{listing.fragranceName}</p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="mt-4 border border-border p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-foreground-secondary">Item price</span>
                <span className="text-foreground font-medium">{formatPrice(checkout.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground-secondary">Platform fee (10%)</span>
                <span className="text-foreground-secondary">{formatPrice(checkout.platformFee)}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-bold text-foreground uppercase text-sm tracking-wide">Total</span>
                <span className="font-display text-2xl font-bold text-foreground">
                  {formatPrice(checkout.amount)}
                </span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="mt-4 border border-border p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Buyer Protection</p>
                  <p className="text-xs text-foreground-secondary mt-1">
                    Funds are held in escrow until you confirm delivery.
                    48-hour inspection window to verify authenticity.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <h2 className="text-xs font-bold text-foreground uppercase tracking-[0.15em] mb-4">
              Payment Details
            </h2>

            <div className="border border-border p-6">
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: checkout.clientSecret,
                  appearance: {
                    theme: 'flat',
                    variables: {
                      colorPrimary: '#DB4A2B',
                      colorBackground: '#E4E2DD',
                      colorText: '#1E1E1E',
                      colorDanger: '#DB4A2B',
                      fontFamily: 'Satoshi, system-ui, sans-serif',
                      borderRadius: '0px',
                    },
                  },
                }}
              >
                <PaymentForm orderId={checkout.orderId} amount={checkout.amount} />
              </Elements>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutContent />
    </ProtectedRoute>
  );
}

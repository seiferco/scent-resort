'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/lib/api';
import { isOldEnough } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SpinningWheel } from '@/components/wheel/SpinningWheel';
import { PrizeReveal } from '@/components/wheel/PrizeReveal';
import { RecentWins } from '@/components/wheel/RecentWins';
import type { WheelConfig, WheelPrize, ShippingAddress } from '@scentresort/shared';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function generateClientSeed(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function WheelPage() {
  const { user, refreshUser } = useAuth();
  const [dobInput, setDobInput] = useState('');
  const [dobLoading, setDobLoading] = useState(false);
  const [dobError, setDobError] = useState('');
  const [wheel, setWheel] = useState<WheelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [wonPrize, setWonPrize] = useState<WheelPrize | null>(null);
  const [currentSpinId, setCurrentSpinId] = useState<string | null>(null);
  const [serverSeed, setServerSeed] = useState<string | null>(null);
  const [serverSeedHash, setServerSeedHash] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [freeSpinLoading, setFreeSpinLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // Payment flow state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [spinId, setSpinId] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ wheel: WheelConfig }>('/wheel')
      .then((data) => setWheel(data.wheel))
      .catch(() => setError('Wheel is not available right now'))
      .finally(() => setLoading(false));
  }, []);

  async function handlePaidSpin() {
    if (!user || !wheel) return;
    setError('');

    try {
      const clientSeed = generateClientSeed();
      const result = await api.post<{
        spinId: string;
        clientSecret: string;
        serverSeedHash: string;
      }>('/wheel/spin', { wheelId: wheel.id, clientSeed });

      setSpinId(result.spinId);
      setClientSecret(result.clientSecret);
      setServerSeedHash(result.serverSeedHash);
    } catch (err: any) {
      setError(err.message || 'Failed to initiate spin');
    }
  }

  async function handleFreeSpin() {
    if (!user || !wheel) return;
    setError('');
    setFreeSpinLoading(true);

    try {
      const clientSeed = generateClientSeed();
      const result = await api.post<{
        spinId: string;
        prize: WheelPrize;
        serverSeed: string;
        serverSeedHash: string;
      }>('/wheel/spin/free', { wheelId: wheel.id, clientSeed });

      setServerSeedHash(result.serverSeedHash);
      setCurrentSpinId(result.spinId);

      const prizeIndex = wheel.prizes.findIndex((p) => p.id === result.prize.id);
      setWinningIndex(prizeIndex >= 0 ? prizeIndex : 0);
      setSpinning(true);
      setServerSeed(result.serverSeed);
      setWonPrize(result.prize);
    } catch (err: any) {
      setError(err.message || 'Free spin not available');
    } finally {
      setFreeSpinLoading(false);
    }
  }

  async function handlePaymentSuccess() {
    if (!spinId || !wheel) return;

    try {
      const result = await api.post<{
        prize: WheelPrize;
        serverSeed: string;
      }>(`/wheel/spin/${spinId}/confirm`);

      const prizeIndex = wheel.prizes.findIndex((p) => p.id === result.prize.id);
      setWinningIndex(prizeIndex >= 0 ? prizeIndex : 0);
      setSpinning(true);
      setServerSeed(result.serverSeed);
      setWonPrize(result.prize);
      setCurrentSpinId(spinId);
    } catch (err: any) {
      setError(err.message || 'Failed to confirm spin');
    }

    setClientSecret(null);
    setSpinId(null);
  }

  function handleSpinComplete() {
    setSpinning(false);
  }

  async function handleClaimShip(address: ShippingAddress) {
    if (!currentSpinId) return;
    setClaiming(true);

    try {
      await api.post(`/wheel/spin/${currentSpinId}/claim`, {
        fulfillmentMethod: 'ship',
        shippingAddress: address,
      });
      handlePrizeClose();
    } catch (err: any) {
      setError(err.message || 'Failed to claim prize');
    } finally {
      setClaiming(false);
    }
  }

  async function handleClaimCredit() {
    if (!currentSpinId) return;
    setClaiming(true);

    try {
      await api.post(`/wheel/spin/${currentSpinId}/claim`, {
        fulfillmentMethod: 'credit',
      });
      handlePrizeClose();
    } catch (err: any) {
      setError(err.message || 'Failed to claim credit');
    } finally {
      setClaiming(false);
    }
  }

  function handlePrizeClose() {
    setWonPrize(null);
    setWinningIndex(null);
    setServerSeed(null);
    setServerSeedHash(null);
    setCurrentSpinId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
      </div>
    );
  }

  if (!wheel) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">
          Coming Soon
        </h1>
        <p className="mt-3 text-foreground-secondary">
          The mystery wheel is being set up. Check back soon!
        </p>
      </div>
    );
  }

  // Age gate: prompt for DOB if not set
  if (user && !user.dateOfBirth) {
    async function handleDobSubmit(e: React.FormEvent) {
      e.preventDefault();
      if (!dobInput) return;
      setDobLoading(true);
      setDobError('');
      try {
        await api.put('/auth/profile', { dateOfBirth: dobInput });
        await refreshUser();
      } catch (err: any) {
        setDobError(err.message || 'Failed to save date of birth');
      } finally {
        setDobLoading(false);
      }
    }

    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">
          Age Verification
        </h1>
        <p className="mt-3 text-foreground-secondary">
          You must be 18 or older to use the Mystery Wheel. Please enter your date of birth to continue.
        </p>
        <form onSubmit={handleDobSubmit} className="mt-8 space-y-4">
          <Input
            id="dob"
            type="date"
            label="Date of Birth"
            required
            value={dobInput}
            onChange={(e) => setDobInput(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
          {dobError && (
            <p className="text-sm text-accent font-medium">{dobError}</p>
          )}
          <Button type="submit" loading={dobLoading} className="w-full">
            Continue
          </Button>
        </form>
      </div>
    );
  }

  // Age gate: block underage users
  if (user && !isOldEnough(user.dateOfBirth, 18)) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">
          Age Restricted
        </h1>
        <p className="mt-3 text-foreground-secondary">
          You must be 18 or older to use the Mystery Wheel.
        </p>
        <Link
          href="/listings"
          className="mt-6 inline-block border border-border px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors"
        >
          Browse Listings
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight">
            Mystery Wheel
          </h1>
          <p className="mt-2 text-foreground-secondary">
            Spin for a chance to win luxury fragrances, samples, and more
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Wheel - center */}
          <div className="lg:col-span-2 flex flex-col items-center gap-6">
            <SpinningWheel
              prizes={wheel.prizes}
              winningIndex={winningIndex}
              onSpinComplete={handleSpinComplete}
              spinning={spinning}
            />

            {/* Spin buttons */}
            {!spinning && !clientSecret && (
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                {user ? (
                  <>
                    <button
                      onClick={handlePaidSpin}
                      className="flex-1 bg-foreground text-background py-3 px-6 font-bold text-sm uppercase tracking-wider hover:bg-accent transition-colors"
                    >
                      Spin — $25
                    </button>
                    <button
                      onClick={handleFreeSpin}
                      disabled={freeSpinLoading}
                      className="flex-1 border-2 border-foreground text-foreground py-3 px-6 font-bold text-sm uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                    >
                      {freeSpinLoading ? 'Spinning...' : 'Free Daily Spin'}
                    </button>
                  </>
                ) : (
                  <a
                    href="/login"
                    className="w-full text-center bg-foreground text-background py-3 px-6 font-bold text-sm uppercase tracking-wider hover:bg-accent transition-colors"
                  >
                    Sign In to Spin
                  </a>
                )}
              </div>
            )}

            {error && (
              <div className="text-sm text-accent font-medium bg-accent/5 border border-accent/20 px-4 py-2 max-w-sm w-full text-center">
                {error}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Prize odds */}
            <div className="border border-border p-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-[0.05em] text-foreground-secondary mb-3">
                Prizes & Odds
              </h3>
              <div className="space-y-2">
                {wheel.prizes.map((prize) => {
                  const dot =
                    prize.probability <= 0.01 ? 'bg-[#B8860B]' :
                    prize.probability <= 0.05 ? 'bg-[#7B2D8E]' :
                    prize.probability <= 0.10 ? 'bg-[#2563EB]' :
                    prize.probability <= 0.20 ? 'bg-[#16A34A]' :
                    'bg-[#444444]';
                  return (
                    <div key={prize.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${dot}`} />
                        <span className="text-foreground">{prize.name}</span>
                      </div>
                      <span className="text-foreground-muted">
                        {(prize.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* My Winnings link */}
            {user && (
              <Link
                href="/wheel/winnings"
                className="block text-center border border-border p-3 text-sm font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors"
              >
                My Winnings
              </Link>
            )}

            {/* Recent wins */}
            <RecentWins />

            {/* Legal */}
            <div className="text-xs text-foreground-muted space-y-1 px-1">
              <p>No Purchase Necessary. Free daily spin available.</p>
              <p>Must be 18+ and a US resident to participate.</p>
              <p>All spins are provably fair and verifiable.</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stripe Payment Modal */}
      {clientSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-background border border-border p-6 max-w-md w-full">
            <h3 className="font-display text-lg font-bold uppercase tracking-tight mb-4">
              Complete Payment — $25
            </h3>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm
                onSuccess={handlePaymentSuccess}
                onCancel={() => { setClientSecret(null); setSpinId(null); }}
              />
            </Elements>
          </div>
        </div>
      )}

      {/* Prize reveal modal */}
      {wonPrize && !spinning && (
        <PrizeReveal
          prize={wonPrize}
          spinId={currentSpinId}
          serverSeed={serverSeed}
          serverSeedHash={serverSeedHash}
          onClose={handlePrizeClose}
          onClaimShip={handleClaimShip}
          onClaimCredit={handleClaimCredit}
          claiming={claiming}
        />
      )}
    </div>
  );
}

// Inline payment form component
function PaymentForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setPayError('');

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      setPayError(error.message || 'Payment failed');
      setProcessing(false);
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {payError && (
        <p className="mt-3 text-sm text-accent">{payError}</p>
      )}
      <div className="flex gap-3 mt-4">
        <button
          type="submit"
          disabled={processing || !stripe}
          className="flex-1 bg-foreground text-background py-2.5 px-4 font-bold text-sm uppercase tracking-wider hover:bg-accent transition-colors disabled:opacity-50"
        >
          {processing ? 'Processing...' : 'Pay $25'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 border border-border text-foreground-secondary text-sm hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Gift, Trophy, X, Truck, CreditCard } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/lib/api';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import { ShippingAddressForm } from '@/components/wheel/ShippingAddressForm';
import type { Spin, ShippingAddress } from '@scentresort/shared';

const statusConfig: Record<string, { label: string; className: string }> = {
  pending_payment: { label: 'Pending', className: 'bg-foreground-muted/20 text-foreground-muted' },
  completed: { label: 'Unclaimed', className: 'bg-amber-500/20 text-amber-700' },
  prize_shipped: { label: 'Shipping', className: 'bg-blue-500/20 text-blue-700' },
  prize_credited: { label: 'Credited', className: 'bg-green-500/20 text-green-700' },
  fulfilled: { label: 'Fulfilled', className: 'bg-green-500/20 text-green-700' },
};

export default function WinningsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [spins, setSpins] = useState<Spin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Claim modal state
  const [claimingSpin, setClaimingSpin] = useState<Spin | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!user) return;

    setLoading(true);
    setError('');
    api.get<{ spins: Spin[] }>('/wheel/spins')
      .then((data) => setSpins(data.spins))
      .catch((err) => {
        console.error('Failed to load spins:', err);
        setError('Failed to load spin history. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  async function handleClaimShip(address: ShippingAddress) {
    if (!claimingSpin) return;
    setClaimLoading(true);
    setClaimError('');
    try {
      await api.post(`/wheel/spin/${claimingSpin.id}/claim`, {
        fulfillmentMethod: 'ship',
        shippingAddress: address,
      });
      // Update spin status in local state
      setSpins((prev) =>
        prev.map((s) => s.id === claimingSpin.id ? { ...s, status: 'prize_shipped' as const } : s)
      );
      setClaimingSpin(null);
      setShowAddressForm(false);
    } catch (err: any) {
      setClaimError(err.message || 'Failed to claim prize');
    } finally {
      setClaimLoading(false);
    }
  }

  async function handleClaimCredit() {
    if (!claimingSpin) return;
    setClaimLoading(true);
    setClaimError('');
    try {
      await api.post(`/wheel/spin/${claimingSpin.id}/claim`, {
        fulfillmentMethod: 'credit',
      });
      setSpins((prev) =>
        prev.map((s) => s.id === claimingSpin.id ? { ...s, status: 'prize_credited' as const } : s)
      );
      setClaimingSpin(null);
    } catch (err: any) {
      setClaimError(err.message || 'Failed to claim credit');
    } finally {
      setClaimLoading(false);
    }
  }

  function openClaimModal(spin: Spin) {
    setClaimingSpin(spin);
    setShowAddressForm(false);
    setClaimError('');
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
      </div>
    );
  }

  const isPhysical = (type: string) => type === 'fragrance' || type === 'sample' || type === 'merch';
  const canTakeCredit = (type: string) => type === 'fragrance' || type === 'sample';

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight">
              My Winnings
            </h1>
            <p className="mt-1 text-sm text-foreground-secondary">
              Your mystery wheel spin history
            </p>
          </div>
          <Link
            href="/wheel"
            className="border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors"
          >
            Spin Again
          </Link>
        </div>

        {error && (
          <div className="text-sm text-accent font-medium bg-accent/5 border border-accent/20 px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {!error && spins.length === 0 ? (
          <div className="text-center py-20 border border-border">
            <Trophy className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
            <p className="text-foreground-secondary font-medium">No spins yet</p>
            <p className="text-sm text-foreground-muted mt-1">
              Head to the mystery wheel to try your luck!
            </p>
            <Link
              href="/wheel"
              className="mt-6 inline-block bg-foreground text-background px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-accent transition-colors"
            >
              Spin the Wheel
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {spins.map((spin) => {
              const status = statusConfig[spin.status] || statusConfig.completed;
              return (
                <div
                  key={spin.id}
                  className="border border-border p-4 flex items-center gap-4"
                >
                  <div className="flex-shrink-0 h-10 w-10 bg-foreground/5 flex items-center justify-center">
                    <Gift className="h-5 w-5 text-foreground-secondary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {spin.prizeName}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-foreground-muted">
                      <span>{formatDate(spin.createdAt)}</span>
                      <span>{spin.isFree ? 'Free Spin' : `Paid — ${formatPrice(spin.amountPaid)}`}</span>
                      {spin.trackingNumber && (
                        <span>Tracking: {spin.trackingNumber}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {spin.prizeValue > 0 && (
                      <span className="text-sm font-bold text-foreground">
                        {formatPrice(spin.prizeValue)}
                      </span>
                    )}
                    <span className={cn('px-2 py-0.5 text-xs font-bold uppercase tracking-wide rounded-sm', status.className)}>
                      {status.label}
                    </span>
                    {spin.status === 'completed' && (
                      <button
                        onClick={() => openClaimModal(spin)}
                        className="text-xs font-bold text-accent hover:opacity-70 transition-opacity uppercase tracking-wide"
                      >
                        Claim
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Claim Modal */}
      <AnimatePresence>
        {claimingSpin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setClaimingSpin(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-background border border-border p-8 max-w-sm w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setClaimingSpin(null)}
                className="absolute top-4 right-4 text-foreground-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>

              {showAddressForm ? (
                <div>
                  <p className="text-sm text-foreground-secondary mb-4">
                    Ship <span className="font-bold text-foreground">{claimingSpin.prizeName}</span> to:
                  </p>
                  <ShippingAddressForm
                    onSubmit={handleClaimShip}
                    onCancel={() => setShowAddressForm(false)}
                    loading={claimLoading}
                  />
                  {claimError && (
                    <p className="mt-3 text-sm text-accent font-medium">{claimError}</p>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <Gift className="h-10 w-10 mx-auto text-accent mb-3" />
                  <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                    Claim Prize
                  </h2>
                  <p className="text-foreground font-bold mt-2">{claimingSpin.prizeName}</p>
                  {claimingSpin.prizeValue > 0 && (
                    <p className="text-sm text-accent font-bold mt-1">
                      {formatPrice(claimingSpin.prizeValue)} value
                    </p>
                  )}

                  {claimError && (
                    <p className="mt-3 text-sm text-accent font-medium">{claimError}</p>
                  )}

                  {isPhysical(claimingSpin.prizeType) ? (
                    <div className="mt-6 space-y-3">
                      <button
                        onClick={() => setShowAddressForm(true)}
                        className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-3 px-4 font-bold text-sm uppercase tracking-wider hover:bg-accent transition-colors"
                      >
                        <Truck className="h-4 w-4" />
                        Ship to Me
                      </button>

                      {canTakeCredit(claimingSpin.prizeType) && (
                        <button
                          onClick={handleClaimCredit}
                          disabled={claimLoading}
                          className="w-full flex items-center justify-center gap-2 border-2 border-foreground text-foreground py-3 px-4 font-bold text-sm uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                        >
                          <CreditCard className="h-4 w-4" />
                          Take {formatPrice(claimingSpin.prizeValue)} Store Credit
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-6 bg-accent/10 border border-accent/20 px-4 py-3">
                      <p className="text-sm font-medium text-accent">
                        {claimingSpin.prizeType === 'credit'
                          ? `${formatPrice(claimingSpin.prizeValue)} site credit has been added to your account!`
                          : 'Free shipping coupon has been added to your account!'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Truck, CreditCard } from 'lucide-react';
import { ShippingAddressForm } from './ShippingAddressForm';
import type { WheelPrize, ShippingAddress } from '@scentresort/shared';

interface Props {
  prize: WheelPrize | null;
  spinId: string | null;
  serverSeed: string | null;
  serverSeedHash: string | null;
  onClose: () => void;
  onClaimShip: (address: ShippingAddress) => void;
  onClaimCredit: () => void;
  claiming?: boolean;
}

function formatValue(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function PrizeReveal({
  prize,
  spinId,
  serverSeed,
  serverSeedHash,
  onClose,
  onClaimShip,
  onClaimCredit,
  claiming,
}: Props) {
  const [showAddressForm, setShowAddressForm] = useState(false);

  if (!prize) return null;

  const isPhysical = prize.type === 'fragrance' || prize.type === 'sample' || prize.type === 'merch';
  const canTakeCredit = prize.type === 'fragrance' || prize.type === 'sample';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-background border border-border p-8 max-w-sm w-full text-center relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-foreground-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          {showAddressForm ? (
            <div className="text-left">
              <p className="text-sm text-foreground-secondary mb-4">
                Ship <span className="font-bold text-foreground">{prize.name}</span> to:
              </p>
              <ShippingAddressForm
                onSubmit={onClaimShip}
                onCancel={() => setShowAddressForm(false)}
                loading={claiming}
              />
            </div>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                className="mb-4"
              >
                <Gift className="h-12 w-12 mx-auto text-accent" />
              </motion.div>

              <h2 className="font-display text-xl font-bold uppercase tracking-tight mb-1">
                You Won!
              </h2>

              {prize.image && (
                <div className="my-4 aspect-square w-40 mx-auto overflow-hidden border border-border">
                  <img src={prize.image} alt={prize.name} className="w-full h-full object-cover" />
                </div>
              )}

              <p className="text-lg font-bold text-foreground">{prize.name}</p>
              <p className="text-sm text-foreground-secondary mt-1">{prize.description}</p>
              <p className="text-accent font-bold mt-2">{formatValue(prize.value)} value</p>

              {isPhysical ? (
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => setShowAddressForm(true)}
                    disabled={claiming}
                    className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-3 px-4 font-bold text-sm uppercase tracking-wider hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    <Truck className="h-4 w-4" />
                    Ship to Me
                  </button>

                  {canTakeCredit && (
                    <button
                      onClick={onClaimCredit}
                      disabled={claiming}
                      className="w-full flex items-center justify-center gap-2 border-2 border-foreground text-foreground py-3 px-4 font-bold text-sm uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                    >
                      <CreditCard className="h-4 w-4" />
                      Take {formatValue(prize.value)} Store Credit
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-6 bg-accent/10 border border-accent/20 px-4 py-3">
                  <p className="text-sm font-medium text-accent">
                    {prize.type === 'credit'
                      ? `${formatValue(prize.creditAmount || 0)} site credit added to your account!`
                      : 'Free shipping coupon added to your account!'}
                  </p>
                </div>
              )}

              {/* Provably fair verification */}
              {serverSeed && serverSeedHash && (
                <details className="mt-6 text-left">
                  <summary className="text-xs text-foreground-muted cursor-pointer hover:text-foreground-secondary">
                    Provably Fair Verification
                  </summary>
                  <div className="mt-2 space-y-1 text-xs text-foreground-muted font-mono break-all">
                    <p><span className="text-foreground-secondary">Hash:</span> {serverSeedHash}</p>
                    <p><span className="text-foreground-secondary">Seed:</span> {serverSeed}</p>
                  </div>
                </details>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

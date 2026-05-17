'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CreditCard, ExternalLink, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

interface StripeStatus {
  connected: boolean;
  stripeAccountStatus: string;
  stripeOnboardingComplete: boolean;
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } },
};

function PaymentsContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    if (searchParams.get('onboarding') === 'complete') {
      setJustCompleted(true);
    }
    fetchStatus();
  }, [searchParams]);

  async function fetchStatus() {
    try {
      const data = await api.get<StripeStatus>('/stripe/connect/status');
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch Stripe status:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      const frontendUrl = window.location.origin;
      const data = await api.post<{ url: string }>('/stripe/connect/onboard', {
        returnUrl: `${frontendUrl}/settings/payments?onboarding=complete`,
        refreshUrl: `${frontendUrl}/settings/payments?onboarding=refresh`,
      });
      window.location.href = data.url;
    } catch (err) {
      console.error('Failed to start onboarding:', err);
      setConnecting(false);
    }
  }

  async function handleDashboard() {
    try {
      const data = await api.get<{ url: string }>('/stripe/connect/dashboard');
      window.open(data.url, '_blank');
    } catch (err) {
      console.error('Failed to open dashboard:', err);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const isActive = status?.stripeAccountStatus === 'active';
  const isPending = status?.connected && !isActive;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground uppercase tracking-tight">
          Payment Settings
        </h1>
        <p className="mt-2 text-sm text-foreground-secondary">
          Connect your Stripe account to receive payments from buyers.
        </p>

        {justCompleted && (
          <div className="mt-4 border border-foreground p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-foreground flex-shrink-0" />
            <p className="text-sm text-foreground">
              Onboarding submitted! Your account status will update shortly.
            </p>
          </div>
        )}

        {/* Status Card */}
        <div className="mt-8 border border-border p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-accent" />
              <h2 className="font-display text-xl font-bold text-foreground uppercase tracking-tight">
                Stripe Connect
              </h2>
            </div>
            {isActive && <Badge variant="success">Active</Badge>}
            {isPending && <Badge variant="warning">Pending</Badge>}
            {!status?.connected && <Badge variant="muted">Not Connected</Badge>}
          </div>

          <div className="mt-6">
            {!status?.connected && (
              <>
                <p className="text-sm text-foreground-secondary leading-relaxed">
                  To sell fragrances on ScentResort, you need to connect a Stripe account.
                  This allows us to securely process payments and send you payouts.
                  ScentResort takes a 10% platform fee on each sale.
                </p>
                <Button
                  className="mt-6 gap-2"
                  onClick={handleConnect}
                  loading={connecting}
                >
                  <CreditCard className="h-4 w-4" />
                  Connect with Stripe
                </Button>
              </>
            )}

            {isPending && (
              <>
                <div className="flex items-start gap-3 mt-2">
                  <Clock className="h-5 w-5 text-accent-warm flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground font-medium">Onboarding incomplete</p>
                    <p className="text-sm text-foreground-secondary mt-1">
                      Your Stripe account needs additional information before you can receive payments.
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="mt-4 gap-2"
                  onClick={handleConnect}
                  loading={connecting}
                >
                  Continue Setup
                </Button>
              </>
            )}

            {isActive && (
              <>
                <div className="flex items-start gap-3 mt-2">
                  <CheckCircle className="h-5 w-5 text-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground font-medium">Ready to receive payments</p>
                    <p className="text-sm text-foreground-secondary mt-1">
                      Your Stripe account is fully set up. Buyers can purchase your listings
                      and payouts will be sent to your connected bank account.
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="mt-4 gap-2"
                  onClick={handleDashboard}
                >
                  <ExternalLink className="h-4 w-4" />
                  View Stripe Dashboard
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Fee Info */}
        <div className="mt-6 border border-border p-6">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-[0.15em] mb-3">
            How Payments Work
          </h3>
          <div className="space-y-3 text-sm text-foreground-secondary">
            <div className="flex items-start gap-2">
              <span className="text-accent font-bold">1.</span>
              <p>Buyer purchases your listing through ScentResort&apos;s secure checkout.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-accent font-bold">2.</span>
              <p>Funds are held in escrow while you ship the item.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-accent font-bold">3.</span>
              <p>After the buyer confirms delivery, there&apos;s a 48-hour inspection window.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-accent font-bold">4.</span>
              <p>Once the window closes, funds are released to your Stripe account minus a 10% platform fee.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <ProtectedRoute>
      <PaymentsContent />
    </ProtectedRoute>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronLeft,
  XCircle,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPrice } from '@/lib/utils';
import type { Order, OrderStatus } from '@scentresort/shared';

type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'error' | 'muted';

const statusConfig: Record<OrderStatus, { label: string; variant: BadgeVariant; icon: typeof Package }> = {
  pending_payment: { label: 'Pending Payment', variant: 'muted', icon: Clock },
  paid: { label: 'Paid — Awaiting Shipment', variant: 'accent', icon: Package },
  shipped: { label: 'Shipped', variant: 'warning', icon: Truck },
  delivered: { label: 'Delivered — In Escrow', variant: 'default', icon: CheckCircle },
  completed: { label: 'Completed', variant: 'success', icon: CheckCircle },
  disputed: { label: 'Disputed', variant: 'error', icon: AlertTriangle },
  refunded: { label: 'Refunded', variant: 'muted', icon: XCircle },
  cancelled: { label: 'Cancelled', variant: 'muted', icon: XCircle },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } },
};

function OrderDetailContent() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Ship form
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingCarrier, setTrackingCarrier] = useState('');

  // Dispute form
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');

  useEffect(() => {
    api
      .get<{ order: Order }>(`/orders/${id}`)
      .then((res) => setOrder(res.order))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (!user) return null;

  const isBuyer = order?.buyerId === user.uid;
  const isSeller = order?.sellerId === user.uid;

  async function handleAction(action: () => Promise<void>) {
    setActionLoading(true);
    setError('');
    try {
      await action();
      // Refresh order
      const res = await api.get<{ order: Order }>(`/orders/${id}`);
      setOrder(res.order);
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  }

  // Escrow countdown
  let escrowTimeLeft = '';
  let escrowExpired = false;
  if (order?.status === 'delivered' && order.escrowReleaseAt) {
    const release = new Date(order.escrowReleaseAt);
    const now = new Date();
    const diff = release.getTime() - now.getTime();
    if (diff <= 0) {
      escrowExpired = true;
      escrowTimeLeft = 'Releasing soon...';
    } else {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      escrowTimeLeft = `${hours}h ${minutes}m remaining`;
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12 text-center">
        <p className="text-foreground-secondary">Order not found</p>
      </div>
    );
  }

  const config = statusConfig[order.status];
  const StatusIcon = config.icon;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-xs font-bold text-foreground-secondary hover:text-foreground uppercase tracking-[0.15em] mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to orders
        </Link>

        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-tight">
          Order Details
        </h1>

        {error && (
          <div className="mt-4 border border-accent p-3 text-sm text-accent font-medium">
            {error}
          </div>
        )}

        {/* Status Banner */}
        <div className="mt-6 border border-border p-5 flex items-center gap-4">
          <StatusIcon className="h-6 w-6 text-accent flex-shrink-0" />
          <div className="flex-1">
            <Badge variant={config.variant}>{config.label}</Badge>
            {order.status === 'delivered' && (
              <p className="text-sm text-foreground-secondary mt-1">
                Escrow window: {escrowTimeLeft}
              </p>
            )}
          </div>
        </div>

        {/* Order Info */}
        <div className="mt-4 border border-border p-5">
          <Link href={`/listings/${order.listingId}`} className="flex gap-4 hover:opacity-80 transition-opacity">
            {order.listingImage ? (
              <img src={order.listingImage} alt={order.listingTitle} className="h-20 w-20 object-cover flex-shrink-0" />
            ) : (
              <div className="h-20 w-20 bg-border/50 flex-shrink-0" />
            )}
            <div>
              <p className="font-medium text-foreground">{order.listingTitle}</p>
              <p className="font-display text-2xl font-bold text-foreground mt-1">{formatPrice(order.amount)}</p>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Platform fee: {formatPrice(order.platformFee)} &middot; Seller receives: {formatPrice(order.sellerPayout)}
              </p>
            </div>
          </Link>
        </div>

        {/* Participants */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="border border-border p-4">
            <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">Buyer</p>
            <p className="text-sm font-medium text-foreground mt-1">{order.buyerDisplayName}</p>
          </div>
          <div className="border border-border p-4">
            <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">Seller</p>
            <p className="text-sm font-medium text-foreground mt-1">{order.sellerDisplayName}</p>
          </div>
        </div>

        {/* Tracking Info */}
        {order.trackingNumber && (
          <div className="mt-4 border border-border p-4">
            <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">Tracking</p>
            <p className="text-sm text-foreground mt-1">
              {order.trackingCarrier}: {order.trackingNumber}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 space-y-3">
          {/* Seller: Mark as Shipped */}
          {isSeller && order.status === 'paid' && (
            <div className="border border-border p-5 space-y-4">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-[0.15em]">Ship this order</h3>
              <Input
                id="trackingNumber"
                label="Tracking Number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g., 1Z999AA10123456784"
              />
              <Input
                id="trackingCarrier"
                label="Carrier"
                value={trackingCarrier}
                onChange={(e) => setTrackingCarrier(e.target.value)}
                placeholder="e.g., USPS, UPS, FedEx"
              />
              <Button
                className="w-full gap-2"
                loading={actionLoading}
                onClick={() =>
                  handleAction(() =>
                    api.post(`/orders/${id}/ship`, {
                      trackingNumber: trackingNumber.trim(),
                      trackingCarrier: trackingCarrier.trim(),
                    })
                  )
                }
                disabled={!trackingNumber.trim() || !trackingCarrier.trim()}
              >
                <Truck className="h-4 w-4" />
                Mark as Shipped
              </Button>
            </div>
          )}

          {/* Buyer: Confirm Delivery */}
          {isBuyer && order.status === 'shipped' && (
            <Button
              className="w-full gap-2"
              loading={actionLoading}
              onClick={() =>
                handleAction(() => api.post(`/orders/${id}/confirm-delivery`))
              }
            >
              <CheckCircle className="h-4 w-4" />
              Confirm Delivery
            </Button>
          )}

          {/* Buyer: Open Dispute (within escrow window) */}
          {isBuyer && order.status === 'delivered' && !escrowExpired && (
            <>
              {!showDispute ? (
                <Button
                  variant="secondary"
                  className="w-full gap-2 text-red-500 hover:text-red-400"
                  onClick={() => setShowDispute(true)}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Open Dispute
                </Button>
              ) : (
                <div className="border border-accent p-5 space-y-4">
                  <h3 className="text-xs font-bold text-accent uppercase tracking-[0.15em]">Open a Dispute</h3>
                  <Input
                    id="disputeReason"
                    label="Reason"
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="e.g., Item is counterfeit, Wrong item received"
                  />
                  <Textarea
                    id="disputeDescription"
                    label="Description"
                    rows={3}
                    value={disputeDescription}
                    onChange={(e) => setDisputeDescription(e.target.value)}
                    placeholder="Provide details about the issue..."
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setShowDispute(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 gap-2"
                      loading={actionLoading}
                      disabled={!disputeReason.trim() || !disputeDescription.trim()}
                      onClick={() =>
                        handleAction(() =>
                          api.post(`/orders/${id}/dispute`, {
                            reason: disputeReason.trim(),
                            description: disputeDescription.trim(),
                          })
                        )
                      }
                    >
                      Submit Dispute
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Cancel (buyer or seller, before shipment) */}
          {(isBuyer || isSeller) && order.status === 'paid' && (
            <Button
              variant="secondary"
              className="w-full gap-2 text-red-500 hover:text-red-400"
              loading={actionLoading}
              onClick={() => {
                if (confirm('Are you sure you want to cancel this order? The buyer will be refunded.')) {
                  handleAction(() => api.post(`/orders/${id}/cancel`));
                }
              }}
            >
              <XCircle className="h-4 w-4" />
              Cancel Order
            </Button>
          )}

          {/* Dispute Resolution Info */}
          {(order.status === 'refunded' || (order.status === 'completed' && order.disputeResolution)) && (
            <div className="border border-border p-4">
              <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">Dispute Resolution</p>
              <p className="text-sm text-foreground mt-1 font-medium">
                {order.disputeResolution === 'buyer_wins' ? 'Resolved in favor of buyer (refunded)' : 'Resolved in favor of seller (funds released)'}
              </p>
              {order.disputeAdminNotes && (
                <p className="text-sm text-foreground-secondary mt-1">{order.disputeAdminNotes}</p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <ProtectedRoute>
      <OrderDetailContent />
    </ProtectedRoute>
  );
}

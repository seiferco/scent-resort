import { RotateCcw } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center mb-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center bg-foreground/5 mb-4">
          <RotateCcw className="h-7 w-7 text-accent" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground uppercase tracking-tight">
          Refund Policy
        </h1>
        <p className="mt-3 text-lg text-foreground-secondary max-w-xl mx-auto leading-relaxed">
          How refunds, disputes, and cancellations work on ScentResort.
        </p>
      </div>

      <div className="space-y-6">
        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">How Our Escrow System Works</h2>
          <p className="mt-2 text-foreground-secondary leading-relaxed">
            When you purchase a fragrance on ScentResort, your payment is held securely in escrow — the seller does not receive funds immediately. Once your order arrives and you confirm delivery, a 48-hour review window begins. During this window, you can inspect the item and open a dispute if anything is wrong. If no dispute is opened within 48 hours, funds are automatically released to the seller.
          </p>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">Automatic Protections</h2>
          <p className="mt-2 text-foreground-secondary leading-relaxed">
            ScentResort includes built-in safeguards to protect both buyers and sellers:
          </p>
          <ul className="mt-2 text-foreground-secondary leading-relaxed space-y-2">
            <li>If a seller does not ship within 5 days of purchase, the order is automatically cancelled and the buyer receives a full refund.</li>
            <li>If a buyer does not confirm delivery within 7 days of the seller marking the order as shipped, delivery is automatically confirmed and the 48-hour escrow window begins.</li>
          </ul>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">Opening a Dispute</h2>
          <p className="mt-2 text-foreground-secondary leading-relaxed">
            Buyers can open a dispute during the 48-hour escrow window after confirming delivery. Valid reasons for a dispute include:
          </p>
          <ul className="mt-2 text-foreground-secondary leading-relaxed space-y-2">
            <li>Item not as described (e.g., different size, concentration, or condition than listed)</li>
            <li>Counterfeit or inauthentic product</li>
            <li>Wrong item received</li>
            <li>Item damaged in transit</li>
          </ul>
          <p className="mt-2 text-foreground-secondary leading-relaxed">
            When opening a dispute, please provide a clear description of the issue along with supporting photos. The more detail you include, the faster we can resolve your case.
          </p>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">Dispute Resolution</h2>
          <p className="mt-2 text-foreground-secondary leading-relaxed">
            Our admin team reviews all disputes promptly. During the review process, we may request additional photos, documentation, or evidence from either party. Once we have enough information, the dispute is resolved with one of the following outcomes:
          </p>
          <ul className="mt-2 text-foreground-secondary leading-relaxed space-y-2">
            <li><strong>Full refund to buyer</strong> — The seller&apos;s payout is cancelled and the buyer receives a complete refund to their original payment method.</li>
            <li><strong>Funds released to seller</strong> — The dispute is dismissed and the escrowed funds are released to the seller as originally intended.</li>
          </ul>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">Cancellations</h2>
          <p className="mt-2 text-foreground-secondary leading-relaxed">
            Either party can cancel an order before the seller marks it as shipped. In all pre-shipment cancellations, the buyer receives a full refund. Once the seller has shipped the item, the order can no longer be cancelled — any issues must be handled through the dispute process after delivery.
          </p>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">Refund Processing</h2>
          <p className="mt-2 text-foreground-secondary leading-relaxed">
            All refunds are processed through Stripe and returned to the original payment method used at checkout. Once a refund is initiated, it typically takes 5–10 business days to appear on your statement, depending on your bank or card issuer.
          </p>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">Non-Refundable Items</h2>
          <ul className="mt-2 text-foreground-secondary leading-relaxed space-y-2">
            <li>The 10% platform fee is non-refundable in cases where a dispute is resolved in the seller&apos;s favor.</li>
            <li>Shipping costs are the responsibility of the seller and are not separately refunded to buyers.</li>
          </ul>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">Contact Us</h2>
          <p className="mt-2 text-foreground-secondary leading-relaxed">
            If you have questions about a refund, need help with a dispute, or want to understand your options before taking action, reach out to us at{' '}
            <a href="mailto:scentresort@icloud.com" className="font-bold text-accent hover:opacity-70 transition-opacity">
              scentresort@icloud.com
            </a>
            . We&apos;re here to help.
          </p>
        </section>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-foreground-secondary">
          Last updated: May 24, 2026
        </p>
      </div>
    </div>
  );
}

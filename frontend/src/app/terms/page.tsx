import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center mb-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center bg-foreground/5 mb-4">
          <FileText className="h-7 w-7 text-accent" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground uppercase tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-3 text-lg text-foreground-secondary max-w-xl mx-auto leading-relaxed">
          Please read these terms carefully before using ScentResort. By accessing or using our platform, you agree to be bound by these terms.
        </p>
      </div>

      <div className="space-y-6">
        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">1. Acceptance of Terms</h2>
          <p className="mt-2 text-foreground-secondary leading-relaxed">
            By accessing or using ScentResort, you agree to comply with and be bound by these Terms of Service, our Privacy Policy, and all applicable laws and regulations. If you do not agree to these terms, you may not use the platform. You must be at least 18 years of age to create an account or conduct transactions on ScentResort. By using the platform, you represent and warrant that you meet this age requirement.
          </p>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">2. Account Responsibilities</h2>
          <ul className="mt-2 text-foreground-secondary leading-relaxed space-y-2">
            <li>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.</li>
            <li>You must provide accurate, current, and complete information during registration and keep your profile up to date.</li>
            <li>Each person may maintain only one account. Creating multiple accounts to circumvent restrictions or manipulate the platform is prohibited and may result in permanent suspension.</li>
            <li>You must notify us immediately if you suspect any unauthorized access to or use of your account.</li>
          </ul>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">3. Marketplace Rules</h2>
          <ul className="mt-2 text-foreground-secondary leading-relaxed space-y-2">
            <li>All fragrances listed on ScentResort must be authentic. The sale of counterfeit, replica, or imitation products is strictly prohibited and will result in immediate account termination.</li>
            <li>Stolen, prohibited, or illegally obtained items may not be listed under any circumstances.</li>
            <li>Sellers must provide accurate and honest descriptions of their products, including condition, size, batch codes, and any relevant details. Misleading listings are grounds for removal and account suspension.</li>
            <li>Sellers are solely responsible for ensuring their listings comply with all applicable local, state, and federal laws, including any regulations governing the sale and shipment of fragrance products.</li>
          </ul>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">4. Transactions & Fees</h2>
          <ul className="mt-2 text-foreground-secondary leading-relaxed space-y-2">
            <li>ScentResort charges a 10% platform fee on all completed sales. This fee is automatically deducted from the seller&apos;s payout.</li>
            <li>All payments are processed securely through Stripe. By using our platform, you agree to Stripe&apos;s Terms of Service in addition to ours.</li>
            <li>Funds from completed sales are held in escrow for 48 hours after the buyer confirms delivery. This escrow period exists to protect both parties and allow time for the buyer to inspect the item.</li>
            <li>ScentResort acts as a marketplace facilitator and is not a party to transactions between buyers and sellers. We do not take ownership or possession of any items listed on the platform.</li>
          </ul>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">5. Shipping & Delivery</h2>
          <ul className="mt-2 text-foreground-secondary leading-relaxed space-y-2">
            <li>Sellers must ship purchased items within 5 business days of receiving payment. Failure to ship within this window may result in automatic order cancellation and a refund to the buyer.</li>
            <li>Tracking information is required for all shipments. Sellers must provide a valid tracking number through the platform so both parties can monitor delivery status.</li>
            <li>Buyers must confirm delivery within 7 days of the item being marked as delivered by the carrier. If no confirmation or dispute is submitted within this period, delivery is automatically confirmed and the escrow release process begins.</li>
          </ul>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">6. Disputes & Refunds</h2>
          <ul className="mt-2 text-foreground-secondary leading-relaxed space-y-2">
            <li>Buyers may open a dispute within the 48-hour escrow window following delivery confirmation. Disputes can be filed for reasons including items not matching their description, suspected counterfeits, damaged goods, or items not received.</li>
            <li>All disputes are reviewed by the ScentResort admin team. We may request additional evidence from both parties, including photographs, tracking information, and communication records.</li>
            <li>If a dispute is resolved in the buyer&apos;s favor, a refund will be processed through Stripe. Refund timelines depend on the buyer&apos;s payment method and financial institution.</li>
          </ul>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">7. Prohibited Conduct</h2>
          <ul className="mt-2 text-foreground-secondary leading-relaxed space-y-2">
            <li>Engaging in fraud, misrepresentation, or deceptive practices of any kind.</li>
            <li>Harassing, threatening, or abusing other users through messages, reviews, or any other means.</li>
            <li>Sending spam, unsolicited promotions, or commercial messages to other users.</li>
            <li>Manipulating reviews, ratings, or feedback through fake accounts, incentivized reviews, or coordinated activity.</li>
            <li>Attempting to circumvent platform fees by directing transactions off-platform or using alternative payment methods to avoid escrow protections.</li>
            <li>Interfering with the operation of the platform, including attempting to gain unauthorized access to systems, accounts, or data.</li>
          </ul>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">8. Intellectual Property</h2>
          <p className="mt-2 text-foreground-secondary leading-relaxed">
            Users retain all ownership rights to content they create and upload to ScentResort, including listing photos, descriptions, and reviews. By posting content on the platform, you grant ScentResort a non-exclusive, worldwide, royalty-free license to use, display, reproduce, and distribute your content solely for the purpose of operating and promoting the marketplace. This license terminates when you remove your content or close your account. ScentResort&apos;s name, logo, and branding are proprietary and may not be used without written permission.
          </p>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">9. Limitation of Liability</h2>
          <p className="mt-2 text-foreground-secondary leading-relaxed">
            ScentResort is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind, either express or implied. While we actively moderate listings and investigate reports, ScentResort does not guarantee the authenticity, quality, or legality of items listed on the platform. We are not liable for any disputes, losses, or damages arising from transactions between users. To the fullest extent permitted by law, ScentResort&apos;s total liability to you for any claims arising from your use of the platform shall not exceed the amount of fees you have paid to us in the preceding twelve months.
          </p>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">10. Modifications</h2>
          <p className="mt-2 text-foreground-secondary leading-relaxed">
            ScentResort reserves the right to modify these Terms of Service at any time. When we make material changes, we will update the &quot;Last updated&quot; date at the bottom of this page and may notify you via email or through the platform. Your continued use of ScentResort after any modifications constitutes your acceptance of the revised terms. We encourage you to review these terms periodically to stay informed of any updates.
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

import { Lock } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center mb-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center bg-foreground/5 mb-4">
          <Lock className="h-7 w-7 text-accent" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground uppercase tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-3 text-lg text-foreground-secondary max-w-xl mx-auto leading-relaxed">
          How we collect, use, and protect your personal information on ScentResort.
        </p>
      </div>

      <div className="space-y-6">
        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">Information We Collect</h2>
          <ul className="mt-2 text-foreground-secondary leading-relaxed space-y-2">
            <li><strong>Account data:</strong> When you create an account, we collect your name, email address, and profile photo through Firebase Authentication.</li>
            <li><strong>Listing data:</strong> Information you provide when creating listings, including product descriptions, photos, pricing, and fragrance details.</li>
            <li><strong>Transaction history:</strong> Records of purchases and sales made through the marketplace, including order status and shipping information.</li>
            <li><strong>Messages:</strong> Communications sent through our built-in messaging system between buyers and sellers.</li>
            <li><strong>Device and browser information:</strong> Technical data such as your IP address, browser type, operating system, and device identifiers collected automatically when you use the platform.</li>
          </ul>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">How We Use Your Information</h2>
          <ul className="mt-2 text-foreground-secondary leading-relaxed space-y-2">
            <li>Provide, maintain, and improve our marketplace services</li>
            <li>Process transactions and facilitate payments between buyers and sellers</li>
            <li>Communicate with you about orders, listings, and account activity</li>
            <li>Improve the platform experience through usage analysis</li>
            <li>Enforce our Terms of Service and community guidelines</li>
            <li>Detect, investigate, and prevent fraudulent or unauthorized activity</li>
          </ul>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">Payment Information</h2>
          <p className="mt-2 text-foreground-secondary leading-relaxed">
            All payments on ScentResort are processed by Stripe. We do not store your credit card numbers, bank account details, or other sensitive financial information on our servers. When you make a purchase or set up a seller account, your payment data is transmitted directly to and handled by Stripe in accordance with their security standards. Stripe&apos;s privacy policy governs the collection and use of your payment data.
          </p>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">Information Sharing</h2>
          <p className="mt-2 text-foreground-secondary leading-relaxed">
            We share your information only in the following circumstances:
          </p>
          <ul className="mt-2 text-foreground-secondary leading-relaxed space-y-2">
            <li><strong>Public profile information:</strong> Your seller profile, display name, and reviews are visible to other users on the marketplace.</li>
            <li><strong>Transaction counterparties:</strong> When you complete a purchase or sale, relevant order details are shared with the other party to facilitate the transaction.</li>
            <li><strong>Service providers:</strong> We share data with trusted third-party services that help us operate the platform, including Firebase (authentication and database), Stripe (payment processing), and Vercel (hosting and analytics).</li>
            <li><strong>Legal requirements:</strong> We may disclose information if required by law or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.</li>
          </ul>
          <p className="mt-4 text-foreground-secondary leading-relaxed font-semibold">
            We do not sell your personal data to third parties.
          </p>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">Data Storage & Security</h2>
          <p className="mt-2 text-foreground-secondary leading-relaxed">
            Your data is stored in Firebase, which runs on Google Cloud infrastructure. We protect your information using encryption in transit (HTTPS) and Firebase security rules that restrict data access to authorized users. While we implement industry-standard safeguards to protect your personal information, no system is 100% secure. We encourage you to use a strong, unique password for your ScentResort account.
          </p>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">Your Rights</h2>
          <p className="mt-2 text-foreground-secondary leading-relaxed">
            You have the following rights regarding your personal data:
          </p>
          <ul className="mt-2 text-foreground-secondary leading-relaxed space-y-2">
            <li><strong>Access:</strong> You can view the personal information associated with your account at any time through your profile settings.</li>
            <li><strong>Update:</strong> You can update your profile information, display name, and account details directly within the platform.</li>
            <li><strong>Delete:</strong> You can request deletion of your account and associated data by contacting us. We will process your request in a timely manner.</li>
            <li><strong>Export:</strong> You can request a copy of your personal data by reaching out to us via email.</li>
          </ul>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">Cookies & Tracking</h2>
          <p className="mt-2 text-foreground-secondary leading-relaxed">
            Firebase Authentication uses cookies to manage your login session and keep you signed in. We use Vercel Analytics to collect basic, anonymized usage metrics such as page views and visitor counts. We do not use third-party advertising cookies or tracking pixels, and we do not participate in ad networks.
          </p>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">Third-Party Services</h2>
          <p className="mt-2 text-foreground-secondary leading-relaxed">
            ScentResort relies on the following third-party services, each of which operates under its own privacy policy:
          </p>
          <ul className="mt-2 text-foreground-secondary leading-relaxed space-y-2">
            <li><strong>Firebase</strong> (Google) — Authentication, database, and file storage</li>
            <li><strong>Stripe</strong> — Payment processing and seller payouts</li>
            <li><strong>Vercel</strong> — Application hosting and analytics</li>
          </ul>
          <p className="mt-2 text-foreground-secondary leading-relaxed">
            We encourage you to review the privacy policies of these services to understand how they handle your data.
          </p>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">Children&apos;s Privacy</h2>
          <p className="mt-2 text-foreground-secondary leading-relaxed">
            ScentResort is not intended for users under the age of 18. We do not knowingly collect personal information from minors. If we become aware that a user under 18 has created an account, we will take steps to remove their information and terminate the account.
          </p>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">Changes to This Policy</h2>
          <p className="mt-2 text-foreground-secondary leading-relaxed">
            We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. If we make material changes, we will notify users through the platform or via email. Your continued use of ScentResort after any changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="border border-border p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">Contact Us</h2>
          <p className="mt-2 text-foreground-secondary leading-relaxed">
            If you have questions about this Privacy Policy or how we handle your data, please contact us at{' '}
            <a href="mailto:scentresort@icloud.com" className="font-bold text-accent hover:opacity-70 transition-opacity">
              scentresort@icloud.com
            </a>.
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

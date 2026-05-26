import { Shield, Flag, Eye, Users, MessageCircle, AlertTriangle } from 'lucide-react';

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center mb-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center bg-foreground/5 mb-4">
          <Shield className="h-7 w-7 text-accent" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground uppercase tracking-tight">
          Safety & Trust
        </h1>
        <p className="mt-3 text-lg text-foreground-secondary max-w-xl mx-auto leading-relaxed">
          How we keep ScentResort a safe and trustworthy marketplace for the fragrance community.
        </p>
      </div>

      <div className="space-y-6">
        {[
          {
            icon: Flag,
            title: 'Community Reporting',
            content: 'Every listing has a report button. If you see something suspicious — a potential counterfeit, misleading description, or prohibited item — flag it. When a listing receives multiple reports, it is automatically hidden from the marketplace pending admin review.',
          },
          {
            icon: Eye,
            title: 'Admin Moderation',
            content: 'Our team reviews every report. We can reinstate listings that were falsely flagged, permanently remove fraudulent ones, and ban sellers who violate community trust. We take every report seriously.',
          },
          {
            icon: Users,
            title: 'Seller Reviews',
            content: "After a transaction, buyers can leave reviews on seller profiles. Star ratings and written feedback help the community identify trusted sellers. Check a seller's reviews before making a purchase.",
          },
          {
            icon: MessageCircle,
            title: 'Direct Communication',
            content: 'Our built-in messaging system lets you communicate directly with sellers. Ask for additional photos, verify authenticity details, and negotiate terms — all before committing to a purchase.',
          },
        ].map((section) => (
          <section key={section.title} className="border border-border p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center bg-foreground/5 flex-shrink-0">
                <section.icon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">{section.title}</h2>
                <p className="mt-2 text-foreground-secondary leading-relaxed">
                  {section.content}
                </p>
              </div>
            </div>
          </section>
        ))}

        <section className="border border-border p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center bg-accent/10 flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">Tips for Safe Transactions</h2>
              <ul className="mt-2 text-foreground-secondary leading-relaxed space-y-2">
                <li>Ask for detailed photos of the bottle, batch code, and packaging</li>
                <li>Check the seller&apos;s profile, reviews, and listing history</li>
                <li>Always pay through the platform — funds are held in escrow until delivery is confirmed</li>
                <li>Be cautious of prices that seem too good to be true</li>
                <li>Report anything suspicious — it helps the entire community</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-12 text-center">
        <p className="text-foreground-secondary">
          Have a concern?{' '}
          <a href="mailto:scentresort@icloud.com" className="font-bold text-accent hover:opacity-70 transition-opacity">
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
}

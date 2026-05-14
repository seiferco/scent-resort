'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Search, Send, Handshake } from 'lucide-react';
import { api } from '@/lib/api';
import { ListingCard } from '@/components/listings/ListingCard';
import { ListingGridSkeleton } from '@/components/ui/Skeleton';
import { GradientBlobs } from '@/components/ui/GradientBlobs';
import { Button } from '@/components/ui/Button';
import type { Listing } from '@scentresort/shared';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ listings: Listing[] }>('/listings')
      .then((res) => setListings(res.listings.slice(0, 8)))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero — Full  Viewport */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <GradientBlobs />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.h1
              variants={fadeUp}
              custom={0}
              className="font-display font-bold uppercase tracking-tight text-foreground leading-[0.9]"
              style={{ fontSize: 'clamp(3rem, 18vw, 16rem)' }}
            >
              SCENT
              <br />
              <span className="text-accent">RESORT</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={1}
              className="mt-8 text-lg sm:text-xl text-foreground-secondary max-w-lg leading-relaxed"
            >
              Authentic luxury and niche fragrances from real collectors.
              Browse, message, negotiate — on your terms.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={2}
              className="mt-10 flex flex-wrap gap-4"
            >
              <Link href="/listings">
                <Button size="lg" className="gap-2">
                  <Search className="h-4 w-4" />
                  Browse Fragrances
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="secondary" size="lg" className="gap-2">
                  Start Selling
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Recently Listed */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2
              className="font-display font-bold text-foreground uppercase tracking-tight leading-none"
              style={{ fontSize: 'clamp(2rem, 8vw, 6rem)' }}
            >
              Recently Listed
            </h2>
          </div>
          <Link
            href="/listings"
            className="hidden sm:flex items-center gap-1 text-xs font-bold text-foreground uppercase tracking-[0.15em] hover:text-accent transition-colors"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <ListingGridSkeleton />
        ) : listings.length > 0 ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {listings.map((listing, i) => (
              <motion.div key={listing.id} variants={fadeUp} custom={i}>
                <ListingCard listing={listing} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <p className="text-foreground-secondary">No listings yet. Be the first to sell!</p>
            <Link href="/listings/create" className="mt-2 inline-block text-sm font-bold text-accent uppercase tracking-wide">
              Create a listing
            </Link>
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link href="/listings" className="text-sm font-bold text-accent uppercase tracking-wide">
            View all listings
          </Link>
        </div>
      </section>

      {/* Category Divider */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h2
            className="font-display font-bold text-foreground/10 uppercase tracking-tight leading-none text-center select-none"
            style={{ fontSize: 'clamp(3rem, 12vw, 10rem)' }}
          >
            How It Works
          </h2>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-10 lg:gap-16"
        >
          {[
            {
              icon: Search,
              title: 'Browse & Discover',
              desc: 'Explore curated listings from verified fragrance collectors. Filter by brand, size, condition, and price.',
              step: '01',
            },
            {
              icon: Send,
              title: 'Message Sellers',
              desc: 'Chat directly with sellers to ask questions, negotiate prices, and arrange your preferred payment method.',
              step: '02',
            },
            {
              icon: Handshake,
              title: 'Close the Deal',
              desc: 'Pay however works best — PayPal, Venmo, Zelle. You and the seller agree on terms directly.',
              step: '03',
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              variants={fadeUp}
              custom={i}
              className="relative"
            >
              <span className="font-display text-[5rem] sm:text-[6rem] font-bold text-foreground/5 leading-none block">
                {item.step}
              </span>
              <div className="mt-2">
                <item.icon className="h-6 w-6 text-accent mb-4" />
                <h3 className="font-display text-xl font-bold text-foreground uppercase tracking-[0.05em]">{item.title}</h3>
                <p className="mt-3 text-sm text-foreground-secondary leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Campaign Block / Bottom CTA */}
      <section className="relative overflow-hidden bg-foreground text-background">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="blob blob-red opacity-20" style={{ top: '-30%', right: '-20%', mixBlendMode: 'screen' }} />
          <div className="blob blob-orange opacity-15" style={{ bottom: '-20%', left: '-10%', mixBlendMode: 'screen' }} />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <h2
            className="font-display font-bold uppercase tracking-tight leading-[0.9]"
            style={{ fontSize: 'clamp(2.5rem, 10vw, 8rem)' }}
          >
            Join the
            <br />
            <span className="text-accent">Community</span>
          </h2>
          <p className="mt-6 text-background/60 max-w-md mx-auto text-lg">
            Whether you&apos;re buying or selling, ScentResort is the place
            for fragrance enthusiasts.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-white text-black hover:bg-white/90">
                Create Free Account
              </Button>
            </Link>
            <Link href="/listings">
              <Button variant="ghost" size="lg" className="text-background/60 hover:text-background border border-background/20">
                Browse Listings
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

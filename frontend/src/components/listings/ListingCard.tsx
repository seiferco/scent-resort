'use client';

import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { Listing } from '@scentresort/shared';

function conditionLabel(c: string) {
  return c.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <div className="overflow-hidden">
        <div className="aspect-square bg-border/30 relative overflow-hidden">
          {listing.images[0] ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-foreground-muted text-sm">No Image</span>
            </div>
          )}

          {listing.status === 'sold' && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <Badge variant="muted" className="text-sm px-4 py-1">Sold</Badge>
            </div>
          )}

          {listing.status === 'active' && (
            <div className="absolute top-2.5 left-2.5">
              <Badge variant="default">{conditionLabel(listing.condition)}</Badge>
            </div>
          )}
        </div>

        <div className="pt-3 pb-1">
          <p className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">
            {listing.brand}
          </p>
          <h3 className="mt-1 font-medium text-foreground truncate text-sm">
            {listing.title}
          </h3>
          <p className="text-xs text-foreground-muted mt-0.5">{listing.size}</p>
          <p className="mt-2 text-lg font-display font-bold text-foreground">
            {formatPrice(listing.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}

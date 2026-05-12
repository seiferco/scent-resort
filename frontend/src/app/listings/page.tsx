'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { api } from '@/lib/api';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { ListingGridSkeleton } from '@/components/ui/Skeleton';
import type { Listing, ListingCondition } from '@scentresort/shared';

const conditions: { value: ListingCondition | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'new_sealed', label: 'New (Sealed)' },
  { value: 'new_open_box', label: 'Open Box' },
  { value: 'lightly_used', label: 'Lightly Used' },
  { value: 'partially_used', label: 'Partially Used' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_low', label: 'Price: Low' },
  { value: 'price_high', label: 'Price: High' },
];

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [condition, setCondition] = useState('');
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    api
      .get<{ listings: Listing[] }>('/listings')
      .then((res) => setListings(res.listings))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...listings];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.brand.toLowerCase().includes(q) ||
          l.fragranceName.toLowerCase().includes(q),
      );
    }

    if (condition) {
      result = result.filter((l) => l.condition === condition);
    }

    if (sort === 'price_low') result.sort((a, b) => a.price - b.price);
    else if (sort === 'price_high') result.sort((a, b) => b.price - a.price);

    return result;
  }, [listings, search, condition, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="font-display font-bold text-foreground uppercase tracking-tight leading-none"
          style={{ fontSize: 'clamp(2rem, 6vw, 4rem)' }}
        >
          Browse
        </h1>
        <p className="mt-2 text-sm text-foreground-secondary uppercase tracking-[0.1em]">
          {listings.length} listings from the community
        </p>
      </div>

      {/* Search & Filters */}
      <div className="mb-8 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search by brand, name, or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-b-2 border-border bg-transparent pl-6 pr-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 border-b-2 border-border px-4 py-2.5 text-xs font-bold text-foreground-secondary uppercase tracking-[0.15em] hover:border-foreground transition-colors sm:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className={`flex flex-wrap gap-2 ${showFilters ? '' : 'hidden sm:flex'}`}>
          {conditions.map((c) => (
            <button
              key={c.value}
              onClick={() => setCondition(c.value)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] border transition-colors ${
                condition === c.value
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-transparent text-foreground-secondary border-border hover:border-foreground'
              }`}
            >
              {c.label}
            </button>
          ))}

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="ml-auto border border-border bg-transparent px-4 py-2 text-xs font-bold text-foreground uppercase tracking-[0.1em] focus:outline-none focus:border-accent"
          >
            {sortOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <ListingGridSkeleton />
      ) : (
        <ListingGrid listings={filtered} />
      )}
    </div>
  );
}

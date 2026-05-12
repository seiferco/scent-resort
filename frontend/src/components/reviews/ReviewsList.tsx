'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';
import { StarRating } from '@/components/ui/StarRating';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Review } from '@scentresort/shared';

interface ReviewsListProps {
  sellerId: string;
}

export function ReviewsList({ sellerId }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(() => {
    api
      .get<{ reviews: Review[]; avgRating: number; count: number }>(`/reviews/seller/${sellerId}`)
      .then((res) => {
        setReviews(res.reviews);
        setAvgRating(res.avgRating);
        setCount(res.count);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sellerId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-display text-xl font-bold text-foreground uppercase tracking-[0.05em]">Reviews</h2>
        {count > 0 && (
          <div className="flex items-center gap-1.5">
            <StarRating rating={avgRating} size={14} />
            <span className="text-sm font-bold text-foreground">{avgRating}</span>
            <span className="text-sm text-foreground-muted">({count})</span>
          </div>
        )}
      </div>

      {/* Review form */}
      <ReviewForm sellerId={sellerId} onReviewAdded={fetchReviews} />

      {/* Reviews list */}
      {reviews.length > 0 ? (
        <div className="mt-4 divide-y divide-border">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-foreground-muted">
          No reviews yet. Be the first to leave one!
        </p>
      )}
    </div>
  );
}

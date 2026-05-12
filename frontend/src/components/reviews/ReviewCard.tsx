'use client';

import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import type { Review } from '@scentresort/shared';

export function ReviewCard({ review }: { review: Review }) {
  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';

  return (
    <div className="flex gap-3 py-4">
      <Avatar src={review.buyerPhotoURL} name={review.buyerDisplayName} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{review.buyerDisplayName}</span>
          <span className="text-xs text-foreground-muted">{date}</span>
        </div>
        <StarRating rating={review.rating} size={14} className="mt-0.5" />
        <p className="mt-1.5 text-sm text-foreground-secondary leading-relaxed">{review.comment}</p>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/lib/api';
import { StarRating } from '@/components/ui/StarRating';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';

interface ReviewFormProps {
  sellerId: string;
  onReviewAdded: () => void;
}

export function ReviewForm({ sellerId, onReviewAdded }: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!user || user.uid === sellerId) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.post('/reviews', { sellerId, rating, comment: comment.trim() });
      setComment('');
      setRating(0);
      onReviewAdded();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border p-4 sm:p-5">
      <h3 className="text-xs font-bold text-foreground uppercase tracking-[0.15em] mb-3">Leave a Review</h3>

      {error && (
        <div className="mb-3 border border-accent p-2.5 text-xs text-accent font-medium">
          {error}
        </div>
      )}

      <div className="mb-3">
        <p className="text-xs text-foreground-muted mb-1.5 uppercase tracking-wide">Your rating</p>
        <StarRating rating={rating} interactive onChange={setRating} size={24} />
      </div>

      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience with this seller..."
        rows={3}
        required
        minLength={5}
      />

      <Button type="submit" size="sm" loading={submitting} className="mt-3">
        Submit Review
      </Button>
    </form>
  );
}

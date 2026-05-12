'use client';

import { useState } from 'react';
import { Flag, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import type { ReportReason } from '@scentresort/shared';

export function ReportButton({ listingId }: { listingId: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('suspected_counterfeit');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (!user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post<{ listingHidden: boolean }>(`/listings/${listingId}/report`, {
        reason,
        description,
      });
      setResult(
        res.listingHidden
          ? 'Report submitted. This listing has been hidden for review.'
          : 'Report submitted. Thank you for helping keep the community safe.'
      );
      setOpen(false);
    } catch (err: any) {
      setResult(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="mt-4 border border-foreground p-3 text-sm text-foreground flex items-center gap-2 font-medium">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        {result}
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-bold text-foreground-muted hover:text-accent mt-4 uppercase tracking-[0.15em] transition-colors"
      >
        <Flag className="h-3.5 w-3.5" />
        Report this listing
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 border border-accent p-4">
      <h4 className="font-display font-bold text-accent flex items-center gap-2 uppercase tracking-[0.05em]">
        <Flag className="h-4 w-4" />
        Report Listing
      </h4>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value as ReportReason)}
        className="w-full border-b-2 border-border bg-transparent py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
      >
        <option value="suspected_counterfeit">Suspected Counterfeit</option>
        <option value="misleading_description">Misleading Description</option>
        <option value="prohibited_item">Prohibited Item</option>
        <option value="other">Other</option>
      </select>
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your concern (min 10 characters)..."
        rows={3}
        required
        minLength={10}
      />
      <div className="flex gap-2">
        <Button type="submit" variant="danger" size="sm" loading={submitting}>
          Submit Report
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

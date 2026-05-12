'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ChatThread } from '@/components/messages/ChatThread';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import type { Conversation } from '@scentresort/shared';

function ChatContent() {
  const { id } = useParams<{ id: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Conversation>(`/conversations/${id}`)
      .then((data) => setConversation(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl h-[calc(100vh-4rem)] flex flex-col">
        <div className="border-b border-border px-4 py-3 flex items-center gap-3">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-5 w-48" />
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="text-center py-20 text-foreground-muted">Conversation not found.</div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 flex items-center gap-3">
        <Link
          href="/messages"
          className="flex h-8 w-8 items-center justify-center text-foreground-secondary hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        {conversation.listingImage && (
          <img
            src={conversation.listingImage}
            alt=""
            className="h-10 w-10 object-cover border border-border"
          />
        )}
        <div className="min-w-0">
          <Link
            href={`/listings/${conversation.listingId}`}
            className="font-display font-bold text-foreground hover:text-accent truncate block text-sm uppercase tracking-[0.05em] transition-colors"
          >
            {conversation.listingTitle}
          </Link>
        </div>
      </div>

      {/* Chat */}
      <ChatThread conversationId={id} />
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatContent />
    </ProtectedRoute>
  );
}

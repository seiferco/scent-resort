'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { getFirebaseAuth } from '@/lib/firebase';
import { getFirestore } from 'firebase/firestore';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Conversation } from '@scentresort/shared';

export function ConversationList() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const auth = getFirebaseAuth();
    const db = getFirestore(auth.app);

    const q = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Conversation[];
      setConversations(convos);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-1 p-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[72px]" />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="No conversations yet"
        description="Browse listings and message a seller to get started."
      />
    );
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map((convo) => {
        const isUnread = user?.uid === convo.buyerId ? convo.buyerUnread : convo.sellerUnread;

        return (
          <Link
            key={convo.id}
            href={`/messages/${convo.id}`}
            className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-foreground/5 ${
              isUnread ? 'bg-accent/5' : ''
            }`}
          >
            {convo.listingImage ? (
              <img
                src={convo.listingImage}
                alt={convo.listingTitle}
                className="h-12 w-12 object-cover flex-shrink-0 border border-border"
              />
            ) : (
              <div className="h-12 w-12 bg-border/50 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm truncate ${isUnread ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>
                  {convo.listingTitle}
                </p>
                {isUnread && (
                  <span className="h-2.5 w-2.5 bg-accent flex-shrink-0" />
                )}
              </div>
              <p className={`text-sm truncate ${isUnread ? 'text-foreground-secondary' : 'text-foreground-muted'}`}>
                {convo.lastMessage || 'No messages yet'}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

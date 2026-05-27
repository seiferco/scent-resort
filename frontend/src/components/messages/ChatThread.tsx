'use client';

import { useEffect, useState, useRef } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getFirestore,
} from 'firebase/firestore';
import { Send } from 'lucide-react';
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/lib/api';
import { MessageBubble } from './MessageBubble';
import type { Message } from '@scentresort/shared';

interface Props {
  conversationId: string;
}

export function ChatThread({ conversationId }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirestore(auth.app);

    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(msgs);
    });

    api.post(`/conversations/${conversationId}/read`).catch(() => {});

    return unsubscribe;
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    setSendError('');
    try {
      await api.post(`/conversations/${conversationId}/messages`, {
        text: newMessage.trim(),
      });
      setNewMessage('');
    } catch (err: any) {
      setSendError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-foreground-muted text-sm py-8">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === user?.uid}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-border p-3 sm:p-4">
        {sendError && (
          <div className="mb-2 text-xs text-accent font-medium bg-accent/5 border border-accent/20 px-3 py-2">
            {sendError}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border-b-2 border-border bg-transparent px-2 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none transition-colors"
            maxLength={5000}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="flex h-10 w-10 items-center justify-center bg-foreground text-background hover:bg-accent disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

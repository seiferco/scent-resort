'use client';

import { motion } from 'framer-motion';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ConversationList } from '@/components/messages/ConversationList';

function MessagesContent() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground uppercase tracking-tight">
          Messages
        </h1>
        <p className="mt-2 text-sm text-foreground-secondary">
          Your conversations with buyers and sellers.
        </p>
        <div className="mt-8 border border-border overflow-hidden">
          <ConversationList />
        </div>
      </motion.div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <MessagesContent />
    </ProtectedRoute>
  );
}

'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { Mail } from 'lucide-react';

export function EmailVerificationBanner() {
  const { firebaseUser, resendVerificationEmail } = useAuth();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  if (!firebaseUser || firebaseUser.emailVerified) return null;

  async function handleResend() {
    setSending(true);
    try {
      await resendVerificationEmail();
      setSent(true);
    } catch {
      // Silently fail — Firebase rate limits this
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-accent/10 border-b border-accent/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center gap-2">
        <Mail className="h-4 w-4 text-accent flex-shrink-0" />
        <p className="text-xs text-foreground-secondary">
          {sent ? (
            'Verification email sent! Check your inbox.'
          ) : (
            <>
              Please verify your email to buy and sell.{' '}
              <button
                onClick={handleResend}
                disabled={sending}
                className="font-bold text-accent hover:opacity-70 transition-opacity"
              >
                {sending ? 'Sending...' : 'Resend verification email'}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

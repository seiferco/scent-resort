'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
  applyActionCode,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { GradientBlobs } from '@/components/ui/GradientBlobs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle, AlertTriangle } from 'lucide-react';

type ActionMode = 'resetPassword' | 'verifyEmail' | null;

export default function AuthActionPage() {
  return (
    <Suspense fallback={
      <ActionLayout title="Loading..." subtitle="Please wait.">
        <div className="h-1 bg-border overflow-hidden">
          <div className="h-full bg-accent animate-pulse w-2/3" />
        </div>
      </ActionLayout>
    }>
      <AuthActionContent />
    </Suspense>
  );
}

function AuthActionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const mode = searchParams.get('mode') as ActionMode;
  const oobCode = searchParams.get('oobCode') || '';

  if (mode === 'resetPassword') {
    return <ResetPassword oobCode={oobCode} />;
  }

  if (mode === 'verifyEmail') {
    return <VerifyEmail oobCode={oobCode} />;
  }

  return (
    <ActionLayout title="Invalid Link" subtitle="This link is invalid or has expired.">
      <div className="text-center">
        <AlertTriangle className="h-10 w-10 text-accent mx-auto mb-4" />
        <p className="text-sm text-foreground-secondary mb-6">
          The action link you followed is not valid. It may have expired or already been used.
        </p>
        <Link href="/login">
          <Button className="w-full">Back to Sign In</Button>
        </Link>
      </div>
    </ActionLayout>
  );
}

function ResetPassword({ oobCode }: { oobCode: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    verifyPasswordResetCode(getFirebaseAuth(), oobCode)
      .then((email) => {
        setEmail(email);
        setVerifying(false);
      })
      .catch(() => {
        setInvalid(true);
        setVerifying(false);
      });
  }, [oobCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPw) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(getFirebaseAuth(), oobCode, password);
      setSuccess(true);
    } catch (err: any) {
      if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.');
      } else if (err.code === 'auth/expired-action-code') {
        setError('This reset link has expired. Please request a new one.');
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (verifying) {
    return (
      <ActionLayout title="Reset Password" subtitle="Verifying your reset link...">
        <div className="h-1 bg-border overflow-hidden">
          <div className="h-full bg-accent animate-pulse w-2/3" />
        </div>
      </ActionLayout>
    );
  }

  if (invalid) {
    return (
      <ActionLayout title="Invalid Link" subtitle="This reset link is invalid or has expired.">
        <div className="text-center">
          <AlertTriangle className="h-10 w-10 text-accent mx-auto mb-4" />
          <p className="text-sm text-foreground-secondary mb-6">
            Please request a new password reset from the login page.
          </p>
          <Link href="/login">
            <Button className="w-full">Back to Sign In</Button>
          </Link>
        </div>
      </ActionLayout>
    );
  }

  if (success) {
    return (
      <ActionLayout title="Password Reset" subtitle="Your password has been updated.">
        <div className="text-center">
          <CheckCircle className="h-10 w-10 text-accent mx-auto mb-4" />
          <p className="text-sm text-foreground-secondary mb-6">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
          <Link href="/login">
            <Button className="w-full">Sign In</Button>
          </Link>
        </div>
      </ActionLayout>
    );
  }

  return (
    <ActionLayout title="Reset Password" subtitle={`Enter a new password for ${email}`}>
      {error && (
        <div className="mb-6 border border-accent p-3 text-sm text-accent font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          id="password"
          type="password"
          label="New Password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
        <Input
          id="confirmPassword"
          type="password"
          label="Confirm Password"
          required
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          placeholder="Re-enter your password"
        />
        <Button type="submit" loading={loading} className="w-full">
          Reset Password
        </Button>
      </form>
    </ActionLayout>
  );
}

function VerifyEmail({ oobCode }: { oobCode: string }) {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    applyActionCode(getFirebaseAuth(), oobCode)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [oobCode]);

  if (status === 'verifying') {
    return (
      <ActionLayout title="Verifying Email" subtitle="Please wait...">
        <div className="h-1 bg-border overflow-hidden">
          <div className="h-full bg-accent animate-pulse w-2/3" />
        </div>
      </ActionLayout>
    );
  }

  if (status === 'error') {
    return (
      <ActionLayout title="Verification Failed" subtitle="This link is invalid or has expired.">
        <div className="text-center">
          <AlertTriangle className="h-10 w-10 text-accent mx-auto mb-4" />
          <p className="text-sm text-foreground-secondary mb-6">
            The verification link may have expired or already been used. Try resending from your account.
          </p>
          <Link href="/listings">
            <Button className="w-full">Go to Marketplace</Button>
          </Link>
        </div>
      </ActionLayout>
    );
  }

  return (
    <ActionLayout title="Email Verified" subtitle="Your email has been confirmed.">
      <div className="text-center">
        <CheckCircle className="h-10 w-10 text-accent mx-auto mb-4" />
        <p className="text-sm text-foreground-secondary mb-6">
          Thank you for verifying your email. You now have full access to ScentResort.
        </p>
        <Link href="/listings">
          <Button className="w-full">Browse Fragrances</Button>
        </Link>
      </div>
    </ActionLayout>
  );
}

function ActionLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden">
        <GradientBlobs />
        <div className="relative z-10 text-center px-12">
          <h2
            className="font-display font-bold text-foreground uppercase tracking-tight leading-[0.9]"
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}
          >
            Scent
            <br />
            <span className="text-accent">Resort</span>
          </h2>
          <p className="mt-6 text-foreground-secondary max-w-sm mx-auto leading-relaxed">
            Your curated marketplace for authentic luxury and niche fragrances.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          className="w-full max-w-sm"
        >
          <div className="text-center lg:text-left mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground uppercase tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-foreground-secondary">{subtitle}</p>
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  );
}

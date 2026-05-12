'use client';

import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  requireRole?: 'admin';
}

export function ProtectedRoute({ children, requireRole }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user && requireRole && user.role !== requireRole) {
      router.push('/dashboard');
    }
  }, [user, loading, requireRole, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user) return null;
  if (requireRole && user.role !== requireRole) return null;

  return <>{children}</>;
}

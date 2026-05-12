'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MessageCircle,
  Plus,
  LayoutDashboard,
  User,
  Shield,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/listings', label: 'Browse', icon: Search },
  { href: '/listings/create', label: 'Sell', icon: Plus },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export function Header() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="font-display text-xl font-bold text-foreground uppercase tracking-[0.05em]">
                SCENTRESORT
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {user ? (
                <>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 text-xs font-medium uppercase tracking-[0.15em] transition-colors',
                        isActive(link.href)
                          ? 'text-accent'
                          : 'text-foreground-secondary hover:text-foreground',
                      )}
                    >
                      <link.icon className="h-3.5 w-3.5" />
                      {link.label}
                    </Link>
                  ))}
                </>
              ) : (
                <Link
                  href="/listings"
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 text-xs font-medium uppercase tracking-[0.15em] transition-colors',
                    isActive('/listings')
                      ? 'text-accent'
                      : 'text-foreground-secondary hover:text-foreground',
                  )}
                >
                  <Search className="h-3.5 w-3.5" />
                  Browse
                </Link>
              )}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {/* Desktop user menu */}
                  <div className="hidden md:flex items-center gap-2">
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-2 text-xs font-medium uppercase tracking-[0.15em] transition-colors',
                          isActive('/admin')
                            ? 'text-accent'
                            : 'text-foreground-muted hover:text-foreground',
                        )}
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Admin
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-2 py-1.5 hover:opacity-70 transition-opacity"
                    >
                      <Avatar src={user.photoURL} name={user.displayName} size="sm" />
                      <span className="text-xs font-medium text-foreground uppercase tracking-wide hidden lg:block">
                        {user.displayName}
                      </span>
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Mobile hamburger */}
                  <button
                    onClick={() => setMobileOpen(true)}
                    className="md:hidden flex h-9 w-9 items-center justify-center hover:opacity-70 transition-opacity"
                  >
                    <Menu className="h-5 w-5 text-foreground" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    className="text-xs font-medium text-foreground-secondary hover:text-foreground transition-colors uppercase tracking-[0.15em] px-3 py-2"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="btn-fill bg-foreground px-5 py-2.5 text-xs font-medium text-background uppercase tracking-[0.15em]"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-foreground/60 mix-blend-difference md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-background border-l border-border md:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Avatar src={user?.photoURL} name={user?.displayName || ''} size="md" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{user?.displayName}</p>
                    <p className="text-xs text-foreground-muted">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center hover:opacity-70"
                >
                  <X className="h-5 w-5 text-foreground-secondary" />
                </button>
              </div>

              <nav className="p-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 text-sm font-medium uppercase tracking-[0.1em] transition-colors',
                      isActive(link.href)
                        ? 'text-accent'
                        : 'text-foreground-secondary hover:text-foreground',
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 text-sm font-medium uppercase tracking-[0.1em] transition-colors',
                    isActive('/profile')
                      ? 'text-accent'
                      : 'text-foreground-secondary hover:text-foreground',
                  )}
                >
                  <User className="h-5 w-5" />
                  Profile
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 text-sm font-medium uppercase tracking-[0.1em] transition-colors',
                      isActive('/admin')
                        ? 'text-accent'
                        : 'text-foreground-muted hover:text-foreground',
                    )}
                  >
                    <Shield className="h-5 w-5" />
                    Admin
                  </Link>
                )}

                <div className="my-2 border-t border-border" />

                <button
                  onClick={() => {
                    setMobileOpen(false);
                    signOut();
                  }}
                  className="flex w-full items-center gap-3 px-3 py-3 text-sm font-medium text-foreground-muted hover:text-foreground uppercase tracking-[0.1em] transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

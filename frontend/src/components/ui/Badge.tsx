import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'error' | 'muted';

const variants: Record<BadgeVariant, string> = {
  default: 'bg-foreground/10 text-foreground',
  accent: 'bg-accent text-white',
  success: 'bg-foreground text-background',
  warning: 'bg-accent-warm text-foreground',
  error: 'bg-accent text-white',
  muted: 'bg-border text-foreground-muted',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 text-xs font-bold uppercase tracking-[0.1em]',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

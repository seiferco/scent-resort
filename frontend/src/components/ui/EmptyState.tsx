import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, children, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="flex h-16 w-16 items-center justify-center bg-foreground/5 mb-4">
        <Icon className="h-7 w-7 text-accent" />
      </div>
      <h3 className="font-display text-lg font-bold text-foreground uppercase tracking-[0.05em]">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-foreground-secondary max-w-sm">{description}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

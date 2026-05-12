'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const baseStyles =
  'block w-full border-b-2 border-border bg-transparent px-0 py-3 text-sm text-foreground placeholder:text-foreground-muted transition-colors focus:border-accent focus:outline-none';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={id} className="block text-xs font-bold text-foreground uppercase tracking-[0.15em] mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(baseStyles, error && 'border-accent', className)}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-accent font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={id} className="block text-xs font-bold text-foreground uppercase tracking-[0.15em] mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(baseStyles, 'resize-none', error && 'border-accent', className)}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-accent font-medium">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/components/ui/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, helperText, error, id, ...props }, ref) => {
  const inputId = id ?? props.name;

  return (
    <label className="grid gap-2 text-sm font-medium text-ink-body" htmlFor={inputId}>
      {label ? <span>{label}</span> : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'h-12 w-full rounded-lg border border-surface-border bg-surface-panel px-3 text-base text-ink-strong outline-none transition placeholder:text-ink-muted focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30',
          error && 'border-brand-red focus:border-brand-red focus:ring-brand-red/30',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-red-700 dark:text-red-200">{error}</span> : null}
      {!error && helperText ? <span className="text-xs text-ink-muted">{helperText}</span> : null}
    </label>
  );
});

Input.displayName = 'Input';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/components/ui/cn';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClassName: Record<ButtonVariant, string> = {
  primary: 'bg-brand-green text-slate-950 hover:brightness-95 active:brightness-90',
  secondary: 'bg-brand-blue text-slate-950 hover:brightness-95 active:brightness-90',
  danger: 'bg-brand-red text-slate-950 hover:brightness-95 active:brightness-90',
  ghost: 'bg-transparent text-ink-body hover:bg-surface-muted',
};

const sizeClassName: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
  icon: 'h-11 w-11 p-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 focus:ring-offset-surface-canvas disabled:cursor-not-allowed disabled:opacity-55',
        variantClassName[variant],
        sizeClassName[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = 'Button';

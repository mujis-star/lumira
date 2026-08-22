'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5 font-semibold',
    icon: 'p-2 rounded-xl',
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-violet-600 via-cyan-500 to-rose-500 text-white shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 hover:brightness-110 border border-white/20',
    gradient:
      'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md shadow-violet-500/20 hover:brightness-110',
    secondary:
      'glass-button text-neutral-200 hover:text-white border-white/10 hover:border-white/20 dark:text-neutral-200',
    ghost:
      'bg-transparent text-neutral-400 hover:text-white hover:bg-white/5',
    outline:
      'border border-violet-500/40 text-violet-400 hover:bg-violet-500/10 hover:border-violet-500',
    danger:
      'bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 hover:border-rose-500',
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}

import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  dot = false,
  children,
  ...props
}) => {
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/10',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-600/10',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/10',
    info: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-600/10',
    primary: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/10',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-600/10',
  };

  const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    primary: 'bg-blue-500',
    neutral: 'bg-slate-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-xs',
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};

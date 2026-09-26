import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  className,
  title,
  subtitle,
  headerAction,
  footer,
  children,
  ...props
}) => {
  const hasHeader = title || subtitle || headerAction;

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden text-slate-900',
        className
      )}
      {...props}
    >
      {hasHeader && (
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && (
            <div className="flex items-center gap-2">{headerAction}</div>
          )}
        </div>
      )}

      <div className="p-6">{children}</div>

      {footer && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};

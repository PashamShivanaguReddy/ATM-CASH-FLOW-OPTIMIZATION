import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  errorCode?: string;
  onRetry?: () => void;
  className?: string;
  action?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this data. Please try again.',
  errorCode,
  onRetry,
  className,
  action,
}) => {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-rose-100 bg-rose-50/40 my-4',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4 shadow-xs">
        <AlertCircle className="w-6 h-6" />
      </div>

      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600 max-w-md mt-1">{message}</p>

      {errorCode && (
        <span className="mt-2 text-xs font-mono px-2 py-0.5 rounded bg-rose-100/80 text-rose-800">
          Error code: {errorCode}
        </span>
      )}

      {(onRetry || action) && (
        <div className="mt-6 flex items-center gap-3">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Try Again
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  );
};

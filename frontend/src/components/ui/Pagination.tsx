import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalElements,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  className,
}) => {
  const isFirst = currentPage === 0;
  const isLast = currentPage >= totalPages - 1 || totalPages === 0;

  const startIdx = totalElements ? currentPage * pageSize + 1 : 0;
  const endIdx = totalElements
    ? Math.min((currentPage + 1) * pageSize, totalElements)
    : 0;

  return (
    <nav
      aria-label="Pagination Navigation"
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 border-t border-slate-200 bg-white text-xs text-slate-600',
        className
      )}
    >
      <div className="flex items-center gap-4">
        {totalElements !== undefined ? (
          <span>
            Showing <strong className="font-semibold text-slate-900">{startIdx}</strong>{' '}
            to <strong className="font-semibold text-slate-900">{endIdx}</strong> of{' '}
            <strong className="font-semibold text-slate-900">{totalElements}</strong>{' '}
            results
          </span>
        ) : (
          <span>
            Page <strong className="font-semibold text-slate-900">{currentPage + 1}</strong>{' '}
            of <strong className="font-semibold text-slate-900">{Math.max(1, totalPages)}</strong>
          </span>
        )}

        {onPageSizeChange && (
          <div className="hidden sm:flex items-center gap-2">
            <span>Show</span>
            <select
              aria-label="Rows per page"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded border border-slate-300 py-1 px-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirst}
          aria-label="Previous Page"
          leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
        >
          Previous
        </Button>

        <span className="px-2 py-1 text-slate-500 font-medium">
          {currentPage + 1} / {Math.max(1, totalPages)}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLast}
          aria-label="Next Page"
          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
        >
          Next
        </Button>
      </div>
    </nav>
  );
};

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
      <span className="text-xs text-muted">Page {page} of {Math.max(pageCount, 1)}</span>
      <div className="flex gap-2">
        <Button aria-label="Previous page" variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft aria-hidden="true" className="size-4" /></Button>
        <Button aria-label="Next page" variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}><ChevronRight aria-hidden="true" className="size-4" /></Button>
      </div>
    </nav>
  );
}
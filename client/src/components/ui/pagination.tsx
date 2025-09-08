import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  maxPageButtons?: number;
}

export function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  maxPageButtons = 5
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const pageNumbers = useMemo(() => {
    // Calculate which page numbers to show
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = startPage + maxPageButtons - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }, [currentPage, maxPageButtons, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <nav className="flex justify-center mt-8" aria-label="التنقل بين الصفحات">
      <ul className="flex items-center gap-1">
        {/* Previous Page Button */}
        <li>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="الصفحة السابقة"
            className="rtl-flip"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </li>

        {/* First Page Button (if not in range) */}
        {pageNumbers[0] > 1 && (
          <>
            <li>
              <Button
                variant={currentPage === 1 ? "default" : "outline"}
                size="icon"
                onClick={() => onPageChange(1)}
                aria-label="الصفحة الأولى"
                aria-current={currentPage === 1 ? "page" : undefined}
              >
                1
              </Button>
            </li>
            {pageNumbers[0] > 2 && (
              <li className="px-2 text-neutral-500">...</li>
            )}
          </>
        )}

        {/* Page Numbers */}
        {pageNumbers.map(number => (
          <li key={number}>
            <Button
              variant={currentPage === number ? "default" : "outline"}
              size="icon"
              onClick={() => onPageChange(number)}
              aria-label={`الصفحة ${number}`}
              aria-current={currentPage === number ? "page" : undefined}
            >
              {number}
            </Button>
          </li>
        ))}

        {/* Last Page Button (if not in range) */}
        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <li className="px-2 text-neutral-500">...</li>
            )}
            <li>
              <Button
                variant={currentPage === totalPages ? "default" : "outline"}
                size="icon"
                onClick={() => onPageChange(totalPages)}
                aria-label="الصفحة الأخيرة"
                aria-current={currentPage === totalPages ? "page" : undefined}
              >
                {totalPages}
              </Button>
            </li>
          </>
        )}

        {/* Next Page Button */}
        <li>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="الصفحة التالية"
            className="rtl-flip"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </li>
      </ul>
    </nav>
  );
}
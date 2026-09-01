export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  compact?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className = "",
  compact = false,
}: PaginationProps) {
  if (totalPages <= 1 && (!totalItems || totalItems <= (pageSize || 10))) {
    // If only 1 page and no item count is needed, render nothing or minimal counter
    if (totalItems !== undefined && totalItems > 0 && !compact) {
      return (
        <div className={`flex items-center justify-between px-6 py-3.5 border-t border-white/10 bg-[#0e1520]/60 text-xs text-slate-400 ${className}`}>
          <span>
            Showing <strong className="text-white font-mono">{totalItems}</strong> of <strong className="text-white font-mono">{totalItems}</strong> records
          </span>
          <span className="text-[11px] font-mono text-slate-500">Page 1 of 1</span>
        </div>
      );
    }
    return null;
  }

  // Calculate items range
  const fromItem = totalItems !== undefined && pageSize !== undefined
    ? Math.min(totalItems, (currentPage - 1) * pageSize + 1)
    : undefined;
  const toItem = totalItems !== undefined && pageSize !== undefined
    ? Math.min(totalItems, Math.min(currentPage * pageSize, totalItems))
    : undefined;

  // Generate visible page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = compact ? 1 : 2;
    const left = currentPage - delta;
    const right = currentPage + delta + 1;
    let last = 0;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i < right)) {
        if (last && i - last === 2) {
          pages.push(last + 1);
        } else if (last && i - last !== 1) {
          pages.push("...");
        }
        pages.push(i);
        last = i;
      }
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-white/10 bg-[#0e1520]/80 text-xs text-slate-300 transition-all ${className}`}
    >
      {/* Left: Records count & Page size selector */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        {totalItems !== undefined && fromItem !== undefined && toItem !== undefined ? (
          <span className="text-slate-400 font-medium">
            Showing <strong className="text-white font-mono">{fromItem}–{toItem}</strong> of{" "}
            <strong className="text-white font-mono">{totalItems}</strong>
          </span>
        ) : (
          <span className="text-slate-400 font-medium">
            Page <strong className="text-white font-mono">{currentPage}</strong> of{" "}
            <strong className="text-white font-mono">{totalPages}</strong>
          </span>
        )}

        {onPageSizeChange && pageSize && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px] text-slate-500 hidden sm:inline">Show</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-[#121822] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#00c076] font-mono cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-[#121822]">
                  {opt} / page
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page navigation buttons */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
        {/* First Page button (if many pages) */}
        {!compact && totalPages > 4 && (
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(1)}
            title="First Page"
            className="p-1.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Previous button */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Numbered Page Pills */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-500 font-mono select-none">
                  …
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(Number(p))}
                className={`min-w-8 h-8 px-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-[#00c076] text-[#080c10] shadow-md shadow-[#00c076]/20"
                    : "border border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <span className="hidden sm:inline">Next</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Last Page button (if many pages) */}
        {!compact && totalPages > 4 && (
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(totalPages)}
            title="Last Page"
            className="p-1.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

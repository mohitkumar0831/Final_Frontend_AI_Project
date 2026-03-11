import { ChevronLeft } from "lucide-react";
import React from "react";

function Pagination({ currentPage, totalPages, onPageChange }) {
  const getPageWindow = () => {
    const windowStart = Math.floor((currentPage - 1) / 5) * 5 + 1;
    const windowEnd = Math.min(windowStart + 4, totalPages);

    const pages = [];
    for (let i = windowStart; i <= windowEnd; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageWindow();
  const windowStart = pageNumbers[0];
  const windowEnd = pageNumbers[pageNumbers.length - 1];

  const handlePrevFive = () => {
    const newStart = Math.max(1, windowStart - 5);
    onPageChange(newStart);
  };

  const handleNextFive = () => {
    const newStart = windowEnd + 1;
    if (newStart <= totalPages) {
      onPageChange(newStart);
    }
  };

  const handlePrevOne = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextOne = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex justify-center items-center mt-6 space-x-3 mb-2">
      <button
        onClick={handlePrevOne}
        disabled={currentPage === 1}
        className="w-10 h-10 flex items-center justify-center rounded-xl border border-purple-400 text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={18} />
      </button>

      {pageNumbers.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all
            ${
              currentPage === page
                ? "bg-[#654CB7] text-white border-[#654CB7]"
                : "border-[#654CB7] text-[#654CB7] hover:bg-[#654CB7]/20"
            }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={handleNextOne}
        disabled={currentPage === totalPages}
        className="w-10 h-10 flex items-center justify-center rounded-xl border border-purple-400 text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={18} className="rotate-180" />
      </button>
    </div>
  );
}

export default Pagination;
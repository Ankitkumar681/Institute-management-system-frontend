import React from 'react';

export default function PaginationBar({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4 bg-slate-50/50 p-3 rounded-xl">
      <span className="text-xs font-bold text-slate-500">
        Page <span className="text-slate-900 font-extrabold">{currentPage}</span> of <span className="text-slate-900 font-extrabold">{totalPages}</span>
      </span>
      <div className="flex items-center space-x-2">
        <button 
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))} 
          disabled={currentPage === 1}
          style={{ borderColor: '#cbd5e1' }}
          className="h-9 px-4 bg-white border text-slate-700 text-xs font-bold rounded-xl flex items-center transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-slate-50 shadow-sm"
        >
          ← Prev
        </button>
        <button 
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))} 
          disabled={currentPage === totalPages}
          style={{ borderColor: '#cbd5e1' }}
          className="h-9 px-4 bg-white border text-slate-700 text-xs font-bold rounded-xl flex items-center transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-slate-50 shadow-sm"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

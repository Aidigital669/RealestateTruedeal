'use client';

import React, { useEffect } from 'react';
import { X, Search } from 'lucide-react';

interface PropertyNotFoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery?: string;
  selectedLocality?: string;
  selectedBhk?: string;
  onOpenRequirementForm: () => void;
  onResetSearch?: () => void;
}

export function PropertyNotFoundModal({
  isOpen,
  onClose,
  searchQuery,
  onOpenRequirementForm,
}: PropertyNotFoundModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleProceed = () => {
    onClose();
    onOpenRequirementForm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm my-auto bg-zinc-950 text-white rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_50px_rgba(163, 136, 30,0.3)] border border-amber-500/30 overflow-hidden flex flex-col transition-all animate-in zoom-in-95 duration-200 p-6 sm:p-7 text-center space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-sm border border-white/10 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shadow-inner">
          <Search className="w-8 h-8" />
        </div>

        {/* Heading & Simple Text */}
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Property Not Found
          </h3>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xs mx-auto">
            {searchQuery
              ? `No verified properties found matching "${searchQuery}".`
              : 'No verified properties found matching your search criteria.'}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2 space-y-2">
          <button
            onClick={handleProceed}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black rounded-xl text-sm transition shadow-[0_0_25px_rgba(163, 136, 30,0.5)] flex items-center justify-center cursor-pointer tracking-wide"
          >
            <span>Please Fill Your Requirement</span>
          </button>
          <button
            onClick={onClose}
            className="text-[11px] text-zinc-400 hover:text-white font-medium cursor-pointer transition py-1"
          >
            Close & Browse Catalog
          </button>
        </div>
      </div>
    </div>
  );
}

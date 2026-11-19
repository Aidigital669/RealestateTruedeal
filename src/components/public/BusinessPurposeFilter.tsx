'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Briefcase, ChevronDown, Check, X, Store } from 'lucide-react';
import { INITIAL_BUSINESS_PURPOSES, BusinessPurpose } from '@/lib/business-purposes-constants';

interface BusinessPurposeFilterProps {
  selectedPurpose: string;
  onSelectPurpose: (slugOrAll: string) => void;
  className?: string;
  isCommercialActive?: boolean;
}

export function BusinessPurposeFilter({
  selectedPurpose = 'All',
  onSelectPurpose,
  className = '',
  isCommercialActive = false
}: BusinessPurposeFilterProps) {
  const [purposes, setPurposes] = useState<BusinessPurpose[]>(() =>
    INITIAL_BUSINESS_PURPOSES.map((p, idx) => ({
      id: idx + 1,
      name: p.name,
      slug: p.slug,
      isActive: true
    }))
  );
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync live from database if available
  useEffect(() => {
    fetch('/api/business-purposes')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.purposes) && data.purposes.length > 0) {
          setPurposes(data.purposes);
        }
      })
      .catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const activePurposeObj = useMemo(() => {
    if (!selectedPurpose || selectedPurpose === 'All' || selectedPurpose === 'all') return null;
    return purposes.find(
      (p) =>
        p.slug.toLowerCase() === selectedPurpose.toLowerCase() ||
        String(p.id) === selectedPurpose ||
        p.name.toLowerCase() === selectedPurpose.toLowerCase()
    );
  }, [purposes, selectedPurpose]);

  const filteredPurposes = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return purposes;
    return purposes.filter(
      (p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
    );
  }, [purposes, search]);

  const handleSelect = (slug: string) => {
    onSelectPurpose(slug);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectPurpose('All');
    setSearch('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition flex items-center justify-between gap-2 cursor-pointer border ${
          activePurposeObj
            ? 'bg-[#b9974f] text-zinc-950 font-black border-[#b9974f] shadow-xs'
            : isCommercialActive
            ? 'bg-[#b9974f]/15 hover:bg-[#b9974f]/25 text-zinc-950 border-[#b9974f]/40 font-semibold shadow-2xs'
            : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
        }`}
        title="Filter properties by suitable business purpose"
      >
        <div className="flex items-center gap-2 truncate">
          <Store
            className={`w-4 h-4 shrink-0 ${
              activePurposeObj ? 'text-zinc-950' : 'text-amber-600'
            }`}
          />
          <span className="truncate">
            {activePurposeObj ? activePurposeObj.name : 'Business Purpose'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {activePurposeObj ? (
            <span
              onClick={handleClear}
              className="w-4 h-4 rounded-full bg-zinc-950/20 hover:bg-zinc-950/40 text-zinc-950 flex items-center justify-center transition"
              title="Clear business purpose filter"
            >
              <X className="w-3 h-3 stroke-[3]" />
            </span>
          ) : (
            <ChevronDown
              className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-amber-600' : ''
              }`}
            />
          )}
        </div>
      </button>

      {/* Searchable Dropdown Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 sm:right-auto sm:w-80 mt-1.5 z-50 bg-white border border-zinc-200 rounded-2xl shadow-2xl p-2.5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-1 text-[11px] font-bold text-zinc-500 border-b border-zinc-100 pb-1.5">
            <span className="flex items-center gap-1.5 text-amber-900 uppercase tracking-wider">
              <Briefcase className="w-3 h-3 text-amber-600" />
              <span>Suitable Business Purpose</span>
            </span>
            <span className="text-zinc-400 font-normal">{purposes.length} options</span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search purpose (e.g. Jewellery, Café)..."
              autoFocus
              className="w-full pl-8 pr-7 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:border-amber-500 focus:bg-white transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Purpose Options List */}
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1 text-xs">
            {/* "All Purposes" Option */}
            <button
              type="button"
              onClick={() => handleSelect('All')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left cursor-pointer ${
                !activePurposeObj
                  ? 'bg-[#b9974f] text-zinc-950 font-black shadow-xs'
                  : 'hover:bg-zinc-100 text-zinc-700'
              }`}
            >
              <span>All Purposes (Unrestricted)</span>
              {!activePurposeObj && <Check className="w-4 h-4 stroke-[3]" />}
            </button>

            {filteredPurposes.length === 0 ? (
              <div className="py-4 text-center text-xs text-zinc-400">
                No matching business purposes found
              </div>
            ) : (
              filteredPurposes.map((item) => {
                const isSelected = activePurposeObj?.slug === item.slug;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.slug)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left cursor-pointer ${
                      isSelected
                        ? 'bg-[#b9974f] text-zinc-950 font-black shadow-xs'
                        : 'hover:bg-[#b9974f]/10 text-zinc-800'
                    }`}
                  >
                    <span className="truncate pr-2">{item.name}</span>
                    {isSelected && <Check className="w-4 h-4 stroke-[3] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

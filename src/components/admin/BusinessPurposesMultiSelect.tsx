'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Check, Briefcase, ChevronDown, Plus, Sparkles } from 'lucide-react';
import { INITIAL_BUSINESS_PURPOSES, BusinessPurpose } from '@/lib/business-purposes-constants';

export const POPULAR_SUITABLE_PRESETS = [
  { label: 'Retail Shop', searchKey: 'Jewellery' },
  { label: 'Showroom', searchKey: 'Showroom' },
  { label: 'Corporate Office', searchKey: 'Office' },
  { label: 'Doctor Clinic', searchKey: 'Clinic' },
  { label: 'Restaurant / Café', searchKey: 'Restaurant' },
  { label: 'Bank / ATM', searchKey: 'Bank' },
  { label: 'Supermarket', searchKey: 'Supermarket' },
  { label: 'Warehouse', searchKey: 'Other' },
  { label: 'IT / ITES Space', searchKey: 'Office' },
  { label: 'Co-Working', searchKey: 'Office' },
  { label: 'Gym / Fitness', searchKey: 'Gym' }
];

interface BusinessPurposesMultiSelectProps {
  selectedIds: (number | string)[];
  onChange: (items: (number | string)[]) => void;
  label?: string;
}

export function BusinessPurposesMultiSelect({
  selectedIds = [],
  onChange,
  label = 'Suitable For (Permitted Operations & Businesses)'
}: BusinessPurposesMultiSelectProps) {
  const [purposes, setPurposes] = useState<BusinessPurpose[]>(() =>
    INITIAL_BUSINESS_PURPOSES.map((p, idx) => ({
      id: idx + 1,
      name: p.name,
      slug: p.slug,
      isActive: true
    }))
  );
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch live purposes from backend if available
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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Map selectedIds to full display objects (supports both IDs and custom string tags)
  const resolvedSelected = useMemo(() => {
    const list: { id: number | string; name: string; isCustom: boolean }[] = [];
    const seen = new Set<string>();

    for (const raw of selectedIds) {
      if (raw === undefined || raw === null || raw === '') continue;

      if (typeof raw === 'number' || /^\d+$/.test(String(raw))) {
        const numId = Number(raw);
        const match = purposes.find((p) => p.id === numId);
        const name = match ? match.name : `Purpose #${numId}`;
        const key = name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          list.push({ id: numId, name, isCustom: false });
        }
      } else {
        const strVal = String(raw).trim();
        // Check if string matches any known purpose name or slug
        const match = purposes.find(
          (p) => p.slug.toLowerCase() === strVal.toLowerCase() || p.name.toLowerCase() === strVal.toLowerCase()
        );
        if (match) {
          const key = match.name.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            list.push({ id: match.id, name: match.name, isCustom: false });
          }
        } else {
          const key = strVal.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            list.push({ id: strVal, name: strVal, isCustom: true });
          }
        }
      }
    }

    return list;
  }, [selectedIds, purposes]);

  const filteredPurposes = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return purposes;
    return purposes.filter(
      (p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
    );
  }, [purposes, search]);

  const isSelected = (idOrName: number | string) => {
    if (typeof idOrName === 'number') {
      return resolvedSelected.some((item) => item.id === idOrName);
    }
    const lower = String(idOrName).toLowerCase().trim();
    return resolvedSelected.some((item) => 
      String(item.id).toLowerCase() === lower || item.name.toLowerCase() === lower
    );
  };

  const handleTogglePurpose = (p: BusinessPurpose) => {
    const alreadySelected = isSelected(p.id);
    if (alreadySelected) {
      onChange(resolvedSelected.filter((item) => item.id !== p.id && item.name !== p.name).map((item) => item.id));
    } else {
      onChange([...resolvedSelected.map((item) => item.id), p.id]);
    }
  };

  const handleRemove = (itemToRemove: { id: number | string; name: string }, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange(
      resolvedSelected
        .filter((item) => item.id !== itemToRemove.id && item.name !== itemToRemove.name)
        .map((item) => item.id)
    );
  };

  const handleAddCustom = (text: string) => {
    const trimmed = text.trim().replace(/^#+/, '').trim();
    if (!trimmed) return;

    // Check if matches existing purpose
    const matched = purposes.find(
      (p) => p.name.toLowerCase() === trimmed.toLowerCase() || p.slug.toLowerCase() === trimmed.toLowerCase()
    );

    const valToAdd = matched ? matched.id : trimmed;
    if (!isSelected(valToAdd)) {
      onChange([...resolvedSelected.map((item) => item.id), valToAdd]);
    }
    setCustomInput('');
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className="space-y-2.5" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="block font-bold text-zinc-900 text-xs flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-amber-600" />
          <span>{label}</span>
          <span className="text-[10px] text-zinc-400 font-normal">
            (Choose standard operations or enter custom suitability)
          </span>
        </label>
        {resolvedSelected.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[11px] text-rose-600 hover:underline cursor-pointer font-semibold"
          >
            Clear all ({resolvedSelected.length})
          </button>
        )}
      </div>

      {/* Quick Commercial Preset Buttons */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
          Quick Preset Select:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_SUITABLE_PRESETS.map((preset) => {
            const active = isSelected(preset.label);
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  if (active) {
                    handleRemove({ id: preset.label, name: preset.label });
                  } else {
                    handleAddCustom(preset.label);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                  active
                    ? 'bg-amber-500 text-zinc-950 border border-amber-600 shadow-2xs'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-amber-100 hover:text-amber-950 border border-zinc-200'
                }`}
              >
                {active ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <Plus className="w-2.5 h-2.5" />}
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Chips / Badges Display */}
      {resolvedSelected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2.5 bg-amber-50/70 rounded-xl border border-amber-200/90 max-h-32 overflow-y-auto shadow-2xs">
          {resolvedSelected.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-zinc-900 border border-amber-300 shadow-2xs group"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>{item.name}</span>
              <button
                type="button"
                onClick={(e) => handleRemove(item, e)}
                className="w-4 h-4 rounded-full flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 transition cursor-pointer"
                title={`Remove ${item.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown Selector & Custom Input Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Dropdown Trigger Box */}
        <div className="relative">
          <div
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full min-h-[38px] px-3 py-2 border rounded-xl bg-white cursor-pointer flex items-center justify-between gap-2 text-xs transition ${
              isOpen ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-zinc-200 hover:border-zinc-300'
            }`}
          >
            <div className="flex items-center gap-2 text-zinc-600 truncate">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              {resolvedSelected.length === 0 ? (
                <span className="text-zinc-400">Select standard purpose...</span>
              ) : (
                <span className="font-semibold text-zinc-900">
                  {resolvedSelected.length} {resolvedSelected.length === 1 ? 'Purpose' : 'Purposes'} Selected
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-amber-600' : ''
              }`}
            />
          </div>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-zinc-200 rounded-xl shadow-xl p-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search purpose (e.g. jewellery, clinic)..."
                  autoFocus
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Checkbox Options List */}
              <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
                {filteredPurposes.length === 0 ? (
                  <div className="py-4 text-center text-xs text-zinc-400">
                    No matching business purposes
                  </div>
                ) : (
                  filteredPurposes.map((p) => {
                    const checked = isSelected(p.id);
                    return (
                      <label
                        key={p.id}
                        onClick={() => handleTogglePurpose(p)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition select-none ${
                          checked
                            ? 'bg-amber-50 text-amber-950 font-semibold'
                            : 'hover:bg-zinc-50 text-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                              checked
                                ? 'bg-amber-500 border-amber-600 text-zinc-950 shadow-2xs'
                                : 'border-zinc-300 bg-white'
                            }`}
                          >
                            {checked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{p.name}</span>
                        </div>
                        {checked && (
                          <span className="text-[10px] text-amber-700 font-bold">Selected</span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Custom Purpose Input with + Add Button */}
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustom(customInput);
              }
            }}
            placeholder="Custom (e.g. shop available in Undri)..."
            className="flex-1 px-3 py-2 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
          <button
            type="button"
            onClick={() => handleAddCustom(customInput)}
            disabled={!customInput.trim()}
            className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white font-bold rounded-xl text-xs cursor-pointer transition shrink-0 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}

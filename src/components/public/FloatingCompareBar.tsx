'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Scale, X, ArrowRight, Trash2 } from 'lucide-react';
import { usePropertyComparison } from '@/context/PropertyComparisonContext';

export function FloatingCompareBar() {
  const pathname = usePathname();
  const { compareList, removeFromCompare, clearCompare } = usePropertyComparison();

  // Don't show floating bar if comparison list is empty, on compare page, or on admin/crm portals
  if (
    compareList.length === 0 ||
    pathname === '/compare' ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/crm')
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-3xl animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-zinc-950/95 backdrop-blur-md text-white border border-zinc-800 rounded-3xl p-3 sm:p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Indicator & Thumbnails */}
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-2 pr-2 border-r border-zinc-800 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold leading-none">Compare Residences</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">{compareList.length} of 4 selected</div>
            </div>
          </div>

          {/* Property Thumbnails */}
          <div className="flex items-center gap-2 shrink-0">
            {compareList.map((prop) => (
              <div
                key={prop.id}
                className="relative group w-12 h-12 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 shrink-0"
                title={`${prop.name} (${prop.price})`}
              >
                <Image
                  src={prop.image}
                  alt={prop.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  onClick={() => removeFromCompare(prop.id)}
                  className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-white"
                  title="Remove from comparison"
                >
                  <X className="w-4 h-4 text-rose-400" />
                </button>
              </div>
            ))}

            {/* Empty slots indicator */}
            {Array.from({ length: 4 - compareList.length }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="w-12 h-12 rounded-xl border border-dashed border-zinc-800 flex items-center justify-center text-zinc-600 text-[10px] shrink-0"
                title="Select another property to compare"
              >
                +
              </div>
            ))}
          </div>
        </div>

        {/* Right Actions: Compare CTA and Clear */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
          <button
            onClick={clearCompare}
            className="text-[11px] font-semibold text-zinc-400 hover:text-white px-2.5 py-2 rounded-xl hover:bg-zinc-900 transition flex items-center gap-1 cursor-pointer"
            title="Clear all selected properties"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          <Link
            href={`/compare?ids=${compareList.map((p) => p.id).join(',')}`}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Compare Now ({compareList.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

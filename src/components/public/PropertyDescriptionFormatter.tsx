'use client';

import React, { useState, useMemo } from 'react';
import {
  ListChecks,
  LayoutGrid,
  FileText,
  MapPin,
  Building2,
  Ruler,
  Car,
  CheckCircle2,
  Sparkles,
  Coins,
  Store,
  Layers,
  Check
} from 'lucide-react';

interface PropertyDescriptionFormatterProps {
  description: string;
  className?: string;
  defaultView?: 'list' | 'cards' | 'text';
  showViewToggle?: boolean;
}

interface ParsedItem {
  id: number;
  raw: string;
  hasColon: boolean;
  label?: string;
  value?: string;
  category: 'overview' | 'commercial' | 'area' | 'location' | 'suitability' | 'facility' | 'general';
}

const DOSSIER_TAG_REGEX = /<!--\s*DOSSIER_DATA:\s*[\s\S]*?\s*-->/g;

/**
 * Strips raw HTML comments, cleans hashtags, and splits into distinct line items
 */
export function parseDescriptionLines(rawText: string = ''): string[] {
  if (!rawText) return [];

  // Remove internal dossier metadata comment if present
  const cleaned = rawText.replace(DOSSIER_TAG_REGEX, '').trim();
  if (!cleaned) return [];

  // If text contains hashtag delimiters (e.g. #Commercial Shop #Prime Location)
  if (cleaned.includes('#')) {
    return cleaned
      .split(/(?:^|\s+)#/)
      .map((item) => item.replace(/^#+/, '').trim())
      .filter((item) => item.length > 0);
  }

  // If text has newline breaks
  if (cleaned.includes('\n')) {
    return cleaned
      .split(/\r?\n/)
      .map((line) => line.replace(/^[•\-\*#\d\.)\s]+/, '').trim())
      .filter((line) => line.length > 0);
  }

  // Fallback: If it's a single paragraph with multiple sentences
  return [cleaned];
}

/**
 * Helper to produce a clean, hashtag-free snippet for card views & hover popups
 */
export function formatCompactDescription(rawText: string = '', maxItems = 2): string {
  const lines = parseDescriptionLines(rawText);
  if (lines.length === 0) return '';
  if (lines.length === 1) return lines[0];
  return lines.slice(0, maxItems).join(' • ');
}

export function PropertyDescriptionFormatter({
  description,
  className = '',
  defaultView = 'list',
  showViewToggle = true
}: PropertyDescriptionFormatterProps) {
  const [view, setView] = useState<'list' | 'cards' | 'text'>(defaultView);

  const parsedItems: ParsedItem[] = useMemo(() => {
    const lines = parseDescriptionLines(description);

    return lines.map((line, idx) => {
      // Check for Key: Value format (e.g. "Total Stated Area: 2,200 Sq.Ft." or "Expected Rent: ₹1,50,000")
      const colonMatch = line.match(/^([^:–—]+[:–—])\s*(.*)$/);
      const lower = line.toLowerCase();

      let category: ParsedItem['category'] = 'general';

      if (idx === 0 && !colonMatch) {
        category = 'overview';
      } else if (/(?:rent|deposit|price|cost|₹|rs\.?|inr|brokerage|maintenance)/i.test(lower)) {
        category = 'commercial';
      } else if (/(?:area|sq\.?\s*ft|sqft|sq\s*meters|carpet|built-?up|super\s*area|basement|mezzanine|floor\s*plate)/i.test(lower)) {
        category = 'area';
      } else if (/(?:location|located|near|chowk|road|facing|connectivity|opposite|highway|expressway|metro|station|junction)/i.test(lower)) {
        category = 'location';
      } else if (/(?:suitable|ideal\s*for|commercial\s*shop|retail|showroom|office|business|boutique|clinic|hospital|outlet)/i.test(lower)) {
        category = 'suitability';
      } else if (/(?:parking|car\s*park|toilet|washroom|bathroom|water|dg\s*power|power\s*backup|lift|elevator)/i.test(lower)) {
        category = 'facility';
      }

      if (colonMatch) {
        return {
          id: idx,
          raw: line,
          hasColon: true,
          label: colonMatch[1].trim(),
          value: colonMatch[2].trim(),
          category
        };
      }

      return {
        id: idx,
        raw: line,
        hasColon: false,
        category
      };
    });
  }, [description]);

  // Grouped for Spec Cards view
  const groupedData = useMemo(() => {
    const commercials = parsedItems.filter((i) => i.category === 'commercial');
    const areas = parsedItems.filter((i) => i.category === 'area');
    const locations = parsedItems.filter((i) => i.category === 'location');
    const suitability = parsedItems.filter((i) => i.category === 'suitability');
    const facilities = parsedItems.filter((i) => i.category === 'facility');
    const general = parsedItems.filter(
      (i) => i.category === 'general' || i.category === 'overview'
    );

    return { commercials, areas, locations, suitability, facilities, general };
  }, [parsedItems]);

  if (!description || parsedItems.length === 0) {
    return (
      <p className="text-xs sm:text-sm text-zinc-500 italic">
        No descriptive specifications provided for this property.
      </p>
    );
  }

  // If there's only 1 simple paragraph without hashtags or bullets, render cleanly
  if (parsedItems.length === 1 && !description.includes('#')) {
    return (
      <p className={`text-xs sm:text-sm text-zinc-600 leading-relaxed ${className}`}>
        {parsedItems[0].raw}
      </p>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Pattern View Switcher Header */}
      {showViewToggle && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Structured Narrative Specifications ({parsedItems.length} points)</span>
          </div>

          <div className="inline-flex items-center gap-1 p-1 bg-zinc-100/90 rounded-xl border border-zinc-200/80 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                view === 'list'
                  ? 'bg-white text-zinc-950 font-bold shadow-2xs border border-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
              title="Line-by-line formatted list"
            >
              <ListChecks className="w-3 h-3 text-amber-600" />
              <span>List View</span>
            </button>

            <button
              type="button"
              onClick={() => setView('cards')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                view === 'cards'
                  ? 'bg-white text-zinc-950 font-bold shadow-2xs border border-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
              title="Categorized feature and spec cards"
            >
              <LayoutGrid className="w-3 h-3 text-amber-600" />
              <span>Spec Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setView('text')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                view === 'text'
                  ? 'bg-white text-zinc-950 font-bold shadow-2xs border border-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
              title="Clean editorial text"
            >
              <FileText className="w-3 h-3 text-amber-600" />
              <span>Clean Text</span>
            </button>
          </div>
        </div>
      )}

      {/* PATTERN 1: LINE-BY-LINE LIST VIEW (DEFAULT) */}
      {view === 'list' && (
        <ul className="space-y-2.5 pt-1">
          {parsedItems.map((item, idx) => {
            const isFirst = idx === 0 && item.category === 'overview';
            const isCommercial = item.category === 'commercial';
            const isArea = item.category === 'area';

            return (
              <li
                key={item.id}
                className={`flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed p-2.5 rounded-xl border transition-colors ${
                  isFirst
                    ? 'bg-amber-500/5 border-amber-200/80 font-semibold text-zinc-900'
                    : isCommercial
                    ? 'bg-emerald-50/40 border-emerald-200/60 text-zinc-800'
                    : isArea
                    ? 'bg-zinc-50 border-zinc-200/70 text-zinc-800'
                    : 'bg-white border-zinc-200/60 text-zinc-700 hover:bg-zinc-50/60'
                }`}
              >
                <span className="shrink-0 mt-0.5">
                  {isFirst ? (
                    <Store className="w-4 h-4 text-amber-600" />
                  ) : isCommercial ? (
                    <Coins className="w-4 h-4 text-emerald-600" />
                  ) : isArea ? (
                    <Ruler className="w-4 h-4 text-amber-700" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  )}
                </span>

                <div className="flex-1">
                  {item.hasColon ? (
                    <div className="flex flex-wrap items-baseline gap-1.5">
                      <span className="font-bold text-zinc-950">{item.label}</span>
                      <span
                        className={
                          isCommercial
                            ? 'font-bold text-emerald-700 font-mono'
                            : isArea
                            ? 'font-bold text-amber-900 font-mono'
                            : 'text-zinc-700 font-medium'
                        }
                      >
                        {item.value}
                      </span>
                    </div>
                  ) : (
                    <span className={isFirst ? 'font-bold text-zinc-950 text-sm sm:text-base' : 'text-zinc-800'}>
                      {item.raw}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* PATTERN 2: STRUCTURED SPEC & FEATURE CARDS */}
      {view === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {/* General Overview & Headline Banner */}
          {groupedData.general.length > 0 && (
            <div className="md:col-span-2 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-50/50 to-white border border-amber-200/70 space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-amber-600" />
                <span>Primary Property Dossier</span>
              </span>
              <ul className="space-y-1 text-xs sm:text-sm font-semibold text-zinc-900">
                {groupedData.general.map((item) => (
                  <li key={item.id} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{item.raw}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Area & Dimension Specs */}
          {groupedData.areas.length > 0 && (
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-950">
                <Ruler className="w-4 h-4 text-amber-600" />
                <span>Dimensions & Area Breakdown</span>
              </div>
              <ul className="space-y-2">
                {groupedData.areas.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-zinc-200/70 text-xs font-medium"
                  >
                    <span className="text-zinc-600">{item.label || item.raw}</span>
                    {item.value && (
                      <span className="font-mono font-bold text-zinc-900 bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200/60">
                        {item.value}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Commercial & Financial Terms */}
          {groupedData.commercials.length > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-50/30 border border-emerald-200/70 space-y-2 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                <Coins className="w-4 h-4 text-emerald-700" />
                <span>Commercial & Financial Terms</span>
              </div>
              <ul className="space-y-2">
                {groupedData.commercials.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-emerald-200/60 text-xs font-medium"
                  >
                    <span className="text-zinc-700">{item.label || item.raw}</span>
                    {item.value && (
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {item.value}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Location & Road Connectivity */}
          {groupedData.locations.length > 0 && (
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-950">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>Location & Arterial Connectivity</span>
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-700">
                {groupedData.locations.map((item) => (
                  <li key={item.id} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{item.raw}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suitability & Facilities */}
          {(groupedData.suitability.length > 0 || groupedData.facilities.length > 0) && (
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-950">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>Suitability & On-Site Facilities</span>
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-700">
                {[...groupedData.suitability, ...groupedData.facilities].map((item) => (
                  <li key={item.id} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                    <span>{item.raw}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* PATTERN 3: CLEAN EDITORIAL PARAGRAPH TEXT */}
      {view === 'text' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50/80 border border-zinc-200 text-xs sm:text-sm text-zinc-700 leading-relaxed space-y-3 font-normal">
          <p>
            {parsedItems.map((item, idx) => (
              <span key={item.id}>
                {item.raw}
                {idx < parsedItems.length - 1 ? '. ' : '.'}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}

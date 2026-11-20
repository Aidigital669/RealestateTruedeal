'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  RefreshCw,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Pencil,
  Eye,
  Home,
  Building,
  Users,
  Layout,
  Info
} from 'lucide-react';
import { DEFAULT_PAGE_HEADINGS, PageHeadings } from '@/lib/page-headings-config';
import { clearPageHeadingsCache } from '@/hooks/usePageHeadings';

// ─────────────────────────────────────────────
// Field metadata for the editor UI
// ─────────────────────────────────────────────
interface FieldMeta {
  key: keyof PageHeadings;
  label: string;
  hint?: string;
  multiline?: boolean;
}

interface Section {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  fields: FieldMeta[];
}

const SECTIONS: Section[] = [
  {
    id: 'footer',
    icon: Layout,
    title: 'Footer Navigation Headings',
    description: 'Column headings in the site footer (visible in screenshot)',
    fields: [
      { key: 'footer_col_commercial', label: 'Column 1 – Commercial', hint: 'e.g. Showroom & Office' },
      { key: 'footer_col_residential', label: 'Column 2 – Residential', hint: 'e.g. Residential & Land' },
      { key: 'footer_col_specialized', label: 'Column 3 – Specialized', hint: 'e.g. Specialized & Advisory' },
      { key: 'footer_col_portals', label: 'Column 4 – Portals', hint: 'e.g. Portals & Access' },
    ],
  },
  {
    id: 'homepage',
    icon: Home,
    title: 'Homepage Section Headings',
    description: 'Hero banner, featured listings, and marketing sections on the homepage',
    fields: [
      { key: 'home_hero_title', label: 'Hero Title', hint: 'Main headline on the hero banner' },
      { key: 'home_hero_subtitle', label: 'Hero Subtitle', hint: 'Supporting text below hero headline', multiline: true },
      { key: 'home_featured_title', label: 'Featured Properties Title', hint: 'Heading for featured listings section' },
      { key: 'home_featured_subtitle', label: 'Featured Properties Subtitle' },
      { key: 'home_active_buyers_title', label: 'Active Buyers Section Title' },
      { key: 'home_why_us_title', label: 'Why Choose Us Title' },
      { key: 'home_explore_title', label: 'Explore by Category Title' },
    ],
  },
  {
    id: 'properties',
    icon: Building,
    title: 'Properties Listing Page',
    description: 'Headings on the /properties all-listings page',
    fields: [
      { key: 'properties_page_title', label: 'Page Title', hint: 'e.g. All Properties' },
      { key: 'properties_page_subtitle', label: 'Page Subtitle' },
      { key: 'category_page_subtitle', label: 'Category Pages Subtitle', hint: 'Shown on /office-space, /restaurant etc.' },
    ],
  },
  {
    id: 'buyers',
    icon: Users,
    title: 'Buyer Demand Section',
    description: 'Headings on the Active Buyers / Buyer Demand section',
    fields: [
      { key: 'buyers_section_title', label: 'Section Title', hint: 'e.g. Active Buyers' },
      { key: 'buyers_section_subtitle', label: 'Section Subtitle', multiline: true },
    ],
  },
  {
    id: 'detail',
    icon: FileText,
    title: 'Property Detail Page',
    description: 'Section headings on individual property detail pages',
    fields: [
      { key: 'detail_location_title', label: 'Location Section Heading' },
      { key: 'detail_amenities_title', label: 'Amenities Section Heading' },
      { key: 'detail_schedule_title', label: 'Site Visit Form Heading' },
      { key: 'detail_similar_title', label: 'Similar Properties Heading' },
    ],
  },
];

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export function PageHeadingsEditor() {
  const [headings, setHeadings] = useState<PageHeadings>({ ...DEFAULT_PAGE_HEADINGS });
  const [original, setOriginal] = useState<PageHeadings>({ ...DEFAULT_PAGE_HEADINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [activeSection, setActiveSection] = useState('footer');
  const [dirty, setDirty] = useState(false);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/page-headings', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setHeadings({ ...data.headings });
        setOriginal({ ...data.headings });
        setDirty(false);
      }
    } catch {
      showToast('error', 'Failed to load page headings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = (key: keyof PageHeadings, value: string) => {
    setHeadings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleReset = () => {
    setHeadings({ ...original });
    setDirty(false);
  };

  const handleResetToDefaults = () => {
    setHeadings({ ...DEFAULT_PAGE_HEADINGS });
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/page-headings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headings }),
      });
      const data = await res.json();
      if (data.success) {
        setOriginal({ ...headings });
        setDirty(false);
        clearPageHeadingsCache(); // bust hook cache
        showToast('success', 'Page headings saved! Changes are live on the website.');
      } else {
        showToast('error', data.error || 'Save failed');
      }
    } catch {
      showToast('error', 'Network error — could not save');
    } finally {
      setSaving(false);
    }
  };

  const currentSection = SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-900">Page Headings Editor</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              CMS
            </span>
            {dirty && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200 animate-pulse">
                Unsaved
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Edit the headings and titles shown on each section of your website. Changes go live immediately on save.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => load()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleResetToDefaults}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          {dirty && (
            <button
              onClick={handleReset}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 border border-rose-200 text-rose-600 rounded-lg text-xs font-semibold hover:bg-rose-50 transition cursor-pointer"
            >
              Discard Changes
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer ${
              dirty && !saving
                ? 'bg-black text-white hover:bg-zinc-800'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none'
            }`}
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Info Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <span>
          These headings appear on your <strong>public website</strong> — footer, homepage, listings, and property
          detail pages. After saving, refresh the public website to see your changes.
        </span>
      </div>

      <div className="flex gap-5">
        {/* Left nav */}
        <div className="w-56 shrink-0 space-y-1">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
                {sec.title.split(' ')[0]}&nbsp;{sec.title.split(' ').slice(1).join(' ')}
              </button>
            );
          })}
        </div>

        {/* Right editor panel */}
        <div className="flex-1 bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs">
          {/* Panel header */}
          <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center gap-3">
            {React.createElement(currentSection.icon, { className: 'w-4 h-4 text-amber-600 shrink-0' })}
            <div>
              <div className="text-sm font-bold text-zinc-900">{currentSection.title}</div>
              <div className="text-xs text-zinc-500">{currentSection.description}</div>
            </div>
          </div>

          {/* Fields */}
          <div className="divide-y divide-zinc-100">
            {loading ? (
              <div className="p-8 text-center text-zinc-400 text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                Loading headings…
              </div>
            ) : (
              currentSection.fields.map((field) => {
                const currentVal = headings[field.key] ?? '';
                const defaultVal = DEFAULT_PAGE_HEADINGS[field.key];
                const isModified = currentVal !== defaultVal;

                return (
                  <div key={field.key} className="px-6 py-4 hover:bg-zinc-50/50 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <label className="text-xs font-semibold text-zinc-700">
                            {field.label}
                          </label>
                          {isModified && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium border border-amber-200">
                              Customised
                            </span>
                          )}
                        </div>
                        {field.hint && (
                          <p className="text-[11px] text-zinc-400 mb-2">{field.hint}</p>
                        )}

                        {field.multiline ? (
                          <textarea
                            rows={3}
                            value={currentVal}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white resize-none"
                          />
                        ) : (
                          <input
                            type="text"
                            value={currentVal}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                          />
                        )}

                        {isModified && (
                          <p className="text-[10px] text-zinc-400 mt-1">
                            Default: <span className="italic text-zinc-500">{defaultVal}</span>
                          </p>
                        )}
                      </div>

                      {/* Preview pill */}
                      <div className="shrink-0 mt-6">
                        <div className="text-[11px] px-2.5 py-1 bg-zinc-100 rounded-lg border border-zinc-200 text-zinc-500 max-w-[120px] truncate font-mono">
                          {currentVal || <span className="italic text-zinc-300">empty</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer action */}
          {!loading && (
            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving || !dirty}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition shadow-xs cursor-pointer ${
                  dirty && !saving
                    ? 'bg-black text-white hover:bg-zinc-800'
                    : 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none'
                }`}
              >
                {saving ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                ) : (
                  <><Save className="w-3.5 h-3.5" /> Save All Changes</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

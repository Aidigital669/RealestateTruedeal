'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home, ShieldCheck } from 'lucide-react';
import { CategoryItem } from '@/lib/categories-data';

interface CategoryHeroSEOHeaderProps {
  category: CategoryItem;
  totalPropertiesCount?: number;
}

export function getCategorySeoHeading(category: CategoryItem): string {
  switch (category.slug) {
    case 'hospital':
      return 'Hospital Properties for Buy & Hospital Properties for Rent in Pune';
    case 'office-space':
    case 'office-in-it-park':
    case 'coworking-office-space':
      return 'Office Space Properties for Buy & Office Space Properties for Rent in Pune';
    case 'shop-showroom':
      return 'Shop & Showroom Properties for Buy & Shop & Showroom Properties for Rent in Pune';
    case 'restaurant':
      return 'Restaurant Properties for Buy & Restaurant Properties for Rent in Pune';
    case 'warehouse':
      return 'Warehouse Properties for Buy & Warehouse Properties for Rent in Pune';
    case 'residential-apartment':
      return 'Residential Apartment Properties for Buy & Residential Apartment Properties for Rent in Pune';
    case 'residential-bungalow':
      return 'Bungalow & Villa Properties for Buy & Bungalow & Villa Properties for Rent in Pune';
    case 'hotel-resort':
      return 'Hotel & Resort Properties for Buy & Hotel & Resort Properties for Rent in Pune';
    case 'preleased-properties':
      return 'Preleased Commercial Properties for Buy & Investment in Pune';
    case 'pre-launch-projects':
      return 'Pre-Launch Projects & New Property Launches for Buy in Pune';
    case 'residential-commercial-land-plot':
      return 'Residential & Commercial Land & Plot Properties for Buy in Pune';
    case 'agriculture-farm-land':
      return 'Agricultural Land & Farm Plot Properties for Buy near Pune';
    case 'industrial-land':
      return 'MIDC & Industrial Land Plot Properties for Buy in Pune';
    case 'tdr':
      return 'Transferable Development Rights (TDR) & FSI in Pune & PCMC';
    case 'group-booking':
      return 'Bulk Property Purchases & Group Booking in Pune';
    default:
      return `${category.title} Properties for Buy & ${category.title} Properties for Rent in Pune`;
  }
}

export function CategoryHeroSEOHeader({
  category,
  totalPropertiesCount
}: CategoryHeroSEOHeaderProps) {
  const title = getCategorySeoHeading(category);

  return (
    <section className="bg-zinc-950 text-white border-b border-zinc-800/80 px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
        <div className="space-y-1">
          {/* Line 1: Breadcrumb + Group Indicator */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <Link href="/" className="hover:text-amber-400 transition-colors flex items-center gap-1">
              <Home className="w-3 h-3" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-2.5 h-2.5 text-zinc-600" />
            <Link href="/properties" className="hover:text-amber-400 transition-colors">
              <span>Categories</span>
            </Link>
            <ChevronRight className="w-2.5 h-2.5 text-zinc-600" />
            <span className="text-amber-400 font-bold">{category.title}</span>
            <span className="text-zinc-600 mx-1">•</span>
            <span className="text-zinc-400 font-medium">{category.groupLabel}</span>
          </nav>

          {/* Line 2: Small, Clean H1 SEO Title */}
          <h1 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight leading-snug">
            {title}
          </h1>
        </div>

        {/* Right Trust Badge (Compact) */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 pt-0.5 md:pt-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-amber-400">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>MahaRERA Verified</span>
          </div>
          {typeof totalPropertiesCount === 'number' && totalPropertiesCount > 0 && (
            <span className="text-[11px] text-zinc-400 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">
              {totalPropertiesCount} Verified
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

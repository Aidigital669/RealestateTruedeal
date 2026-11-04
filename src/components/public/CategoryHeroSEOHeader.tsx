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
    case 'office-space':
      return 'Office Space for Buy & Lease / Rent in Pune';
    case 'preleased-properties':
      return 'Preleased Commercial Properties for Sale & Investment in Pune';
    case 'shop-showroom':
      return 'Commercial Shops & Showrooms for Sale & Lease in Pune';
    case 'office-in-it-park':
      return 'IT Park Offices & Tech Workspaces for Buy & Lease in Pune';
    case 'coworking-office-space':
      return 'Coworking & Managed Flexible Workspaces in Pune';
    case 'restaurant':
      return 'Commercial Restaurant & F&B Retail Spaces for Lease / Sale in Pune';
    case 'warehouse':
      return 'Industrial Warehouses & Logistics Hubs in Pune';
    case 'residential-apartment':
      return 'Luxury Residential Apartments & Flats for Sale in Pune';
    case 'residential-bungalow':
      return 'Luxury Bungalows, Independent Villas & Row Houses for Sale in Pune';
    case 'pre-launch-projects':
      return 'Pre-Launch Projects & New Launches in Pune';
    case 'residential-commercial-land-plot':
      return 'Residential & Commercial NA Land & Plots for Sale in Pune';
    case 'agriculture-farm-land':
      return 'Agricultural Land & Managed Farm Plots for Sale near Pune';
    case 'industrial-land':
      return 'MIDC & Industrial Land / Factory Plots for Sale in Pune';
    case 'hospital':
      return 'Hospital & Healthcare Commercial Properties for Buy & Lease in Pune';
    case 'hotel-resort':
      return 'Commercial Hotels & Luxury Resorts for Sale & Lease in Pune';
    case 'tdr':
      return 'Transferable Development Rights (TDR) & FSI in Pune & PCMC';
    case 'group-booking':
      return 'Bulk Property Purchases & Group Booking in Pune';
    default:
      return `${category.title} for Buy & Lease in Pune`;
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

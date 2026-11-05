import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Clock
} from 'lucide-react';
import { CATEGORIES_DATA } from '@/lib/categories-data';

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  // Split categories for clean column layout
  const commercialCats = CATEGORIES_DATA.filter((c) =>
    ['office-space', 'preleased-properties', 'shop-showroom', 'restaurant', 'warehouse'].includes(c.slug)
  );

  const residentialAndLandCats = CATEGORIES_DATA.filter((c) =>
    ['residential-apartment', 'residential-bungalow', 'pre-launch-projects', 'residential-commercial-land-plot', 'agriculture-farm-land', 'industrial-land'].includes(c.slug)
  );

  const specializedCats = CATEGORIES_DATA.filter((c) =>
    ['hospital', 'hotel-resort', 'tdr', 'group-booking'].includes(c.slug)
  );

  return (
    <footer className="bg-zinc-950 text-zinc-300 pt-16 pb-12 border-t border-zinc-800" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Grid: Brand, Categories Columns, Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-zinc-800/80">
          {/* Column 1: Brand & Institutional Overview */}
          <div className="lg:col-span-1 space-y-4">
            <Link href="/" className="inline-block group">
              <Image
                src="/LogoAnv-original.png"
                alt="ANV REEALTY"
                width={150}
                height={46}
                className="h-10 w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-200"
              />
            </Link>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">
              Premier real estate advisory &amp; institutional intermediary focused on Pune and PCMC. Two decades of verified transaction excellence in luxury residential, Grade-A commercial, and strategic land parcels.
            </p>

            <div className="pt-2 space-y-2 text-xs text-zinc-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>East Wing, M.G. Road, Camp, Pune 411001, Maharashtra</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <a href="tel:+919373020701" className="hover:text-amber-400 transition">
                  +91 93730 20701
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Mon – Sat: 9:30 AM – 7:00 PM IST</span>
              </div>
            </div>

            <div className="pt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-amber-400">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Verified Properties</span>
            </div>
          </div>

          {/* Column 2: Showroom & IT Workspaces (SEO Category Links) */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
              Showroom &amp; Office
            </h3>
            <ul className="space-y-2 text-xs">
              {commercialCats.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/${cat.slug}`}
                    className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 group"
                  >
                    <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-amber-400 transition-colors" />
                    <span>{cat.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Residential & Land Assets (SEO Category Links) */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
              Residential &amp; Land
            </h3>
            <ul className="space-y-2 text-xs">
              {residentialAndLandCats.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/${cat.slug}`}
                    className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 group"
                  >
                    <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-amber-400 transition-colors" />
                    <span>{cat.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Specialized Assets & Developer Services (SEO Category Links) */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
              Specialized &amp; Advisory
            </h3>
            <ul className="space-y-2 text-xs">
              {specializedCats.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/${cat.slug}`}
                    className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 group"
                  >
                    <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-amber-400 transition-colors" />
                    <span>{cat.title}</span>
                  </Link>
                </li>
              ))}
              <li className="pt-2 border-t border-zinc-800/80">
                <Link
                  href="/properties"
                  className="text-amber-400 font-medium hover:text-amber-300 transition-colors flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Browse All Properties</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Portals & Access */}
          <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
                Portals &amp; Access
              </h3>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link href="/login" className="text-zinc-400 hover:text-amber-400 transition flex items-center gap-1.5 group">
                    <span>Patron Client Portal</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                  </Link>
                </li>
                <li>
                  <Link href="/crm" className="text-zinc-400 hover:text-amber-400 transition flex items-center gap-1.5 group">
                    <span>ANV Real-Time CRM</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="text-zinc-400 hover:text-amber-400 transition flex items-center gap-1.5 group">
                    <span>Admin Management Console</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Compliance */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <p>
            &copy; {currentYear} ANV REEALTY. Institutional Real Estate Advisory. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500">
            <span>Verified Portfolio</span>
            <span>&bull;</span>
            <span>Institutional Due Diligence</span>
            <span>&bull;</span>
            <span>Zero Brokerage on Primary Inventory</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

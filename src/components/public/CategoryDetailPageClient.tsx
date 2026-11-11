'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  BadgePercent,
  Store,
  Laptop,
  Users,
  Home,
  Castle,
  Rocket,
  UtensilsCrossed,
  HeartPulse,
  Hotel,
  MapPin,
  Trees,
  Factory,
  Warehouse,
  Coins,
  Briefcase,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Phone,
  Calendar,
  Sparkles,
  HelpCircle,
  TrendingUp,
  Map,
  FileCheck
} from 'lucide-react';
import { CategoryItem, CATEGORIES_DATA } from '@/lib/categories-data';
import { InstantEnquiryModal } from '@/components/public/InstantEnquiryModal';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  BadgePercent,
  Store,
  Laptop,
  Users,
  Home,
  Castle,
  Rocket,
  UtensilsCrossed,
  HeartPulse,
  Hotel,
  MapPin,
  Trees,
  Factory,
  Warehouse,
  Coins,
  Briefcase
};

interface CategoryDetailPageClientProps {
  category: CategoryItem;
  matchingProperties: any[];
}

export function CategoryDetailPageClient({
  category,
  matchingProperties
}: CategoryDetailPageClientProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSuccessMsg, setModalSuccessMsg] = useState<string | null>(null);

  const IconComponent = iconMap[category.iconName] || Building2;
  const otherCategories = CATEGORIES_DATA.filter((c) => c.slug !== category.slug).slice(0, 6);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="bg-zinc-50 min-h-screen text-zinc-900">
      {/* 1. Hero Section */}
      <section className="relative bg-zinc-950 text-white overflow-hidden py-16 sm:py-24 border-b border-zinc-800">
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-900/90 to-zinc-950 z-10" />
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay filter blur-xs"
          style={{ backgroundImage: `url(${category.heroImage})` }}
        />

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-400 mb-6 font-medium">
            <Link href="/" className="hover:text-amber-400 transition">Home</Link>
            <span>/</span>
            <Link href="/properties" className="hover:text-amber-400 transition">Categories</Link>
            <span>/</span>
            <span className="text-amber-400 font-semibold">{category.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-mono tracking-wide uppercase">
                <IconComponent className="w-4 h-4 text-amber-400" />
                <span>{category.groupLabel} &bull; {category.badge}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
                {category.title} <span className="text-amber-400 font-light italic">in Pune</span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-light max-w-2xl">
                {category.tagline}
              </p>

              <p className="text-sm text-zinc-400 leading-relaxed font-light max-w-3xl">
                {category.overview}
              </p>

              {/* CTAs */}
              <div className="pt-4 flex flex-wrap items-center gap-3.5">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 text-xs sm:text-sm font-bold tracking-wider uppercase transition shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Request Bespoke Dossier</span>
                </button>

                <a
                  href="tel:+919373020701"
                  className="px-5 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-white text-xs sm:text-sm font-medium transition flex items-center gap-2"
                >
                  <Phone className="w-4 h-4 text-amber-400" />
                  <span>+91 93730 20701</span>
                </a>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>100% MahaRERA &amp; Title Verified</span>
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Zero Brokerage on Primary Developer Inventory</span>
                </span>
              </div>
            </div>

            {/* Right Card: Quick Facts */}
            <div className="lg:col-span-4 bg-zinc-900/80 backdrop-blur border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-4">
              <h3 className="text-xs uppercase tracking-wider text-amber-400 font-mono font-semibold flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-400" />
                <span>Sector Intelligence</span>
              </h3>

              <div className="space-y-3 divide-y divide-zinc-800/80 text-xs">
                <div className="pt-2 flex justify-between items-center text-zinc-400">
                  <span>Geographic Focus</span>
                  <span className="text-white font-medium">Pune &amp; PCMC</span>
                </div>
                <div className="pt-2 flex justify-between items-center text-zinc-400">
                  <span>Advisory Model</span>
                  <span className="text-emerald-400 font-medium">Zero Brokerage</span>
                </div>
                <div className="pt-2 flex justify-between items-center text-zinc-400">
                  <span>Legal Diligence</span>
                  <span className="text-white font-medium">30-Year Title Search</span>
                </div>
                <div className="pt-2 flex justify-between items-center text-zinc-400">
                  <span>Lead Advisory</span>
                  <span className="text-amber-400 font-medium">ANV Senior Desk</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition text-center block cursor-pointer"
                >
                  Schedule Private Site Visit
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Features & Specifications Grid */}
      <section className="py-14 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            {/* Features */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-amber-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Handover Standards &amp; Architecture</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-900 tracking-tight">
                Curated Standards for {category.title}
              </h2>
              <p className="text-sm text-zinc-600 leading-relaxed font-light">
                Every property listed or sourced under our {category.title.toLowerCase()} advisory satisfies institutional audit metrics.
              </p>

              <ul className="space-y-2.5 pt-2">
                {category.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-zinc-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Investment Benefits */}
            <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-amber-700 font-semibold">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span>Financial &amp; Yield Metrics</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-zinc-900">
                Why Invest in {category.title}?
              </h3>

              <div className="space-y-3 pt-2">
                {category.investmentBenefits.map((benefit, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white border border-zinc-200/80 shadow-2xs">
                    <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed font-medium">
                      &bull; {benefit}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Live Verified Properties Catalog */}
      <section className="py-14 sm:py-20 bg-zinc-50 border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-amber-700 font-semibold mb-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>Live Catalog</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-900 tracking-tight">
                Verified Inventory for {category.title}
              </h2>
              <p className="text-sm text-zinc-600 font-light mt-1">
                Institutional developer inventory with direct title verification and zero brokerage.
              </p>
            </div>

            <Link
              href="/properties"
              className="text-xs sm:text-sm font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 group"
            >
              <span>View All Properties</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matchingProperties && matchingProperties.length > 0 ? (
              matchingProperties.map((prop: any) => (
                <div
                  key={prop.id}
                  className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  <div className="relative h-52 w-full overflow-hidden bg-zinc-100">
                    <Image
                      src={prop.image || category.heroImage}
                      alt={prop.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-zinc-950/80 backdrop-blur text-[11px] font-semibold text-amber-400">
                      {prop.bhk || category.shortTitle}
                    </div>
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-white/90 backdrop-blur text-xs font-bold text-zinc-900 shadow-sm">
                      {prop.price}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-zinc-900 line-clamp-1 group-hover:text-amber-800 transition">
                        {prop.name}
                      </h3>
                      <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{prop.locality || prop.location || 'Pune'}</span>
                      </p>
                      <p className="text-xs text-zinc-600 line-clamp-2 mt-2 font-light">
                        {prop.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {prop.sqft || 'Ready to Move'}
                      </span>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition cursor-pointer"
                      >
                        Inquire Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : null}

            {/* Always display an Off-Market Sourcing Card */}
            <div className="bg-gradient-to-br from-amber-950/90 to-zinc-900 text-white rounded-2xl border border-amber-500/30 p-6 sm:p-7 flex flex-col justify-between shadow-md">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-serif font-bold text-white">
                  Exclusive Off-Market Sourcing
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed font-light">
                  Looking for private, unadvertised institutional {category.title.toLowerCase()} inventories or distressed asset purchases in Pune?
                </p>
                <div className="text-xs text-amber-300/90 font-medium">
                  &bull; Direct developer mandates &bull; 100% confidential
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold tracking-wider uppercase transition shadow-md cursor-pointer"
                >
                  Register Requirement
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Prime Micro-Markets in Pune */}
      <section className="py-12 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-700 font-semibold mb-3">
            <Map className="w-4 h-4 text-amber-600" />
            <span>Prime Growth Clusters</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-zinc-900 mb-4">
            High-Velocity Micro-Markets for {category.title}
          </h2>

          <div className="flex flex-wrap gap-2.5">
            {category.popularLocalities.map((loc) => (
              <Link
                key={loc}
                href={`/properties?locality=${encodeURIComponent(loc)}`}
                className="px-4 py-2 rounded-xl bg-zinc-50 hover:bg-amber-50 border border-zinc-200 hover:border-amber-300 text-xs sm:text-sm font-medium text-zinc-800 hover:text-amber-900 transition shadow-2xs"
              >
                {category.title} in <span className="font-semibold">{loc}</span> &rarr;
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FAQ Section (with Schema.org FAQPage data for Google Rich Snippets) */}
      <section className="py-16 bg-zinc-50 border-b border-zinc-200" itemScope itemType="https://schema.org/FAQPage">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-amber-700 font-semibold mb-2">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Questions &amp; Advisory Guidance</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-900 tracking-tight">
              Frequently Asked Questions: {category.title}
            </h2>
          </div>

          <div className="space-y-3">
            {category.faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;

              return (
                <div
                  key={idx}
                  itemScope
                  itemProp="mainEntity"
                  itemType="https://schema.org/Question"
                  className="rounded-2xl bg-white border border-zinc-200/90 overflow-hidden shadow-2xs"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-zinc-900 hover:text-amber-900 transition cursor-pointer"
                  >
                    <span itemProp="name">{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-amber-600' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div
                      itemScope
                      itemProp="acceptedAnswer"
                      itemType="https://schema.org/Answer"
                      className="px-5 pb-5 pt-1 text-xs sm:text-sm text-zinc-600 leading-relaxed font-light border-t border-zinc-100"
                    >
                      <p itemProp="text">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Explore Other Categories (Internal SEO Linking) */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-mono font-semibold mb-4">
            Explore Other Real Estate Asset Classes
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {otherCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${cat.slug}`}
                className="p-3 rounded-xl bg-zinc-50 hover:bg-amber-50 border border-zinc-200 hover:border-amber-300 text-center transition group"
              >
                <div className="text-xs font-semibold text-zinc-800 group-hover:text-amber-900 line-clamp-1">
                  {cat.title}
                </div>
                <div className="text-[10px] text-zinc-400 group-hover:text-amber-700">
                  {cat.badge}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Inbound Lead Capture Modal */}
      <InstantEnquiryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        property={{
          name: `${category.title} Advisory Requirement`,
          location: 'Pune, Maharashtra',
          price: 'On Request',
          bhk: category.shortTitle
        }}
        onSuccess={(msg) => setModalSuccessMsg(msg)}
      />
    </div>
  );
}

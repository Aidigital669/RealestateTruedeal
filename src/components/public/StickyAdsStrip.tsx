'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Volume2,
  VolumeX,
  Plus,
  ExternalLink
} from 'lucide-react';

export interface AdItem {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  badge?: string;
  image: string;
  videoUrl?: string;
  ctaText: string;
  ctaMessage: string;
}

const AD_ITEMS: AdItem[] = [
  {
    id: 'opus-video',
    name: 'Opus',
    category: 'Signature Luxury Living',
    tagline: 'Opus Luxury Residences & Penthouses',
    description:
      'Experience premier ultra-luxury architecture, curated landscape views, and bespoke craftsmanship at Opus. Schedule an exclusive private walkthrough and access institutional pre-launch inventory pricing.',
    image: '/opus-thumb.jpg',
    videoUrl: '/Opusvideo.mp4',
    ctaText: 'Explore Opus & Schedule Visit',
    ctaMessage: 'Hello ANV Realty advisory, I watched the Opus video ad and would like to schedule an exclusive site visit and receive pricing brochure for Opus.'
  },
  {
    id: 'ai-digital',
    name: 'AI Digital',
    category: 'Digital Marketing Partner',
    tagline: 'AI Meta & Google Ads • 3D Virtual Walkthroughs',
    description:
      'Premier performance marketing partner for real estate builders, channel partners, and developers. Specializing in high-intent buyer acquisition, AI meta lead funnels, and photorealistic 3D architectural renders.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
    videoUrl: '/AiDigital.mp4',
    ctaText: 'Get Free Project Audit',
    ctaMessage: 'Hello AI Digital team, I saw your promotional ad on ANV Realty and would like a Free Project Audit for real estate digital marketing.'
  },
  {
    id: 'hdfc-loans',
    name: 'Home Loan',
    category: 'Banking & Mortgages',
    tagline: '8.40% ROI • 48-Hour Instant In-Principle Sanction',
    description:
      'Fast-track institutional home loans and balance transfers for luxury residential and commercial properties in Pune with zero processing fees and doorstep documentation.',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
    ctaText: 'Check Eligibility',
    ctaMessage: 'Hello ANV Realty advisory, I would like to check home loan eligibility and lowest ROI for Pune properties.'
  },
  {
    id: 'luxury-interiors',
    name: 'Interiors',
    category: 'Luxury Architecture',
    tagline: 'Turnkey Modular Kitchens & Italian Decor',
    description:
      'End-to-end bespoke interior architecture, smart home automation, Italian marble flooring, and customized modular interiors with a 10-year warranty.',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80',
    ctaText: 'Get 3D Design Consultation',
    ctaMessage: 'Hello, I am interested in interior design and modular layout planning for my Pune property.'
  },
  {
    id: 'legal-audit',
    name: 'Legal Due',
    category: 'Title Search & RERA',
    tagline: '30-Year Title Verification & RERA Compliance',
    description:
      'Independent institutional legal scrutiny, search reports, encumbrance verification, and agreement vetting by senior High Court real estate advocates.',
    image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=400&q=80',
    ctaText: 'Request Legal Scrutiny',
    ctaMessage: 'Hello ANV Realty legal cell, I would like to verify property title and legal documentation.'
  },
  {
    id: 'vastu-shastra',
    name: 'Vastu',
    category: 'Vastu & Energy',
    tagline: 'Scientific Vastu for Penthouses & Commercial',
    description:
      'Non-demolition Vastu remedies, entrance energy balancing, and directional optimization for business prosperity and peaceful family residences.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
    ctaText: 'Book Vastu Consultation',
    ctaMessage: 'Hello, I would like to consult a Vastu expert for my residential / commercial property in Pune.'
  },
  {
    id: 'preleased-leasing',
    name: 'MNC Lease',
    category: 'Commercial Pre-Leased',
    tagline: 'Grade-A Corporate Tenants with 8.5%+ Yield',
    description:
      'Connect with institutional corporate tenants, IT/ITeS firms, and retail brands looking for long-term lease commitments across prime Pune IT corridors.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
    ctaText: 'View Leasing Demand',
    ctaMessage: 'Hello ANV Realty leasing division, I want to explore MNC pre-leased commercial opportunities in Pune.'
  }
];

export function StickyAdsStrip() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [activeAd, setActiveAd] = useState<AdItem | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  };

  useEffect(() => {
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/crm')) {
      return;
    }
    checkScroll();
  }, [pathname, mounted]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth || 188;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(checkScroll, 200);
  };

  const handleOpenAd = (ad: AdItem) => {
    setActiveAd(ad);
    setIsVideoMuted(true);
  };

  const handlePromoteClick = () => {
    const text = encodeURIComponent(
      'Hello ANV Realty team, I would like to feature our company ad in your website Ads strip for Pune property buyers and investors.'
    );
    window.open(`https://wa.me/919373020701?text=${text}`, '_blank');
  };

  const handleAdCta = (ad: AdItem) => {
    const text = encodeURIComponent(ad.ctaMessage);
    window.open(`https://wa.me/919373020701?text=${text}`, '_blank');
  };

  // Guard against SSR hydration mismatches and hide on admin/crm portals
  if (!mounted || pathname?.startsWith('/admin') || pathname?.startsWith('/crm')) {
    return null;
  }

  return (
    <>
      {/* ================= STICKY ADS STRIP (BOTTOM-RIGHT AREA) ================= */}
      <aside
        aria-label="Sponsored Partners and Ads"
        className="fixed bottom-2.5 sm:bottom-5 right-2 sm:right-6 z-40 select-none animate-in fade-in slide-in-from-bottom-3 duration-300"
      >
        {isMinimized ? (
          /* Minimized Pill to restore */
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950/95 hover:bg-zinc-900 text-white border border-amber-500/30 shadow-xl backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
            title="Expand Premium"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs font-black tracking-wide text-amber-400">Premium</span>
            <span className="text-[10px] text-zinc-400 font-semibold bg-zinc-800 px-1.5 py-0.2 rounded-full">
              {AD_ITEMS.length}
            </span>
          </button>
        ) : (
          /* Full Sticky Strip */
          <div className="relative bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/90 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] p-2 sm:p-2.5 flex items-center gap-2 sm:gap-2.5 transition-all max-w-[calc(100vw-24px)]">
            {/* Left Header Label: "Premium" */}
            <div className="flex items-center justify-center shrink-0 pr-1.5 border-r border-zinc-800/80">
              <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 font-black text-[11px] sm:text-xs px-2.5 py-1.5 rounded-lg tracking-wide shadow-xs whitespace-nowrap">
                Premium
              </div>
            </div>

            {/* Left Scroll Arrow */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => handleScroll('left')}
                className="w-5 h-5 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center transition shrink-0 cursor-pointer shadow-xs"
                title="Scroll previous ads"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
            )}

            {/* Circles Rail: Shows exactly 3 Ads at a time, horizontal scrolling reveals more */}
            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto scrollbar-none py-1 px-0.5 w-[164px] sm:w-[190px] max-w-[164px] sm:max-w-[190px] scroll-smooth"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {AD_ITEMS.map((ad) => (
                <button
                  key={ad.id}
                  type="button"
                  onClick={() => handleOpenAd(ad)}
                  className="flex flex-col items-center gap-1 shrink-0 group/circle cursor-pointer focus:outline-none w-[48px] sm:w-[56px]"
                  style={{ scrollSnapAlign: 'start' }}
                  title={`${ad.name} - ${ad.tagline}`}
                >
                  {/* Circle Icon Container with Elegant Amber Story Ring */}
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-400 to-amber-500 group-hover/circle:from-amber-300 group-hover/circle:to-amber-400 transition-all duration-300 group-hover/circle:scale-105 shadow-sm">
                    <div className="relative w-full h-full rounded-full overflow-hidden bg-zinc-900 border border-zinc-950">
                      <Image
                        src={ad.image}
                        alt={ad.name}
                        fill
                        unoptimized
                        className="object-cover group-hover/circle:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </div>

                  {/* Name Label: Only on sm and above, on mobile show icons only */}
                  <span className="hidden sm:block text-[10.5px] font-medium text-zinc-200 group-hover/circle:text-amber-400 transition-colors truncate max-w-[56px] text-center leading-tight">
                    {ad.name}
                  </span>
                </button>
              ))}

              {/* "+ Promote" Circle Button at the end */}
              <button
                type="button"
                onClick={handlePromoteClick}
                className="flex flex-col items-center gap-1 shrink-0 group/promote cursor-pointer focus:outline-none w-[48px] sm:w-[56px]"
                title="Advertise your business here on ANV Realty"
                style={{ scrollSnapAlign: 'start' }}
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-dashed border-zinc-700 hover:border-amber-400 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 flex items-center justify-center transition-all group-hover/promote:scale-105">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="hidden sm:block text-[10.5px] font-medium text-zinc-400 group-hover/promote:text-amber-400 transition-colors truncate max-w-[50px] text-center leading-tight">
                  Promote
                </span>
              </button>
            </div>

            {/* Right Scroll Arrow */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => handleScroll('right')}
                className="w-5 h-5 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center transition shrink-0 cursor-pointer shadow-xs"
                title="Scroll more ads"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </aside>

      {/* ================= INTERACTIVE AD DETAIL MODAL ================= */}
      {activeAd && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveAd(null)}
        >
          <div
            className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl text-white animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between gap-3 bg-zinc-900/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full overflow-hidden relative shrink-0 border border-amber-500/50">
                  <Image
                    src={activeAd.image}
                    alt={activeAd.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-white tracking-tight truncate">
                      {activeAd.name}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500 text-zinc-950">
                      Sponsored
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate">{activeAd.category}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveAd(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
                title="Close ad"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Media Showcase: Video or Image */}
            <div className="relative w-full bg-black aspect-video max-h-[55vh] flex items-center justify-center overflow-hidden">
              {activeAd.videoUrl ? (
                <>
                  <video
                    ref={videoRef}
                    src={activeAd.videoUrl}
                    autoPlay
                    loop
                    muted={isVideoMuted}
                    playsInline
                    className="w-full h-full object-contain"
                  />
                  {/* Floating Sound Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!videoRef.current) return;
                      const nextMuted = !isVideoMuted;
                      videoRef.current.muted = nextMuted;
                      setIsVideoMuted(nextMuted);
                    }}
                    className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-xl bg-black/75 hover:bg-black text-white text-xs font-bold border border-white/20 backdrop-blur-sm flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {isVideoMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{isVideoMuted ? 'Unmute' : 'Audio On'}</span>
                  </button>
                </>
              ) : (
                <Image
                  src={activeAd.image}
                  alt={activeAd.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              )}
            </div>

            {/* Modal Content Body */}
            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <h4 className="text-sm sm:text-base font-extrabold text-amber-400">
                  {activeAd.tagline}
                </h4>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mt-1.5">
                  {activeAd.description}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleAdCta(activeAd)}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                >
                  <span>{activeAd.ctaText}</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handlePromoteClick}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Promote Your Ad</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


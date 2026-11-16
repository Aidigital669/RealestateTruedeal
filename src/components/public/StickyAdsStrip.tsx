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
import {
  PremiumAdItem,
  PremiumAdsConfig,
  DEFAULT_PREMIUM_CONFIG
} from '@/lib/premium-ads-constants';
import { usePropertyComparison } from '@/context/PropertyComparisonContext';

export type AdItem = PremiumAdItem;

export function StickyAdsStrip() {
  const pathname = usePathname();
  const { compareList } = usePropertyComparison();
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState<PremiumAdsConfig>(DEFAULT_PREMIUM_CONFIG);
  const [activeAd, setActiveAd] = useState<PremiumAdItem | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch dynamic ads from backend
  useEffect(() => {
    fetch('/api/premium-ads')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config && Array.isArray(data.config.ads)) {
          setConfig(data.config);
        }
      })
      .catch((err) => {
        console.warn('Using fallback default premium ads:', err);
      });
  }, []);

  const adItems = config.ads.filter((ad) => ad.isActive !== false);

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
  }, [pathname, mounted, adItems.length]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth || 188;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(checkScroll, 200);
  };

  const handleOpenAd = (ad: PremiumAdItem) => {
    setActiveAd(ad);
    setIsVideoMuted(true);
  };

  const handlePromoteClick = () => {
    const text = encodeURIComponent(
      config.promoteMessage ||
        'Hello ANV Realty team, I would like to feature our company ad in your website Ads strip for Pune property buyers and investors.'
    );
    const phone = config.promoteWhatsAppNumber || '919373020701';
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const handleAdCta = (ad: PremiumAdItem) => {
    if (ad.linkUrl) {
      window.open(ad.linkUrl, '_blank');
      return;
    }
    const text = encodeURIComponent(ad.ctaMessage);
    const phone = config.promoteWhatsAppNumber || '919373020701';
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  // Guard against SSR hydration mismatches and hide on admin/crm portals
  if (!mounted || pathname?.startsWith('/admin') || pathname?.startsWith('/crm')) {
    return null;
  }

  // If there are no active ads, do not render the strip
  if (adItems.length === 0) {
    return null;
  }

  const hasCompareBar = mounted && compareList && compareList.length > 0 && pathname !== '/compare';

  return (
    <>
      {/* ================= STICKY ADS STRIP (EXACT DESIGN MATCH) ================= */}
      <aside
        aria-label="Sponsored Partners and Ads"
        className={`fixed ${
          hasCompareBar
            ? 'bottom-[84px] lg:bottom-24'
            : 'bottom-3 sm:bottom-4 lg:bottom-6'
        } left-1/2 -translate-x-1/2 z-40 select-none animate-in fade-in slide-in-from-bottom-3 duration-300`}
      >
        {isMinimized ? (
          /* Minimized Pill to restore */
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-zinc-950 via-[#2e050f] to-zinc-950 hover:from-zinc-900 hover:to-[#420816] text-white border border-amber-500/50 shadow-xl backdrop-blur-md transition-all hover:scale-105 cursor-pointer shadow-[0_0_14px_rgba(245,158,11,0.3)]"
            title="Expand Premium"
          >
            <div className="relative w-7 h-4 shrink-0">
              <Image
                src={config.crownImage || '/premium-crown.png'}
                alt={config.crownTitle || 'Premium'}
                fill
                unoptimized
                className="object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
              />
            </div>
            <span className="text-[10px] text-amber-300 font-bold bg-amber-950/80 border border-amber-500/40 px-1.5 py-0.2 rounded-full">
              {adItems.length}
            </span>
          </button>
        ) : (
          /* Full Sticky Strip - Exact Match with User Design (media_1794823588567_af47e828.jpg) */
          <div className="relative bg-[#0c0c0e]/95 backdrop-blur-xl border border-zinc-800/80 rounded-[28px] sm:rounded-[32px] shadow-[0_16px_50px_rgba(0,0,0,0.7)] px-3 sm:px-5 py-2.5 sm:py-3.5 flex items-center gap-2.5 sm:gap-4 lg:gap-6 transition-all max-w-[calc(100vw-16px)] sm:max-w-none">
            {/* Left Corner: Small Premium Crown Badge (No dividing line, sitting comfortably in top-left) */}
            <div className="shrink-0 self-start sm:self-center">
              <div
                className="relative px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-gradient-to-b from-[#2e050f] via-[#420816] to-[#1f030a] border border-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.3)] flex items-center justify-center group/crown"
                title={config.crownTitle || 'Premium Collection'}
              >
                {/* Subtle Amber Glow Behind the Crown */}
                <div className="absolute inset-0 rounded-lg bg-[radial-gradient(ellipse_at_center,_rgba(245,158,11,0.25)_0%,_transparent_70%)] pointer-events-none" />

                <div className="relative w-8 h-4 sm:w-10 sm:h-5 shrink-0">
                  <Image
                    src={config.crownImage || '/premium-crown.png'}
                    alt={config.crownTitle || 'Premium'}
                    fill
                    unoptimized
                    priority
                    className="object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] group-hover/crown:scale-105 transition-transform duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Previous Arrow Button (Only if scrolled) */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => handleScroll('left')}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-white flex items-center justify-center transition shrink-0 cursor-pointer shadow-md"
                title="Scroll previous ads"
                aria-label="Previous ads"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Center Circles Rail: Shows exactly 3 Ads at a time with clear labels underneath */}
            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex items-center gap-3 sm:gap-4 lg:gap-5 overflow-x-auto scrollbar-none py-1 px-1 w-[205px] sm:w-[245px] lg:w-[265px] max-w-[205px] sm:max-w-[245px] lg:max-w-[265px] scroll-smooth"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {adItems.map((ad) => (
                <button
                  key={ad.id}
                  type="button"
                  onClick={() => handleOpenAd(ad)}
                  className="flex flex-col items-center gap-1.5 shrink-0 group/circle cursor-pointer focus:outline-none w-[56px] sm:w-[68px]"
                  title={`${ad.name} - ${ad.tagline}`}
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {/* Circular Avatar Container with Golden Ring */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.35)] group-hover/circle:shadow-[0_0_18px_rgba(245,158,11,0.7)] group-hover/circle:scale-105 transition-all duration-200">
                    <div className="w-full h-full rounded-full overflow-hidden relative bg-black">
                      <Image
                        src={ad.image || '/opus-thumb.jpg'}
                        alt={ad.name}
                        fill
                        unoptimized
                        className="object-cover group-hover/circle:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </div>

                  {/* Clean White Label Underneath */}
                  <span className="text-[11px] sm:text-xs font-semibold text-white group-hover/circle:text-amber-400 transition-colors truncate max-w-[56px] sm:max-w-[68px] text-center leading-tight">
                    {ad.name}
                  </span>
                </button>
              ))}

              {/* "+ Promote" Circle Button at the end of the rail */}
              <button
                type="button"
                onClick={handlePromoteClick}
                className="flex flex-col items-center gap-1.5 shrink-0 group/promote cursor-pointer focus:outline-none w-[56px] sm:w-[68px]"
                title="Advertise your business here on ANV Realty"
                style={{ scrollSnapAlign: 'start' }}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full border-2 border-dashed border-zinc-600 hover:border-amber-400 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 flex items-center justify-center transition-all group-hover/promote:scale-105">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 group-hover/promote:text-amber-400 transition-colors truncate max-w-[56px] sm:max-w-[68px] text-center leading-tight">
                  Promote
                </span>
              </button>
            </div>

            {/* Right Side Navigation Controls (Arrow + Close button side-by-side) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Next Arrow Button */}
              {canScrollRight && (
                <button
                  type="button"
                  onClick={() => handleScroll('right')}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-white flex items-center justify-center transition shrink-0 cursor-pointer shadow-md"
                  title="Scroll more ads"
                  aria-label="Scroll more ads"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {/* Close / Minimize Button */}
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-white flex items-center justify-center transition shrink-0 cursor-pointer shadow-md"
                title="Close ads strip"
                aria-label="Close ads strip"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ================= INTERACTIVE AD DETAIL MODAL ================= */}
      {activeAd && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setActiveAd(null)}
        >
          <div
            className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl text-white animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between gap-3 bg-zinc-900/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full overflow-hidden relative shrink-0 border border-amber-500/50">
                  <Image
                    src={activeAd.image || '/opus-thumb.jpg'}
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
                      {activeAd.badge || 'Sponsored'}
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
                    {isVideoMuted ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{isVideoMuted ? 'Unmute' : 'Audio On'}</span>
                  </button>
                </>
              ) : (
                <Image
                  src={activeAd.image || '/opus-thumb.jpg'}
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

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

export type AdItem = PremiumAdItem;

export function StickyAdsStrip() {
  const pathname = usePathname();
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

  return (
    <>
      {/* ================= STICKY ADS STRIP (CENTERED BOTTOM AREA) ================= */}
      <aside
        aria-label="Sponsored Partners and Ads"
        className="fixed bottom-[64px] lg:bottom-5 left-1/2 -translate-x-1/2 z-40 select-none animate-in fade-in slide-in-from-bottom-3 duration-300"
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
          /* Full Sticky Strip */
          <div className="relative bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/90 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] p-1.5 sm:p-2.5 flex items-center gap-1.5 sm:gap-2.5 transition-all max-w-[calc(100vw-16px)] sm:max-w-none">
            {/* Left Header Image Badge: Gold Crown with Premium Royal Background */}
            <div className="flex items-center justify-center shrink-0 pr-1.5 border-r border-zinc-800/80">
              <div
                className="relative px-2 py-1 rounded-xl bg-gradient-to-b from-[#2e050f] via-[#420816] to-[#1f030a] border border-amber-400/70 shadow-[0_0_16px_rgba(245,158,11,0.35)] flex items-center justify-center shrink-0 group/crown"
                title={config.crownTitle || 'Premium Collection'}
              >
                {/* Subtle Amber Glow Behind the Crown */}
                <div className="absolute inset-0 rounded-xl bg-[radial-gradient(ellipse_at_center,_rgba(245,158,11,0.25)_0%,_transparent_70%)] pointer-events-none" />

                <div className="relative w-14 h-7 sm:w-16 sm:h-8 shrink-0">
                  <Image
                    src={config.crownImage || '/premium-crown.png'}
                    alt={config.crownTitle || 'Premium'}
                    fill
                    unoptimized
                    priority
                    className="object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] group-hover/crown:scale-105 transition-transform duration-200"
                  />
                </div>
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
              {adItems.map((ad) => (
                <button
                  key={ad.id}
                  type="button"
                  onClick={() => handleOpenAd(ad)}
                  className="flex flex-col items-center gap-1 shrink-0 group/circle cursor-pointer focus:outline-none w-[48px] sm:w-[56px]"
                  title={`${ad.name} - ${ad.tagline}`}
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {/* Circular Avatar Container with Gold Luxury Border */}
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.35)] group-hover/circle:shadow-[0_0_16px_rgba(245,158,11,0.65)] group-hover/circle:scale-105 transition-all duration-200">
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

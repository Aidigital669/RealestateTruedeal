'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  PremiumAdItem,
  PremiumAdsConfig,
  DEFAULT_PREMIUM_CONFIG
} from '@/lib/premium-ads-constants';

// Self-contained inline SVG icons to eliminate all chunk factory desyncs
function ChevronRightIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function CloseIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function Volume2Icon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function VolumeXIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

function ExternalLinkIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function SparklesIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

export type AdItem = PremiumAdItem;

export function LuxuryAdsStrip() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [hasCompareBar, setHasCompareBar] = useState(false);
  const [config, setConfig] = useState<PremiumAdsConfig>(DEFAULT_PREMIUM_CONFIG);
  const [activeAd, setActiveAd] = useState<PremiumAdItem | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen to comparison list changes in localStorage safely without circular dependency
  useEffect(() => {
    const checkCompare = () => {
      try {
        const stored = localStorage.getItem('anv_compare_properties');
        if (stored) {
          const list = JSON.parse(stored);
          setHasCompareBar(Array.isArray(list) && list.length > 0 && pathname !== '/compare');
        } else {
          setHasCompareBar(false);
        }
      } catch {
        setHasCompareBar(false);
      }
    };
    checkCompare();
    window.addEventListener('storage', checkCompare);
    return () => window.removeEventListener('storage', checkCompare);
  }, [pathname]);

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

  // Auto-rotate ads every 3.5 seconds smoothly (paused on hover)
  useEffect(() => {
    if (adItems.length <= 3 || isPaused || isMinimized) return;
    const interval = setInterval(() => {
      setPageIndex((prev) => (prev + 1) % adItems.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [adItems.length, isPaused, isMinimized]);

  const handleNextAds = () => {
    if (adItems.length === 0) return;
    setPageIndex((prev) => (prev + 1) % adItems.length);
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

  // Exactly 3 ads visible at a time, cycling smoothly with Next button or auto-rotate
  const displayCount = Math.min(3, adItems.length);
  const visibleAds = Array.from({ length: displayCount }).map((_, idx) => {
    return adItems[(pageIndex + idx) % adItems.length];
  });

  return (
    <>
      {/* ================= STICKY ADS STRIP (EXACT MATCH WITH DESIGN MOCKUP) ================= */}
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
          /* Full Sticky Strip - Exact Match with Second Design Mockup */
          <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="relative bg-[#08080a] rounded-[32px] sm:rounded-[36px] shadow-[0_15px_45px_rgba(0,0,0,0.9)] px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-3 sm:gap-6 lg:gap-8 transition-all max-w-[calc(100vw-16px)] sm:max-w-none"
          >
            {/* Left Corner: Glowing Burgundy Crown Badge */}
            <div className="shrink-0 self-start mt-0.5 sm:mt-1">
              <div
                className="relative px-2 sm:px-2.5 py-1 rounded-2xl bg-gradient-to-b from-[#3a0614] via-[#52091c] to-[#25030c] border-[1.5px] border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.45)] flex items-center justify-center group/crown"
                title={config.crownTitle || 'Premium Collection'}
              >
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

            {/* Center: 3 Circular Ad Avatars with Thick Golden Rings and Clean White Labels */}
            <div className="flex items-center justify-center gap-3 sm:gap-6 lg:gap-7">
              {visibleAds.map((ad, idx) => (
                <button
                  key={`${ad.id}-${pageIndex}-${idx}`}
                  type="button"
                  onClick={() => handleOpenAd(ad)}
                  className="flex flex-col items-center group cursor-pointer focus:outline-none animate-in fade-in zoom-in-95 duration-300"
                  title={`${ad.name} - ${ad.tagline}`}
                >
                  {/* Thick Golden Ring Frame: Solid vibrant amber ring */}
                  <div className="w-13 h-13 sm:w-15 sm:h-15 lg:w-16 lg:h-16 rounded-full p-[3px] bg-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.5)] group-hover:scale-105 group-hover:shadow-[0_0_18px_rgba(245,158,11,0.8)] transition-all duration-200 shrink-0">
                    <div className="w-full h-full rounded-full overflow-hidden relative bg-black">
                      <Image
                        src={ad.image || '/opus-thumb.jpg'}
                        alt={ad.name}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </div>

                  {/* Clean White Label Underneath */}
                  <span className="text-[11px] sm:text-xs font-semibold text-white group-hover:text-amber-400 transition-colors mt-1.5 text-center truncate max-w-[62px] sm:max-w-[76px] leading-tight">
                    {ad.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Right Side: Next Arrow + Close Button */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Next Arrow Button */}
              {adItems.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextAds}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1e1e24] hover:bg-[#2c2c34] active:scale-95 text-white flex items-center justify-center transition cursor-pointer shadow-md"
                  title="Next ad (Click to rotate)"
                  aria-label="Next ad"
                >
                  <ChevronRightIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1e1e24] hover:bg-[#2c2c34] active:scale-95 text-white flex items-center justify-center transition cursor-pointer shadow-md"
                title="Close ads strip"
                aria-label="Close ads strip"
              >
                <CloseIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ================= MODAL / FULL AD SHOWCASE ================= */}
      {activeAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-900/60">
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
                <CloseIcon className="w-4 h-4" />
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
                      <VolumeXIcon className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2Icon className="w-3.5 h-3.5 text-amber-400" />
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
                  <ExternalLinkIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handlePromoteClick}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
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

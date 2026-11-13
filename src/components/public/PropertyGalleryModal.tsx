'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  Video,
  Calendar,
  ExternalLink,
  Play
} from 'lucide-react';
import { PropertyItem, formatPriceDisplay, cleanSqft } from '@/components/public/HomepageSearchablePortal';
import { getPropertyUrl } from '@/lib/slug';

interface PropertyGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyItem | null;
  initialMode?: 'photos' | 'video';
  onBookSiteVisit?: (p: PropertyItem) => void;
}

export function PropertyGalleryModal({
  isOpen,
  onClose,
  property,
  initialMode = 'photos',
  onBookSiteVisit
}: PropertyGalleryModalProps) {
  const [activeMediaMode, setActiveMediaMode] = useState<'photos' | 'video'>('photos');
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Extract all available photos for the property
  const mediaImages: string[] = useMemo(() => {
    if (!property) return [];
    const list: string[] = [];

    // 1. Array of images
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      property.images.forEach((img: any) => {
        const url = typeof img === 'string' ? img : img?.url;
        if (url && typeof url === 'string' && url.trim().length > 0) {
          list.push(url.trim());
        }
      });
    }

    // 2. all_images fallback from database scraper/API
    if ((property as any).all_images && Array.isArray((property as any).all_images)) {
      (property as any).all_images.forEach((url: any) => {
        if (typeof url === 'string' && url.trim().length > 0 && !list.includes(url.trim())) {
          list.push(url.trim());
        }
      });
    }

    // 3. Primary cover image
    if (property.image && property.image.trim().length > 0 && !list.includes(property.image.trim())) {
      list.unshift(property.image.trim());
    }

    // Fallback placeholder if no images exist
    if (list.length === 0) {
      list.push('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80');
    }

    return list;
  }, [property]);

  // Sync state whenever property or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setActivePhotoIdx(0);
      setActiveMediaMode(initialMode === 'video' && property?.videoUrl ? 'video' : 'photos');
    }
  }, [isOpen, property, initialMode]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (activeMediaMode === 'photos') {
        if (e.key === 'ArrowRight') {
          setActivePhotoIdx((prev) => (prev + 1) % (mediaImages.length || 1));
        } else if (e.key === 'ArrowLeft') {
          setActivePhotoIdx((prev) => (prev - 1 + (mediaImages.length || 1)) % (mediaImages.length || 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeMediaMode, mediaImages.length, onClose]);

  if (!isOpen || !property) return null;

  const handleNextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActivePhotoIdx((prev) => (prev + 1) % (mediaImages.length || 1));
  };

  const handlePrevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActivePhotoIdx((prev) => (prev - 1 + (mediaImages.length || 1)) % (mediaImages.length || 1));
  };

  // Video Embed URL Formatter
  const getVideoEmbedUrl = (rawUrl?: string | null): string | null => {
    if (!rawUrl) return null;
    const url = rawUrl.trim();

    // YouTube matches
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/i);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    }

    // Vimeo matches
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }

    return url;
  };

  const videoEmbedUrl = getVideoEmbedUrl(property.videoUrl);

  const getWhatsAppVideoRequestUrl = () => {
    const text = `*ANV REEALTY - Video Walkthrough Request*\n*Property:* ${property.name}\n*Location:* ${property.locality || property.location}\n*Price:* ${property.price}\n\nHello, I would like to receive the full 4K video walkthrough and brochure for this property.`;
    return `https://wa.me/919373020701?text=${encodeURIComponent(text)}`;
  };

  return (
    <div
      className="fixed inset-0 z-[130] bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-3 sm:p-6 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* ================= 1. MODAL TOP HEADER ================= */}
      <div
        className="flex items-center justify-between gap-3 text-white pb-3 sm:pb-4 border-b border-white/10 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0 flex-1 pr-2">
          {property.developer &&
            !/anv\s*(signature\s*partner|verified\s*developer|partner\s*developer)/i.test(property.developer) && (
              <span className="text-[10px] sm:text-xs text-amber-400 font-bold uppercase tracking-wider block mb-0.5 truncate">
                {property.developer}
              </span>
            )}
          <h2
            className="text-xs sm:text-base md:text-lg font-bold text-white line-clamp-2 leading-snug"
            title={property.name}
          >
            {property.name}
          </h2>
        </div>

        {/* Media Switcher Tabs (Photos vs Video) & Close Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center bg-zinc-900/90 p-0.5 sm:p-1 rounded-xl border border-white/15 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveMediaMode('photos')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeMediaMode === 'photos'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-zinc-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span>Photos{mediaImages.length > 1 ? ` (${mediaImages.length})` : ''}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMediaMode('video')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeMediaMode === 'video'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-zinc-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Video className="w-3.5 h-3.5 shrink-0" />
              <span>Video</span>
              {property.videoUrl && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              )}
            </button>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer border border-white/10 shrink-0"
            title="Close Gallery (Esc)"
            aria-label="Close Gallery"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* ================= 2. MAIN MEDIA SHOWCASE ================= */}
      <div
        className="relative flex-1 flex items-center justify-center my-3 sm:my-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {activeMediaMode === 'photos' ? (
          /* ================= PHOTOS CAROUSEL ================= */
          <div className="relative w-full h-full max-w-5xl max-h-[72vh] flex items-center justify-center">
            {mediaImages.length > 0 && (
              <div className="relative w-full h-full">
                <Image
                  src={mediaImages[activePhotoIdx]}
                  alt={`${property.name} - Photo ${activePhotoIdx + 1}`}
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                />

                {/* Left Arrow */}
                {mediaImages.length > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevPhoto}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition cursor-pointer shadow-2xl backdrop-blur-sm"
                    title="Previous Photo (Left Arrow)"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}

                {/* Right Arrow */}
                {mediaImages.length > 1 && (
                  <button
                    type="button"
                    onClick={handleNextPhoto}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition cursor-pointer shadow-2xl backdrop-blur-sm"
                    title="Next Photo (Right Arrow)"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}

                {/* Photo Counter Pill: only when more than 1 photo */}
                {mediaImages.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20 shadow-lg">
                    Photo {activePhotoIdx + 1} of {mediaImages.length}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ================= VIDEO WALKTHROUGH ================= */
          <div className="w-full h-full max-w-4xl max-h-[72vh] flex items-center justify-center">
            {property.videoUrl && videoEmbedUrl ? (
              <div className="w-full h-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black">
                {videoEmbedUrl.includes('youtube.com') || videoEmbedUrl.includes('vimeo.com') ? (
                  <iframe
                    src={videoEmbedUrl}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`${property.name} Video Walkthrough`}
                  />
                ) : (
                  <video
                    src={videoEmbedUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            ) : (
              <div className="bg-zinc-900/90 border border-amber-500/30 rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto space-y-4 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                  <Video className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-white">4K Walkthrough Video Available</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    A private walkthrough video and floor plans for <strong>{property.name}</strong> can be delivered directly to your WhatsApp.
                  </p>
                </div>
                <a
                  href={getWhatsAppVideoRequestUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition shadow-lg cursor-pointer"
                >
                  <svg viewBox="0 0 32 32" className="w-4 h-4 fill-white shrink-0" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 2C8.28 2 2 8.28 2 16c0 2.66.75 5.15 2.05 7.29L2.3 29.7l6.63-1.74A13.9 13.9 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm8.17 19.83c-.34.96-1.7 1.76-2.76 1.99-.73.16-1.68.29-4.88-1.04-4.09-1.69-6.72-5.83-6.93-6.1-.2-.28-1.67-2.22-1.67-4.23s1.05-3.01 1.43-3.42c.38-.41.82-.51 1.1-.51.27 0 .55 0 .79.02.25.01.59-.1.92.7.34.82 1.16 2.83 1.26 3.04.1.2.17.44.03.71-.13.27-.2.44-.4.68-.2.24-.43.53-.61.71-.21.21-.43.44-.19.86.25.41 1.09 1.8 2.34 2.91 1.61 1.43 2.97 1.88 3.39 2.09.42.2.67.18.92-.1.25-.28 1.07-1.24 1.35-1.67.28-.43.56-.36.94-.22.38.14 2.42 1.14 2.83 1.35.41.2.69.31.79.48.1.18.1 1.02-.24 1.98z" />
                  </svg>
                  <span>Request Video on WhatsApp</span>
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= 3. THUMBNAILS RAIL & FOOTER CONTROLS ================= */}
      <div
        className="pt-2 sm:pt-3 border-t border-white/10 shrink-0 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thumbnails rail when in photos mode */}
        {activeMediaMode === 'photos' && mediaImages.length > 1 && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1 scrollbar-none max-w-4xl mx-auto px-2">
            {mediaImages.map((imgUrl, idx) => {
              const isActive = idx === activePhotoIdx;
              return (
                <button
                  key={`${imgUrl}-${idx}`}
                  type="button"
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`relative w-14 h-10 sm:w-18 sm:h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    isActive
                      ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105'
                      : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/60'
                  }`}
                >
                  <Image
                    src={imgUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Footer info & CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 text-white max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap justify-center sm:justify-start">
            <span className="font-black text-amber-400 text-xs sm:text-sm md:text-base">
              {formatPriceDisplay(property.price)}
            </span>
            {(property.configuration || property.bhk) && (
              <>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-300 font-semibold">
                  {property.configuration || property.bhk}
                </span>
              </>
            )}
            {property.sqft && (
              <>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400">
                  {cleanSqft(property.sqft)}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end w-full sm:w-auto">
            {onBookSiteVisit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBookSiteVisit(property);
                }}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition cursor-pointer shadow-md"
              >
                <Calendar className="w-3.5 h-3.5 text-zinc-950 shrink-0" />
                <span>Book Site Visit</span>
              </button>
            )}

            <Link
              href={getPropertyUrl(property)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer border border-white/10"
            >
              <span>View Full Specs</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


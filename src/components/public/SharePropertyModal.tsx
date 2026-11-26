'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Share2,
  Copy,
  Check,
  X,
  Mail,
  ExternalLink,
  Building2,
  MapPin,
  IndianRupee,
  ShieldCheck
} from 'lucide-react';

export interface ShareableProperty {
  id?: string | number;
  name: string;
  locality?: string;
  location?: string;
  price?: string;
  bhk?: string;
  sqft?: string;
  url?: string;
  slug?: string;
  image?: string;
  developer?: string;
  reraNumber?: string;
  status?: string;
}

interface SharePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: ShareableProperty | null;
}

export function SharePropertyModal({
  isOpen,
  onClose,
  property
}: SharePropertyModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDetails, setCopiedDetails] = useState(false);

  if (!isOpen || !property) return null;

  // Compute full URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.anvreealty.com';
  const rawUrl = property.url || `/properties/${property.slug || property.id || ''}`;
  const fullUrl = rawUrl.startsWith('http') ? rawUrl : `${origin}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

  // Formatted property details summary for text sharing
  const propertySummaryText = `🏢 *ANV REEALTY - Verified Property Dossier*
📍 *Project*: ${property.name}
🌆 *Location*: ${property.locality || property.location || 'Pune, Maharashtra'}
📐 *Configuration*: ${property.bhk || 'Prime Typology'}${property.sqft ? ` (${property.sqft})` : ''}
💰 *Price*: ${property.price || 'Price on Request'}${property.status ? `\n🏷️ *Status*: ${property.status}` : ''}${property.developer ? `\n🏗️ *Developer*: ${property.developer}` : ''}
🔗 *View Dossier*: ${fullUrl}

📞 *ANV REEALTY Central Advisory Desk*: +91 93730 20701 / East Wing, M.G. Road, Camp, Pune`;

  // 1. WhatsApp Share
  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(propertySummaryText)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // 2. Copy Link to Clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // 3. Copy Full Details to Clipboard
  const handleCopyDetails = async () => {
    try {
      await navigator.clipboard.writeText(propertySummaryText);
      setCopiedDetails(true);
      setTimeout(() => setCopiedDetails(false), 2500);
    } catch (err) {
      console.error('Failed to copy details:', err);
    }
  };

  // 4. Native Browser Share (Mobile/Tablet/Supported Desktop)
  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${property.name} - ANV REEALTY`,
          text: `Check out this verified property in ${property.locality || 'Pune'}: ${property.name} (${property.price || ''})`,
          url: fullUrl
        });
      } catch (err) {
        // User cancelled share or browser error; fallback gracefully
        console.log('Share dismissed or cancelled');
      }
    } else {
      handleCopyLink();
    }
  };

  // 5. Email Share
  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Verified Property Dossier: ${property.name} - ANV REEALTY Pune`);
    const body = encodeURIComponent(
      `Hello,\n\nI wanted to share this verified property from ANV REEALTY:\n\n${propertySummaryText}\n\nExplore full details online: ${fullUrl}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden z-10 flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-zinc-900 text-white flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Share Property Details</h3>
              <p className="text-[11px] text-zinc-400">Send verified dossiers or property links to clients & peers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Property Brief Card */}
        <div className="p-5 space-y-4">
          <div className="bg-zinc-50 rounded-2xl p-3 border border-zinc-200 flex gap-3.5 items-center">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-zinc-200 border border-zinc-200">
              <Image
                src={property.image || '/LogoAnv-original.png'}
                alt={property.name}
                fill
                unoptimized
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                  {property.bhk || 'Verified Asset'}
                </span>
                {property.status && (
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                    {property.status}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-black text-zinc-900 truncate mt-1">
                {property.name}
              </h4>
              <div className="flex items-center justify-between text-xs text-zinc-600 mt-0.5">
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                  <span className="truncate">{property.locality || property.location || 'Pune'}</span>
                </span>
                <span className="font-extrabold text-amber-700 shrink-0 ml-2">
                  {property.price || 'Price on Request'}
                </span>
              </div>
            </div>
          </div>

          {/* Direct Share Options */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
              Quick Share Options
            </label>

            {/* 1. Share on WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2.5 cursor-pointer text-xs sm:text-sm"
            >
              {/* Authentic WhatsApp SVG */}
              <svg viewBox="0 0 32 32" className="w-4 h-4 fill-white shrink-0" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2C8.28 2 2 8.28 2 16c0 2.66.75 5.15 2.05 7.29L2.3 29.7l6.63-1.74A13.9 13.9 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm8.17 19.83c-.34.96-1.7 1.76-2.76 1.99-.73.16-1.68.29-4.88-1.04-4.09-1.69-6.72-5.83-6.93-6.1-.2-.28-1.67-2.22-1.67-4.23s1.05-3.01 1.43-3.42c.38-.41.82-.51 1.1-.51.27 0 .55 0 .79.02.25.01.59-.1.92.7.34.82 1.16 2.83 1.26 3.04.1.2.17.44.03.71-.13.27-.2.44-.4.68-.2.24-.43.53-.61.71-.21.21-.43.44-.19.86.25.41 1.09 1.8 2.34 2.91 1.61 1.43 2.97 1.88 3.39 2.09.42.2.67.18.92-.1.25-.28 1.07-1.24 1.35-1.67.28-.43.56-.36.94-.22.38.14 2.42 1.14 2.83 1.35.41.2.69.31.79.48.1.18.1 1.02-.24 1.98z" />
              </svg>
              <span>Share Dossier on WhatsApp</span>
            </button>

            {/* 2. Copy Link & Copy Full Details Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-800 hover:border-zinc-300'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyDetails}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  copiedDetails
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-800 hover:border-zinc-300'
                }`}
              >
                {copiedDetails ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Details Copied!</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Copy Full Details</span>
                  </>
                )}
              </button>
            </div>

            {/* 3. Native Device Share & Email Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleNativeShare}
                className="py-2.5 px-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 hover:border-zinc-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-zinc-500" />
                <span>More Share Options</span>
              </button>

              <button
                type="button"
                onClick={handleEmailShare}
                className="py-2.5 px-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 hover:border-zinc-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                <span>Share via Email</span>
              </button>
            </div>
          </div>

          {/* Share Link Preview Box */}
          <div className="pt-2 border-t border-zinc-100">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Direct Property URL
            </label>
            <div className="flex items-center gap-2 bg-zinc-100 rounded-xl px-3 py-2 border border-zinc-200 text-zinc-600 text-xs font-mono">
              <span className="truncate flex-1">{fullUrl}</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-amber-800 hover:text-amber-950 font-sans font-bold text-[11px] shrink-0 hover:underline cursor-pointer"
              >
                {copiedLink ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Advisory Footer */}
          <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-200/80 flex items-center gap-2 text-[11px] text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Verified Pune property dossier backed by <strong>ANV REEALTY</strong> Central Advisory Desk.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

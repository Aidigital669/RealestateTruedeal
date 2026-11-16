'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  User,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PhoneCall
} from 'lucide-react';

interface SellerLeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLocation?: string;
  initialBhk?: string;
  buyerRef?: string;
  buyerDemandSummary?: string;
  onSuccessToast?: (msg: string) => void;
}

export function SellerLeadCaptureModal({
  isOpen,
  onClose,
  initialLocation = '',
  initialBhk = '',
  buyerRef,
  buyerDemandSummary,
  onSuccessToast
}: SellerLeadCaptureModalProps) {
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState(initialLocation);
  const [bhk, setBhk] = useState(initialBhk);
  const [askingPrice, setAskingPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCallbackForm, setShowCallbackForm] = useState(false);

  const buyerWhatsAppUrl = `https://wa.me/919373020701?text=${encodeURIComponent(
    `Hello ANV Realty Desk, I am contacting you regarding Verified Buyer Ref: ${buyerRef || ''}${
      buyerDemandSummary ? ` (${buyerDemandSummary})` : ''
    }. I have a matching property/inquiry and would like to connect with this buyer.`
  )}`;

  const getWhatsAppUrl = () => {
    const parts: string[] = ['*ANV REEALTY - Seller / Owner Listing Enquiry*'];
    if (name.trim()) parts.push(`*Owner Name:* ${name.trim()}`);
    if (number.trim()) parts.push(`*Phone:* ${number.trim()}`);
    if (email.trim()) parts.push(`*Email:* ${email.trim()}`);
    if (location.trim()) parts.push(`*Location:* ${location.trim()}`);
    if (bhk.trim()) parts.push(`*Property Type/Config:* ${bhk.trim()}`);
    if (askingPrice.trim()) parts.push(`*Asking Price/Budget:* ${askingPrice.trim()}`);
    if (notes.trim()) parts.push(`*Society / Details:* ${notes.trim()}`);
    parts.push('\nHello, I would like to list/enquire about selling or leasing my property through Anv Reealty.');
    return `https://wa.me/919373020701?text=${encodeURIComponent(parts.join('\n'))}`;
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setShowCallbackForm(false);
      if (initialLocation && initialLocation !== 'All') {
        setLocation(initialLocation);
      }
      if (initialBhk && initialBhk !== 'All') {
        setBhk(initialBhk);
      }
    }
  }, [isOpen, initialLocation, initialBhk]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleQuickCallback = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide your name.');
      return;
    }
    if (!number.trim() || number.trim().length < 10) {
      setError('Please provide a valid 10-digit contact number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/buyer-demands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: initialLocation || 'Pune',
          name: name.trim(),
          number: number.trim(),
          email: `${number.trim()}@callback.anvrealty.internal`,
          bhk: initialBhk || undefined,
          buyerRef: buyerRef || undefined,
          notes: `Quick Callback Request from Website for Buyer ${buyerRef || ''}: ${buyerDemandSummary || ''}`
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit callback request');
      }

      onClose();
      if (onSuccessToast) {
        onSuccessToast('Thank you! Our senior advisory desk will call you shortly.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!location.trim()) {
      setError('Please enter the location of your property.');
      return;
    }
    if (!name.trim()) {
      setError('Please provide your name.');
      return;
    }
    if (!number.trim() || number.trim().length < 10) {
      setError('Please provide a valid 10-digit contact number.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/buyer-demands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: location.trim(),
          name: name.trim(),
          number: number.trim(),
          email: email.trim(),
          bhk: bhk ? bhk.trim() : undefined,
          askingPrice: askingPrice.trim() || undefined,
          buyerRef: buyerRef || undefined,
          notes: notes.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit enquiry');
      }

      onClose();
      if (onSuccessToast) {
        onSuccessToast('Thank you for enquiry');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl my-auto bg-zinc-950 text-white rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_50px_rgba(217,119,6,0.25)] border border-amber-500/30 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] transition-all animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-sm border border-white/10 transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-amber-500/20 bg-gradient-to-b from-zinc-900 to-zinc-950 shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{buyerRef ? `Match with Buyer ${buyerRef}` : 'Seller Property Registration Desk'}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {buyerRef ? 'Connect With Verified Buyer' : 'Register Your Property to Find Buyers'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-lg">
            {buyerRef
              ? `Connect directly with our central desk at 93730 20701 via WhatsApp or Call to facilitate this buyer match.`
              : 'No matching buyer active right now for your exact search. Leave your property details and our luxury desk will find buyers for you immediately.'}
          </p>

          {buyerDemandSummary && (
            <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold line-clamp-2">{buyerDemandSummary}</span>
            </div>
          )}
        </div>

        {/* ================= CONDITIONAL CONTENT ================= */}
        {buyerRef ? (
          /* ================= 1. DIRECT CONNECT VIEW (NO LONG FORM) ================= */
          <div className="p-6 space-y-4 overflow-y-auto">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold animate-in fade-in">
                {error}
              </div>
            )}

            {/* Direct Connect Action Buttons */}
            <div className="space-y-3 pt-1">
              {/* WhatsApp Button */}
              <a
                href={buyerWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-5 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-zinc-950 font-black text-sm sm:text-base flex items-center justify-center gap-3 transition shadow-[0_10px_30px_rgba(37,211,102,0.3)] cursor-pointer group"
              >
                <svg viewBox="0 0 32 32" className="w-5 h-5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 2C8.28 2 2 8.28 2 16c0 2.66.75 5.15 2.05 7.29L2.3 29.7l6.63-1.74A13.9 13.9 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm8.17 19.83c-.34.96-1.7 1.76-2.76 1.99-.73.16-1.68.29-4.88-1.04-4.09-1.69-6.72-5.83-6.93-6.1-.2-.28-1.67-2.22-1.67-4.23s1.05-3.01 1.43-3.42c.38-.41.82-.51 1.1-.51.27 0 .55 0 .79.02.25.01.59-.1.92.7.34.82 1.16 2.83 1.26 3.04.1.2.17.44.03.71-.13.27-.2.44-.4.68-.2.24-.43.53-.61.71-.21.21-.43.44-.19.86.25.41 1.09 1.8 2.34 2.91 1.61 1.43 2.97 1.88 3.39 2.09.42.2.67.18.92-.1.25-.28 1.07-1.24 1.35-1.67.28-.43.56-.36.94-.22.38.14 2.42 1.14 2.83 1.35.41.2.69.31.79.48.1.18.1 1.02-.24 1.98z" />
                </svg>
                <div className="text-left">
                  <span className="block leading-tight">Connect on WhatsApp</span>
                  <span className="block text-[11px] font-bold text-zinc-900/80 leading-tight">Instant response from advisory desk</span>
                </div>
              </a>

              {/* Direct Call Button */}
              <a
                href="tel:+919373020701"
                className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-zinc-950 font-black text-sm sm:text-base flex items-center justify-center gap-3 transition shadow-[0_10px_30px_rgba(245,158,11,0.3)] cursor-pointer group"
              >
                <PhoneCall className="w-5 h-5 shrink-0" />
                <div className="text-left">
                  <span className="block leading-tight">Call Our Senior Desk</span>
                  <span className="block text-[11px] font-bold text-zinc-900/80 leading-tight">Dial +91 93730 20701 directly</span>
                </div>
              </a>
            </div>

            {/* How it works info */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Direct Introduction Protocol</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Our central advisory desk will coordinate a direct, confidential introduction between you and buyer <strong className="text-white font-mono">{buyerRef}</strong>. No brokerage delays, direct senior facilitation.
              </p>
            </div>

            {/* Quick Callback Accordion */}
            <div className="pt-2 border-t border-zinc-800/80">
              {!showCallbackForm ? (
                <button
                  type="button"
                  onClick={() => setShowCallbackForm(true)}
                  className="w-full text-center text-xs text-zinc-400 hover:text-amber-400 transition underline underline-offset-4 cursor-pointer py-1"
                >
                  Want our desk to call you back instead? Click here
                </button>
              ) : (
                <form onSubmit={handleQuickCallback} className="space-y-3 pt-2 animate-in fade-in duration-200">
                  <div className="text-xs font-bold text-amber-400">Request Instant Callback:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name *"
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-500"
                    />
                    <input
                      type="tel"
                      required
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="10-digit Phone Number *"
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? 'Submitting...' : 'Request Callback'}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* ================= 2. SELLER PROPERTY REGISTRATION FORM (WHEN NO BUYER IS SELECTED) ================= */
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold animate-in fade-in">
                {error}
              </div>
            )}

            {/* Location field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Property Location *</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Baner, Koregaon Park, Balewadi, Pune"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition"
              />
            </div>

            {/* Name & Phone Number fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Your Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Contact Number *</span>
                </label>
                <input
                  type="tel"
                  required
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition"
                />
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>Email Address *</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. seller@example.com"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition"
              />
            </div>

            {/* Typology / BHK & Asking Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-400" />
                  <span>Property Typology / BHK</span>
                </label>
                <input
                  type="text"
                  value={bhk}
                  onChange={(e) => setBhk(e.target.value)}
                  placeholder="e.g. 3 BHK, 4 BHK, Commercial Office"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <span>Expected Price / Budget</span>
                </label>
                <input
                  type="text"
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(e.target.value)}
                  placeholder="e.g. ₹2.25 Cr / Negotiable"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">
                Additional Details / Society Name
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Project name, floor number, car parking, carpet area..."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-500 outline-none resize-none transition"
              />
            </div>

            {/* ANV Helpline Notice */}
            <div className="p-3 rounded-2xl bg-zinc-900/90 border border-amber-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-zinc-300">
                  Direct Desk: <strong className="text-white font-mono">93730 20701</strong>
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-[#25D366] hover:underline"
                >
                  WhatsApp
                </a>
                <span className="text-zinc-600">&bull;</span>
                <a
                  href="tel:+919373020701"
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2"
                >
                  Call
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-zinc-950 font-black py-3.5 px-6 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(217,119,6,0.3)] disabled:opacity-60 cursor-pointer text-sm"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Submit Property Enquiry</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-zinc-950 border border-[#25D366]/40 hover:border-[#25D366] font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg viewBox="0 0 32 32" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 2C8.28 2 2 8.28 2 16c0 2.66.75 5.15 2.05 7.29L2.3 29.7l6.63-1.74A13.9 13.9 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm8.17 19.83c-.34.96-1.7 1.76-2.76 1.99-.73.16-1.68.29-4.88-1.04-4.09-1.69-6.72-5.83-6.93-6.1-.2-.28-1.67-2.22-1.67-4.23s1.05-3.01 1.43-3.42c.38-.41.82-.51 1.1-.51.27 0 .55 0 .79.02.25.01.59-.1.92.7.34.82 1.16 2.83 1.26 3.04.1.2.17.44.03.71-.13.27-.2.44-.4.68-.2.24-.43.53-.61.71-.21.21-.43.44-.19.86.25.41 1.09 1.8 2.34 2.91 1.61 1.43 2.97 1.88 3.39 2.09.42.2.67.18.92-.1.25-.28 1.07-1.24 1.35-1.67.28-.43.56-.36.94-.22.38.14 2.42 1.14 2.83 1.35.41.2.69.31.79.48.1.18.1 1.02-.24 1.98z" />
                </svg>
                <span>Enquire on WhatsApp</span>
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

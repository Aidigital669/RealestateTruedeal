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
  Building2
} from 'lucide-react';

export interface BuyerDemandContext {
  id?: string;
  referenceCode?: string;
  maskedName?: string;
  locality?: string;
  bhk?: string;
  budget?: string;
  timeline?: string;
  purpose?: string;
  requirements?: string;
}

interface SellerLeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLocation?: string;
  initialBhk?: string;
  initialPrice?: string;
  buyerRef?: string;
  buyerDemand?: BuyerDemandContext;
  buyerDemandSummary?: string;
  onSuccessToast?: (msg: string) => void;
  onPropertySaved?: () => void;
}

export function SellerLeadCaptureModal({
  isOpen,
  onClose,
  initialLocation = '',
  initialBhk = '',
  initialPrice = '',
  buyerRef,
  buyerDemand,
  buyerDemandSummary,
  onSuccessToast,
  onPropertySaved
}: SellerLeadCaptureModalProps) {
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [bhk, setBhk] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [title, setTitle] = useState('');
  const [sqft, setSqft] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Submission state result
  const [submissionResult, setSubmissionResult] = useState<{
    isMatch: boolean;
    message: string;
    buyerRef?: string;
    propertySlug?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSubmissionResult(null);

      const targetLoc = buyerDemand?.locality || (initialLocation && initialLocation !== 'All' ? initialLocation : 'Pune');
      const targetBhk = buyerDemand?.bhk || (initialBhk && initialBhk !== 'All' ? initialBhk : '');
      const targetBudget = buyerDemand?.budget || (initialPrice && initialPrice !== 'All' ? initialPrice : '');

      setLocation(targetLoc);
      setBhk(targetBhk);
      setAskingPrice(targetBudget);
      setTitle(targetBhk ? `${targetBhk} in ${targetLoc}` : (targetLoc ? `Premium Property in ${targetLoc}` : ''));
      setSqft('');
      setNotes('');
    }
  }, [isOpen, buyerDemand, initialLocation, initialBhk, initialPrice]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide your name.');
      return;
    }
    const cleanPhone = number.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!location.trim()) {
      setError('Please enter the property location.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/buyer-demands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          number: cleanPhone,
          phone: cleanPhone,
          email: email.trim().toLowerCase(),
          location: location.trim(),
          bhk: bhk.trim() || (buyerDemand?.bhk || 'Commercial / Residential'),
          askingPrice: askingPrice.trim() || (buyerDemand?.budget || 'Market Rate'),
          title: title.trim() || `${bhk || 'Property'} in ${location}`,
          sqft: sqft.trim() || undefined,
          buyerRef: buyerRef || buyerDemand?.referenceCode || undefined,
          buyerDemand: buyerDemand || undefined,
          notes: notes.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit property');
      }

      setSubmissionResult({
        isMatch: Boolean(data.isMatch),
        message: data.message,
        buyerRef: data.buyerRef || buyerRef || buyerDemand?.referenceCode,
        propertySlug: data.propertySlug
      });

      if (onSuccessToast) {
        onSuccessToast(data.message);
      }
      if (onPropertySaved) {
        onPropertySaved();
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl my-auto bg-zinc-950 text-white rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_50px_rgba(163, 136, 30,0.25)] border border-amber-500/30 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] transition-all animate-in zoom-in-95 duration-200">
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
            <span>
              {buyerRef || buyerDemand?.referenceCode
                ? `Submit Property for Buyer ${buyerRef || buyerDemand?.referenceCode}`
                : 'Submit Your Property'}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {submissionResult
              ? submissionResult.isMatch
                ? 'Matching Buyer Found!'
                : 'Property Saved to Portal'
              : 'Submit Your Property Details'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-lg leading-relaxed">
            {submissionResult
              ? 'Your property submission has been processed successfully.'
              : 'Fill in your property details. If it matches our active buyer mandate, we will connect you directly. In all cases, your property will be accepted and saved to our property page.'}
          </p>

          {/* Target Buyer Requirement Banner (Auto-filled context) */}
          {(buyerRef || buyerDemand?.referenceCode || buyerDemandSummary) && !submissionResult && (
            <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-amber-400 block">
                  Target Buyer: {buyerDemand?.maskedName || 'Verified Buyer'} (Ref: {buyerRef || buyerDemand?.referenceCode})
                </span>
                <span className="text-[11px] text-zinc-300 block">
                  Looking for: {buyerDemand?.bhk || initialBhk || 'Commercial'} in {buyerDemand?.locality || initialLocation || 'Pune'} &bull; Budget: {buyerDemand?.budget || initialPrice || 'Competitive'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ================= CONDITIONAL CONTENT ================= */}
        {submissionResult ? (
          /* ================= SUCCESS STATE ================= */
          <div className="p-6 sm:p-8 text-center space-y-5 overflow-y-auto animate-in zoom-in-95 duration-200">
            {submissionResult.isMatch ? (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.35)]">
                  <Sparkles className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
                    🎉 Match Found!
                  </div>
                  <h4 className="text-2xl font-black text-white">
                    We Found a Matching Buyer!
                  </h4>
                  <p className="text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
                    Great news! Your property details match the active requirements of{' '}
                    <strong className="text-amber-400 font-mono">
                      Buyer {submissionResult.buyerRef || buyerRef}
                    </strong>
                    . Our luxury advisory desk is initiating direct facilitation.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900 border border-emerald-500/30 text-left text-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Property Details Saved to Property Page &amp; CRM</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Your property in <strong className="text-white">{location}</strong> ({bhk}) is published in our catalogue. Our desk will contact you at <strong className="text-white">{number}</strong> and <strong className="text-white">{email}</strong>.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_30px_rgba(185, 151, 79,0.35)]">
                  <CheckCircle2 className="w-8 h-8 text-amber-400" />
                </div>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider">
                    ✅ Property Saved
                  </div>
                  <h4 className="text-2xl font-black text-white">
                    Property Accepted &amp; Saved!
                  </h4>
                  <p className="text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
                    Your property details in <strong className="text-white">{location}</strong> have been accepted and added to our property page catalogue.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900 border border-amber-500/30 text-left text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span>Live on Anv Reealty Property Portal</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Our central advisory desk will actively present your property to incoming buyers matching your pricing and typology.
                  </p>
                </div>
              </>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinish}
                className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black py-3 px-6 rounded-xl transition shadow-md cursor-pointer text-sm"
              >
                Done / Continue
              </button>
            </div>
          </div>
        ) : (
          /* ================= REGULAR FORM (ALWAYS OPENS WITH AUTO-FILLED DATA) ================= */
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold animate-in fade-in">
                {error}
              </div>
            )}

            {/* Property Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-amber-400" />
                <span>Property Title *</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Commercial Office/Space in Pune"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition"
              />
            </div>

            {/* Location & BHK (Auto-filled) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  placeholder="e.g. Pune, Baner, Undri"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Typology / Configuration *</span>
                </label>
                <input
                  type="text"
                  required
                  value={bhk}
                  onChange={(e) => setBhk(e.target.value)}
                  placeholder="e.g. Commercial Office/Space, 3 BHK"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition"
                />
              </div>
            </div>

            {/* Asking Price & Carpet Area (Auto-filled) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <span>Asking / Expected Price *</span>
                </label>
                <input
                  type="text"
                  required
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(e.target.value)}
                  placeholder="e.g. ₹3.00 Cr / Negotiable"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <span>Carpet Area (Sq.Ft.)</span>
                </label>
                <input
                  type="text"
                  value={sqft}
                  onChange={(e) => setSqft(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition"
                />
              </div>
            </div>

            {/* Contact Person Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Your Name (Owner / Representative) *</span>
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

            {/* 2 EXTRA REQUIRED CONTACT FIELDS: PHONE NUMBER & EMAIL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Phone Number *</span>
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
                  placeholder="e.g. owner@example.com"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition"
                />
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">
                Additional Property Details / Society Name
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Society/Project name, floor number, car parking, amenities..."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-500 outline-none resize-none transition"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#b9974f] hover:bg-[#a4823d] active:scale-[0.99] text-zinc-950 font-black py-3.5 px-6 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(185,151,79,0.35)] disabled:opacity-60 cursor-pointer text-sm"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Submit Your Property</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

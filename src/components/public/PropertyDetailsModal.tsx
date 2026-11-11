'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  X,
  Building2,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Scale,
  Heart,
  ArrowRight,
  Calendar,
  Share2,
  Copy,
  Check,
  Compass,
  FileCheck,
  Award,
  Layers,
  PhoneCall,
  Briefcase
} from 'lucide-react';
import type { PropertyItem } from '@/components/public/HomepageSearchablePortal';
import { usePropertyComparison } from '@/context/PropertyComparisonContext';
import { InstantEnquiryModal } from '@/components/public/InstantEnquiryModal';
import { getClientSession } from '@/lib/user-auth';
import { AuthInquiryModal } from '@/components/auth/AuthInquiryModal';

interface PropertyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyItem | null;
  onInstantEnquiryClick?: () => void;
}

export function PropertyDetailsModal({
  isOpen,
  onClose,
  property,
  onInstantEnquiryClick
}: PropertyDetailsModalProps) {
  const { isInCompare, toggleCompare } = usePropertyComparison();
  const [isSaved, setIsSaved] = useState(false);
  const [copiedRera, setCopiedRera] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'amenities' | 'legal'>('overview');
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sync saved state with localStorage
  useEffect(() => {
    if (property) {
      try {
        const saved = localStorage.getItem('anv_saved_properties') || '[]';
        const list = JSON.parse(saved);
        setIsSaved(list.includes(String(property.id)));
      } catch (e) {
        // ignore
      }
    }
  }, [property]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !property) return null;

  const handleToggleSave = () => {
    const user = getClientSession();
    if (!user) {
      setAuthNotice('Login or Sign Up is compulsory to save properties to your shortlist.');
      setAuthModalOpen(true);
      return;
    }
    try {
      const saved = localStorage.getItem('anv_saved_properties') || '[]';
      let list: string[] = JSON.parse(saved);
      const propId = String(property.id);
      if (list.includes(propId)) {
        list = list.filter((id) => id !== propId);
        setIsSaved(false);
        setToastMsg(`Removed "${property.name}" from saved list`);
      } else {
        list.push(propId);
        setIsSaved(true);
        setToastMsg(`Saved "${property.name}" to your shortlist`);
      }
      localStorage.setItem('anv_saved_properties', JSON.stringify(list));
      setTimeout(() => setToastMsg(null), 3000);
    } catch (e) {
      // ignore
    }
  };

  const handleToggleCompare = () => {
    const user = getClientSession();
    if (!user) {
      setAuthNotice('Login or Sign Up is compulsory to compare properties.');
      setAuthModalOpen(true);
      return;
    }
    toggleCompare(property);
  };

  const handleCopyRera = () => {
    if (property.reraNumber) {
      navigator.clipboard.writeText(property.reraNumber);
      setCopiedRera(true);
      setTimeout(() => setCopiedRera(false), 2500);
    }
  };

  // Estimate calculations
  const priceRaw = property.priceRaw || 15000000;
  const stampDuty = Math.round(priceRaw * 0.07);
  const registrationFee = 30000;
  const isReady = property.status.toLowerCase().includes('ready');
  const gstRate = isReady ? 0 : 0.05;
  const gstAmount = Math.round(priceRaw * gstRate);
  const totalCost = priceRaw + stampDuty + registrationFee + gstAmount;

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    return `₹${(val / 100000).toFixed(2)} Lakh`;
  };

  const isCompared = isInCompare(property.id);

  return (
    <>
      {toastMsg && (
        <div className="fixed bottom-6 left-6 z-[80] bg-zinc-950 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-zinc-800 animate-in fade-in">
          {toastMsg}
        </div>
      )}

      <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
        <div
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden my-auto flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER BAR */}
          <div className="bg-zinc-950 px-6 py-4 text-white flex items-center justify-between border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-3">
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                Institutional Dossier
              </span>
              <span className="text-xs text-zinc-400 hidden sm:inline">
                Verified RERA ID: {property.reraNumber || 'PRM/PUN/RERA/2026/0491'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* SCROLLABLE BODY */}
          <div className="overflow-y-auto flex-1 p-6 space-y-6">
            {/* HERO CARD: IMAGE & TOP METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Image Preview */}
              <div className="md:col-span-5 relative h-56 md:h-72 w-full rounded-2xl overflow-hidden bg-zinc-100 shadow-sm border border-zinc-200">
                <Image
                  src={property.image}
                  alt={property.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/20">
                  {property.label || 'Verified Asset'}
                </div>
                {property.developer &&
                  !/anv\s*(signature\s*partner|verified\s*developer|partner\s*developer)/i.test(property.developer) && (
                  <div className="absolute bottom-3 left-3 right-3 bg-gradient-to-t from-black/80 to-transparent p-2 rounded-xl text-white">
                    <div className="text-[10px] text-zinc-300 uppercase tracking-wider font-semibold">
                      Developer Partner
                    </div>
                    <div className="text-sm font-bold truncate">{property.developer}</div>
                  </div>
                )}
              </div>

              {/* Title & Key Highlights */}
              <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-md">
                      {property.locality || 'Pune'}
                    </span>
                    <span className="text-xs text-zinc-500 flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>{property.location}</span>
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
                    {property.name}
                  </h2>
                </div>

                {/* Prominent Price & Zero Brokerage */}
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      All-Inclusive Pricing
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-zinc-950">
                      {property.price}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-semibold block mt-0.5">
                      {property.priceSuffix || 'All Inclusive'}
                    </span>
                  </div>
                </div>

                {/* 4 Quick Stat Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Typology</span>
                    <span className="font-extrabold text-zinc-900 truncate block mt-0.5">{property.bhk}</span>
                  </div>
                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Carpet Area</span>
                    <span className="font-extrabold text-zinc-900 block mt-0.5">{property.sqft ? property.sqft.replace(/\s*carpet\s*/gi, '').trim() : '1,200 Sq.Ft.'}</span>
                  </div>
                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Possession</span>
                    <span className="font-extrabold text-zinc-900 block mt-0.5 truncate">{property.status}</span>
                  </div>
                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">MahaRERA</span>
                    <span className="font-extrabold text-emerald-700 block mt-0.5">Approved ✓</span>
                  </div>
                </div>

                {/* Suitable For Business Purposes */}
                {property.businessPurposes && property.businessPurposes.length > 0 && (
                  <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-900">
                      <Briefcase className="w-3.5 h-3.5 text-amber-700" />
                      <span className="text-xs font-black uppercase tracking-wider">
                        Suitable For:
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {property.businessPurposes.map((bp) => (
                        <span
                          key={bp.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-zinc-900 border border-amber-300 shadow-2xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>{bp.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-zinc-950 text-white'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
              >
                Executive Summary
              </button>
              <button
                onClick={() => setActiveTab('financials')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'financials'
                    ? 'bg-zinc-950 text-white'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
              >
                Financial Breakdown
              </button>
              <button
                onClick={() => setActiveTab('amenities')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'amenities'
                    ? 'bg-zinc-950 text-white'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
              >
                Lifestyle & Amenities
              </button>
              <button
                onClick={() => setActiveTab('legal')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'legal'
                    ? 'bg-zinc-950 text-white'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
              >
                RERA & Compliance
              </button>
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 mb-1.5">Property Narrative</h4>
                  <p className="text-zinc-600 leading-relaxed text-sm">
                    {property.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
                    <span className="font-bold text-zinc-900 block mb-1">Architectural Highlights</span>
                    <ul className="space-y-1 text-zinc-600 list-disc list-inside">
                      <li>East/West orientation with maximum cross-ventilation</li>
                      <li>High ceilings with acoustic double-glazed windows</li>
                      <li>Zero dead-space layout engineered for private entertaining</li>
                    </ul>
                  </div>

                  <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
                    <span className="font-bold text-zinc-900 block mb-1">Locality Advantage</span>
                    <ul className="space-y-1 text-zinc-600 list-disc list-inside">
                      <li>Prime micro-market in {property.locality || 'Pune'}</li>
                      <li>Fast arterial access to Metro Line 3 and Expressway</li>
                      <li>Within 10 mins of leading international academies & hospitals</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: FINANCIALS */}
            {activeTab === 'financials' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl">
                  <h4 className="font-bold text-sm text-amber-950 mb-1">Estimated Cost Sheet & Statutory Fees</h4>
                  <p className="text-amber-800">
                    Transparent statutory estimates calculated as per current Government of Maharashtra real estate tariffs.
                  </p>
                </div>

                <div className="border border-zinc-200 rounded-2xl overflow-hidden divide-y divide-zinc-200">
                  <div className="flex justify-between items-center p-3.5 bg-zinc-50">
                    <span className="font-bold text-zinc-800">Base Agreement Value</span>
                    <span className="font-black text-zinc-950 text-sm">{formatCurrency(priceRaw)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3.5">
                    <span className="text-zinc-600">MahaRERA Stamp Duty (7%)</span>
                    <span className="font-semibold text-zinc-900">{formatCurrency(stampDuty)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3.5">
                    <span className="text-zinc-600">Statutory Registration Charges</span>
                    <span className="font-semibold text-zinc-900">₹30,000</span>
                  </div>
                  <div className="flex justify-between items-center p-3.5">
                    <span className="text-zinc-600">Goods & Services Tax (GST {isReady ? '0% - OC Received' : '5%'})</span>
                    <span className="font-semibold text-zinc-900">{isReady ? '₹0 (OC Received)' : formatCurrency(gstAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-zinc-950 text-white font-bold">
                    <span>Estimated Total Landed Investment</span>
                    <span className="text-amber-400 text-base font-black">{formatCurrency(totalCost)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: AMENITIES */}
            {activeTab === 'amenities' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { title: 'Infinity Edge Pool', desc: 'Temperature-controlled rooftop deck' },
                    { title: 'Grand Clubhouse', desc: 'Private banquet & cigar lounge' },
                    { title: 'Biometric Security', desc: '3-tier access control & CCTV' },
                    { title: 'EV Charging Infrastructure', desc: 'Dedicated charging at each bay' },
                    { title: 'Fitness & Yoga Sanctuary', desc: 'Imported equipment & steam/sauna' },
                    { title: 'Squash & Padel Court', desc: 'Competition-grade court' }
                  ].map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl">
                      <div className="flex items-center gap-1.5 font-bold text-zinc-900 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                        <span>{item.title}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-snug">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: LEGAL & COMPLIANCE */}
            {activeTab === 'legal' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-emerald-950">MahaRERA & RPS Legal Clearance</h4>
                    <p className="text-emerald-800 mt-1">
                      This property has been vetted by ANV Reality's legal diligence team. Clear title deed, encumbrance-free verification, and valid environmental clearance.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">MahaRERA Number</span>
                      <span className="font-mono font-bold text-zinc-900 block mt-0.5">
                        {property.reraNumber || 'PRM/PUN/RERA/2026/0491'}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyRera}
                      className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-600 transition"
                      title="Copy RERA ID"
                    >
                      {copiedRera ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">RPS Valuation Status</span>
                    <span className="font-bold text-emerald-700 block mt-0.5">
                      Verified &bull; Tier-1 High Liquidity Asset
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACTION FOOTER BAR */}
          <div className="bg-zinc-50 px-6 py-4 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {/* Compare Button */}
              <button
                onClick={handleToggleCompare}
                className={`flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                  isCompared
                    ? 'bg-amber-500 text-black border-amber-500 hover:bg-amber-400'
                    : 'bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-100'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{isCompared ? '✓ Added to Compare' : 'Add to Compare'}</span>
              </button>

              {/* Save Button */}
              <button
                onClick={handleToggleSave}
                className={`p-2.5 rounded-xl border transition cursor-pointer ${
                  isSaved
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                }`}
                title="Save Residence"
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <a
                href={`https://wa.me/919373020701?text=${encodeURIComponent(
                  `*ANV REEALTY - Property Enquiry*\n*Property:* ${property.name}\n*Location:* ${property.location}\n*Price:* ${property.price}\n\nHello, I would like to enquire about this property on WhatsApp.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-zinc-950 border border-[#25D366]/40 hover:border-[#25D366] font-bold text-xs px-3.5 py-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                title="Direct WhatsApp Enquiry"
              >
                <svg viewBox="0 0 32 32" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 2C8.28 2 2 8.28 2 16c0 2.66.75 5.15 2.05 7.29L2.3 29.7l6.63-1.74A13.9 13.9 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm8.17 19.83c-.34.96-1.7 1.76-2.76 1.99-.73.16-1.68.29-4.88-1.04-4.09-1.69-6.72-5.83-6.93-6.1-.2-.28-1.67-2.22-1.67-4.23s1.05-3.01 1.43-3.42c.38-.41.82-.51 1.1-.51.27 0 .55 0 .79.02.25.01.59-.1.92.7.34.82 1.16 2.83 1.26 3.04.1.2.17.44.03.71-.13.27-.2.44-.4.68-.2.24-.43.53-.61.71-.21.21-.43.44-.19.86.25.41 1.09 1.8 2.34 2.91 1.61 1.43 2.97 1.88 3.39 2.09.42.2.67.18.92-.1.25-.28 1.07-1.24 1.35-1.67.28-.43.56-.36.94-.22.38.14 2.42 1.14 2.83 1.35.41.2.69.31.79.48.1.18.1 1.02-.24 1.98z" />
                </svg>
                <span>WhatsApp</span>
              </a>
              <button
                onClick={() => {
                  if (onInstantEnquiryClick) {
                    onInstantEnquiryClick();
                  } else {
                    setEnquiryOpen(true);
                  }
                }}
                className="flex-1 sm:flex-initial bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Instant Enquiry / Site Visit</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Instant Enquiry Modal */}
      <InstantEnquiryModal
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        property={property}
        onSuccess={(msg) => {
          setToastMsg(msg);
          setTimeout(() => setToastMsg(null), 4000);
        }}
      />

      {/* Compulsory Auth Modal for Save / Compare */}
      <AuthInquiryModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthNotice(null);
        }}
        featureNotice={authNotice || undefined}
        onSuccess={(msg) => {
          setToastMsg(msg);
          setTimeout(() => setToastMsg(null), 3500);
        }}
      />
    </>
  );
}

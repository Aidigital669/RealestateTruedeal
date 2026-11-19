'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Scale,
  ArrowLeft,
  X,
  Check,
  Building2,
  MapPin,
  ShieldCheck,
  Heart,
  Eye,
  ArrowRight,
  Plus,
  Trash2,
  Printer,
  Sparkles,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronRight
} from 'lucide-react';
import { usePropertyComparison } from '@/context/PropertyComparisonContext';
import { PropertyItem } from '@/components/public/HomepageSearchablePortal';
import { InstantEnquiryModal } from '@/components/public/InstantEnquiryModal';
import { UserProfile, getClientSession } from '@/lib/user-auth';
import { AuthInquiryModal } from '@/components/auth/AuthInquiryModal';
import { PublicHeader } from '@/components/public/PublicHeader';

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    compareList,
    addToCompare,
    removeFromCompare,
    clearCompare,
    setComparedProperties,
    isInCompare
  } = usePropertyComparison();

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const [allProperties, setAllProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightDiffs, setHighlightDiffs] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedPropertyForModal, setSelectedPropertyForModal] = useState<PropertyItem | null>(null);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [copiedReraId, setCopiedReraId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Monitor client authentication session
  useEffect(() => {
    setCurrentUser(getClientSession());
    setAuthChecked(true);

    const handleAuthChange = () => {
      setCurrentUser(getClientSession());
    };
    window.addEventListener('anv_auth_change', handleAuthChange);
    return () => window.removeEventListener('anv_auth_change', handleAuthChange);
  }, []);

  // Fetch all properties to enable adding properties and URL-based hydration
  useEffect(() => {
    async function loadAll() {
      try {
        const res = await fetch('/api/properties');
        const data = await res.json();
        if (data.properties && Array.isArray(data.properties)) {
          setAllProperties(data.properties);

          // If query params has ?ids=1,2,3, hydrate from URL
          const idsParam = searchParams.get('ids');
          if (idsParam) {
            const requestedIds = idsParam.split(',').map((id) => id.trim());
            const matching = data.properties.filter((p: PropertyItem) =>
              requestedIds.includes(String(p.id))
            );
            if (matching.length > 0) {
              setComparedProperties(matching);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load properties for comparison:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopyRera = (rera: string) => {
    navigator.clipboard.writeText(rera);
    setCopiedReraId(rera);
    showToast(`Copied RERA: ${rera}`);
    setTimeout(() => setCopiedReraId(null), 2500);
  };

  const calculatePricePerSqft = (prop: PropertyItem) => {
    const rawPrice = prop.priceRaw || 15000000;
    const rawSqft = prop.sqftNum || 1100;
    const ppsf = Math.round(rawPrice / rawSqft);
    return `₹${ppsf.toLocaleString('en-IN')} / sq.ft`;
  };

  const calculateStampDuty = (prop: PropertyItem) => {
    const rawPrice = prop.priceRaw || 15000000;
    const sd = Math.round(rawPrice * 0.07);
    if (sd >= 10000000) return `₹${(sd / 10000000).toFixed(2)} Cr`;
    return `₹${(sd / 100000).toFixed(2)} Lakh (7%)`;
  };

  const calculateGst = (prop: PropertyItem) => {
    const isReady = prop.status.toLowerCase().includes('ready');
    if (isReady) return '₹0 (0% - OC Issued)';
    const rawPrice = prop.priceRaw || 15000000;
    const gst = Math.round(rawPrice * 0.05);
    return `₹${(gst / 100000).toFixed(2)} Lakh (5%)`;
  };

  // Difference detection helpers
  const isDifferent = (getter: (p: PropertyItem) => any) => {
    if (compareList.length < 2) return false;
    const firstVal = getter(compareList[0]);
    return compareList.some((p) => getter(p) !== firstVal);
  };

  const diffRowClass = (isDiff: boolean) => {
    if (!highlightDiffs || !isDiff) return 'bg-white';
    return 'bg-amber-50/70 text-amber-950 font-semibold';
  };

  const availableToAdd = allProperties.filter(
    (p) => !compareList.some((cp) => String(cp.id) === String(p.id))
  );

  const filteredAvailableToAdd = availableToAdd.filter(
    (p) =>
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.developer.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.locality && p.locality.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  // COMPULSORY AUTHENTICATION GATE IF NOT LOGGED IN
  if (authChecked && !currentUser) {
    return (
      <>
        <PublicHeader />
        <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white flex items-center justify-center p-4 pt-28 pb-16">
          <div className="relative w-full max-w-lg bg-zinc-900/95 border border-amber-500/30 rounded-3xl p-7 sm:p-10 shadow-[0_25px_80px_rgba(0,0,0,0.8),0_0_40px_rgba(163, 136, 30,0.15)] backdrop-blur-2xl text-center overflow-hidden animate-in zoom-in-95">
            {/* Ambient gold glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-28 bg-amber-500/20 blur-3xl pointer-events-none" />

            {/* Scale Icon Badge */}
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-zinc-950 shadow-xl mb-4">
              <Scale className="w-8 h-8 text-zinc-950 stroke-[2.2]" />
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-extrabold uppercase tracking-widest text-amber-300 mb-3">
              Patron Authentication Required
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Compare Properties
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 mt-2.5 max-w-sm mx-auto leading-relaxed">
              Login or Sign Up is compulsory to access our side-by-side comparative analysis of architectural carpet, pricing, statutory RERA compliance & amenities.
            </p>

            <div className="mt-6 p-4 rounded-2xl bg-black/40 border border-white/5 text-left text-xs space-y-2.5 text-zinc-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Side-by-side comparative metrics for up to 4 luxury properties</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>MahaRERA registration verification & statutory compliance audits</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Direct carpet price per sq.ft and stamp duty calculation breakdown</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setAuthModalOpen(true);
                }}
                className="flex-1 py-3 px-5 rounded-xl bg-[#b9974f] hover:bg-[#a4823d] text-zinc-950 font-black text-xs transition shadow-lg shadow-[#b9974f]/20 cursor-pointer"
              >
                Sign In to Your Account
              </button>
              <button
                onClick={() => {
                  setAuthModalMode('signup');
                  setAuthModalOpen(true);
                }}
                className="flex-1 py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs transition cursor-pointer"
              >
                Register as New Patron
              </button>
            </div>

            <div className="mt-4">
              <Link
                href="/"
                className="text-xs text-zinc-500 hover:text-amber-400 transition inline-flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Curated Portfolio</span>
              </Link>
            </div>
          </div>
        </main>

        <AuthInquiryModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
          featureNotice="Login or Sign Up is compulsory to access Property Comparison."
          onSuccess={(msg) => showToast(msg)}
        />
      </>
    );
  }

  return (
    <>
      {toastMsg && (
        <div className="fixed bottom-6 left-6 z-[90] bg-zinc-950 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-zinc-800 animate-in fade-in">
          {toastMsg}
        </div>
      )}

      {/* Top Navbar */}
      <PublicHeader />

      <main className="min-h-screen bg-zinc-50 text-zinc-900 pb-24">
        {/* TOP BAR / BREADCRUMB */}
        <div className="bg-zinc-950 text-white border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.history.length > 1) {
                        router.back();
                      } else {
                        router.push('/#properties-search-bar');
                      }
                    }}
                    className="hover:text-amber-400 transition flex items-center gap-1.5 font-bold cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                    <span>Back to Search / Home</span>
                  </button>
                  <span>/</span>
                  <span className="text-zinc-200 font-semibold">Property Comparison Matrix</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                  <Scale className="w-6 h-6 text-amber-400" />
                  <span>Institutional Property Comparison</span>
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Side-by-side comparative analysis of pricing, architectural carpet, statutory compliance & amenities.
                </p>
              </div>

              {/* Top Controls */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {compareList.length > 1 && (
                  <button
                    onClick={() => setHighlightDiffs(!highlightDiffs)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                      highlightDiffs
                        ? 'bg-[#b9974f] text-zinc-950 border-[#b9974f]'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>{highlightDiffs ? 'Diffs Highlighted' : 'Highlight Diffs'}</span>
                  </button>
                )}

                {compareList.length < 4 && (
                  <button
                    onClick={() => setAddModalOpen(true)}
                    className="bg-[#b9974f] hover:bg-[#a4823d] text-zinc-950 font-black text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Property ({compareList.length}/4)</span>
                  </button>
                )}

                {compareList.length > 0 && (
                  <button
                    onClick={clearCompare}
                    className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl border border-zinc-800 transition flex items-center gap-1.5 cursor-pointer"
                    title="Clear comparison list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}

                <Link
                  href="/saved"
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold px-3 py-2 rounded-xl border border-zinc-800 transition flex items-center gap-1.5 cursor-pointer"
                  title="View Saved Shortlist"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/40" />
                  <span className="hidden sm:inline">Saved Shortlist</span>
                </Link>

                <button
                  onClick={() => window.print()}
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold px-3 py-2 rounded-xl border border-zinc-800 transition flex items-center gap-1.5 cursor-pointer"
                  title="Print or save as PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print Matrix</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COMPARISON BODY */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          {compareList.length === 0 ? (
            /* EMPTY STATE */
            <div className="bg-white rounded-3xl border border-zinc-200 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm my-12">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto mb-4">
                <Scale className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-zinc-950">No Properties Selected for Comparison</h2>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                You can select up to 4 luxury properties from our portfolio to compare agreement values, carpet layouts, possession schedules, and statutory compliances side-by-side.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="w-full sm:w-auto bg-[#b9974f] hover:bg-[#a4823d] text-zinc-950 font-black text-xs px-6 py-3 rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Choose from Portfolio</span>
                </button>
                <Link
                  href="/"
                  className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs px-6 py-3 rounded-xl transition cursor-pointer text-center"
                >
                  Explore Residences
                </Link>
              </div>

              {/* Sample Pre-configured comparisons */}
              {allProperties.length >= 2 && (
                <div className="mt-8 pt-6 border-t border-zinc-100 text-left">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                    Quick Sample Comparison:
                  </span>
                  <button
                    onClick={() => {
                      addToCompare(allProperties[0]);
                      addToCompare(allProperties[1]);
                    }}
                    className="text-xs text-amber-700 hover:text-amber-800 font-bold bg-amber-50 border border-amber-200/80 px-3 py-2 rounded-xl flex items-center justify-between w-full transition"
                  >
                    <span>
                      Compare: <strong>{allProperties[0].name}</strong> vs{' '}
                      <strong>{allProperties[1].name}</strong>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ACTIVE COMPARISON MATRIX */
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
              {/* Mobile Swipe Hint */}
              <div className="sm:hidden px-4 py-2 bg-amber-50 text-amber-900 text-[11px] font-bold flex items-center justify-between border-b border-amber-200/80">
                <span className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-amber-600" />
                  <span>Swipe horizontally to compare side-by-side</span>
                </span>
                <span className="text-amber-700">↔</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs min-w-[720px]">
                  {/* HEADER ROW WITH PROPERTY PREVIEWS */}
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/50">
                      <th className="w-48 sm:w-56 p-4 text-left font-bold text-zinc-400 uppercase tracking-wider text-[11px] align-top bg-zinc-100/50">
                        Specification & Metrics
                      </th>
                      {compareList.map((property) => (
                        <th
                          key={property.id}
                          className="p-4 text-left font-normal align-top border-l border-zinc-200 min-w-[240px] max-w-[280px]"
                        >
                          <div className="space-y-3">
                            {/* Image with Remove Button */}
                            <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
                              <Image
                                src={property.image}
                                alt={property.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                              <button
                                onClick={() => removeFromCompare(property.id)}
                                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition cursor-pointer"
                                title="Remove property"
                              >
                                <X className="w-4 h-4 text-rose-400" />
                              </button>
                              <div className="absolute bottom-2 left-2 bg-zinc-950/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/20">
                                {property.label || 'Verified'}
                              </div>
                            </div>

                            {/* Property Name & Dev */}
                            <div>
                              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                                {property.developer}
                              </span>
                              <h3 className="font-black text-sm text-zinc-950 line-clamp-1 mt-0.5">
                                {property.name}
                              </h3>
                              <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                                <span className="truncate">{property.location}</span>
                              </p>
                            </div>

                            {/* Price */}
                            <div className="p-2.5 bg-zinc-100/70 rounded-xl border border-zinc-200">
                              <span className="text-base font-black text-zinc-950 block leading-tight">
                                {property.price}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-semibold">
                                {property.priceSuffix || 'All Inclusive'}
                              </span>
                            </div>

                            {/* 4 Card Actions Row inside compare column */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <Link
                                href={`/properties/${property.id}`}
                                className="px-2.5 py-2 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition shadow-xs"
                                title="Open dedicated property detail page"
                              >
                                <Eye className="w-3 h-3 text-zinc-500" />
                                <span>Details</span>
                              </Link>

                              <button
                                onClick={() => {
                                  setSelectedPropertyForModal(property);
                                  setEnquiryModalOpen(true);
                                }}
                                className="px-2.5 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition shadow-xs"
                              >
                                <span>Enquire</span>
                                <ArrowRight className="w-3 h-3 text-amber-400" />
                              </button>
                            </div>
                          </div>
                        </th>
                      ))}

                      {/* Add Slot if less than 4 */}
                      {compareList.length < 4 && (
                        <th className="p-4 align-top border-l border-zinc-200 min-w-[200px] bg-zinc-50/30">
                          <div
                            onClick={() => setAddModalOpen(true)}
                            className="h-full min-h-[300px] border-2 border-dashed border-zinc-300 hover:border-amber-400 rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer group transition bg-white/50 hover:bg-amber-50/20"
                          >
                            <div className="w-12 h-12 rounded-full bg-zinc-100 group-hover:bg-amber-100 text-zinc-500 group-hover:text-amber-700 flex items-center justify-center mb-3 transition">
                              <Plus className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-zinc-800 group-hover:text-zinc-950">
                              + Add Property
                            </span>
                            <span className="text-[10px] text-zinc-400 mt-1">
                              Compare up to {4 - compareList.length} more
                            </span>
                          </div>
                        </th>
                      )}
                    </tr>
                  </thead>

                  {/* SECTION 1: FINANCIAL & STATUTORY METRICS */}
                  <tbody>
                    <tr className="bg-zinc-900 text-white font-bold text-[11px]">
                      <td colSpan={1 + compareList.length + (compareList.length < 4 ? 1 : 0)} className="px-4 py-2.5 uppercase tracking-wider">
                        1. Financials & Pricing Structure
                      </td>
                    </tr>

                    <tr className={`border-b border-zinc-100 ${diffRowClass(isDifferent((p) => p.price))}`}>
                      <td className="p-3.5 font-bold text-zinc-700 bg-zinc-50/60">Agreement Price</td>
                      {compareList.map((p) => (
                        <td key={p.id} className="p-3.5 border-l border-zinc-200 font-black text-sm text-zinc-950">
                          {p.price}
                        </td>
                      ))}
                      {compareList.length < 4 && <td className="border-l border-zinc-200" />}
                    </tr>

                    <tr className={`border-b border-zinc-100 ${diffRowClass(isDifferent((p) => calculatePricePerSqft(p)))}`}>
                      <td className="p-3.5 font-bold text-zinc-700 bg-zinc-50/60">Price per Sq.Ft (Carpet)</td>
                      {compareList.map((p) => (
                        <td key={p.id} className="p-3.5 border-l border-zinc-200 font-bold text-zinc-800">
                          {calculatePricePerSqft(p)}
                        </td>
                      ))}
                      {compareList.length < 4 && <td className="border-l border-zinc-200" />}
                    </tr>

                    <tr className={`border-b border-zinc-100 ${diffRowClass(isDifferent((p) => calculateStampDuty(p)))}`}>
                      <td className="p-3.5 font-bold text-zinc-700 bg-zinc-50/60">Estimated Stamp Duty</td>
                      {compareList.map((p) => (
                        <td key={p.id} className="p-3.5 border-l border-zinc-200 text-zinc-700">
                          {calculateStampDuty(p)}
                        </td>
                      ))}
                      {compareList.length < 4 && <td className="border-l border-zinc-200" />}
                    </tr>

                    <tr className={`border-b border-zinc-100 ${diffRowClass(isDifferent((p) => calculateGst(p)))}`}>
                      <td className="p-3.5 font-bold text-zinc-700 bg-zinc-50/60">GST Statutory Liability</td>
                      {compareList.map((p) => (
                        <td key={p.id} className="p-3.5 border-l border-zinc-200 text-zinc-700">
                          {calculateGst(p)}
                        </td>
                      ))}
                      {compareList.length < 4 && <td className="border-l border-zinc-200" />}
                    </tr>

                    <tr className="border-b border-zinc-100">
                      <td className="p-3.5 font-bold text-zinc-700 bg-zinc-50/60">Brokerage Terms</td>
                      {compareList.map((p) => (
                        <td key={p.id} className="p-3.5 border-l border-zinc-200">
                          <span className="inline-block bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                            Zero Brokerage (Direct Mandate)
                          </span>
                        </td>
                      ))}
                      {compareList.length < 4 && <td className="border-l border-zinc-200" />}
                    </tr>

                    {/* SECTION 2: ARCHITECTURAL & LAYOUT SPECIFICATIONS */}
                    <tr className="bg-zinc-900 text-white font-bold text-[11px]">
                      <td colSpan={1 + compareList.length + (compareList.length < 4 ? 1 : 0)} className="px-4 py-2.5 uppercase tracking-wider">
                        2. Architectural Layout & Configurations
                      </td>
                    </tr>

                    <tr className={`border-b border-zinc-100 ${diffRowClass(isDifferent((p) => p.bhk))}`}>
                      <td className="p-3.5 font-bold text-zinc-700 bg-zinc-50/60">Configuration / Typology</td>
                      {compareList.map((p) => (
                        <td key={p.id} className="p-3.5 border-l border-zinc-200 font-extrabold text-zinc-900">
                          {p.bhk}
                        </td>
                      ))}
                      {compareList.length < 4 && <td className="border-l border-zinc-200" />}
                    </tr>

                    <tr className={`border-b border-zinc-100 ${diffRowClass(isDifferent((p) => p.sqft))}`}>
                      <td className="p-3.5 font-bold text-zinc-700 bg-zinc-50/60">RERA Carpet Area</td>
                      {compareList.map((p) => (
                        <td key={p.id} className="p-3.5 border-l border-zinc-200 font-bold text-zinc-900">
                          {p.sqft}
                        </td>
                      ))}
                      {compareList.length < 4 && <td className="border-l border-zinc-200" />}
                    </tr>

                    <tr className={`border-b border-zinc-100 ${diffRowClass(isDifferent((p) => p.status))}`}>
                      <td className="p-3.5 font-bold text-zinc-700 bg-zinc-50/60">Possession Timeline</td>
                      {compareList.map((p) => (
                        <td key={p.id} className="p-3.5 border-l border-zinc-200 font-bold text-zinc-800">
                          {p.status}
                        </td>
                      ))}
                      {compareList.length < 4 && <td className="border-l border-zinc-200" />}
                    </tr>

                    <tr className="border-b border-zinc-100">
                      <td className="p-3.5 font-bold text-zinc-700 bg-zinc-50/60">Balcony & Orientation</td>
                      {compareList.map((p) => (
                        <td key={p.id} className="p-3.5 border-l border-zinc-200 text-zinc-700">
                          Private Deck &bull; East/North-East Facing
                        </td>
                      ))}
                      {compareList.length < 4 && <td className="border-l border-zinc-200" />}
                    </tr>

                    {/* SECTION 3: REGULATORY, RERA & COMPLIANCE */}
                    <tr className="bg-zinc-900 text-white font-bold text-[11px]">
                      <td colSpan={1 + compareList.length + (compareList.length < 4 ? 1 : 0)} className="px-4 py-2.5 uppercase tracking-wider">
                        3. Regulatory Compliance & Verification
                      </td>
                    </tr>

                    <tr className="border-b border-zinc-100">
                      <td className="p-3.5 font-bold text-zinc-700 bg-zinc-50/60">MahaRERA ID</td>
                      {compareList.map((p) => {
                        const rera = p.reraNumber || 'PRM/PUN/RERA/2026/0491';
                        return (
                          <td key={p.id} className="p-3.5 border-l border-zinc-200">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-zinc-800">
                              <span>{rera}</span>
                              <button
                                onClick={() => handleCopyRera(rera)}
                                className="p-1 hover:bg-zinc-100 rounded text-zinc-500"
                                title="Copy RERA ID"
                              >
                                {copiedReraId === rera ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        );
                      })}
                      {compareList.length < 4 && <td className="border-l border-zinc-200" />}
                    </tr>

                    <tr className="border-b border-zinc-100">
                      <td className="p-3.5 font-bold text-zinc-700 bg-zinc-50/60">Title & Encumbrance Status</td>
                      {compareList.map((p) => (
                        <td key={p.id} className="p-3.5 border-l border-zinc-200 text-emerald-800 font-semibold">
                          <div className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>100% Clear Title Deed</span>
                          </div>
                        </td>
                      ))}
                      {compareList.length < 4 && <td className="border-l border-zinc-200" />}
                    </tr>

                    {/* SECTION 4: AMENITIES & INFRASTRUCTURE */}
                    <tr className="bg-zinc-900 text-white font-bold text-[11px]">
                      <td colSpan={1 + compareList.length + (compareList.length < 4 ? 1 : 0)} className="px-4 py-2.5 uppercase tracking-wider">
                        4. Amenities & Residential Ecosystem
                      </td>
                    </tr>

                    {[
                      { label: 'Infinity Swimming Pool', checked: true },
                      { label: 'Grand Clubhouse & Banquet', checked: true },
                      { label: '3-Tier Biometric Security', checked: true },
                      { label: 'EV Vehicle Charging Bay', checked: true },
                      { label: 'Gymnasium & Yoga Deck', checked: true },
                      { label: 'Squash / Padel Court', checked: true },
                      { label: 'Vastu Compliant Layouts', checked: true }
                    ].map((amenity, idx) => (
                      <tr key={idx} className="border-b border-zinc-100 hover:bg-zinc-50/50">
                        <td className="p-3.5 font-semibold text-zinc-700 bg-zinc-50/60">{amenity.label}</td>
                        {compareList.map((p) => (
                          <td key={p.id} className="p-3.5 border-l border-zinc-200">
                            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Included</span>
                            </span>
                          </td>
                        ))}
                        {compareList.length < 4 && <td className="border-l border-zinc-200" />}
                      </tr>
                    ))}

                    {/* BOTTOM FINAL ACTION ROW */}
                    <tr className="bg-zinc-50">
                      <td className="p-4 font-bold text-zinc-900 bg-zinc-100/60">Next Step Actions</td>
                      {compareList.map((p) => (
                        <td key={p.id} className="p-4 border-l border-zinc-200">
                          <button
                            onClick={() => {
                              setSelectedPropertyForModal(p);
                              setEnquiryModalOpen(true);
                            }}
                            className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Schedule Private Visit</span>
                            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                        </td>
                      ))}
                      {compareList.length < 4 && <td className="border-l border-zinc-200" />}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ADD PROPERTY PICKER MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-lg text-zinc-950">Add Property to Compare</h3>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4">
              <input
                type="text"
                placeholder="Search by property, developer, or locality..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-950"
              />
            </div>

            <div className="mt-4 overflow-y-auto space-y-2.5 flex-1 pr-1">
              {filteredAvailableToAdd.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 text-xs">
                  No additional properties found.
                </div>
              ) : (
                filteredAvailableToAdd.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-3 rounded-2xl border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200">
                        <Image
                          src={prop.image}
                          alt={prop.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 line-clamp-1">{prop.name}</h4>
                        <div className="text-[10px] text-zinc-500">{prop.developer} &bull; {prop.locality}</div>
                        <div className="text-xs font-black text-zinc-950 mt-0.5">{prop.price}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        addToCompare(prop);
                        setAddModalOpen(false);
                      }}
                      className="bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0"
                    >
                      + Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instant Enquiry Modal */}
      <InstantEnquiryModal
        isOpen={enquiryModalOpen}
        onClose={() => {
          setEnquiryModalOpen(false);
          setSelectedPropertyForModal(null);
        }}
        property={selectedPropertyForModal || undefined}
        onSuccess={(msg) => showToast(msg)}
      />
    </>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center text-sm font-semibold">
          Loading comparison matrix...
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}

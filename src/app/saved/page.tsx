'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  Scale,
  Eye,
  ArrowRight,
  MapPin,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Share2,
  Calendar,
  User,
  Lock,
  Sparkles,
  ArrowLeft,
  Check,
  ExternalLink,
  SlidersHorizontal,
  ChevronRight,
  Phone,
  Mail,
  Award,
  Printer,
  ShieldAlert,
  X
} from 'lucide-react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { useSavedProperties } from '@/context/SavedPropertiesContext';
import { usePropertyComparison } from '@/context/PropertyComparisonContext';
import { PropertyItem } from '@/components/public/HomepageSearchablePortal';
import { InstantEnquiryModal } from '@/components/public/InstantEnquiryModal';
import { AuthInquiryModal } from '@/components/auth/AuthInquiryModal';
import { UserProfile } from '@/lib/user-auth';

const FALLBACK_PROPERTIES: PropertyItem[] = [
  {
    id: '13',
    name: 'Commercial Office/Space for Sale in Koregaon Park, Pune(East)',
    developer: 'GT INFRASTRUCTURE & REALTY',
    locality: 'Koregaon Park',
    location: 'Airport Road Corridor, Koregaon Park (East), Pune, Maharashtra',
    price: '₹14.32 Cr',
    priceRaw: 143200000,
    priceSuffix: 'All Inclusive',
    bhk: 'Commercial Office',
    bhkNum: 0,
    sqft: '3,200 Sq.Ft.',
    sqftNum: 3200,
    status: 'Ready to Move',
    reraNumber: 'PRM/PUN/COM/2026/0882',
    rpsStatus: 'Verified Commercial',
    description: 'Grade-A corporate office space in Koregaon Park, Pune. Landmark business address with optimized workspace efficiency and airport corridor connectivity.',
    image: 'https://b2bbricksblob.azureedge.net/propertyimages/nj280277@gmail.com/545a71e5a4c546f2be409c9534113fda20261005124244458.jpeg',
    tags: ['Commercial Landmark', 'Grade-A Tower', 'Airport Corridor', '100% DG Backup'],
    featured: true,
    label: 'Commercial Landmark',
    isCommercial: true
  },
  {
    id: '1',
    name: 'VTP Altair Residences',
    developer: 'VTP Realty',
    locality: 'Baner',
    location: 'Baner, Pune, Maharashtra',
    price: '₹1.49 Cr',
    priceRaw: 14900000,
    priceSuffix: 'All Inclusive',
    bhk: '3 BHK',
    bhkNum: 3,
    sqft: '1,146 Sq.Ft.',
    sqftNum: 1146,
    status: "Under-Construction (Mar '26)",
    reraNumber: 'PRM/PUN/RERA/2026/0491',
    rpsStatus: 'Verified Project',
    description: 'VTP Altair Residences is an institutional-grade luxury residential enclave situated in prime Baner.',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    tags: ['Verified Listing', 'Vastu Compliant', 'Private Balcony'],
    featured: true,
    label: 'Top Choice',
    isCommercial: false
  },
  {
    id: '2',
    name: 'The Sovereign Horizon Estate',
    developer: 'Sovereign Luxury Collection',
    locality: 'Kalyani Nagar',
    location: 'Kalyani Nagar, Pune, Maharashtra',
    price: '₹2.10 Cr',
    priceRaw: 21000000,
    priceSuffix: 'All Inclusive',
    bhk: '4 BHK',
    bhkNum: 4,
    sqft: '1,400 Sq.Ft.',
    sqftNum: 1400,
    status: 'Ready to Move',
    reraNumber: 'PRM/PUN/RERA/2026/0812',
    rpsStatus: 'Verified Project',
    description: 'The Sovereign Horizon Estate offers an uncompromising private sanctuary in prestigious Kalyani Nagar.',
    image: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    tags: ['Verified Listing', 'OC Received', 'Private Deck'],
    featured: true,
    label: 'Ready Possession',
    isCommercial: false
  },
  {
    id: '3',
    name: 'Kohinoor Presidentia',
    developer: 'Kohinoor Group',
    locality: 'Bavdhan',
    location: 'Bavdhan, Pune, Maharashtra',
    price: '₹1.28 Cr',
    priceRaw: 12800000,
    priceSuffix: 'All Inclusive',
    bhk: '3 BHK',
    bhkNum: 3,
    sqft: '1,050 Sq.Ft.',
    sqftNum: 1050,
    status: "Under-Construction (Dec '25)",
    reraNumber: 'PRM/PUN/RERA/2026/0334',
    rpsStatus: 'Verified Project',
    description: 'Kohinoor Presidentia brings refined luxury living to prime Bavdhan.',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    tags: ['Verified Listing', 'Green Hill Views', 'Clubhouse'],
    featured: false,
    label: 'Fast Selling',
    isCommercial: false
  },
  {
    id: '4',
    name: 'Godrej Hillside Reserve',
    developer: 'Godrej Properties',
    locality: 'Mahalunge',
    location: 'Mahalunge, Pune, Maharashtra',
    price: '₹1.65 Cr',
    priceRaw: 16500000,
    priceSuffix: 'All Inclusive',
    bhk: '3 BHK',
    bhkNum: 3,
    sqft: '1,180 Sq.Ft.',
    sqftNum: 1180,
    status: "Under-Construction (Jun '26)",
    reraNumber: 'PRM/PUN/RERA/2026/0995',
    rpsStatus: 'Verified Project',
    description: 'Godrej Hillside Reserve offers holistic resort-style living nestled amid lush nature.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    tags: ['Verified Listing', 'IGBC Gold Certified', 'Resort Amenities'],
    featured: false,
    label: 'Eco Sanctuary',
    isCommercial: false
  },
  {
    id: '5',
    name: 'ANV Heights Sky Suite',
    developer: '',
    locality: 'Baner',
    location: 'Baner Western Corridor, Pune, Maharashtra',
    price: '₹1.85 Cr',
    priceRaw: 18500000,
    priceSuffix: 'All Inclusive',
    bhk: '3 BHK',
    bhkNum: 3,
    sqft: '1,250 Sq.Ft.',
    sqftNum: 1250,
    status: "Under-Construction (Mar '26)",
    reraNumber: 'PRM/PUN/RERA/2026/0124',
    rpsStatus: 'Verified Project',
    description: 'Tower B corner 3 BHK sky suite boasting dual master suites, smart home automation, and high-speed elevators.',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    tags: ['Verified Listing', 'Corner Unit', 'Subvention Scheme'],
    featured: true,
    label: 'Exclusive',
    isCommercial: false
  },
  {
    id: '6',
    name: 'Shivajinagar Embassy Penthouse',
    developer: 'Emirates Sovereign Assets',
    locality: 'Shivajinagar',
    location: 'Shivajinagar, Model Colony, Pune',
    price: '₹6.50 Cr',
    priceRaw: 65000000,
    priceSuffix: 'Trophy Asset',
    bhk: '4.5+ BHK Penthouse',
    bhkNum: 5,
    sqft: '4,100 Sq.Ft.',
    sqftNum: 4100,
    status: 'Ready to Move',
    reraNumber: 'PRM/PUN/RERA/2026/0001',
    rpsStatus: 'Verified Project',
    description: 'Trophy penthouse residence overlooking Model Colony and city panorama. Private plunge pool on terrace.',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    tags: ['Verified Listing', 'Private Pool', '360° Panorama'],
    featured: false,
    label: 'Trophy Collection',
    isCommercial: false
  }
];

export default function SavedPropertiesPage() {
  const router = useRouter();
  const {
    savedIds,
    savedCount,
    isSaved,
    toggleSave,
    clearSaved,
    clearSavedExcept,
    isSafeSaved,
    toggleSafeSaved,
    currentUser
  } = useSavedProperties();
  const { isInCompare, toggleCompare } = usePropertyComparison();

  const [allProperties, setAllProperties] = useState<PropertyItem[]>(FALLBACK_PROPERTIES);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyForModal, setSelectedPropertyForModal] = useState<PropertyItem | null>(null);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [tempSafeIds, setTempSafeIds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'commercial' | 'residential' | 'ready'>('all');

  // Load all properties to match saved IDs
  useEffect(() => {
    async function loadProperties() {
      try {
        const res = await fetch('/api/properties');
        const data = await res.json();
        if (data.properties && Array.isArray(data.properties)) {
          // Merge with fallback to ensure property 13 and others are present
          const existingIds = new Set(data.properties.map((p: any) => String(p.id)));
          const extraFallbacks = FALLBACK_PROPERTIES.filter((p) => !existingIds.has(String(p.id)));
          setAllProperties([...data.properties, ...extraFallbacks]);
        }
      } catch (err) {
        console.warn('API fetch fallback on saved page:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProperties();
  }, []);

  // Filter to currently saved items
  const savedPropertiesRaw: PropertyItem[] = allProperties.filter((p) =>
    savedIds.includes(String(p.id))
  );

  // Apply category filter
  const savedProperties: PropertyItem[] = savedPropertiesRaw.filter((p) => {
    if (filterType === 'commercial') return p.isCommercial;
    if (filterType === 'residential') return !p.isCommercial;
    if (filterType === 'ready') return p.status.toLowerCase().includes('ready');
    return true;
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Portfolio calculations
  const totalOutlay = savedPropertiesRaw.reduce(
    (acc, curr) => acc + (curr.priceRaw || 15000000),
    0
  );

  const formatOutlay = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const uniqueLocalities = Array.from(
    new Set(savedPropertiesRaw.map((p) => p.locality || 'Pune').filter(Boolean))
  );

  const handleSharePortfolio = () => {
    if (savedPropertiesRaw.length === 0) return;
    const url = `${window.location.origin}/compare?ids=${savedPropertiesRaw.map((p) => p.id).join(',')}`;
    navigator.clipboard.writeText(url);
    showToast('Portfolio comparison link copied to clipboard!');
  };

  const handleCompareAll = () => {
    if (savedPropertiesRaw.length === 0) return;
    router.push(`/compare?ids=${savedPropertiesRaw.map((p) => p.id).join(',')}`);
  };

  const handlePrintPortfolio = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleOpenEnquiry = (prop: PropertyItem) => {
    setSelectedPropertyForModal(prop);
    setEnquiryModalOpen(true);
  };

  // COMPULSORY AUTHENTICATION GATE IF NOT LOGGED IN
  if (!currentUser) {
    return (
      <>
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-[95] bg-zinc-950 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-zinc-800 animate-in fade-in flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        <PublicHeader />

        <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white flex items-center justify-center p-4 pt-28 pb-16">
          <div className="relative w-full max-w-lg bg-zinc-900/95 border border-amber-500/30 rounded-3xl p-7 sm:p-10 shadow-[0_25px_80px_rgba(0,0,0,0.8),0_0_40px_rgba(217,119,6,0.15)] backdrop-blur-2xl text-center overflow-hidden animate-in zoom-in-95">
            {/* Ambient rose glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-28 bg-rose-500/20 blur-3xl pointer-events-none" />

            {/* Heart Icon Badge */}
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-400 text-white shadow-xl mb-4">
              <Heart className="w-8 h-8 text-white fill-white stroke-[2.2]" />
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-[11px] font-extrabold uppercase tracking-widest text-rose-300 mb-3">
              Patron Authentication Required
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              My Saved Shortlist
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 mt-2.5 max-w-sm mx-auto leading-relaxed">
              Login or Sign Up is compulsory to save, curate, and track your personalized portfolio of vetted luxury residences and Grade-A commercial acquisitions.
            </p>

            <div className="mt-6 p-4 rounded-2xl bg-black/40 border border-white/5 text-left text-xs space-y-2.5 text-zinc-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Private portfolio synchronized securely across all your devices</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Dedicated financial outlay and capital allocation metrics</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Priority site-visit bookings with senior ANV REEALTY advisors</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setAuthModalOpen(true);
                }}
                className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer"
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
          featureNotice="Login or Sign Up is compulsory to access your Saved Shortlist."
          onSuccess={(msg: string) => showToast(msg)}
        />
      </>
    );
  }

  return (
    <>
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[95] bg-zinc-950 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-zinc-800 animate-in fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Navbar */}
      <PublicHeader />

      <main className="min-h-screen bg-zinc-50 text-zinc-900 pb-20">
        {/* BREADCRUMB & PAGE HEADER */}
        <div className="bg-white border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.history.length > 1) {
                    router.back();
                  } else {
                    router.push('/#properties-search-bar');
                  }
                }}
                className="hover:text-amber-600 transition flex items-center gap-1.5 font-bold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Search / Home</span>
              </button>
              <span>/</span>
              <span className="font-bold text-zinc-900">
                {currentUser ? `${currentUser.name.split(' ')[0]}'s Shortlist` : 'Saved Shortlist'}
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shadow-xs">
                    <Heart className="w-5 h-5 fill-rose-500" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950">
                      My Shortlisted Residences & Spaces
                    </h1>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Your private collection of vetted luxury residences and Grade-A commercial acquisitions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {savedPropertiesRaw.length > 0 && (
                  <>
                    <button
                      onClick={handleCompareAll}
                      className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      title="Compare all saved properties side-by-side"
                    >
                      <Scale className="w-4 h-4" />
                      <span>Compare All ({savedPropertiesRaw.length})</span>
                    </button>

                    <button
                      onClick={handlePrintPortfolio}
                      className="px-3 py-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      title="Print or save PDF dossier"
                    >
                      <Printer className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="hidden sm:inline">Print Dossier</span>
                    </button>

                    <button
                      onClick={handleSharePortfolio}
                      className="px-3 py-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      title="Copy shareable shortlist link"
                    >
                      <Share2 className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="hidden sm:inline">Share</span>
                    </button>

                    <button
                      onClick={() => {
                        const safeSet = new Set(
                          savedPropertiesRaw
                            .filter((p) => isSafeSaved(p.id))
                            .map((p) => String(p.id))
                        );
                        setTempSafeIds(safeSet);
                        setClearConfirmOpen(true);
                      }}
                      className="px-3 py-2 rounded-xl bg-white border border-zinc-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-zinc-500 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      title="Clear saved properties with Safe protection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Clear All</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Category Filter Tabs */}
            {savedPropertiesRaw.length > 0 && (
              <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      filterType === 'all' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    All ({savedPropertiesRaw.length})
                  </button>
                  <button
                    onClick={() => setFilterType('commercial')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      filterType === 'commercial' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    Commercial
                  </button>
                  <button
                    onClick={() => setFilterType('residential')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      filterType === 'residential' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    Residential
                  </button>
                  <button
                    onClick={() => setFilterType('ready')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      filterType === 'ready' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    Ready
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* HUMAN ACCOUNT PROFILE / GUEST BANNER */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          {currentUser ? (
            /* Logged-in Human Patron Bar */
            <div className="bg-zinc-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black font-black text-base flex items-center justify-center shadow-md shrink-0">
                  {currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-white">
                      {currentUser.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase tracking-wider">
                      Verified Patron &bull; {currentUser.role}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-zinc-500" />
                      <span>{currentUser.email}</span>
                    </span>
                    {currentUser.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-zinc-500" />
                        <span>{currentUser.phone}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-800">
                <div className="text-right hidden md:block mr-2">
                  <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                    Cloud Synced Portfolio
                  </div>
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Saved to your personal dossier</span>
                  </div>
                </div>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition border border-zinc-800 cursor-pointer"
                >
                  Switch Account
                </button>
              </div>
            </div>
          ) : (
            /* Guest Human Banner with 1-Click Login CTA */
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-bold shadow-md shrink-0 mt-0.5">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-zinc-950">
                    Guest Shortlist (Saved on this device)
                  </h3>
                  <p className="text-xs text-zinc-600 mt-0.5 max-w-2xl leading-relaxed">
                    Sign in with your email or phone to link this shortlist to your personal account. Your shortlisted properties will automatically sync across your desktop, tablet, and mobile devices with zero data loss.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-850 text-white text-xs font-black transition flex items-center gap-2 shadow-md cursor-pointer shrink-0"
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Sign In / Create Account</span>
              </button>
            </div>
          )}
        </div>

        {/* PORTFOLIO SUMMARY STATS (Only when there are saved items) */}
        {savedProperties.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200 shadow-xs">
              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Shortlisted Assets
                </span>
                <span className="text-lg font-black text-zinc-950 block mt-1">
                  {savedProperties.length} Verified Properties
                </span>
              </div>

              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Cumulative Portfolio Outlay
                </span>
                <span className="text-lg font-black text-amber-600 block mt-1">
                  {formatOutlay(totalOutlay)}
                </span>
              </div>

              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Preferred Corridors
                </span>
                <span className="text-xs font-black text-zinc-900 block mt-1 truncate">
                  {uniqueLocalities.length > 0 ? uniqueLocalities.join(', ') : 'Prime Pune'}
                </span>
              </div>

              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Due Diligence Status
                </span>
                <span className="text-xs font-bold text-emerald-700 block mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% MahaRERA & Title Clear</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SAVED PROPERTIES LIST / GRID */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          {savedProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedProperties.map((prop) => {
                const isCompared = isInCompare(prop.id);
                return (
                  <div
                    key={prop.id}
                    className="bg-white rounded-3xl overflow-hidden border border-zinc-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                  >
                    {/* Image Area */}
                    <div className="relative h-56 w-full bg-zinc-900 overflow-hidden">
                      <Image
                        src={prop.image}
                        alt={prop.name}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-700"
                        unoptimized
                      />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                        {isSafeSaved(prop.id) && (
                          <span className="bg-emerald-600/95 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-md border border-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-200" />
                            Safe
                          </span>
                        )}
                        <span className="bg-zinc-950/85 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-xl border border-white/20">
                          {prop.label || 'Prime Asset'}
                        </span>
                        {prop.isCommercial && (
                          <span className="bg-amber-400 text-black text-[10px] font-black px-2 py-1 rounded-xl">
                            Corporate
                          </span>
                        )}
                      </div>

                      <div className="absolute top-3 right-3">
                        <button
                          onClick={() => {
                            toggleSave(prop.id, prop.name);
                            showToast(`Removed "${prop.name}" from your shortlist`);
                          }}
                          className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-rose-600 backdrop-blur-md flex items-center justify-center shadow-md transition cursor-pointer hover:scale-110"
                          title="Remove from saved shortlist"
                        >
                          <Heart className="w-4 h-4 fill-rose-600" />
                        </button>
                      </div>

                      {/* Bottom Image Overlay */}
                      {prop.developer && !/anv\s*(signature\s*partner|verified\s*developer|partner\s*developer)/i.test(prop.developer) && (
                        <div className="absolute bottom-3 left-3 right-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 rounded-xl text-white flex items-center justify-between">
                          <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                            {prop.developer}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content Body */}
                    <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/properties/${prop.id}`}
                            className="font-black text-base sm:text-lg text-zinc-950 hover:text-amber-600 transition leading-snug line-clamp-1"
                          >
                            {prop.name}
                          </Link>
                        </div>

                        <p className="text-[11px] sm:text-xs text-zinc-500 flex items-center gap-1 mt-0.5 sm:mt-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{prop.location}</span>
                        </p>

                        {/* Price & Typology Strip */}
                        <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-zinc-100 flex items-baseline justify-between">
                          <div>
                            <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                              Quoted Value
                            </span>
                            <span className="text-lg sm:text-xl font-black text-zinc-950">
                              {prop.price}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                              Layout / Carpet
                            </span>
                            <span className="text-[11px] sm:text-xs font-black text-zinc-900">
                              {prop.bhk} &bull; {prop.sqft ? prop.sqft.replace(/\s*carpet\s*/gi, '').trim() : '1,200 Sq.Ft.'}
                            </span>
                          </div>
                        </div>

                        {/* Status / Possession */}
                        <div className="mt-2 sm:mt-2.5 flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-600 bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                          <span>Status: <strong className="text-zinc-900">{prop.status}</strong></span>
                          <span className="text-emerald-700 font-bold">RERA Registered ✓</span>
                        </div>
                      </div>

                      {/* 4 CORE ACTION BUTTONS */}
                      <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 sm:gap-2.5">
                        {/* Left Group: Compare & Save & Safe */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {/* 1. COMPARE BUTTON */}
                          <button
                            onClick={() => toggleCompare(prop)}
                            className={`p-2 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                              isCompared
                                ? 'bg-amber-400 text-black border-amber-400 font-extrabold shadow-xs'
                                : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                            }`}
                            title={isCompared ? 'Remove from Compare' : 'Add to Compare'}
                            aria-label={isCompared ? 'Remove from Compare' : 'Add to Compare'}
                          >
                            <Scale className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{isCompared ? 'Compared ✓' : 'Compare'}</span>
                          </button>

                          {/* 2. SAVE BUTTON (HEART) */}
                          <button
                            onClick={() => {
                              toggleSave(prop.id, prop.name);
                              showToast(`Removed "${prop.name}" from your shortlist`);
                            }}
                            className="p-2 border rounded-lg sm:rounded-xl transition cursor-pointer bg-rose-50 border-rose-300 text-rose-600 hover:bg-rose-100 shadow-2xs"
                            title="Remove from saved shortlist"
                            aria-label="Remove from saved shortlist"
                          >
                            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                          </button>

                          {/* 3. SAFE PROPERTY BUTTON */}
                          <button
                            type="button"
                            onClick={() => {
                              const wasSafe = toggleSafeSaved(prop.id);
                              showToast(
                                wasSafe
                                  ? `🛡️ "${prop.name}" is marked Safe and protected from clearing!`
                                  : `"${prop.name}" Safe protection removed.`
                              );
                            }}
                            className={`p-2 sm:px-2.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                              isSafeSaved(prop.id)
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold shadow-2xs'
                                : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                            }`}
                            title={isSafeSaved(prop.id) ? 'Property is Safe (Protected). Click to remove safe' : 'Mark as Safe (protect from delete all)'}
                            aria-label={isSafeSaved(prop.id) ? 'Property is Safe (Protected). Click to remove safe' : 'Mark as Safe (protect from delete all)'}
                          >
                            <ShieldCheck className={`w-3.5 h-3.5 ${isSafeSaved(prop.id) ? 'text-emerald-700' : 'text-zinc-400'}`} />
                            <span className="hidden sm:inline">{isSafeSaved(prop.id) ? 'Safe ✓' : 'Safe'}</span>
                          </button>
                        </div>

                        {/* Right Group: View Details & Instant Enquiry */}
                        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 w-full lg:w-auto">
                          {/* 4. VIEW DETAILS DIRECT LINK (NO POPUP) */}
                          <Link
                            href={`/properties/${prop.id}`}
                            className="flex-1 sm:flex-none px-2.5 py-2 sm:px-3.5 sm:py-2 border border-zinc-200 hover:border-zinc-950 bg-white hover:bg-zinc-950 hover:text-white rounded-lg sm:rounded-xl text-xs font-bold text-zinc-800 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs group"
                          >
                            <Eye className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors shrink-0" />
                            <span className="truncate">View Details</span>
                          </Link>

                          {/* 5. INSTANT ENQUIRY */}
                          <button
                            onClick={() => handleOpenEnquiry(prop)}
                            className="flex-1 sm:flex-none px-2.5 py-2 sm:px-4 sm:py-2 bg-zinc-950 hover:bg-zinc-850 rounded-lg sm:rounded-xl text-xs font-black text-white transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer group"
                          >
                            <span className="truncate">Instant Enquiry</span>
                            <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* EMPTY STATE */
            <div className="bg-white rounded-3xl border border-zinc-200 p-8 sm:p-14 text-center max-w-2xl mx-auto shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
                <Heart className="w-8 h-8 stroke-[1.5]" />
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-zinc-950">
                  Your Shortlist is Currently Empty
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 mt-2 leading-relaxed max-w-md mx-auto">
                  Browse our verified Pune luxury sky suites and Grade-A commercial landmarks. Click the heart icon on any property card to save it to your private portfolio.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/#properties-section"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-850 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <span>Explore Verified Portfolio</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </Link>

                <Link
                  href="/compare"
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Scale className="w-4 h-4 text-zinc-500" />
                  <span>Open Comparison Hub</span>
                </Link>
              </div>

              {/* Suggestions */}
              <div className="mt-8 pt-8 border-t border-zinc-100 text-left">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-3 text-center sm:text-left">
                  Recommended Properties to Shortlist:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {FALLBACK_PROPERTIES.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-[10px] font-bold text-amber-600 uppercase">
                          {item.developer}
                        </div>
                        <div className="text-xs font-bold text-zinc-900 truncate mt-0.5">
                          {item.name}
                        </div>
                        <div className="text-[11px] font-black text-zinc-950 mt-1">
                          {item.price}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          toggleSave(item.id, item.name);
                          showToast(`Added "${item.name}" to your shortlist`);
                        }}
                        className="mt-2.5 w-full py-1.5 rounded-lg bg-white border border-zinc-200 hover:border-zinc-400 text-zinc-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span>Add to Shortlist</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CLEAR ALL CONFIRMATION MODAL WITH SAFE PROPERTY PROTECTION */}
      {clearConfirmOpen && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-zinc-200 p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-base text-zinc-950">
                    Clear Saved Shortlist
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Select properties to keep safe before clearing
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setClearConfirmOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prominent Safety Badge Notice as requested by User */}
            <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-3.5 shadow-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[10px] font-black uppercase tracking-wider mb-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    Property Protection Badge
                  </div>
                  <p className="text-xs sm:text-sm font-extrabold text-amber-950 leading-snug">
                    &ldquo;If you want to save some property please select the property that you want to safe&rdquo;
                  </p>
                  <p className="text-[11px] text-amber-900/80 mt-1">
                    Properties marked as <strong className="text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded font-bold">Safe</strong> will <u>NOT</u> be deleted from your shortlist.
                  </p>
                </div>
              </div>
            </div>

            {/* Selection list */}
            <div className="flex-1 overflow-y-auto space-y-2 max-h-60 border border-zinc-200 rounded-2xl p-2 bg-zinc-50/50">
              <div className="flex items-center justify-between px-2 py-1 text-[11px]">
                <span className="font-bold text-zinc-600">
                  {tempSafeIds.size} of {savedPropertiesRaw.length} Safe
                </span>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={() =>
                      setTempSafeIds(new Set(savedPropertiesRaw.map((p) => String(p.id))))
                    }
                    className="text-emerald-700 hover:underline font-bold"
                  >
                    Select All Safe
                  </button>
                  <span>&bull;</span>
                  <button
                    type="button"
                    onClick={() => setTempSafeIds(new Set())}
                    className="text-zinc-500 hover:underline"
                  >
                    Clear All Safe
                  </button>
                </div>
              </div>

              {savedPropertiesRaw.map((prop) => {
                const idStr = String(prop.id);
                const isSafe = tempSafeIds.has(idStr);
                return (
                  <div
                    key={prop.id}
                    onClick={() => {
                      setTempSafeIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(idStr)) next.delete(idStr);
                        else next.add(idStr);
                        return next;
                      });
                    }}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                      isSafe
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                        : 'bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <input
                        type="checkbox"
                        checked={isSafe}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 pointer-events-none"
                      />
                      <span className="truncate">{prop.name}</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] shrink-0 font-bold ${
                        isSafe
                          ? 'bg-emerald-200 text-emerald-900 border border-emerald-400'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isSafe ? '🛡️ Safe (Kept)' : '⚠️ Deleting'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setClearConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (tempSafeIds.size > 0) {
                    const toDeleteCount = savedPropertiesRaw.length - tempSafeIds.size;
                    clearSavedExcept(Array.from(tempSafeIds));
                    setClearConfirmOpen(false);
                    showToast(
                      toDeleteCount > 0
                        ? `Removed ${toDeleteCount} properties. ${tempSafeIds.size} safe properties were not deleted!`
                        : `All ${tempSafeIds.size} properties kept safe.`
                    );
                  } else {
                    clearSaved();
                    setClearConfirmOpen(false);
                    showToast('Your shortlist has been cleared');
                  }
                }}
                disabled={savedPropertiesRaw.length - tempSafeIds.size === 0}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  savedPropertiesRaw.length - tempSafeIds.size === 0
                    ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                {savedPropertiesRaw.length - tempSafeIds.size === 0 ? (
                  <span>All Properties Safe</span>
                ) : tempSafeIds.size > 0 ? (
                  <span>
                    Clear {savedPropertiesRaw.length - tempSafeIds.size} Unprotected
                  </span>
                ) : (
                  <span>Yes, Clear All</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instant Enquiry Modal */}
      {selectedPropertyForModal && (
        <InstantEnquiryModal
          isOpen={enquiryModalOpen}
          onClose={() => {
            setEnquiryModalOpen(false);
            setSelectedPropertyForModal(null);
          }}
          property={selectedPropertyForModal}
          onSuccess={(msg) => {
            showToast(msg);
          }}
        />
      )}

      {/* User Login / Auth Modal */}
      <AuthInquiryModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode="login"
        onSuccess={(msg: string) => {
          showToast(msg);
        }}
      />
    </>
  );
}

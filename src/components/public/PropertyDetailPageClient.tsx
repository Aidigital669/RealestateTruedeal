'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  MapPin,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Scale,
  Heart,
  ArrowRight,
  Share2,
  Copy,
  Check,
  Phone,
  Maximize2,
  Video,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Play,
  Briefcase,
  Calendar
} from 'lucide-react';
import { usePropertyComparison } from '@/context/PropertyComparisonContext';
import { useSavedProperties } from '@/context/SavedPropertiesContext';
import { PropertyItem, ALL_FALLBACK_PROPERTIES } from '@/lib/property-types';
import { getPropertySlug, getPropertyUrl, matchesProperty } from '@/lib/slug';
import { PublicHeader } from '@/components/public/PublicHeader';
import { SharePropertyModal } from '@/components/public/SharePropertyModal';
import { getClientSession } from '@/lib/user-auth';
import { AuthInquiryModal } from '@/components/auth/AuthInquiryModal';
import { formatPropertyDescription, parseDossierData } from '@/lib/dossier-parser';

interface PropertyDetailPageClientProps {
  initialProperty?: PropertyItem | null;
  identifier?: string;
}

export function PropertyDetailPageClient({
  initialProperty,
  identifier
}: PropertyDetailPageClientProps) {
  const routeParams = useParams();
  const slugOrId = identifier || (routeParams?.slug as string) || (routeParams?.id as string) || '13';
  const router = useRouter();

  const { isInCompare, toggleCompare } = usePropertyComparison();
  const { isSaved, toggleSave } = useSavedProperties();

  const fallback =
    ALL_FALLBACK_PROPERTIES.find((p) => matchesProperty(p, slugOrId)) ||
    ALL_FALLBACK_PROPERTIES[0];

  const [property, setProperty] = useState<PropertyItem>(initialProperty || fallback);
  const saved = isSaved(property.id);
  const [copiedRera, setCopiedRera] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'amenities' | 'compliance'>('overview');
  const [toastMsg, setToastMsg] = useState<{ text: string; showLink?: boolean } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Multi-Media Showcase State (Photos & Video)
  const [mediaMode, setMediaMode] = useState<'photos' | 'video'>('photos');
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [preferredSlot, setPreferredSlot] = useState('This Saturday (04:00 PM)');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Client-side fetch & slug canonical URL replacement
  useEffect(() => {
    // If server already provided initialProperty, preserve it and only sync canonical URL if on a legacy ID path
    if (initialProperty) {
      const canonicalUrl = getPropertyUrl(initialProperty);
      if (typeof window !== 'undefined' && window.location.pathname !== canonicalUrl) {
        const currentPath = window.location.pathname;
        if (currentPath.match(/^\/properties\/\d+$/) || currentPath.match(/^\/\d+$/)) {
          window.history.replaceState(null, '', canonicalUrl);
        }
      }
      return;
    }

    async function loadProperty() {
      try {
        const res = await fetch('/api/properties');
        const data = await res.json();
        if (data.properties && Array.isArray(data.properties)) {
          const match = data.properties.find((p: any) => matchesProperty(p, slugOrId));
          if (match) {
            setProperty(match);
            const canonicalUrl = getPropertyUrl(match);
            if (typeof window !== 'undefined' && window.location.pathname !== canonicalUrl) {
              window.history.replaceState(null, '', canonicalUrl);
            }
            return;
          }
        }
      } catch (e) {
        console.warn('Live property fetch fallback:', e);
      }

      const matchedFallback = ALL_FALLBACK_PROPERTIES.find((p) => matchesProperty(p, slugOrId));
      if (matchedFallback) {
        setProperty(matchedFallback);
        const canonicalUrl = getPropertyUrl(matchedFallback);
        if (typeof window !== 'undefined' && window.location.pathname !== canonicalUrl) {
          window.history.replaceState(null, '', canonicalUrl);
        }
      }
    }

    loadProperty();
  }, [slugOrId, initialProperty]);

  // Active media list
  const mediaImages: string[] = React.useMemo(() => {
    if (property?.images && Array.isArray(property.images) && property.images.length > 0) {
      const list = property.images
        .map((u: any) => (typeof u === 'string' ? u : u?.url))
        .filter((u: any) => typeof u === 'string' && u.trim().length > 0);
      if (list.length > 0) return list;
    }
    if ((property as any)?.all_images && Array.isArray((property as any).all_images) && (property as any).all_images.length > 0) {
      const list = (property as any).all_images.filter((u: any) => typeof u === 'string' && u.trim().length > 0);
      if (list.length > 0) return list;
    }
    return property?.image ? [property.image] : [];
  }, [property]);

  // Video walkthrough URL (custom property video or Opus 4K luxury architectural walkthrough by default)
  const activeVideoUrl: string = property?.videoUrl?.trim() || '/Opusvideo.mp4';

  // Ensure activePhotoIdx stays in bounds when images list changes
  useEffect(() => {
    if (mediaImages.length > 0 && activePhotoIdx >= mediaImages.length) {
      setActivePhotoIdx(0);
    }
  }, [mediaImages.length, activePhotoIdx]);

  const handleNextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActivePhotoIdx((prev) => (prev + 1) % (mediaImages.length || 1));
  };

  const handlePrevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActivePhotoIdx((prev) => (prev - 1 + (mediaImages.length || 1)) % (mediaImages.length || 1));
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') setActivePhotoIdx((prev) => (prev + 1) % (mediaImages.length || 1));
      if (e.key === 'ArrowLeft') setActivePhotoIdx((prev) => (prev - 1 + (mediaImages.length || 1)) % (mediaImages.length || 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, mediaImages.length]);

  const showToast = (text: string, showLink = false) => {
    setToastMsg({ text, showLink });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleToggleSave = () => {
    if (!property) return;
    const user = getClientSession();
    if (!user) {
      setAuthNotice('Login or Sign Up is compulsory to save properties to your shortlist.');
      setAuthModalOpen(true);
      return;
    }
    const nextSaved = toggleSave(property.id, property.name);
    if (nextSaved) {
      showToast(`Saved "${property.name}" to your shortlist`, true);
    } else {
      showToast(`Removed "${property.name}" from your shortlist`, false);
    }
  };

  const handleToggleCompare = () => {
    if (!property) return;
    const user = getClientSession();
    if (!user) {
      setAuthNotice('Login or Sign Up is compulsory to compare properties.');
      setAuthModalOpen(true);
      return;
    }
    toggleCompare(property);
  };

  const handleCopyRera = () => {
    if (property?.reraNumber) {
      navigator.clipboard.writeText(property.reraNumber);
      setCopiedRera(true);
      showToast(`Copied MahaRERA ID: ${property.reraNumber}`);
      setTimeout(() => setCopiedRera(false), 2500);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}${getPropertyUrl(property)}`;
      navigator.clipboard.writeText(shareUrl);
      showToast('SEO property link copied to clipboard!');
    }
  };

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      showToast('Please provide your name and contact number');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clientName.trim(),
          phone: clientPhone.trim(),
          email: clientEmail.trim(),
          projectName: property?.name || 'Curated Residence',
          propertyId: property?.id || slugOrId,
          locality: property?.locality || property?.location || 'Pune',
          bhk: property?.bhk || '3 BHK',
          budget: property?.price || '₹1.5 - 2.5 Cr',
          visitDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          visitTime: preferredSlot,
          notes: `Direct page inquiry. Preferred slot: ${preferredSlot}`
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit site visit request');
      }
      setFormSubmitted(true);
      showToast(data.message || 'Your site visit request is successfully confirmed!');
    } catch (err) {
      console.error(err);
      showToast('Unable to submit inquiry. Please call desk directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const getWhatsAppEnquiryUrl = () => {
    const parts: string[] = ['*ANV REEALTY - Site Visit & Property Enquiry*'];
    if (property?.name) {
      parts.push(`*Property:* ${property.name}${property.hideName ? ' (Confidential Listing)' : ''}`);
    }
    if (property?.locality || property?.location) {
      parts.push(`*Location:* ${property?.locality || property?.location}`);
    }
    if (property?.price) {
      parts.push(`*Price:* ${property.hidePrice ? 'Price on Request (Confidential)' : property.price}`);
    }
    if (property?.bhk) {
      parts.push(`*Configuration:* ${property.bhk}`);
    }
    if (clientName.trim()) {
      parts.push(`*Client Name:* ${clientName.trim()}`);
    }
    if (clientPhone.trim()) {
      parts.push(`*Contact Phone:* ${clientPhone.trim()}`);
    }
    if (clientEmail.trim()) {
      parts.push(`*Email:* ${clientEmail.trim()}`);
    }
    if (preferredSlot.trim()) {
      parts.push(`*Preferred Timing:* ${preferredSlot.trim()}`);
    }
    parts.push('\nHello, I would like to arrange an exclusive private walkthrough for this property.');
    return `https://wa.me/919373020701?text=${encodeURIComponent(parts.join('\n'))}`;
  };

  const handleWhatsAppEnquiryClick = () => {
    if (clientPhone.trim() || clientName.trim()) {
      fetch('/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clientName.trim() || 'WhatsApp Inquirer',
          phone: clientPhone.trim() || 'Not Provided',
          email: clientEmail.trim(),
          projectName: property?.name || 'Curated Residence',
          propertyId: property?.id || slugOrId,
          locality: property?.locality || property?.location || 'Pune',
          bhk: property?.bhk || '3 BHK',
          budget: property?.price || '₹1.5 - 2.5 Cr',
          visitDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          visitTime: preferredSlot,
          notes: `[Initiated via WhatsApp Button] Preferred slot: ${preferredSlot}`
        })
      }).catch(() => {});
    }
  };

  if (!property) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center text-sm font-semibold">
        Loading property dossier...
      </div>
    );
  }

  // Structured Dossier Parsing & Privacy Settings
  const { cleanDescription, dossier } = useMemo(() => {
    return parseDossierData(property?.description || '');
  }, [property?.description]);

  const hideName = Boolean(property?.hideName ?? dossier.hideName);
  const hidePrice = Boolean(property?.hidePrice ?? dossier.hidePrice);
  const hideRera = Boolean(property?.hideRera ?? dossier.hideRera);
  const hideComplianceTab = Boolean(property?.hideComplianceTab ?? dossier.hideComplianceTab);
  const hideCostSheet = Boolean(property?.hideCostSheet ?? dossier.hideCostSheet);
  const hideAmenities = Boolean(property?.hideAmenities ?? dossier.hideAmenities);
  const hideHighlights = Boolean(property?.hideHighlights ?? dossier.hideHighlights);
  const hideConnectivity = Boolean(property?.hideConnectivity ?? dossier.hideConnectivity);

  const highlights: string[] = (property?.highlights && property.highlights.length > 0)
    ? property.highlights
    : (dossier.highlights && dossier.highlights.length > 0)
    ? dossier.highlights
    : [];

  const connectivity: string[] = (property?.connectivity && property.connectivity.length > 0)
    ? property.connectivity
    : (dossier.connectivity && dossier.connectivity.length > 0)
    ? dossier.connectivity
    : [];

  const amenitiesList = (property?.amenitiesList && property.amenitiesList.length > 0)
    ? property.amenitiesList
    : (dossier.amenitiesList && dossier.amenitiesList.length > 0)
    ? dossier.amenitiesList
    : [];

  const rawRera = (property?.reraNumber || dossier.reraNumber || '').trim();
  const displayRera = (rawRera === 'PRM/PUN/RERA/2026/0491' || rawRera === 'PRM/PUN/COM/2026/0882') ? '' : rawRera;
  const rpsStatus = property?.rpsStatus || dossier.rpsStatus || '100% Clear Title • Zero Encumbrances';
  const legalVettingText = property?.legalVettingText || dossier.legalVettingText || 'This property has completed 100% title deed investigation, environmental clearance, and commencement certification as registered under Government of Maharashtra MahaRERA.';
  const customCostSheet = property?.customCostSheet || dossier.customCostSheet;

  // Cost estimates
  const priceRaw = property?.priceRaw || 0;
  const stampDuty = Math.round(priceRaw * 0.07);
  const registrationFee = 30000;
  const isReady = (property?.status || '').toLowerCase().includes('ready');
  const gstRate = isReady ? 0 : 0.05;
  const gstAmount = Math.round(priceRaw * gstRate);
  const totalCost = priceRaw > 0 ? (priceRaw + stampDuty + registrationFee + gstAmount) : 0;

  const formatCurrency = (val: number) => {
    if (!val || val <= 0) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    return `₹${(val / 100000).toFixed(2)} Lakh`;
  };

  // Dynamic Tabs Available
  const availableTabs = useMemo(() => {
    const tabs: { id: 'overview' | 'financials' | 'amenities' | 'compliance'; label: string }[] = [
      { id: 'overview', label: 'Executive Dossier' }
    ];

    if (!hideCostSheet && (customCostSheet?.baseAgreementValue || (priceRaw > 0 && !hidePrice))) {
      tabs.push({ id: 'financials', label: 'Financial Cost Sheet' });
    }

    if (!hideAmenities && amenitiesList.length > 0) {
      tabs.push({ id: 'amenities', label: property?.isCommercial ? 'Commercial Infrastructure' : 'Lifestyle Amenities' });
    }

    if (!hideComplianceTab) {
      tabs.push({ id: 'compliance', label: 'RERA & Legal Clearance' });
    }

    return tabs;
  }, [hideCostSheet, hidePrice, customCostSheet, priceRaw, hideAmenities, amenitiesList.length, property?.isCommercial, hideComplianceTab]);

  useEffect(() => {
    if (!availableTabs.some((t: any) => t.id === activeTab)) {
      setActiveTab(availableTabs[0]?.id || 'overview');
    }
  }, [availableTabs, activeTab]);

  const isCompared = isInCompare(property.id);

  return (
    <>
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[95] bg-zinc-950 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-zinc-800 animate-in fade-in flex items-center gap-3">
          <span>{toastMsg.text}</span>
          {toastMsg.showLink && (
            <Link
              href="/saved"
              className="text-amber-400 hover:text-amber-300 font-extrabold underline flex items-center gap-1"
            >
              <span>View Shortlist →</span>
            </Link>
          )}
        </div>
      )}

      {/* Top Navbar */}
      <PublicHeader />

      <main className="min-h-screen bg-zinc-50 text-zinc-900 pb-28 lg:pb-20">
        {/* BREADCRUMB & TOP CONTROLS */}
        <div className="bg-white border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-500 overflow-x-auto py-0.5">
              <Link href="/" className="hover:text-amber-600 transition flex items-center gap-1 font-semibold shrink-0">
                <span>Home</span>
              </Link>
              <span className="text-zinc-300">/</span>
              <Link href="/properties" className="hover:text-amber-600 transition font-semibold shrink-0">
                <span>Properties</span>
              </Link>
              <span className="text-zinc-300">/</span>
              <Link href={`/properties?locality=${encodeURIComponent(property.locality || 'Pune')}`} className="hover:text-amber-600 transition shrink-0">
                {property.locality || 'Pune'}
              </Link>
              <span className="text-zinc-300">/</span>
              <span className="font-bold text-zinc-900 truncate max-w-[180px] sm:max-w-xs md:max-w-none inline-flex items-center gap-1.5">
                <span>{property.name}</span>
                {property.hideName && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Confidential
                  </span>
                )}
              </span>
            </nav>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={handleToggleCompare}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  isCompared
                    ? 'bg-amber-400 text-black border-amber-400 font-extrabold shadow-xs'
                    : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                }`}
                title={isCompared ? 'Remove from compare' : 'Add to compare'}
              >
                <Scale className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{isCompared ? 'Compared ✓' : 'Add to Compare'}</span>
                <span className="xs:hidden">{isCompared ? '✓' : 'Compare'}</span>
              </button>

              <button
                onClick={handleToggleSave}
                className={`p-1.5 sm:p-2 rounded-xl border transition cursor-pointer ${
                  saved
                    ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-xs'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-rose-600'
                }`}
                title={saved ? 'Remove from shortlist' : 'Save property'}
              >
                <Heart className={`w-4 h-4 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>

              <button
                onClick={() => setShareModalOpen(true)}
                className="p-1.5 sm:p-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 hover:text-amber-600 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Share property details (WhatsApp, link, dossier)"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-bold">Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* HERO SHOWCASE SECTION */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6">
          {/* PROPERTY TITLE & OVERVIEW HEADER */}
          <div className="mb-4 sm:mb-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                {property.developer &&
                  !/anv\s*(signature\s*partner|verified\s*developer|partner\s*developer)/i.test(property.developer) && (
                  <div className="text-xs sm:text-sm text-amber-600 font-extrabold uppercase tracking-wider mb-1.5">
                    {property.developer}
                  </div>
                )}

                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-zinc-950 leading-tight">
                    {property.name}
                  </h1>
                  {property.hideName && (
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-400 text-black border border-amber-300 shadow-xs inline-flex items-center gap-1">
                      Private &amp; Confidential Listing
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-zinc-500 flex items-center gap-1.5 mt-1.5 font-medium">
                  <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{property.location}</span>
                </p>
              </div>

              {/* Media View & Fullscreen Controls - OUTSIDE the photo */}
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <div className="flex items-center bg-zinc-100 p-1 rounded-xl sm:rounded-2xl border border-zinc-200 shadow-xs w-full sm:w-auto">
                  {mediaImages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setMediaMode('photos');
                        setIsLightboxOpen(true);
                      }}
                      className={`flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        mediaMode === 'photos'
                          ? 'bg-amber-400 text-black font-extrabold shadow-xs hover:bg-amber-300'
                          : 'text-zinc-700 hover:text-black hover:bg-white'
                      }`}
                      title="Open Fullscreen Photos"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Photos ({mediaImages.length})</span>
                      <Maximize2 className="w-3 h-3 ml-0.5 opacity-70" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setMediaMode('video');
                      setIsLightboxOpen(true);
                    }}
                    className={`flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      mediaMode === 'video'
                        ? 'bg-amber-400 text-black font-extrabold shadow-xs hover:bg-amber-300'
                        : 'text-zinc-700 hover:text-black hover:bg-white'
                    }`}
                    title="Open Fullscreen Video Tour"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video Tour</span>
                    <Maximize2 className="w-3 h-3 ml-0.5 opacity-70" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Gallery Big Preview & Multi-Media Showcase */}
            <div className="lg:col-span-8 space-y-3">
              <div className="relative h-64 sm:h-80 md:h-[460px] w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-950 shadow-md border border-zinc-200 group">
                {/* Mode 1: Photos Carousel */}
                {mediaMode === 'photos' ? (
                  <>
                    {mediaImages.length > 0 ? (
                      <Image
                        src={mediaImages[activePhotoIdx]}
                        alt={`${property.name} - View ${activePhotoIdx + 1}`}
                        fill
                        className="object-cover group-hover:scale-102 transition duration-700 select-none cursor-pointer"
                        priority
                        unoptimized
                        onClick={() => setIsLightboxOpen(true)}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-zinc-500">
                        <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-sm font-medium opacity-50">No photos uploaded yet</p>
                      </div>
                    )}

                    {/* Prev / Next Controls */}
                    {mediaImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={handlePrevPhoto}
                          className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md flex items-center justify-center transition border border-white/20 shadow-lg cursor-pointer z-30 opacity-80 hover:opacity-100"
                          aria-label="Previous Photo"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextPhoto}
                          className="absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md flex items-center justify-center transition border border-white/20 shadow-lg cursor-pointer z-30 opacity-80 hover:opacity-100"
                          aria-label="Next Photo"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  /* Mode 2: Video Walkthrough Player */
                  <div className="w-full h-full relative bg-black flex items-center justify-center">
                    {(() => {
                      const url = activeVideoUrl;
                      const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/i);
                      if (ytMatch && ytMatch[1]) {
                        return (
                          <iframe
                            src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="Property Video Walkthrough"
                          />
                        );
                      }
                      const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
                      if (vimeoMatch && vimeoMatch[1]) {
                        return (
                          <iframe
                            src={`https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="Property Video Walkthrough"
                          />
                        );
                      }
                      return (
                        <video
                          key={url}
                          src={url}
                          controls
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                          poster={property.videoThumbnail || mediaImages[0] || '/opus-thumb.jpg'}
                        >
                          Your browser does not support high-definition video playback.
                        </video>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Thumbnails rail with photos + Video Tour */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {mediaImages.map((imgUrl, idx) => {
                  const isActive = mediaMode === 'photos' && activePhotoIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setMediaMode('photos');
                        setActivePhotoIdx(idx);
                      }}
                      className={`relative w-16 sm:w-24 h-12 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        isActive
                          ? 'border-amber-400 ring-2 ring-amber-400/50 scale-102 shadow-md'
                          : 'border-zinc-200 opacity-70 hover:opacity-100'
                      }`}
                      title={`View photo ${idx + 1}`}
                    >
                      <Image src={imgUrl} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" unoptimized />
                      <span className="absolute bottom-1 right-1 bg-black/75 text-[9px] font-bold text-white px-1 rounded">
                        #{idx + 1}
                      </span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setMediaMode('video')}
                  className={`relative w-20 sm:w-28 h-12 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer bg-zinc-900 flex flex-col items-center justify-center text-center p-1 ${
                    mediaMode === 'video'
                      ? 'border-amber-400 ring-2 ring-amber-400/50 scale-102 shadow-md bg-zinc-800'
                      : 'border-zinc-200 opacity-80 hover:opacity-100'
                  }`}
                  title="Play 4K Video Walkthrough"
                >
                  <div className="w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-md">
                    <Play className="w-2.5 h-2.5 fill-black ml-0.5" />
                  </div>
                  <span className="text-[9px] font-extrabold text-white mt-1">Video Tour</span>
                </button>
              </div>

              {/* 4 CORE STATS BAR */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-zinc-200 shadow-xs">
                <div className="p-2.5 sm:p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Typology</span>
                  <span className="text-xs sm:text-sm font-black text-zinc-900 block mt-0.5 truncate">{property.bhk}</span>
                </div>
                <div className="p-2.5 sm:p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Carpet Area</span>
                  <span className="text-xs sm:text-sm font-black text-zinc-900 block mt-0.5 truncate">{property.sqft ? property.sqft.replace(/\s*carpet\s*/gi, '').trim() : '1,200 Sq.Ft.'}</span>
                </div>
                <div className="p-2.5 sm:p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Possession</span>
                  <span className="text-xs sm:text-sm font-black text-zinc-900 block mt-0.5 truncate">{property.possession || property.status}</span>
                </div>
                <div className="p-2.5 sm:p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Verification</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-700 block mt-0.5 truncate">
                    {property.rpsStatus ? `${property.rpsStatus} ✓` : 'Verified Listing ✓'}
                  </span>
                </div>
              </div>

              {/* SUITABLE FOR BUSINESS PURPOSES */}
              {property.businessPurposes && property.businessPurposes.length > 0 && (
                <div className="bg-white rounded-2xl border border-amber-200/80 p-4 sm:p-5 shadow-xs space-y-2.5 bg-gradient-to-br from-white to-amber-50/30">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                      <Briefcase className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-zinc-950 uppercase tracking-wider block">
                        Suitable For:
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        Admin-assigned commercial suitability labels for customer operations
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {property.businessPurposes.map((bp) => (
                      <span
                        key={bp.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-zinc-900 border border-amber-300 shadow-2xs hover:border-amber-400 transition"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>{bp.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* TABS NAVIGATION */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-1.5 sm:p-2 flex items-center gap-1.5 sm:gap-2 overflow-x-auto shadow-xs">
                {availableTabs.map((tab: any) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-zinc-950 text-white shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT */}
              {activeTab === 'overview' && (
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 p-5 sm:p-8 space-y-6 shadow-xs">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-zinc-950 mb-2">Architectural Narrative & Orientation</h3>
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
                      {cleanDescription || formatPropertyDescription(property.description)}
                    </p>
                  </div>

                  {((!hideHighlights && highlights.length > 0) || (!hideConnectivity && connectivity.length > 0)) && (
                    <div className={`grid gap-4 pt-2 ${
                      (!hideHighlights && highlights.length > 0) && (!hideConnectivity && connectivity.length > 0)
                        ? 'grid-cols-1 sm:grid-cols-2'
                        : 'grid-cols-1'
                    }`}>
                      {!hideHighlights && highlights.length > 0 && (
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                          <span className="text-xs font-bold text-zinc-900 block mb-2">Engineering &amp; Architectural Highlights</span>
                          <ul className="space-y-1.5 text-xs text-zinc-600 list-disc list-inside">
                            {highlights.map((hl, idx) => (
                              <li key={idx}>{hl}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!hideConnectivity && connectivity.length > 0 && (
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                          <span className="text-xs font-bold text-zinc-900 block mb-2">Location Connectivity Advantage</span>
                          <ul className="space-y-1.5 text-xs text-zinc-600 list-disc list-inside">
                            {connectivity.map((cn, idx) => (
                              <li key={idx}>{cn}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'financials' && (
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 p-5 sm:p-8 space-y-6 shadow-xs">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-zinc-950">Statutory Landed Cost Sheet</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Transparent breakdown of all statutory taxes, stamp duties, and direct developer pricing.
                    </p>
                  </div>

                  <div className="border border-zinc-200 rounded-2xl overflow-hidden divide-y divide-zinc-200 text-xs">
                    <div className="flex justify-between items-center p-3.5 sm:p-4 bg-zinc-50">
                      <span className="font-bold text-zinc-800">Base Agreement Value</span>
                      <span className="font-black text-zinc-950 text-sm">
                        {customCostSheet?.baseAgreementValue || (priceRaw > 0 ? formatCurrency(priceRaw) : (property.price || 'Price on Request'))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3.5 sm:p-4">
                      <span className="text-zinc-600">MahaRERA Stamp Duty (7%)</span>
                      <span className="font-semibold text-zinc-900">
                        {customCostSheet?.stampDuty || (priceRaw > 0 ? formatCurrency(stampDuty) : 'Calculated at 7% on Agreement')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3.5 sm:p-4">
                      <span className="text-zinc-600">Statutory Registration Charges</span>
                      <span className="font-semibold text-zinc-900">
                        {customCostSheet?.registrationCharges || '₹30,000'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3.5 sm:p-4">
                      <span className="text-zinc-600">Goods &amp; Services Tax (GST {isReady ? '0% - OC Issued' : '5%'})</span>
                      <span className="font-semibold text-zinc-900">
                        {customCostSheet?.gst || (isReady ? '₹0 (OC Received)' : (priceRaw > 0 ? formatCurrency(gstAmount) : 'Subject to Project Stage'))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3.5 sm:p-4">
                      <span className="text-zinc-600">Brokerage &amp; Advisory Fee</span>
                      <span className="font-bold text-emerald-700">
                        {customCostSheet?.brokerage || '₹0 (Zero Brokerage Mandate)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 sm:p-5 bg-zinc-950 text-white font-bold">
                      <span className="text-xs sm:text-sm">Estimated Total Landed Outlay</span>
                      <span className="text-amber-400 text-base sm:text-lg font-black">
                        {customCostSheet?.totalLandedOutlay || (priceRaw > 0 ? formatCurrency(totalCost) : 'Available on Custom Quote')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'amenities' && (
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 p-5 sm:p-8 space-y-6 shadow-xs">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-zinc-950">
                      {property.isCommercial ? 'Commercial Infrastructure & Building Ecosystem' : 'Residential Lifestyle & Wellness Ecosystem'}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      World-class amenities maintained to institutional five-star hospitality standards.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {amenitiesList.map((item: any, idx: number) => {
                      const title = typeof item === 'string' ? item : item.title;
                      const desc = typeof item === 'string' ? 'Verified on-site infrastructure & service amenity' : (item.desc || 'Verified on-site infrastructure & service amenity');
                      return (
                        <div key={idx} className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900 mb-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{title}</span>
                          </div>
                          <p className="text-[11px] text-zinc-500 leading-snug">{desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'compliance' && (
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 p-5 sm:p-8 space-y-6 shadow-xs">
                  <div className="p-4 sm:p-5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3">
                    <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-emerald-950">MahaRERA &amp; RPS Legal Title Vetting</h4>
                      <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                        {legalVettingText}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {!hideRera ? (
                      <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase block">MahaRERA Registration ID</span>
                          <span className="font-mono font-bold text-zinc-900 text-sm block mt-0.5">
                            {displayRera || 'Available on Request / In Process'}
                          </span>
                        </div>
                        {displayRera && (
                          <button
                            onClick={handleCopyRera}
                            className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-600 transition cursor-pointer"
                            title="Copy RERA ID"
                          >
                            {copiedRera ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase block">MahaRERA Registration</span>
                        <span className="font-semibold text-zinc-700 text-xs block mt-0.5">
                          Verified Mandate &bull; Private Clearance On Request
                        </span>
                      </div>
                    )}

                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">Title Clearance Status</span>
                      <span className="font-bold text-emerald-700 text-sm block mt-0.5">
                        {rpsStatus}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STICKY RIGHT COLUMN: PRICE & INSTANT ENQUIRY / VISIT BOOKING */}
            <div className="lg:col-span-4 space-y-5">
              {/* PRICE CARD */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 p-5 sm:p-6 shadow-sm">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  All-Inclusive Quoted Valuation
                </span>
                {property.hidePrice || !property.price || property.price.toLowerCase().includes('request') || property.price === '₹0' ? (
                  <div className="mt-2 space-y-2.5">
                    <div className="text-xl sm:text-2xl font-black text-zinc-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-600" />
                      <span>Price on Request</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const target = document.getElementById('enquiry-form-section');
                        if (target) {
                          target.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                    >
                      <span>Request Official Price &amp; Brochure</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl sm:text-4xl font-black text-zinc-950 mt-1">
                      {property.price}
                    </div>
                    <div className="text-xs text-zinc-500 font-semibold mt-1 flex items-center">
                      <span>{property.priceSuffix || 'All Inclusive'}</span>
                    </div>
                  </>
                )}

                <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Estimated Rate:</span>
                  <span className="font-bold text-zinc-900">
                    {property.hidePrice ? 'Rate on Request' : `₹${Math.round(priceRaw / (property.sqftNum || 1100)).toLocaleString('en-IN')} / sq.ft`}
                  </span>
                </div>

                {/* Quick Save & Compare Actions inside Price Card */}
                <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSave}
                    className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      saved
                        ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-xs'
                        : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-rose-600'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span>{saved ? 'Shortlisted ✓' : 'Save'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCompare(property)}
                    className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      isCompared
                        ? 'bg-amber-400 border-amber-400 text-black font-extrabold shadow-xs'
                        : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700'
                    }`}
                  >
                    <Scale className="w-4 h-4 text-zinc-500" />
                    <span>{isCompared ? 'Compared ✓' : 'Compare'}</span>
                  </button>
                </div>
              </div>

              {/* PRIVATE SITE VISIT & ENQUIRY FORM */}
              <div id="visit-booking-section" className="bg-zinc-950 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl border border-zinc-800 scroll-mt-24">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[11px] sm:text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Exclusive Viewing Pass
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight">Schedule Private Site Visit</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Arrange a private escorted walkthrough with our senior advisor. Complimentary Innova Crysta pickup available.
                </p>

                {formSubmitted ? (
                  <div className="mt-6 p-5 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-center space-y-3 animate-in fade-in zoom-in-95">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-white">
                        Your Site Visit Request is Confirmed!
                      </h4>
                      <p className="text-xs text-emerald-300 font-semibold mt-1">
                        We will contact you shortly.
                      </p>
                    </div>

                    <a
                      href={getWhatsAppEnquiryUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <svg viewBox="0 0 32 32" className="w-4 h-4 fill-zinc-950" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 2C8.28 2 2 8.28 2 16c0 2.66.75 5.15 2.05 7.29L2.3 29.7l6.63-1.74A13.9 13.9 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm8.17 19.83c-.34.96-1.7 1.76-2.76 1.99-.73.16-1.68.29-4.88-1.04-4.09-1.69-6.72-5.83-6.93-6.1-.2-.28-1.67-2.22-1.67-4.23s1.05-3.01 1.43-3.42c.38-.41.82-.51 1.1-.51.27 0 .55 0 .79.02.25.01.59-.1.92.7.34.82 1.16 2.83 1.26 3.04.1.2.17.44.03.71-.13.27-.2.44-.4.68-.2.24-.43.53-.61.71-.21.21-.43.44-.19.86.25.41 1.09 1.8 2.34 2.91 1.61 1.43 2.97 1.88 3.39 2.09.42.2.67.18.92-.1.25-.28 1.07-1.24 1.35-1.67.28-.43.56-.36.94-.22.38.14 2.42 1.14 2.83 1.35.41.2.69.31.79.48.1.18.1 1.02-.24 1.98z" />
                      </svg>
                      <span>Connect with Advisor on WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setFormSubmitted(false)}
                      className="text-xs text-amber-400 hover:text-amber-300 font-bold underline pt-1 block mx-auto cursor-pointer"
                    >
                      Book Another Viewing / Modify
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitEnquiry} className="mt-5 space-y-3.5 text-xs">
                    <div>
                      <label className="block text-[11px] text-zinc-400 font-semibold mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. Rahul Mehta"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-400 font-semibold mb-1">Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="+91 98200 00000"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-400 font-semibold mb-1">Email Address</label>
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-400 font-semibold mb-1">Preferred Timing Slot</label>
                      <input
                        type="text"
                        value={preferredSlot}
                        onChange={(e) => setPreferredSlot(e.target.value)}
                        placeholder="e.g. This Saturday (04:00 PM)"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold py-3.5 rounded-xl transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>{submitting ? 'Confirming Pass...' : 'Dispatch Viewing Pass'}</span>
                      <ArrowRight className="w-4 h-4 text-black" />
                    </button>

                    <div className="relative flex items-center justify-center py-0.5">
                      <div className="border-t border-zinc-800 w-full" />
                      <span className="bg-zinc-950 px-2.5 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">or connect via</span>
                      <div className="border-t border-zinc-800 w-full" />
                    </div>

                    <a
                      href={getWhatsAppEnquiryUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleWhatsAppEnquiryClick}
                      className="w-full py-3 bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-zinc-950 border border-[#25D366]/40 hover:border-[#25D366] font-bold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer shadow-sm hover:shadow-[0_4px_20px_rgba(37,211,102,0.25)]"
                    >
                      <svg
                        viewBox="0 0 32 32"
                        className="w-4 h-4 fill-current transition-transform duration-200 group-hover:scale-110"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M16 2C8.28 2 2 8.28 2 16c0 2.66.75 5.15 2.05 7.29L2.3 29.7l6.63-1.74A13.9 13.9 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm8.17 19.83c-.34.96-1.7 1.76-2.76 1.99-.73.16-1.68.29-4.88-1.04-4.09-1.69-6.72-5.83-6.93-6.1-.2-.28-1.67-2.22-1.67-4.23s1.05-3.01 1.43-3.42c.38-.41.82-.51 1.1-.51.27 0 .55 0 .79.02.25.01.59-.1.92.7.34.82 1.16 2.83 1.26 3.04.1.2.17.44.03.71-.13.27-.2.44-.4.68-.2.24-.43.53-.61.71-.21.21-.43.44-.19.86.25.41 1.09 1.8 2.34 2.91 1.61 1.43 2.97 1.88 3.39 2.09.42.2.67.18.92-.1.25-.28 1.07-1.24 1.35-1.67.28-.43.56-.36.94-.22.38.14 2.42 1.14 2.83 1.35.41.2.69.31.79.48.1.18.1 1.02-.24 1.98z" />
                      </svg>
                      <span>Enquire Directly on WhatsApp</span>
                    </a>
                  </form>
                )}

                {/* Direct Advisor Desk */}
                <div className="mt-5 pt-5 border-t border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                      JD
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Jennifer Desai</div>
                      <div className="text-[10px] text-zinc-400">Senior Real Estate Advisor</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={getWhatsAppEnquiryUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-[#25D366] text-emerald-400 hover:text-zinc-950 border border-emerald-500/30 transition group"
                      title="Direct WhatsApp Desk (+91 93730 20701)"
                    >
                      <svg viewBox="0 0 32 32" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 2C8.28 2 2 8.28 2 16c0 2.66.75 5.15 2.05 7.29L2.3 29.7l6.63-1.74A13.9 13.9 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm8.17 19.83c-.34.96-1.7 1.76-2.76 1.99-.73.16-1.68.29-4.88-1.04-4.09-1.69-6.72-5.83-6.93-6.1-.2-.28-1.67-2.22-1.67-4.23s1.05-3.01 1.43-3.42c.38-.41.82-.51 1.1-.51.27 0 .55 0 .79.02.25.01.59-.1.92.7.34.82 1.16 2.83 1.26 3.04.1.2.17.44.03.71-.13.27-.2.44-.4.68-.2.24-.43.53-.61.71-.21.21-.43.44-.19.86.25.41 1.09 1.8 2.34 2.91 1.61 1.43 2.97 1.88 3.39 2.09.42.2.67.18.92-.1.25-.28 1.07-1.24 1.35-1.67.28-.43.56-.36.94-.22.38.14 2.42 1.14 2.83 1.35.41.2.69.31.79.48.1.18.1 1.02-.24 1.98z" />
                      </svg>
                    </a>
                    <a
                      href="tel:+919373020701"
                      className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 transition"
                      title="Direct Phone Desk (+91 93730 20701)"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE STICKY BOTTOM CONVERSION BAR */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-zinc-200/90 px-4 py-2.5 shadow-[0_-4px_25px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
            {/* Price Preview */}
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider leading-none">
                Quoted Price
              </span>
              <div className="text-base sm:text-lg font-black text-zinc-950 truncate leading-tight mt-0.5">
                {property.price}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const visitSection = document.getElementById('visit-booking-section');
                  if (visitSection) {
                    visitSection.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.location.href = getWhatsAppEnquiryUrl();
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Visit</span>
              </button>

              <a
                href={getWhatsAppEnquiryUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xs transition cursor-pointer flex items-center justify-center active:scale-95"
                title="Chat on WhatsApp"
              >
                <svg viewBox="0 0 32 32" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 2C8.28 2 2 8.28 2 16c0 2.66.75 5.15 2.05 7.29L2.3 29.7l6.63-1.74A13.9 13.9 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm8.17 19.83c-.34.96-1.7 1.76-2.76 1.99-.73.16-1.68.29-4.88-1.04-4.09-1.69-6.72-5.83-6.93-6.1-.2-.28-1.67-2.22-1.67-4.23s1.05-3.01 1.43-3.42c.38-.41.82-.51 1.1-.51.27 0 .55 0 .79.02.25.01.59-.1.92.7.34.82 1.16 2.83 1.26 3.04.1.2.17.44.03.71-.13.27-.2.44-.4.68-.2.24-.43.53-.61.71-.21.21-.43.44-.19.86.25.41 1.09 1.8 2.34 2.91 1.61 1.43 2.97 1.88 3.39 2.09.42.2.67.18.92-.1.25-.28 1.07-1.24 1.35-1.67.28-.43.56-.36.94-.22.38.14 2.42 1.14 2.83 1.35.41.2.69.31.79.48.1.18.1 1.02-.24 1.98z" />
                </svg>
              </a>

              <a
                href="tel:+919373020701"
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 shadow-xs transition cursor-pointer flex items-center justify-center active:scale-95"
                title="Direct Phone Desk (+91 93730 20701)"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 select-none animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-4 text-white pb-3 border-b border-white/10">
            <div>
              {property.developer &&
                !/anv\s*(signature\s*partner|verified\s*developer|partner\s*developer)/i.test(property.developer) && (
                <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">
                  {property.developer}
                </span>
              )}
              <h2 className="text-base sm:text-xl font-bold truncate max-w-md sm:max-w-xl">
                {property.name}
              </h2>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Media Switcher inside Lightbox: Toggle between Photos & Video */}
              <div className="flex items-center bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/15">
                {mediaImages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMediaMode('photos')}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      mediaMode === 'photos'
                        ? 'bg-amber-400 text-black font-extrabold shadow-xs'
                        : 'text-zinc-300 hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Photos ({mediaImages.length})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMediaMode('video')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    mediaMode === 'video'
                      ? 'bg-amber-400 text-black font-extrabold shadow-xs'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video Tour</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
                title="Close Lightbox"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            {mediaMode === 'video' ? (
              <div className="relative w-full h-full max-w-5xl max-h-[75vh] flex items-center justify-center rounded-2xl overflow-hidden bg-black border border-white/15 shadow-2xl">
                {(() => {
                  const url = activeVideoUrl;
                  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/i);
                  if (ytMatch && ytMatch[1]) {
                    return (
                      <iframe
                        src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Property Video Walkthrough Fullscreen"
                      />
                    );
                  }
                  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
                  if (vimeoMatch && vimeoMatch[1]) {
                    return (
                      <iframe
                        src={`https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Property Video Walkthrough Fullscreen"
                      />
                    );
                  }
                  return (
                    <video
                      key={url}
                      src={url}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                      poster={property.videoThumbnail || mediaImages[0] || '/opus-thumb.jpg'}
                    >
                      Your browser does not support high-definition video playback.
                    </video>
                  );
                })()}
              </div>
            ) : mediaImages.length > 0 ? (
              <div className="relative w-full h-full max-w-5xl max-h-[75vh]">
                <Image
                  src={mediaImages[activePhotoIdx]}
                  alt={`Photo ${activePhotoIdx + 1}`}
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                />

                {mediaImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevPhoto}
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition cursor-pointer shadow-2xl"
                      title="Previous"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextPhoto}
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition cursor-pointer shadow-2xl"
                      title="Next"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white text-xs font-bold px-4 py-1.5 rounded-full border border-white/20 shadow-lg">
                  Photo {activePhotoIdx + 1} of {mediaImages.length}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Share Property Modal */}
      <SharePropertyModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        property={property}
      />

      {/* Auth Modal */}
      <AuthInquiryModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthNotice(null);
        }}
        featureNotice={authNotice || undefined}
        onSuccess={(msg) => showToast(msg, false)}
      />
    </>
  );
}

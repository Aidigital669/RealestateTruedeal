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
  Calendar,
  Sparkles
} from 'lucide-react';
import { usePropertyComparison } from '@/context/PropertyComparisonContext';
import { useSavedProperties } from '@/context/SavedPropertiesContext';
import { PropertyItem, ALL_FALLBACK_PROPERTIES } from '@/lib/property-types';
import { isZeroPrice, formatPriceDisplay } from '@/components/public/HomepageSearchablePortal';
import { getPropertySlug, getPropertyUrl, matchesProperty } from '@/lib/slug';
import { PublicHeader } from '@/components/public/PublicHeader';
import { SharePropertyModal } from '@/components/public/SharePropertyModal';
import { getClientSession } from '@/lib/user-auth';
import { AuthInquiryModal } from '@/components/auth/AuthInquiryModal';
import { formatPropertyDescription, parseDossierData, embedDossierData } from '@/lib/dossier-parser';
import { parseAndNormalizeVideoUrl } from '@/lib/video-utils';

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

  // Check if this property is specifically an Opus luxury property
  const isOpusProperty = Boolean(
    (property?.name && /opus/i.test(property.name)) ||
    (property?.slug && /opus/i.test(property.slug)) ||
    (property?.developer && /opus/i.test(property.developer)) ||
    ((property as any)?.realName && /opus/i.test((property as any).realName))
  );

  // Video walkthrough URL:
  // - If property has its own assigned videoUrl, normalize and use that.
  // - If it is specifically an Opus property and no custom videoUrl is given, use '/Opusvideo.mp4'.
  // - For all other properties, do not fall back to Opus video (activeVideoUrl is null).
  const rawVideo = property?.videoUrl?.trim();
  const parsedVideo = useMemo(() => {
    if (rawVideo) {
      const p = parseAndNormalizeVideoUrl(rawVideo);
      if (p.isValid) return p;
    }
    if (isOpusProperty) {
      return parseAndNormalizeVideoUrl('/Opusvideo.mp4');
    }
    return { type: 'unknown' as const, embedUrl: null, normalizedUrl: '', isValid: false };
  }, [rawVideo, isOpusProperty]);

  const hasVideo: boolean = parsedVideo.isValid;
  const activeVideoUrl: string | null = parsedVideo.isValid ? parsedVideo.normalizedUrl : null;

  // Auto-switch away from video mode if property has no video
  useEffect(() => {
    if (!hasVideo && mediaMode === 'video') {
      setMediaMode('photos');
    }
  }, [hasVideo, mediaMode]);

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
    if (property?.price && !isZeroPrice(property.price)) {
      parts.push(`*Price:* ${property.hidePrice ? 'Price on Request (Confidential)' : formatPriceDisplay(property.price)}`);
    } else {
      parts.push(`*Price:* Price on Request`);
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
      }).catch(() => { });
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
    return parseDossierData(property?.description || '', property?.name);
  }, [property?.description, property?.name]);

  // Helper to split text by newlines and inline bullet markers (*, •, -, #)
  const splitBulletSegments = (text: string): string[] => {
    if (!text) return [];
    const normalized = text
      .replace(/^[ \t]*[*•]\s+/gm, '\n')
      .replace(/(?:^|\n)[ \t]*-\s+/g, '\n')
      .replace(/\s*#\s*/g, '\n');
    return normalized
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
  };

  const hideName = Boolean(property?.hideName ?? dossier.hideName);
  const hidePrice = Boolean(property?.hidePrice ?? dossier.hidePrice);
  const hideRera = Boolean(property?.hideRera ?? dossier.hideRera);
  const hideComplianceTab = Boolean(property?.hideComplianceTab ?? dossier.hideComplianceTab);
  const hideCostSheet = Boolean(property?.hideCostSheet ?? dossier.hideCostSheet);
  const hideAmenities = Boolean(property?.hideAmenities ?? dossier.hideAmenities);
  const hideHighlights = Boolean(property?.hideHighlights ?? dossier.hideHighlights);
  const hideConnectivity = Boolean(property?.hideConnectivity ?? dossier.hideConnectivity);

  const rawHighlights: string[] = (property?.highlights && property.highlights.length > 0)
    ? property.highlights
    : (dossier.highlights && dossier.highlights.length > 0)
      ? dossier.highlights
      : [];

  // Filter out dummy/placeholder highlights imported from raw Excel columns
  const filteredHighlights = rawHighlights.filter((hl) => {
    const lower = (hl || '').toLowerCase().trim();
    return !(
      lower.startsWith('listing status:') ||
      lower.startsWith('property type:') ||
      lower.startsWith('configuration:') ||
      lower.startsWith('property tag:') ||
      lower.startsWith('status:') ||
      lower.startsWith('availability:') ||
      lower === 'new' ||
      lower === 'office' ||
      lower === 'available' ||
      lower === 'ready to move'
    );
  });

  const highlights: string[] = useMemo(() => {
    // If filteredHighlights has authentic architectural specs (not dummy/generic items), keep them
    const validRaw = filteredHighlights.filter((h) => {
      const lower = h.toLowerCase().trim();
      return !/^(?:listing status|property type|configuration|property tag|availability|status)\b/i.test(lower);
    });

    const d = ((dossier || (property as any)?.dossier || {}) as Record<string, any>);

    // Always extract real architectural & engineering lines from cleanDescription or description
    const descText = cleanDescription || property?.description || '';
    const extracted: string[] = [];
    const segments = splitBulletSegments(descText);
    for (const clean of segments) {
      const lower = clean.toLowerCase();
      if (
        lower.startsWith('façade:') || lower.startsWith('facade:') ||
        lower.startsWith('hvac:') ||
        lower.startsWith('total retail leasable area:') || lower.startsWith('leasable area:') ||
        lower.startsWith('floor:') || lower.startsWith('total floors:') ||
        lower.startsWith('parking:') || lower.startsWith('parking spaces:') ||
        lower.startsWith('power (kva):') || lower.startsWith('backup power:') ||
        lower.startsWith('lifts:') || lower.startsWith('flooring:') ||
        lower.startsWith('retail efficiency:') || lower.startsWith('racking capacity:') ||
        lower.startsWith('floor strength:') || lower.startsWith('unique feature:')
      ) {
        extracted.push(clean);
      }
    }

    // Check if validRaw only has boilerplate placeholders
    const isGenericOnly = validRaw.every(h =>
      /grade-a commercial architectural|optimized usable carpet area with superior floor efficiency|dedicated utility infrastructure/i.test(h)
    );

    if (isGenericOnly || validRaw.length === 0) {
      const dynamicSpecs: string[] = [];
      if (d.CarpetAreaName) {
        dynamicSpecs.push(`Optimized ${d.CarpetAreaName} usable carpet area${d.SuperAreaName ? ' (' + d.SuperAreaName + ' super built-up layout)' : ''}`);
      } else if (d.SuperAreaName) {
        dynamicSpecs.push(`Super Built-up Area: ${d.SuperAreaName} commercial space`);
      } else if (d.BuiltAreaName) {
        dynamicSpecs.push(`Built-up Area: ${d.BuiltAreaName}`);
      } else if (property?.sqft) {
        dynamicSpecs.push(`Optimized ${property.sqft} floor space`);
      }
      const validBldg = d.BuildingName || d.PropertyName || ((property?.developer && !/anv\b/i.test(property.developer)) ? property.developer : '');
      if (validBldg) {
        dynamicSpecs.push(`Prime commercial landmark at ${validBldg} with high-street visibility`);
      }
      if (d.FloorNumber) {
        dynamicSpecs.push(`Level placement: ${d.FloorNumber} with direct commercial access`);
      }
      if (d.ParkingDetails) {
        const pNum = String(d.ParkingDetails).replace(/[^0-9]/g, '');
        if (pNum && Number(pNum) > 0) {
          dynamicSpecs.push(`${pNum} Dedicated reserved parking spaces for occupants and visitors`);
        }
      }
      const frontageMatch = descText.match(/(\d+\s*(?:feet|ft|m|meter)\s*(?:wide\s*road|frontage|ceiling\s*height)[^\n.,#|]*)/i);
      if (frontageMatch) {
        dynamicSpecs.push(`Superior infrastructure specifications: ${frontageMatch[1].trim()}`);
      }
      if (dynamicSpecs.length > 0) {
        return dynamicSpecs;
      }
    }

    const combined = [...validRaw, ...extracted];
    const unique = Array.from(new Set(combined));
    if (unique.length > 0) return unique;

    // Professional fallback for properties without specific engineering specs
    return property?.isCommercial
      ? [
        "High-efficiency corporate floor plate with optimized workspace layout",
        "Double-glazed acoustic glass façade with superior thermal insulation",
        "100% DG power backup and high-speed passenger & service elevators",
        "Multi-tier 24x7 security surveillance and visitor access management"
      ]
      : [
        "Vastu-compliant architectural orientation with cross-ventilation",
        "Acoustic double-glazed windows and expansive living deck",
        "Premium Italian marble flooring in living and dining zones",
        "100% DG power backup and 3-tier smart security infrastructure"
      ];
  }, [filteredHighlights, cleanDescription, property, dossier]);

  const rawConnectivity: string[] = (property?.connectivity && property.connectivity.length > 0)
    ? property.connectivity
    : (dossier.connectivity && dossier.connectivity.length > 0)
      ? dossier.connectivity
      : [];

  const connectivity: string[] = useMemo(() => {
    // If description has a specific Connectivity: line, make sure it's included
    const descText = cleanDescription || property?.description || '';
    const extractedConn: string[] = [];
    const segments = splitBulletSegments(descText);
    for (const clean of segments) {
      if (clean.toLowerCase().startsWith('connectivity:')) {
        const val = clean.replace(/^connectivity\s*:\s*/i, '').trim();
        if (val) extractedConn.push(val);
      }
    }
    const merged = [...extractedConn, ...rawConnectivity];
    return Array.from(new Set(merged));
  }, [rawConnectivity, cleanDescription, property?.description]);

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

  // Aggregate Suitable For list from DB relations, dossier metadata, and description lines
  const suitableForList = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();

    const add = (val: any) => {
      if (!val) return;
      const str = typeof val === 'object' ? (val.name || val.title || '') : String(val);
      // Clean leading # and "Suitable For:"
      const clean = str.replace(/^(?:#\s*)?(?:suitable\s*for\s*[:\-]?\s*)+/i, '').trim();
      if (!clean) return;

      // Handle comma or pipe separated items
      const parts = clean.split(/[,|]/);
      for (const p of parts) {
        const item = p.trim().replace(/^#+/, '').trim();
        const key = item.toLowerCase();

        // STRICT FILTER: Discard any invalid entries like property titles, availability phrases, sqft, locations, etc.
        if (
          !item ||
          seen.has(key) ||
          item.length > 40 ||
          item.includes(':') ||
          item.includes('*') ||
          /^(?:showroom|shop|office|unit|flat)\s*(?:no\.?|number)?\s*\d+/i.test(item) ||
          /\b(?:available\s*in|for\s*rent|for\s*sale|sq\.?\s*ft|carpet\s*area|saleable|bhk|project\s*name|trade\s*park|undri|commercial\s*shop|hospital\s*premise|façade|facade|hvac|chiller|parking|connectivity|floor|leasable|total\s*retail|godrej)\b/i.test(item)
        ) {
          continue;
        }

        seen.add(key);
        list.push(item);
      }
    };

    // 1. From property.businessPurposes (Admin DB assigned)
    if (Array.isArray(property?.businessPurposes)) {
      for (const bp of property.businessPurposes) {
        add(bp);
      }
    }

    // 2. From dossier.suitableFor (Admin JSON assigned)
    if (Array.isArray(dossier?.suitableFor)) {
      for (const sf of dossier.suitableFor) {
        add(sf);
      }
    } else if (typeof dossier?.suitableFor === 'string') {
      add(dossier.suitableFor);
    }

    // 3. From description lines starting with # Suitable For: (only if non-empty and not listing metadata)
    const desc = cleanDescription || property?.description || '';
    const matches = desc.match(/#\s*Suitable\s*For\s*:\s*([^\n#]+)/gi);
    if (matches) {
      for (const m of matches) {
        const val = m.replace(/#\s*Suitable\s*For\s*:\s*/i, '');
        add(val);
      }
    }

    return list;
  }, [property?.businessPurposes, dossier?.suitableFor, cleanDescription, property?.description]);

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

  const renderPriceCard = () => (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 p-5 sm:p-6 shadow-sm">
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
        All-Inclusive Quoted Valuation
      </span>
      {property.hidePrice || isZeroPrice(property.price) ? (
        <div className="mt-2 space-y-2.5">
          <div className="text-xl sm:text-2xl font-black text-zinc-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <span>Price on Request</span>
          </div>
          <button
            type="button"
            onClick={() => {
              const target = document.getElementById('visit-booking-section') || document.getElementById('enquiry-form-section');
              if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="w-full py-2.5 px-4 bg-[#b9974f] hover:bg-[#a4823d] text-zinc-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
          >
            <span>Request Official Price &amp; Brochure</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="text-2xl sm:text-4xl font-black text-zinc-950 mt-1">
            {formatPriceDisplay(property.price)}
          </div>
          <div className="text-xs text-zinc-500 font-semibold mt-1 flex items-center">
            <span>{property.priceSuffix || 'All Inclusive'}</span>
          </div>
        </>
      )}

      <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
        <span className="text-zinc-500">Estimated Rate:</span>
        <span className="font-bold text-zinc-900">
          {property.hidePrice || isZeroPrice(property.price) ? 'Rate on Request' : `₹${Math.round(priceRaw / (property.sqftNum || 1100)).toLocaleString('en-IN')} / sq.ft`}
        </span>
      </div>

      {/* Quick Save & Compare Actions inside Price Card */}
      <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggleSave}
          className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${saved
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
          className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${isCompared
            ? 'bg-amber-400 border-amber-400 text-black font-extrabold shadow-xs'
            : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700'
            }`}
        >
          <Scale className="w-4 h-4 text-zinc-500" />
          <span>{isCompared ? 'Compared ✓' : 'Compare'}</span>
        </button>
      </div>
    </div>
  );

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
          <div className={`max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center ${!property.hideBreadcrumbs ? 'flex-col sm:flex-row justify-between gap-2.5 sm:gap-3' : 'justify-end'}`}>
            {!property.hideBreadcrumbs && (
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-500 min-w-0 overflow-x-auto scrollbar-none whitespace-nowrap py-0.5">
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
            )}

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={handleToggleCompare}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${isCompared
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
                className={`p-1.5 sm:p-2 rounded-xl border transition cursor-pointer ${saved
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
                  !/anv\b/i.test(property.developer) && (
                    <div className="text-[10px] sm:text-xs text-amber-600 font-extrabold uppercase tracking-wider mb-1">
                      {property.developer}
                    </div>
                  )}

                <div className="flex items-start gap-2 flex-wrap">
                  <h1 className="text-[15px] sm:text-lg md:text-2xl font-bold sm:font-extrabold tracking-tight text-zinc-950 leading-snug break-words">
                    {property.name}
                  </h1>
                  {property.hideName && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-400 text-black border border-amber-300 shadow-xs inline-flex items-center gap-1 shrink-0 mt-0.5">
                      Confidential
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-500 flex items-center gap-1 mt-1 font-medium">
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 shrink-0" />
                  <span>{property.location}</span>
                </p>
              </div>

              {/* Media View & Fullscreen Controls - OUTSIDE the photo */}
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <div className="flex items-center bg-zinc-100 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-zinc-200 shadow-xs w-full sm:w-auto">
                  {mediaImages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setMediaMode('photos')}
                      className={`flex-1 sm:flex-initial justify-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center gap-1 sm:gap-1.5 cursor-pointer ${mediaMode === 'photos'
                        ? 'bg-amber-400 text-black font-extrabold shadow-xs hover:bg-amber-300'
                        : 'text-zinc-700 hover:text-black hover:bg-white'
                        }`}
                      title="Switch to Photos"
                    >
                      <ImageIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>Photos ({mediaImages.length})</span>
                    </button>
                  )}

                  {hasVideo && (
                    <button
                      type="button"
                      onClick={() => setMediaMode('video')}
                      className={`flex-1 sm:flex-initial justify-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center gap-1 sm:gap-1.5 cursor-pointer ${mediaMode === 'video'
                        ? 'bg-amber-400 text-black font-extrabold shadow-xs hover:bg-amber-300'
                        : 'text-zinc-700 hover:text-black hover:bg-white'
                        }`}
                      title="Switch to Video Tour"
                    >
                      <Video className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>Video Tour</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="p-1 sm:p-1.5 rounded-md sm:rounded-xl text-zinc-600 hover:text-black hover:bg-white transition cursor-pointer flex items-center justify-center shrink-0 ml-0.5"
                    title="Open Fullscreen"
                    aria-label="Open Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
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
                {mediaMode === 'photos' || !hasVideo || !activeVideoUrl ? (
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
                  !isLightboxOpen ? (
                    <div className="w-full h-full relative bg-black flex items-center justify-center">
                      {(() => {
                        if (parsedVideo.type === 'youtube' || parsedVideo.type === 'vimeo') {
                          return (
                            <iframe
                              src={parsedVideo.embedUrl || ''}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              title="Property Video Walkthrough"
                            />
                          );
                        }
                        if (parsedVideo.type === 'direct') {
                          return (
                            <video
                              key={parsedVideo.embedUrl || activeVideoUrl}
                              src={parsedVideo.embedUrl || activeVideoUrl}
                              controls
                              autoPlay
                              muted
                              playsInline
                              className="w-full h-full object-cover"
                              poster={property.videoThumbnail || mediaImages[0] || (isOpusProperty ? '/opus-thumb.jpg' : undefined)}
                            >
                              Your browser does not support high-definition video playback.
                            </video>
                          );
                        }
                        return (
                          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-950 text-white space-y-3">
                            <Video className="w-10 h-10 text-amber-400" />
                            <p className="text-sm font-semibold text-zinc-300">High-Definition Walkthrough Video Available</p>
                            <a
                              href={activeVideoUrl || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#b9974f] hover:bg-[#a4823d] text-zinc-950 text-xs font-black transition shadow-lg"
                            >
                              Open Walkthrough Link ↗
                            </a>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="w-full h-full relative bg-zinc-950 flex flex-col items-center justify-center text-center p-4">
                      {property.videoThumbnail || mediaImages[0] ? (
                        <Image
                          src={property.videoThumbnail || mediaImages[0]}
                          alt="Video Preview"
                          fill
                          className="object-cover opacity-30"
                          unoptimized
                        />
                      ) : null}
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-400 border border-white/20">
                          <Play className="w-4 h-4 fill-amber-400 ml-0.5" />
                        </div>
                        <span className="text-xs font-semibold text-zinc-300">Playing in Fullscreen Lightbox</span>
                      </div>
                    </div>
                  )
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
                      className={`relative w-16 sm:w-24 h-12 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${isActive
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

                {hasVideo && (
                  <button
                    type="button"
                    onClick={() => setMediaMode('video')}
                    className={`relative w-20 sm:w-28 h-12 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer bg-zinc-900 flex flex-col items-center justify-center text-center p-1 ${mediaMode === 'video'
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
                )}
              </div>

              {/* CORE STATS BAR */}
              {(() => {
                const d = ((dossier || (property as any)?.dossier || {}) as Record<string, any>);
                const rawPos = (d.PossessionName || property.possession || (property.status && property.status !== 'Ready to Move' ? property.status : '')).toString().trim();
                const displayPossession = rawPos
                  ? (/immediately|immediate/i.test(rawPos) ? 'Immediate Possession' : rawPos)
                  : 'Possession on Request';

                const unitVal = d.FlatNo ? String(d.FlatNo) : '';
                const superAreaVal = d.SuperAreaName || '';
                // Carpet area is strictly shown if CarpetAreaName was explicitly provided,
                // or if no Super Area was provided and property.sqft exists. Never equate them.
                const carpetAreaVal = d.CarpetAreaName
                  ? d.CarpetAreaName
                  : (!superAreaVal && property.sqft ? property.sqft.replace(/\s*carpet\s*/gi, '').trim() : '');

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-zinc-200 shadow-xs">
                    <div className="p-2 sm:p-3 bg-zinc-50 rounded-xl border border-zinc-100 min-w-0">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Typology</span>
                      <span className="text-xs sm:text-sm font-black text-zinc-900 block mt-0.5 truncate">{property.bhk}</span>
                    </div>

                    {unitVal && (
                      <div className="p-2 sm:p-3 bg-zinc-50 rounded-xl border border-zinc-100 min-w-0">
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Unit No.</span>
                        <span className="text-xs sm:text-sm font-black text-zinc-900 block mt-0.5 truncate">{unitVal}</span>
                      </div>
                    )}

                    <div className="p-2 sm:p-3 bg-zinc-50 rounded-xl border border-zinc-100 min-w-0">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Carpet Area</span>
                      <span className="text-xs sm:text-sm font-black text-zinc-900 block mt-0.5 truncate">
                        {carpetAreaVal || '—'}
                      </span>
                    </div>

                    {superAreaVal && (
                      <div className="p-2 sm:p-3 bg-zinc-50 rounded-xl border border-zinc-100 min-w-0">
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Super Area</span>
                        <span className="text-xs sm:text-sm font-black text-zinc-900 block mt-0.5 truncate">{superAreaVal}</span>
                      </div>
                    )}

                    <div className="p-2 sm:p-3 bg-zinc-50 rounded-xl border border-zinc-100 min-w-0">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Possession</span>
                      <span className="text-xs sm:text-sm font-black text-zinc-900 block mt-0.5 truncate">{displayPossession}</span>
                    </div>
                  </div>
                );
              })()}

              {/* MOBILE & TABLET PRICING CARD (Directly after Core Stats on < lg screens) */}
              <div className="block lg:hidden">
                {renderPriceCard()}
              </div>



              {/* TABS NAVIGATION */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-1 sm:p-2 flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none shadow-xs">
                {availableTabs.map((tab: any) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${activeTab === tab.id
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT */}
              {activeTab === 'overview' && (() => {
                // Parse # Field: Value, * Field: Value, - Field: Value lines from cleanDescription
                const descRaw = cleanDescription || property.description || '';
                const d = ((dossier || (property as any)?.dossier || {}) as Record<string, any>);

                const lineMap: Record<string, string> = {};
                const extraHighlights: string[] = [];
                let tagsBlock = '';

                // Break by newline or inline bullet separators (*, •, -, #)
                const rawLines = descRaw
                  .split('\n')
                  .map(l => l.trim())
                  .filter(Boolean);

                rawLines.forEach(line => {
                  let cleanLine = line.replace(/^[#*\-•\s]+/, '').trim();
                  if (!cleanLine) return;

                  // Strip markdown bold / italic markers around key
                  cleanLine = cleanLine
                    .replace(/^\*\*([^*]+)\*\*:\s*/, '$1: ')
                    .replace(/^\*([^*]+)\*:\s*/, '$1: ')
                    .replace(/^\*\*([^*]+):\*\*\s*/, '$1: ')
                    .replace(/^\*([^*]+):\*\s*/, '$1: ');

                  // 1. Compound key: H : W : D
                  const hwdMatch = cleanLine.match(/^(?:h\s*:\s*w\s*:\s*d)\s*[:\-]\s*(.+)$/i);
                  if (hwdMatch) {
                    const cleanVal = hwdMatch[1].replace(/(?:h\s*:\s*w\s*:\s*d\s*[:\-]\s*)+/gi, '').trim();
                    lineMap['h : w : d'] = cleanVal;
                    return;
                  }

                  // 2. Compound key: Area : Carpet : Saleable
                  const areaMatch = cleanLine.match(/^(?:area\s*:\s*carpet\s*:\s*saleable)\s*[:\-]\s*(.+)$/i);
                  if (areaMatch) {
                    lineMap['area : carpet : saleable'] = areaMatch[1].trim();
                    return;
                  }

                  // 3. Find separator: colon (:) or dash/hyphen (- / – / —) or equals (=)
                  let sepIdx = cleanLine.indexOf(':');
                  let sepLen = 1;

                  if (sepIdx === -1) {
                    const dashMatch = cleanLine.match(/\s+([–—\-=])\s+/);
                    if (dashMatch && dashMatch.index !== undefined) {
                      sepIdx = dashMatch.index;
                      sepLen = dashMatch[0].length;
                    }
                  }

                  if (sepIdx > 0 && sepIdx < 50) {
                    const key = cleanLine.slice(0, sepIdx).trim().replace(/^[*_\s"']+|[*_\s"':]+$/g, '');
                    const val = cleanLine.slice(sepIdx + sepLen).trim().replace(/^[*_\s"']+|[*_\s"']+$/g, '');
                    if (key && val) {
                      lineMap[key.toLowerCase()] = val;
                      return;
                    }
                  }

                  // 4. Capture any unstructured pasted bullets, notes, or highlights
                  if (!cleanLine.startsWith('#') && cleanLine.length > 2 && cleanLine.length < 160) {
                    extraHighlights.push(cleanLine.replace(/^[*_\s"']+|[*_\s"']+$/g, ''));
                  }
                });

                // Drop broken area heading if it has no numbers (e.g. "TOATAl Carpet Area")
                if (lineMap['area'] && !/\d/.test(lineMap['area'])) {
                  delete lineMap['area'];
                }

                const FIELD_ORDER = [
                  'Ref Number', 'Posted Date', 'Property Title', 'Unit No.', 'Building Name', 'Landmark, City', 'Location', 'Property Age', 'Possession',
                  'Expected Price', 'Price Per Sq.Ft.', 'JV Ratio', 'Transaction', 'Ownership',
                  'Property/Developer Name', 'Super Area', 'Super Built-up Area', 'Carpet Area', 'Total Retail Leasable Area', 'Area : Carpet : Saleable',
                  'Built-up Area', 'Plot Size / Land Area', 'No of Bedroom', 'Parking Spaces', 'Parking',
                  'Furnishing', 'H : W : D', 'Total Floors', 'Property on Floor', 'Floor', 'Suitable For',
                  'Unique Feature', 'Retail Efficiency', 'Façade', 'HVAC', 'Lease Period (Month)', 'Lock-in Period (Year)', 'Rent Start Date',
                  'Rent Per Month', 'Rent Escalation %', 'Maintenance Charges', 'Security Deposit',
                  'Property Tax', 'ROI %', 'Facing', 'Branch', 'Lifts', 'Flooring', 'Power (kVA)',
                  'Backup Power (kVA)', 'Pollution Color Zone', 'Racking Capacity (EOT) - tonnes',
                  'Floor Strength - ton per meter cube', 'STP/ETP Capacity - litres',
                  'No of loading bays', 'Canopy Details (Length - Width)', 'Fire NOC', 'Dock Levellers', 'Connectivity'
                ];

                const resolveField = (field: string): string | undefined => {
                  const k = field.toLowerCase();
                  const existing = lineMap[k];
                  if (existing && existing.trim()) return existing.trim();

                  switch (k) {
                    case 'ref number':
                      return d.RefNumber || undefined;
                    case 'property title':
                      return property?.name || d.Title || undefined;
                    case 'posted date':
                      return d.PostedDate || undefined;
                    case 'unit no.':
                    case 'unit no':
                    case 'unit / flat no':
                      return d.FlatNo ? String(d.FlatNo) : (lineMap['unit no.'] || lineMap['unit no'] || lineMap['shop no'] || lineMap['flat no'] || undefined);
                    case 'landmark, city':
                      if (d.Landmark) return `${d.Landmark}${d.CityName ? ', ' + d.CityName : ''}`;
                      if (property?.locality) return `${property.locality}, ${d.CityName || 'Pune'}`;
                      return undefined;
                    case 'location':
                      return property?.location || d.LocationName || d.AddressName || undefined;
                    case 'property age':
                      return d.PropertyAge || undefined;
                    case 'possession': {
                      const rawP = (d.PossessionName || lineMap['possession'] || lineMap['possession at'] || property?.possession || (property?.status && property.status !== 'Ready to Move' ? property.status : '')).toString().trim();
                      if (!rawP) return 'Possession on Request';
                      if (/immediately|immediate/i.test(rawP)) return 'Immediate Possession';
                      return rawP;
                    }
                    case 'expected price':
                      if (d.ExpectedPrice) return String(d.ExpectedPrice).startsWith('₹') ? d.ExpectedPrice : `₹${d.ExpectedPrice}`;
                      return property?.price || undefined;
                    case 'price per sq.ft.':
                      if (d.PricePerUnitArea) {
                        const num = Number(d.PricePerUnitArea);
                        return !isNaN(num) && num > 0 ? `₹${num.toLocaleString('en-IN')}/Sq.Ft.` : String(d.PricePerUnitArea);
                      }
                      return undefined;
                    case 'transaction':
                      return d.TransactionName || d.Lease_Sale || property?.listingType || undefined;
                    case 'building name':
                      return d.BuildingName || d.PropertyName || undefined;
                    case 'property/developer name':
                      return d.PropertyName || ((property?.developer && !/anv\b/i.test(property.developer)) ? property.developer : undefined) || d.BuildingName || undefined;
                    case 'super area':
                    case 'super built-up area':
                    case 'total retail leasable area':
                      return d.SuperAreaName || lineMap['super area'] || lineMap['super built-up area'] || lineMap['saleable area'] || undefined;
                    case 'area : carpet : saleable':
                      if (d.CarpetAreaName || d.SuperAreaName || d.BuiltAreaName) {
                        const parts = [];
                        if (d.CarpetAreaName) parts.push(`Carpet: ${d.CarpetAreaName}`);
                        else if (!d.SuperAreaName && property?.sqft) parts.push(`Carpet: ${property.sqft}`);
                        if (d.SuperAreaName) parts.push(`Super: ${d.SuperAreaName}`);
                        if (d.BuiltAreaName) parts.push(`Built-up: ${d.BuiltAreaName}`);
                        return parts.join(' | ');
                      }
                      return undefined;
                    case 'carpet area':
                      return d.CarpetAreaName || (!d.SuperAreaName && property?.sqft ? `${property.sqft}` : undefined);
                    case 'built-up area':
                      return d.BuiltAreaName || undefined;
                    case 'plot size / land area':
                      return d.PlotSizeName || undefined;
                    case 'no of bedroom':
                      return property?.bhkNum && property.bhkNum > 0 ? `${property.bhkNum} BHK` : undefined;
                    case 'parking spaces':
                    case 'parking':
                      if (d.ParkingDetails) {
                        const pNum = String(d.ParkingDetails).replace(/[^0-9]/g, '');
                        return pNum && Number(pNum) > 0 ? `${pNum} Dedicated Slot(s)` : undefined;
                      }
                      return undefined;
                    case 'furnishing':
                      return d.FurnishingName || undefined;
                    case 'property on floor':
                    case 'floor':
                      return d.FloorNumber || undefined;
                    case 'lease period (month)':
                      return d.LeasePeriod || undefined;
                    case 'lock-in period (year)':
                      return d.LockinPeriod || undefined;
                    case 'rent per month':
                      return d.RentPM ? (String(d.RentPM).startsWith('₹') ? String(d.RentPM) : `₹${d.RentPM}`) : undefined;
                    case 'maintenance charges':
                      return d.MaintainCharges ? (String(d.MaintainCharges).startsWith('₹') ? String(d.MaintainCharges) : `₹${d.MaintainCharges}/month`) : undefined;
                    case 'security deposit':
                      return d.DepositePrice ? (String(d.DepositePrice).startsWith('₹') ? String(d.DepositePrice) : `₹${d.DepositePrice}`) : undefined;
                    case 'property tax':
                      return d.PropertyTax || undefined;
                    case 'roi %':
                      return d.ROI ? `${String(d.ROI).replace(/%/g, '')}%` : undefined;
                    case 'facing':
                      return d.FacingText || undefined;
                    case 'branch':
                      return d.BranchName || undefined;
                    default:
                      return undefined;
                  }
                };

                // Build ordered rows — only fields with values
                const rows: { label: string; value: string }[] = [];
                const addedKeys = new Set<string>();

                FIELD_ORDER.forEach(field => {
                  const v = resolveField(field);
                  if (v && v.trim()) {
                    rows.push({ label: field, value: v.trim() });
                    addedKeys.add(field.toLowerCase());
                  }
                });

                // Any remaining keys not in FIELD_ORDER (All pasted keys dynamically added!)
                Object.keys(lineMap).forEach(k => {
                  if (!addedKeys.has(k) && !k.startsWith('_extra_')) {
                    const formattedLabel = k
                      .split(' ')
                      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ');
                    rows.push({ label: formattedLabel, value: lineMap[k] });
                  }
                });

                // Tags line (pipe-separated short keyword tags only)
                const tagLine = tagsBlock.replace(/\s+/g, ' ').trim();
                const tags = tagLine
                  ? tagLine
                    .split('|')
                    .map(t => t.replace(/^[#*\-•\s]+/, '').trim())
                    .filter(t => t && t.length > 1 && t.length < 35 && !t.includes(':') && !t.includes('*') && !t.toLowerCase().includes('approx') && !t.toLowerCase().includes('sq. ft'))
                  : [];

                return (
                  <div className="bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 p-4 sm:p-6 shadow-xs space-y-4">
                    {/* Property Details — structured field rows */}
                    {rows.length > 0 && (
                      <div>
                        <h3 className="text-sm font-black text-zinc-950 mb-3 uppercase tracking-wider">Property Details</h3>
                        <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 overflow-hidden text-xs">
                          {rows.map(({ label, value }, idx) => (
                            <div key={idx} className="flex items-start gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-zinc-50/60 transition-colors">
                              <span className="text-zinc-500 font-semibold shrink-0 w-[130px] sm:w-[180px] leading-relaxed">{label}</span>
                              <span className="text-zinc-800 font-medium leading-relaxed break-words min-w-0 flex-1">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pasted Highlights & Overview Notes */}
                    {extraHighlights.length > 0 && (
                      <div className="p-3.5 sm:p-4 bg-amber-50/40 rounded-2xl border border-amber-200/60">
                        <span className="text-xs font-bold text-amber-950 block mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Key Highlights &amp; Overview Notes</span>
                        </span>
                        <ul className="space-y-1.5 text-xs text-zinc-700 list-disc list-inside">
                          {extraHighlights.map((note, idx) => (
                            <li key={idx} className="break-words">{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Tags / keywords line */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {tags.map((tag, i) => (
                          <span key={i} className="px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-[11px] font-medium border border-zinc-200">{tag}</span>
                        ))}
                      </div>
                    )}

                    {/* Engineering Highlights */}
                    {!hideHighlights && highlights.length > 0 && (
                      <div className="p-3.5 sm:p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                        <span className="text-xs font-bold text-zinc-900 block mb-2">Engineering &amp; Architectural Highlights</span>
                        <ul className="space-y-1.5 text-xs text-zinc-600 list-disc list-inside">
                          {highlights.map((hl, idx) => (
                            <li key={idx} className="break-words">{hl}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}

              {activeTab === 'financials' && (
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-xs">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-zinc-950">Statutory Landed Cost Sheet</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Transparent breakdown of all statutory taxes, stamp duties, and direct developer pricing.
                    </p>
                  </div>

                  <div className="border border-zinc-200 rounded-2xl overflow-hidden divide-y divide-zinc-200 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 bg-zinc-50 gap-1 sm:gap-2">
                      <span className="font-bold text-zinc-800">Base Agreement Value</span>
                      <span className="font-black text-zinc-950 text-sm shrink-0">
                        {customCostSheet?.baseAgreementValue || (priceRaw > 0 ? formatCurrency(priceRaw) : (isZeroPrice(property.price) ? 'Price on Request' : formatPriceDisplay(property.price)))}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 gap-1 sm:gap-2">
                      <span className="text-zinc-600">MahaRERA Stamp Duty (7%)</span>
                      <span className="font-semibold text-zinc-900 shrink-0">
                        {customCostSheet?.stampDuty || (priceRaw > 0 ? formatCurrency(stampDuty) : 'Calculated at 7% on Agreement')}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 gap-1 sm:gap-2">
                      <span className="text-zinc-600">Statutory Registration Charges</span>
                      <span className="font-semibold text-zinc-900 shrink-0">
                        {customCostSheet?.registrationCharges || '₹30,000'}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 gap-1 sm:gap-2">
                      <span className="text-zinc-600">Goods &amp; Services Tax (GST {isReady ? '0% - OC Issued' : '5%'})</span>
                      <span className="font-semibold text-zinc-900 shrink-0">
                        {customCostSheet?.gst || (isReady ? '₹0 (OC Received)' : (priceRaw > 0 ? formatCurrency(gstAmount) : 'Subject to Project Stage'))}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 gap-1 sm:gap-2">
                      <span className="text-zinc-600">Brokerage &amp; Advisory Fee</span>
                      <span className="font-bold text-emerald-700 shrink-0">
                        {customCostSheet?.brokerage || '₹0 (Zero Brokerage Mandate)'}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-5 bg-zinc-950 text-white font-bold gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm">Estimated Total Landed Outlay</span>
                      <span className="text-amber-400 text-base sm:text-lg font-black shrink-0">
                        {customCostSheet?.totalLandedOutlay || (priceRaw > 0 ? formatCurrency(totalCost) : 'Available on Custom Quote')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'amenities' && (
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-xs">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-zinc-950">
                      {property.isCommercial ? 'Commercial Infrastructure & Building Ecosystem' : 'Residential Lifestyle & Wellness Ecosystem'}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      World-class amenities maintained to institutional five-star hospitality standards.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
                    {amenitiesList.map((item: any, idx: number) => {
                      const title = typeof item === 'string' ? item : item.title;
                      const desc = typeof item === 'string' ? 'Verified on-site infrastructure & service amenity' : (item.desc || 'Verified on-site infrastructure & service amenity');
                      return (
                        <div key={idx} className="p-3 sm:p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900 mb-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="break-words">{title}</span>
                          </div>
                          <p className="text-[11px] text-zinc-500 leading-snug break-words">{desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'compliance' && (
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-xs">
                  <div className="p-3.5 sm:p-5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-2.5 sm:gap-3">
                    <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-emerald-950">MahaRERA &amp; RPS Legal Title Vetting</h4>
                      <p className="text-[11px] sm:text-xs text-emerald-800 mt-1 leading-relaxed break-words">
                        {legalVettingText}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                    {!hideRera ? (
                      <div className="p-3.5 sm:p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase block">MahaRERA Registration ID</span>
                          <span className="font-mono font-bold text-zinc-900 text-xs sm:text-sm block mt-0.5 break-all">
                            {displayRera || 'Available on Request / In Process'}
                          </span>
                        </div>
                        {displayRera && (
                          <button
                            onClick={handleCopyRera}
                            className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-600 transition cursor-pointer shrink-0"
                            title="Copy RERA ID"
                          >
                            {copiedRera ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="p-3.5 sm:p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase block">MahaRERA Registration</span>
                        <span className="font-semibold text-zinc-700 text-xs block mt-0.5">
                          Verified Mandate &bull; Private Clearance On Request
                        </span>
                      </div>
                    )}

                    <div className="p-3.5 sm:p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">Title Clearance Status</span>
                      <span className="font-bold text-emerald-700 text-xs sm:text-sm block mt-0.5 break-words">
                        {rpsStatus}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STICKY RIGHT COLUMN: PRICE & INSTANT ENQUIRY / VISIT BOOKING */}
            <div className="lg:col-span-4 space-y-5">
              {/* DESKTOP PRICE CARD */}
              <div className="hidden lg:block">
                {renderPriceCard()}
              </div>

              {/* SITE VISIT & ENQUIRY FORM */}
              <div id="visit-booking-section" className="bg-zinc-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xl border border-zinc-800 scroll-mt-24">
                <h3 className="text-lg sm:text-xl font-bold tracking-tight">Schedule Site Visit</h3>

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

                    {property.hideDirectContact === false && (
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
                    )}

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
                      className="w-full mt-2 bg-[#b9974f] hover:bg-[#a4823d] text-zinc-950 font-black py-3.5 rounded-xl transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>{submitting ? 'Scheduling...' : 'Schedule Site Visit'}</span>
                      <ArrowRight className="w-4 h-4 text-zinc-950" />
                    </button>

                    {/* Direct Connect & WhatsApp: Controlled by Admin/Seller */}
                    {property.hideDirectContact === false && (
                      <div className="space-y-4 pt-2 animate-in fade-in duration-200">
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

                        {/* Direct Advisor Desk */}
                        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
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
                    )}
                  </form>
                )}
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
                {hidePrice || isZeroPrice(property.price) ? 'Price on Request' : formatPriceDisplay(property.price)}
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
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-[#b9974f] hover:bg-[#a4823d] text-zinc-950 font-black text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Visit</span>
              </button>

              {property.hideDirectContact === false && (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-3 sm:p-6 select-none animate-in fade-in duration-200">
          {/* Lightbox Header - Responsive for Mobile, Tablet & Desktop */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 text-white pb-2.5 sm:pb-3 border-b border-white/10 shrink-0">
            {/* Top row on mobile: Title + Close Button */}
            <div className="flex items-start justify-between gap-3 min-w-0 flex-1">
              <div className="min-w-0 flex-1">
                {property.developer &&
                  !/anv\b/i.test(property.developer) && (
                    <span className="text-[10px] sm:text-xs text-amber-400 font-bold uppercase tracking-wider block mb-0.5">
                      {property.developer}
                    </span>
                  )}
                <h2 className="text-xs sm:text-base md:text-lg font-bold leading-snug break-words">
                  {property.name}
                </h2>
              </div>

              {/* Close Button on mobile (visible in top-right of mobile header) */}
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="sm:hidden w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center text-sm font-bold transition shrink-0 cursor-pointer"
                title="Close Lightbox"
                aria-label="Close Lightbox"
              >
                ✕
              </button>
            </div>

            {/* Controls: Media Switcher + Desktop Close Button */}
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0">
              {/* Media Switcher inside Lightbox: Toggle between Photos & Video */}
              <div className="flex items-center bg-white/10 backdrop-blur-md p-0.5 sm:p-1 rounded-xl border border-white/15">
                {mediaImages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMediaMode('photos')}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center gap-1 sm:gap-1.5 cursor-pointer ${mediaMode === 'photos'
                      ? 'bg-amber-400 text-black font-extrabold shadow-xs'
                      : 'text-zinc-300 hover:text-white'
                      }`}
                  >
                    <ImageIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Photos ({mediaImages.length})</span>
                  </button>
                )}
                {hasVideo && (
                  <button
                    type="button"
                    onClick={() => setMediaMode('video')}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center gap-1 sm:gap-1.5 cursor-pointer ${mediaMode === 'video'
                      ? 'bg-amber-400 text-black font-extrabold shadow-xs'
                      : 'text-zinc-300 hover:text-white'
                      }`}
                  >
                    <Video className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Video Tour</span>
                  </button>
                )}
              </div>

              {/* Desktop Close Button */}
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="hidden sm:flex w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white items-center justify-center text-sm font-bold transition cursor-pointer"
                title="Close Lightbox"
                aria-label="Close Lightbox"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            {mediaMode === 'video' && hasVideo && activeVideoUrl ? (
              <div className="relative w-full h-full max-w-5xl max-h-[75vh] flex items-center justify-center rounded-2xl overflow-hidden bg-black border border-white/15 shadow-2xl">
                {(() => {
                  if (parsedVideo.type === 'youtube' || parsedVideo.type === 'vimeo') {
                    return (
                      <iframe
                        src={parsedVideo.embedUrl || ''}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        title="Property Video Walkthrough Fullscreen"
                      />
                    );
                  }
                  if (parsedVideo.type === 'direct') {
                    return (
                      <video
                        key={parsedVideo.embedUrl || activeVideoUrl}
                        src={parsedVideo.embedUrl || activeVideoUrl}
                        controls
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                        poster={property.videoThumbnail || mediaImages[0] || (isOpusProperty ? '/opus-thumb.jpg' : undefined)}
                      >
                        Your browser does not support high-definition video playback.
                      </video>
                    );
                  }
                  return (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-950 text-white space-y-3">
                      <Video className="w-12 h-12 text-amber-400" />
                      <p className="text-base font-semibold text-zinc-200">High-Definition Walkthrough Video Available</p>
                      <a
                        href={activeVideoUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#b9974f] hover:bg-[#a4823d] text-zinc-950 text-xs font-black transition shadow-lg"
                      >
                        Open Walkthrough Link ↗
                      </a>
                    </div>
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

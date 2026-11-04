'use client';

import React, { useState, useEffect, useMemo, useDeferredValue, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  CheckCircle,
  ChevronDown,
  User,
  Users,
  Filter,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  Home,
  Grid,
  Scale,
  Building2,
  ShieldCheck,
  RotateCcw,
  Calendar,
  FileText,
  Table,
  Layers,
  Check,
  Lock,
  Phone,
  PhoneCall,
  Sparkles,
  Eye,
  X,
  Briefcase,
  Store,
  Tag,
  Camera,
  Video,
  Expand,
  Maximize2,
  ArrowUpDown
} from 'lucide-react';
import { PropertyCardActions } from '@/components/public/PropertyCardActions';
import { InstantEnquiryModal } from '@/components/public/InstantEnquiryModal';
import { SiteVisitModal } from '@/components/public/SiteVisitModal';
import { BespokePropertyRequirementModal } from '@/components/public/BespokePropertyRequirementModal';
import { SellerLeadCaptureModal } from '@/components/public/SellerLeadCaptureModal';
import { AuthInquiryModal } from '@/components/auth/AuthInquiryModal';
import { PropertyDetailsModal } from '@/components/public/PropertyDetailsModal';
import { PropertyGalleryModal } from '@/components/public/PropertyGalleryModal';
import { getClientSession } from '@/lib/user-auth';
import { getPropertyUrl } from '@/lib/slug';
import { parseQueryCriteria, getPropertyRawPrice, scorePropertyMatch } from '@/lib/property-matching';
import { findMatchingCategorySlug } from '@/lib/categories-data';
import { isUserSeller } from '@/lib/seller-intent';
import { generateSearchSuggestions, detectQueryAutocorrect, SearchSuggestion } from '@/lib/search-autocorrect';

export interface BuyerDemandItem {
  id: string;
  referenceCode: string;
  maskedName: string;
  displayPhone: string;
  displayEmail: string;
  locality: string;
  bhk: string;
  budget: string;
  timeline: string;
  purpose: string;
  requirements: string;
  createdAt: string;
  status: string;
}


export interface PropertyItem {
  id: string;
  slug?: string;
  name: string;
  developer: string;
  locality?: string;
  location: string;
  price: string;
  priceRaw?: number;
  priceSuffix?: string;
  configuration?: string;
  bhk: string;
  bhkNum?: number;
  sqft: string;
  sqftNum?: number;
  status: string;
  description: string;
  image: string;
  images?: string[];
  videoUrl?: string | null;
  videoThumbnail?: string | null;
  tags?: string[];
  reraNumber?: string;
  rpsStatus?: string;
  featured?: boolean;
  label?: string;
  score?: string;
  isCommercial?: boolean;
  listingType?: 'Sale' | 'Rent' | 'Buy' | string;
  businessPurposes?: { id: number; name: string; slug: string }[];
  hideName?: boolean;
  hidePrice?: boolean;
  realName?: string;
}

export interface BlogItem {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  locality?: string;
  connectedTypology?: string;
  connectedProperty?: string;
  readTime?: string;
  author?: string;
}

export interface DynamicFilterOptions {
  localities: string[];
  typologies: { value: string; label: string }[];
  statuses: string[];
  priceRanges: { value: string; label: string }[];
}

export interface HomepageSearchablePortalProps {
  initialProperties: PropertyItem[];
  initialBlogs: BlogItem[];
  initialFilterOptions?: DynamicFilterOptions;
  initialSearchParams?: {
    search?: string;
    locality?: string;
    bhk?: string;
    priceRange?: string;
    status?: string;
    purpose?: string;
    transactionType?: string;
    type?: string;
  };
  isDedicatedSearchPage?: boolean;
}

export function formatPriceDisplay(val: string | number | undefined | null): string {
  if (!val) return 'Price on Request';
  const str = String(val).trim();
  if (str.startsWith('₹') || /cr|lakh|crore/i.test(str)) return str;
  const num = Number(str.replace(/[^0-9.]/g, ''));
  if (isNaN(num) || num <= 0) return str || 'Price on Request';
  if (num >= 10000000) {
    const cr = (num / 10000000).toFixed(2).replace(/\.00$/, '');
    return `₹${cr} Cr`;
  }
  if (num >= 100000) {
    const lk = (num / 100000).toFixed(2).replace(/\.00$/, '');
    return `₹${lk} Lakh`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
}

export function cleanSqft(sqft?: string): string {
  if (!sqft) return '1,200 Sq.Ft.';
  return sqft.replace(/\s*carpet\s*/gi, '').trim();
}

export function getPropertySqftNumber(p: PropertyItem): number {
  if (typeof p.sqftNum === 'number' && !isNaN(p.sqftNum) && p.sqftNum > 0) return p.sqftNum;
  if (!p.sqft) return 0;
  const match = p.sqft.replace(/,/g, '').match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

export function getSortLabel(sort: string): string {
  switch (sort) {
    case 'price_low':
      return 'Price: Low → High';
    case 'price_high':
      return 'Price: High → Low';
    case 'name_asc':
      return 'Building: A → Z';
    case 'name_desc':
      return 'Building: Z → A';
    case 'locality_asc':
      return 'Location: A → Z';
    case 'locality_desc':
      return 'Location: Z → A';
    case 'size_low':
    case 'area_low':
      return 'Area: Low → High';
    case 'size_high':
    case 'area_high':
    case 'size':
      return 'Area: High → Low';
    default:
      return 'Sort By';
  }
}

export const REAL_ESTATE_SEARCH_SUGGESTIONS = [
  { label: '🏢 Commercial Office Spaces', query: 'Commercial Office Space Pune' },
  { label: '🏥 Medical & Hospital Premises', query: 'Hospital' },
  { label: '🏠 3 & 4 BHK Luxury Residences', query: '3 BHK Apartments in Pune' },
  { label: '🛍️ Prime Retail Showrooms', query: 'Retail Showroom' },
  { label: '📈 High-ROI Pre-Leased Assets', query: 'Pre-Leased Commercial' },
  { label: '📍 Baner & Balewadi Properties', query: 'Baner' },
  { label: '📍 Koregaon Park Luxury Homes', query: 'Koregaon Park' }
];

interface PropertyCardProps {
  property: PropertyItem;
  onInstantEnquiry: (p: PropertyItem) => void;
  onQuickView?: (p: PropertyItem) => void;
  onOpenGallery?: (p: PropertyItem, mode?: 'photos' | 'video') => void;
}

const PropertyCard = React.memo(function PropertyCard({
  property,
  onInstantEnquiry,
  onQuickView,
  onOpenGallery
}: PropertyCardProps) {
  return (
    <div
      className="bg-white rounded-3xl shadow-sm border border-zinc-200/90 overflow-hidden flex flex-col hover:shadow-2xl hover:border-amber-400/60 hover:-translate-y-1 transition-all duration-300 group"
    >
      {/* Visual Top Showcase */}
      <div className="relative block w-full h-60 sm:h-64 shrink-0 overflow-hidden bg-zinc-950">
        <Link
          href={getPropertyUrl(property)}
          className="relative block w-full h-full focus:outline-none"
          title={`View details for ${property.name}`}
        >
          <Image
            src={
              property.image ||
              'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            }
            alt={property.name}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />

          {/* Gradient Overlay for Top Badges */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

          {/* TOP BADGES */}
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 z-10">
            {property.isCommercial || property.bhk.includes('Commercial') ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md backdrop-blur-md text-[10px] font-bold shadow-md bg-blue-950/90 text-blue-300 border border-blue-500/40">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Commercial</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md backdrop-blur-md text-[10px] font-bold shadow-md bg-zinc-950/90 text-amber-300 border border-amber-500/40">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Listing</span>
              </div>
            )}

            <span className="px-2.5 py-1 rounded-md bg-zinc-900/90 backdrop-blur-md text-white text-[10px] font-bold shadow-md uppercase tracking-wider">
              {property.status}
            </span>
          </div>
        </Link>

        {/* Gallery & Video Quick Action Pill on Image */}
        {onOpenGallery && (
          <div className="absolute bottom-3.5 right-3.5 z-20 flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenGallery(property, 'photos');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black/95 text-white backdrop-blur-md text-xs font-bold shadow-lg border border-white/20 transition-all hover:scale-105 cursor-pointer"
              title="Open Photo Gallery"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>Gallery</span>
            </button>
            {property.videoUrl && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenGallery(property, 'video');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black shadow-lg transition-all hover:scale-105 cursor-pointer"
                title="Play Walkthrough Video"
              >
                <Video className="w-3.5 h-3.5 text-zinc-950" />
                <span>Video</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* INNER CARD (CARD IN CARD CONTENT ARCHITECTURE) */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        {/* Inner Card Top Row: Title, Location & Price */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-zinc-100">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {property.developer &&
                  !/anv\s*(signature\s*partner|verified\s*developer|partner\s*developer)/i.test(property.developer) && (
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${property.isCommercial || property.bhk.includes('Commercial')
                          ? 'text-blue-950 bg-blue-50 border-blue-200/60'
                          : 'text-amber-800 bg-amber-50 border-amber-200/60'
                        }`}
                    >
                      {property.developer}
                    </span>
                  )}
                <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-600" />
                  <span>{property.location}</span>
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight break-words whitespace-normal">
                <Link
                  href={getPropertyUrl(property)}
                  className="hover:text-amber-800 transition-colors block w-full"
                >
                  <span className="flex items-center gap-2 flex-wrap">
                    <span>{property.name}</span>
                    {property.hideName && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        Confidential
                      </span>
                    )}
                  </span>
                </Link>
              </h3>
            </div>

            {/* Prominent Price Box */}
            <div className="text-left sm:text-right shrink-0 bg-amber-50/50 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
              <div className="text-2xl font-black text-zinc-950 tracking-tight">
                {formatPriceDisplay(property.price)}
              </div>
              <div className="text-[10px] text-zinc-500 font-semibold mt-0.5 flex items-center sm:justify-end">
                <span>{property.priceSuffix || 'All Inclusive'}</span>
              </div>
            </div>
          </div>

          {/* INNER SPECIFICATION CARD (Card in Card Grid) */}
          <div className="grid grid-cols-3 gap-2.5 my-3.5 p-3.5 bg-zinc-50/80 rounded-2xl border border-zinc-200/70 text-xs">
            {/* 1. Typology */}
            <div>
              <span className="text-[10px] font-bold uppercase text-zinc-400 block tracking-wider">
                Configuration
              </span>
              <span
                className={`font-extrabold mt-0.5 block truncate ${property.isCommercial || property.bhk.includes('Commercial')
                    ? 'text-blue-950 font-black'
                    : 'text-zinc-900'
                  }`}
              >
                {property.bhk}
              </span>
            </div>

            {/* 2. Carpet Area */}
            <div>
              <span className="text-[10px] font-bold uppercase text-zinc-400 block tracking-wider">
                Carpet Area
              </span>
              <span className="font-extrabold text-zinc-900 mt-0.5 block">
                {cleanSqft(property.sqft)}
              </span>
            </div>

            {/* 3. Possession / Status */}
            <div>
              <span className="text-[10px] font-bold uppercase text-zinc-400 block tracking-wider">
                Status
              </span>
              <span className="font-extrabold text-zinc-900 mt-0.5 block">
                {property.status}
              </span>
            </div>
          </div>

          {/* ABOUT THIS PROPERTY PARAGRAPH */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              About This Property:
            </span>
            <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">
              {property.description}
            </p>
          </div>

          {/* Verified Specs Pills */}
          <div className="flex flex-wrap gap-1.5 pt-3">
            {property.businessPurposes && property.businessPurposes.length > 0 && (
              <span className="text-[11px] font-bold text-amber-950 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                <Briefcase className="w-3 h-3 text-amber-600" />
                <span>
                  Suitable: {property.businessPurposes.slice(0, 2).map((bp) => bp.name).join(', ')}
                  {property.businessPurposes.length > 2 ? ` +${property.businessPurposes.length - 2}` : ''}
                </span>
              </span>
            )}
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Verified Direct Listing</span>
            </span>
            {(property.tags && property.tags.length > 0 ? property.tags : ['Vastu Compliant', 'Prime Location'])
              .filter((tag) => !/rps|rera/i.test(tag))
              .map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-semibold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200 flex items-center gap-1"
                >
                  <span>{tag}</span>
                </span>
              ))}
          </div>
        </div>

        {/* Bottom Action Strip: Responsive Action Buttons */}
        <div className="pt-4 border-t border-zinc-100">
          <PropertyCardActions
            property={property}
            onInstantEnquiry={onInstantEnquiry}
          />
        </div>
      </div>
    </div>
  );
});

export function HomepageSearchablePortal({
  initialProperties,
  initialBlogs,
  initialFilterOptions,
  initialSearchParams,
  isDedicatedSearchPage = false
}: HomepageSearchablePortalProps) {
  const router = useRouter();

  // Main Search & Filter States
  const [searchQuery, setSearchQuery] = useState(initialSearchParams?.search || '');
  const [catalogueSearch, setCatalogueSearch] = useState(initialSearchParams?.search || '');
  // Debounced search query for 60+ FPS zero-latency typing
  const [activeFilterQuery, setActiveFilterQuery] = useState(initialSearchParams?.search || '');
  const [selectedLocality, setSelectedLocality] = useState(initialSearchParams?.locality || 'All');
  const [selectedBhk, setSelectedBhk] = useState(
    initialSearchParams?.bhk && initialSearchParams.bhk !== 'All'
      ? initialSearchParams.bhk
      : (initialSearchParams?.type || 'All')
  );
  const [selectedPriceRange, setSelectedPriceRange] = useState(initialSearchParams?.priceRange || 'All');
  const [selectedStatus, setSelectedStatus] = useState(initialSearchParams?.status || 'All');
  const [selectedPurpose, setSelectedPurpose] = useState<string>(initialSearchParams?.purpose || 'All');
  const [selectedTransactionType, setSelectedTransactionType] = useState<string>(initialSearchParams?.transactionType || 'All');
  const [selectedDeveloper, setSelectedDeveloper] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('price_low');

  // Autofill & Autocorrect Searchbar States
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const [isSearchSuggestionsOpen, setIsSearchSuggestionsOpen] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounce the heavy property filtering by 150ms so typing never lags
  useEffect(() => {
    const raw = (catalogueSearch || searchQuery || '').trim();
    const timer = setTimeout(() => {
      setActiveFilterQuery(raw);
      if (raw.length >= 3) {
        if (isUserSeller(raw)) {
          setActiveResultTab('buyer_leads');
        } else {
          setActiveResultTab('properties');
        }
      } else {
        setActiveResultTab('properties');
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, catalogueSearch]);

  const deferredQuery = useDeferredValue(activeFilterQuery);

  const handleInstantEnquiry = useCallback((p: PropertyItem) => {
    setSelectedPropertyForEnquiry(p);
    setConsultationModalOpen(true);
  }, []);

  // Dynamic Filter Options state (initialized from server & syncs automatically with database)
  const [filterOptions, setFilterOptions] = useState<DynamicFilterOptions>(() => {
    return (
      initialFilterOptions || {
        localities: [
          'Koregaon Park',
          'Baner',
          'Balewadi',
          'Kalyani Nagar',
          'Bavdhan',
          'Mahalunge',
          'Shivajinagar',
          'Kharadi',
          'Hinjewadi',
          'Wakad',
          'Talawade',
          'Gultekadi',
          'Undri',
          'Viman Nagar'
        ],
        typologies: [
          { value: 'Office in IT Park', label: 'Office in IT Park' },
          { value: 'Commercial Office', label: 'Commercial Office Space' },
          { value: 'Hospital / Healthcare', label: 'Hospital / Healthcare' },
          { value: '1 BHK', label: '1 BHK' },
          { value: '2 BHK', label: '2 BHK' },
          { value: '3 BHK', label: '3 BHK' },
          { value: '4 BHK', label: '4 BHK' },
          { value: '4.5+ BHK Penthouse', label: '4.5+ BHK Penthouse' }
        ],
        statuses: ['Ready to Move', 'Under-Construction', 'Newly Launched'],
        priceRanges: [
          { value: 'Under ₹1.5 Cr', label: 'Under ₹1.5 Cr' },
          { value: '₹1.5 Cr - ₹2.5 Cr', label: '₹1.5 Cr - ₹2.5 Cr' },
          { value: '₹2.5 Cr - ₹4.0 Cr', label: '₹2.5 Cr - ₹4.0 Cr' },
          { value: '₹4.0 Cr+', label: '₹4.0 Cr+ (Ultra-Luxury)' }
        ]
      }
    );
  });

  // Automatically refresh dynamic filter options from backend API so options increase as products/admin add items
  useEffect(() => {
    fetch('/api/filter-options')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFilterOptions((prev) => ({
            localities: Array.from(new Set([...prev.localities, ...(data.localities || [])])),
            typologies: data.typologies || prev.typologies,
            statuses: Array.from(new Set([...prev.statuses, ...(data.statuses || [])])),
            priceRanges: data.priceRanges || prev.priceRanges
          }));
        }
      })
      .catch((err) => console.log('Filter options fetch fallback:', err));

    // Preload verified active buyer demands so seller matchmaking is instantaneous
    fetch('/api/buyer-demands')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.demands)) {
          setBuyerDemands(data.demands);
        }
      })
      .catch(() => { });
  }, []);

  const [properties, setProperties] = useState<PropertyItem[]>(() => {
    return initialProperties || [];
  });

  const [blogs, setBlogs] = useState<BlogItem[]>(initialBlogs || []);
  const [blogCategory, setBlogCategory] = useState('All');
  const [showAllBlogs, setShowAllBlogs] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Tab State: Properties vs Active Registered Buyer Demands
  const [activeResultTab, setActiveResultTab] = useState<'properties' | 'buyer_leads'>(() => {
    const initQ = (initialSearchParams?.search || '').trim();
    if (initQ && isUserSeller(initQ)) {
      return 'buyer_leads';
    }
    return 'properties';
  });
  const [buyerDemands, setBuyerDemands] = useState<BuyerDemandItem[]>([]);
  const [catalogueBuyerFilter, setCatalogueBuyerFilter] = useState('');
  const deferredBuyerFilter = useDeferredValue(catalogueBuyerFilter);
  const [buyerSortBy, setBuyerSortBy] = useState<string>('relevance');
  const [buyerBhkFilter, setBuyerBhkFilter] = useState<string>('All');
  const [buyerLocalityFilter, setBuyerLocalityFilter] = useState<string>('All');
  const [showAllBuyerComparison, setShowAllBuyerComparison] = useState(false);
  const [showAllBuyerCards, setShowAllBuyerCards] = useState(false);

  const filteredCatalogueBuyerDemands = useMemo(() => {
    let list = buyerDemands;

    if (buyerBhkFilter && buyerBhkFilter !== 'All') {
      const bLower = buyerBhkFilter.toLowerCase();
      list = list.filter((demand) => {
        const text = `${demand.bhk} ${demand.requirements} ${demand.purpose}`.toLowerCase();
        if (bLower.includes('it park') || bLower.includes('tech park')) {
          return text.includes('it park') || text.includes('tech park') || text.includes('commercial') || text.includes('office');
        }
        if (bLower.includes('commercial') || bLower.includes('office')) {
          return text.includes('commercial') || text.includes('office') || text.includes('workspace');
        }
        if (bLower.includes('hospital') || bLower.includes('medical') || bLower.includes('healthcare')) {
          return text.includes('hospital') || text.includes('medical') || text.includes('clinic');
        }
        if (bLower.includes('shop') || bLower.includes('showroom') || bLower.includes('retail')) {
          return text.includes('shop') || text.includes('showroom') || text.includes('retail') || text.includes('store');
        }
        if (bLower.includes('industrial') || bLower.includes('warehouse') || bLower.includes('factory')) {
          return text.includes('industrial') || text.includes('warehouse') || text.includes('factory') || text.includes('godown');
        }
        const digit = bLower.match(/\d+/)?.[0];
        if (digit) {
          return text.includes(`${digit} bhk`) || text.includes(`${digit}bhk`) || text.includes(`${digit} &`) || text.includes(`& ${digit}`);
        }
        return text.includes(bLower);
      });
    }

    if (buyerLocalityFilter && buyerLocalityFilter !== 'All') {
      const locLower = buyerLocalityFilter.toLowerCase();
      list = list.filter((demand) => {
        const text = `${demand.locality} ${demand.requirements}`.toLowerCase();
        return text.includes(locLower);
      });
    }

    const rawSearchInput = (catalogueBuyerFilter || deferredQuery).trim();
    if (!rawSearchInput) return list;

    const isSeller = isUserSeller(rawSearchInput);
    const SELLER_STOP_WORDS = new Set([
      'i', 'want', 'a', 'an', 'the', 'buyer', 'buyers', 'for', 'my', 'me', 'we', 'our',
      'property', 'properties', 'sell', 'selling', 'seller', 'sellers', 'need', 'needs',
      'find', 'get', 'looking', 'look', 'seeking', 'seek', 'require', 'required', 'leads',
      'lead', 'clients', 'client', 'to', 'in', 'at', 'with', 'and', 'or', 'is', 'am', 'are',
      'please', 'show', 'give', 'help', 'connect', 'interested', 'available', 'have'
    ]);

    const words = rawSearchInput.toLowerCase().split(/\s+/).filter(Boolean);
    const meaningfulTokens = isSeller
      ? words.filter((w) => !SELLER_STOP_WORDS.has(w))
      : words;

    // For a general seller query like "i want a buyer for my property", meaningfulTokens will be empty.
    // Return all verified active buyers!
    if (meaningfulTokens.length === 0) {
      return list;
    }

    const parsed = parseQueryCriteria(rawSearchInput);
    const isMulti = parsed.isMultiCategory || (parsed.typologyIntents && parsed.typologyIntents.length > 1) || (parsed.bhkNums && parsed.bhkNums.length > 1) || /\b(?:and|or|,|\/|both)\b/i.test(rawSearchInput);

    return list.filter((demand) => {
      const haystack = `${demand.referenceCode} ${demand.maskedName} ${demand.locality} ${demand.bhk} ${demand.budget} ${demand.requirements || ''} ${demand.purpose || ''}`.toLowerCase();
      return isMulti
        ? meaningfulTokens.some((t) => haystack.includes(t))
        : meaningfulTokens.every((t) => haystack.includes(t));
    });
  }, [deferredQuery, buyerDemands, catalogueBuyerFilter, buyerBhkFilter, buyerLocalityFilter]);

  const sortedBuyerDemands = useMemo(() => {
    const list = [...filteredCatalogueBuyerDemands];
    if (buyerSortBy === 'locality_asc') {
      list.sort((a, b) => a.locality.localeCompare(b.locality));
    } else if (buyerSortBy === 'locality_desc') {
      list.sort((a, b) => b.locality.localeCompare(a.locality));
    } else if (buyerSortBy === 'bhk_asc' || buyerSortBy === 'typography_asc') {
      list.sort((a, b) => a.bhk.localeCompare(b.bhk, undefined, { numeric: true, sensitivity: 'base' }));
    } else if (buyerSortBy === 'bhk_desc' || buyerSortBy === 'typography_desc') {
      list.sort((a, b) => b.bhk.localeCompare(a.bhk, undefined, { numeric: true, sensitivity: 'base' }));
    }
    return list;
  }, [filteredCatalogueBuyerDemands, buyerSortBy]);

  const displayedComparisonBuyers = useMemo(() => {
    if (showAllBuyerComparison) return sortedBuyerDemands;
    return sortedBuyerDemands.slice(0, 5);
  }, [sortedBuyerDemands, showAllBuyerComparison]);

  const displayedCardBuyers = useMemo(() => {
    if (showAllBuyerCards) return sortedBuyerDemands;
    return sortedBuyerDemands.slice(0, 3);
  }, [sortedBuyerDemands, showAllBuyerCards]);

  // Modal & Toast States
  const [sellerModalOpen, setSellerModalOpen] = useState(false);
  const [selectedBuyerRefForConnect, setSelectedBuyerRefForConnect] = useState<string | undefined>(undefined);
  const [selectedBuyerSummaryForConnect, setSelectedBuyerSummaryForConnect] = useState<string | undefined>(undefined);
  const [consultationModalOpen, setConsultationModalOpen] = useState(false);
  const [requirementModalOpen, setRequirementModalOpen] = useState(false);
  const [blogAuthModalOpen, setBlogAuthModalOpen] = useState(false);
  const [targetBlogForAuth, setTargetBlogForAuth] = useState<BlogItem | null>(null);
  const [siteVisitModalOpen, setSiteVisitModalOpen] = useState(false);
  const [selectedPropertyForSiteVisit, setSelectedPropertyForSiteVisit] = useState<PropertyItem | null>(null);
  const [selectedPropertyForEnquiry, setSelectedPropertyForEnquiry] = useState<PropertyItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showBackToSearch, setShowBackToSearch] = useState(false);

  // Table Header Dropdown States
  const [activeHeaderDropdown, setActiveHeaderDropdown] = useState<'developer' | 'locality' | 'typography' | 'price' | 'status' | 'sort' | 'sort_cards' | 'buyer_locality' | 'buyer_typography' | null>(null);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerDropdownRef = useRef<HTMLDivElement>(null);
  const [expandedSortCategory, setExpandedSortCategory] = useState<'price' | 'name' | 'location' | 'area' | null>(null);

  useEffect(() => {
    if (!activeHeaderDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (headerDropdownRef.current && !headerDropdownRef.current.contains(e.target as Node)) {
        setActiveHeaderDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveHeaderDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeHeaderDropdown]);

  // Property Details Specs Modal & Table Hover Card States
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDetailsProperty, setSelectedDetailsProperty] = useState<PropertyItem | null>(null);

  // Property Photo & Video Gallery Modal States
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [selectedPropertyForGallery, setSelectedPropertyForGallery] = useState<PropertyItem | null>(null);
  const [galleryInitialMode, setGalleryInitialMode] = useState<'photos' | 'video'>('photos');

  const openPropertyGallery = (p: PropertyItem, mode: 'photos' | 'video' = 'photos') => {
    setSelectedPropertyForGallery(p);
    setGalleryInitialMode(mode);
    setGalleryModalOpen(true);
    setHoveredTableProperty(null);
  };
  const [hoveredTableProperty, setHoveredTableProperty] = useState<{
    property: PropertyItem;
    x: number;
    y: number;
  } | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTablePropertyHover = (e: React.MouseEvent<HTMLElement>, property: PropertyItem) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    const cellEl = e.currentTarget;
    const cellRect = cellEl.getBoundingClientRect();

    const cardWidth = 350;
    const estimatedCardHeight = 410;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const topMargin = 75; // Stay safely below sticky navbar and header
    const bottomMargin = 20; // Safe clearance above viewport bottom edge

    // Anchor card directly next to the Property & Developer cell (first column)
    let left = cellRect.right + 12;
    if (left + cardWidth > viewportWidth - 16) {
      left = Math.max(16, viewportWidth - cardWidth - 16);
    }

    // Align card top cleanly with the top of the hovered cell
    let top = cellRect.top;
    if (top + estimatedCardHeight > viewportHeight - bottomMargin) {
      top = viewportHeight - estimatedCardHeight - bottomMargin;
    }
    if (top < topMargin) {
      top = topMargin;
    }

    setHoveredTableProperty({
      property,
      x: left,
      y: top
    });
  };

  const handleTablePropertyLeave = () => {
    hoverTimerRef.current = setTimeout(() => {
      setHoveredTableProperty(null);
    }, 220);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        setShowBackToSearch(window.scrollY > 300);
        setHoveredTableProperty(null);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Open Full Blog: Enforces login before opening
  const handleOpenFullBlog = (article: BlogItem) => {
    const session = getClientSession();
    if (!session) {
      setTargetBlogForAuth(article);
      setBlogAuthModalOpen(true);
      showToast('Patron login is required to view full editorial articles.');
    } else {
      router.push(`/blogs/${encodeURIComponent(article.id)}`);
    }
  };

  // 1. Available Localities: dynamically increases as per products & locations in database
  const availableLocalities = useMemo(() => {
    const set = new Set<string>(filterOptions.localities);
    (initialProperties || []).forEach((p) => {
      if (p.locality?.trim()) set.add(p.locality.trim());
      else if (p.location) {
        const first = p.location.split(',')[0].trim();
        if (first && first.length >= 3) set.add(first);
      }
    });
    (properties || []).forEach((p) => {
      if (p.locality?.trim()) set.add(p.locality.trim());
      else if (p.location) {
        const first = p.location.split(',')[0].trim();
        if (first && first.length >= 3) set.add(first);
      }
    });
    (buyerDemands || []).forEach((d) => {
      if (d.locality?.trim()) {
        const parts = d.locality.split(/[/,]/);
        parts.forEach((part) => {
          const t = part.trim();
          if (t && t.length >= 3 && !t.toLowerCase().includes('corridor') && !t.toLowerCase().includes('pune')) {
            set.add(t);
          }
        });
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [filterOptions.localities, initialProperties, properties, buyerDemands]);

  // 2. Available Typologies: dynamically increases as per products & property types in database
  const availableTypologies = useMemo(() => {
    const list = [...filterOptions.typologies];
    const seen = new Set(list.map((t) => t.value.toLowerCase()));

    const checkAndAdd = (bhkVal?: string) => {
      if (!bhkVal) return;
      const trimmed = bhkVal.trim();
      const lower = trimmed.toLowerCase();
      if (!seen.has(lower) && trimmed !== 'All') {
        seen.add(lower);
        list.push({ value: trimmed, label: trimmed });
      }
    };

    (initialProperties || []).forEach((p) => {
      checkAndAdd(p.bhk);
      checkAndAdd(p.configuration);
    });
    (properties || []).forEach((p) => {
      checkAndAdd(p.bhk);
      checkAndAdd(p.configuration);
    });

    return list;
  }, [filterOptions.typologies, initialProperties, properties]);

  const otherTypologies = useMemo(() => {
    const standardKeys = new Set([
      'all',
      '1 bhk', '2 bhk', '3 bhk', '4 bhk', '4.5+ bhk penthouse',
      'residential apartment', 'residential bunglow', 'residential bungalow',
      'office in it park', 'commercial office', 'commercial office space', 'office space',
      'shop/showroom', 'shop', 'showroom', 'preleased properties', 'restaurant',
      'hospital', 'hospital / healthcare', 'industrial factory', 'warehouse', 'plot/land', 'land/plot'
    ]);
    return availableTypologies
      .filter((t) => !standardKeys.has(t.value.toLowerCase().trim()))
      .sort((a, b) => (a.label || a.value).localeCompare(b.label || b.value));
  }, [availableTypologies]);

  const standardTypologies = useMemo(
    () => [
      { label: '1 BHK', value: '1 BHK', group: 'Residential' },
      { label: '2 BHK', value: '2 BHK', group: 'Residential' },
      { label: '3 BHK', value: '3 BHK', group: 'Residential' },
      { label: '4 BHK', value: '4 BHK', group: 'Residential' },
      { label: '4.5+ BHK Penthouse', value: '4.5+ BHK Penthouse', group: 'Residential' },
      { label: 'Residential Apartment', value: 'Residential Apartment', group: 'Residential' },
      { label: 'Residential Bungalow / Villa', value: 'Residential Bunglow', group: 'Residential' },
      { label: 'Office in IT Park', value: 'Office in IT Park', group: 'Commercial' },
      { label: 'Commercial Office Space', value: 'Commercial Office', group: 'Commercial' },
      { label: 'Shop / Showroom', value: 'Shop/Showroom', group: 'Commercial' },
      { label: 'Preleased Properties', value: 'Preleased Properties', group: 'Commercial' },
      { label: 'Restaurant / F&B', value: 'Restaurant', group: 'Commercial' },
      { label: 'Hospital / Healthcare', value: 'Hospital / Healthcare', group: 'Specialized' },
      { label: 'Industrial Factory', value: 'Industrial Factory', group: 'Specialized' },
      { label: 'Warehouse / Logistics', value: 'Warehouse', group: 'Specialized' },
      { label: 'Land / Plot', value: 'Plot/Land', group: 'Specialized' }
    ],
    []
  );

  const allTypologyList = useMemo(() => {
    const list = [...standardTypologies];
    otherTypologies.forEach((t) => {
      if (!list.some((item) => item.value.toLowerCase() === t.value.toLowerCase())) {
        list.push({ label: t.label || t.value, value: t.value, group: 'Catalog Typologies' });
      }
    });
    return list;
  }, [standardTypologies, otherTypologies]);

  const filteredHeaderLocalities = useMemo(() => {
    const list = availableLocalities.filter((loc) => loc !== 'All');
    if (!headerSearchQuery.trim()) return list;
    const q = headerSearchQuery.toLowerCase().trim();
    return list.filter((loc) => loc.toLowerCase().includes(q));
  }, [availableLocalities, headerSearchQuery]);

  const filteredHeaderTypologies = useMemo(() => {
    if (!headerSearchQuery.trim()) return allTypologyList;
    const q = headerSearchQuery.toLowerCase().trim();
    return allTypologyList.filter(
      (t) => t.label.toLowerCase().includes(q) || t.value.toLowerCase().includes(q) || (t.group && t.group.toLowerCase().includes(q))
    );
  }, [allTypologyList, headerSearchQuery]);

  const availableDevelopers = useMemo(() => {
    const set = new Set<string>();
    (initialProperties || []).forEach((p) => {
      if (p.developer?.trim() && !/anv\s*(signature\s*partner|verified\s*developer|partner\s*developer)/i.test(p.developer)) {
        set.add(p.developer.trim());
      }
    });
    (properties || []).forEach((p) => {
      if (p.developer?.trim() && !/anv\s*(signature\s*partner|verified\s*developer|partner\s*developer)/i.test(p.developer)) {
        set.add(p.developer.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [initialProperties, properties]);

  const filteredHeaderDevelopers = useMemo(() => {
    if (!headerSearchQuery.trim()) return availableDevelopers;
    const q = headerSearchQuery.toLowerCase().trim();
    return availableDevelopers.filter((dev) => dev.toLowerCase().includes(q));
  }, [availableDevelopers, headerSearchQuery]);

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live Autofill Suggestions & Typo Autocorrect calculation
  useEffect(() => {
    const q = (catalogueSearch || '').trim();
    if (q.length < 2) {
      setSearchSuggestions([]);
      setDidYouMean(null);
      setIsSearchSuggestionsOpen(false);
      setSelectedSuggestionIndex(-1);
      return;
    }

    // 1. Instant 0ms local in-memory calculation (Localities, Typologies, Developers, Properties)
    const localRes = generateSearchSuggestions(q, {
      properties: (properties || []).map((p) => ({
        id: p.id,
        name: p.name,
        locality: p.locality || p.location,
        developer: p.developer,
        bhk: p.configuration || p.bhk
      })),
      localities: availableLocalities,
      developers: availableDevelopers,
      limit: 6
    });

    setSearchSuggestions(localRes.suggestions);
    setDidYouMean(localRes.didYouMean);
    setIsSearchSuggestionsOpen(localRes.suggestions.length > 0 || !!localRes.didYouMean);
    setSelectedSuggestionIndex(-1);

    // 2. Fetch server-side suggestions for comprehensive database matching
    const timer = setTimeout(() => {
      fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.suggestions)) {
            setSearchSuggestions((prev) => {
              const map = new Map<string, SearchSuggestion>();
              data.suggestions.forEach((s: SearchSuggestion) => map.set(`${s.type}:${s.value.toLowerCase()}`, s));
              prev.forEach((s) => {
                if (!map.has(`${s.type}:${s.value.toLowerCase()}`)) {
                  map.set(`${s.type}:${s.value.toLowerCase()}`, s);
                }
              });
              return Array.from(map.values()).slice(0, 8);
            });
            if (data.didYouMean) {
              setDidYouMean(data.didYouMean);
            }
          }
        })
        .catch(() => {});
    }, 150);

    return () => clearTimeout(timer);
  }, [catalogueSearch, properties, availableLocalities, availableDevelopers]);

  const applySuggestion = (s: SearchSuggestion) => {
    setCatalogueSearch(s.value);
    setSearchQuery(s.value);
    setActiveFilterQuery(s.value);
    setIsSearchSuggestionsOpen(false);
    setSelectedSuggestionIndex(-1);

    if (s.type === 'location') {
      setSelectedLocality(s.value);
    } else if (s.type === 'developer') {
      setSelectedDeveloper(s.value);
    } else if (s.type === 'typology') {
      setSelectedBhk(s.value);
    }
  };

  const applyCorrection = (correctedText: string) => {
    setCatalogueSearch(correctedText);
    setSearchQuery(correctedText);
    setActiveFilterQuery(correctedText);
    setDidYouMean(null);
    setIsSearchSuggestionsOpen(false);
    setSelectedSuggestionIndex(-1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isSearchSuggestionsOpen || searchSuggestions.length === 0) {
        setIsSearchSuggestionsOpen(true);
        return;
      }
      setSelectedSuggestionIndex((prev) => (prev + 1 >= searchSuggestions.length ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isSearchSuggestionsOpen || searchSuggestions.length === 0) return;
      setSelectedSuggestionIndex((prev) => (prev - 1 < 0 ? searchSuggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      if (isSearchSuggestionsOpen && selectedSuggestionIndex >= 0 && selectedSuggestionIndex < searchSuggestions.length) {
        e.preventDefault();
        applySuggestion(searchSuggestions[selectedSuggestionIndex]);
      } else {
        setIsSearchSuggestionsOpen(false);
        executeSearch();
      }
    } else if (e.key === 'Tab') {
      if (didYouMean && (!searchSuggestions.length || selectedSuggestionIndex === -1)) {
        e.preventDefault();
        applyCorrection(didYouMean);
      } else if (isSearchSuggestionsOpen && selectedSuggestionIndex >= 0 && selectedSuggestionIndex < searchSuggestions.length) {
        e.preventDefault();
        applySuggestion(searchSuggestions[selectedSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsSearchSuggestionsOpen(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  // 3. Available Statuses: dynamically increases as per products in database
  const availableStatuses = useMemo(() => {
    const set = new Set<string>(filterOptions.statuses);
    (initialProperties || []).forEach((p) => {
      if (p.status?.trim() && p.status !== 'Draft' && p.status !== 'Published') {
        set.add(p.status.trim());
      }
    });
    (properties || []).forEach((p) => {
      if (p.status?.trim() && p.status !== 'Draft' && p.status !== 'Published') {
        set.add(p.status.trim());
      }
    });
    return Array.from(set);
  }, [filterOptions.statuses, initialProperties, properties]);

  const availablePriceRanges = filterOptions.priceRanges;

  // Client-Side Filtering Algorithm
  const filterClientSide = (
    qSearch: string,
    qLocality: string,
    qBhk: string,
    qPrice: string,
    qStatus: string,
    qPurpose?: string,
    qTransactionType?: string
  ): PropertyItem[] => {
    let list = [...(initialProperties && initialProperties.length > 0 ? initialProperties : properties)];

    const criteria = parseQueryCriteria(qSearch);
    const isMultiCat = criteria.isMultiCategory || (criteria.typologyIntents && criteria.typologyIntents.length > 1) || (criteria.bhkNums && criteria.bhkNums.length > 1);

    if (qLocality && qLocality !== 'All' && (!criteria.locality || criteria.locality === 'All')) {
      criteria.locality = qLocality.toLowerCase();
      criteria.isExplicitLocality = true;
    }
    if (!isMultiCat && qBhk && qBhk !== 'All') {
      const isPenthouseOption = qBhk.toLowerCase().includes('penthouse');
      if (!isPenthouseOption) {
        const d = qBhk.match(/\d+(?:\.5)?/)?.[0];
        if (d) criteria.bhkNum = parseFloat(d);
      }
      const bLower = qBhk.toLowerCase().trim();
      if (bLower.includes('it park') || bLower.includes('tech park')) {
        criteria.typologyIntent = 'commercial_office';
      } else if (bLower.includes('hospital') || bLower.includes('medical') || bLower.includes('healthcare') || bLower.includes('clinic')) {
        criteria.typologyIntent = 'healthcare_hospital';
      } else if (bLower.includes('shop') || bLower.includes('showroom') || bLower.includes('retail') || bLower.includes('store') || bLower.includes('boutique')) {
        criteria.typologyIntent = 'commercial_showroom';
      } else if (bLower.includes('industrial') || bLower.includes('factory') || bLower.includes('warehouse') || bLower.includes('godown') || bLower.includes('shed')) {
        criteria.typologyIntent = 'industrial';
      } else if (bLower.includes('plot') || bLower.includes('land')) {
        criteria.typologyIntent = 'land_plot';
      } else if (bLower.includes('prelease') || bLower.includes('pre-lease') || bLower.includes('preleased') || bLower.includes('pre-rented')) {
        criteria.typologyIntent = 'preleased';
      } else if (bLower.includes('office') || bLower.includes('commercial office') || bLower.includes('coworking')) {
        criteria.typologyIntent = 'commercial_office';
      } else if (bLower.includes('bhk') || bLower.includes('apartment') || bLower.includes('flat') || bLower.includes('penthouse') || bLower.includes('villa') || bLower.includes('bungalow') || bLower.includes('bunglow')) {
        criteria.typologyIntent = 'residential';
      }
      criteria.hasSpecificIntent = true;
    }

    if (criteria.hasSpecificIntent || qSearch.trim() || (qLocality && qLocality !== 'All') || (!isMultiCat && qBhk && qBhk !== 'All')) {
      const qTokens = qSearch.toLowerCase().trim().split(/\s+/).filter(Boolean);
      list = list
        .map((p) => ({ p, score: scorePropertyMatch(p, criteria) }))
        .filter((item) => {
          if (item.score <= 0) return false;
          if (qTokens.length > 0 && !criteria.locality && !criteria.bhkNum && (!criteria.bhkNums || criteria.bhkNums.length === 0)) {
            const bpText = (item.p.businessPurposes || []).map((bp) => `${bp.name} ${bp.slug}`).join(' ');
            const typeName = (item.p as any).type_name || item.p.label || '';
            const text = `${item.p.name || ''} ${item.p.developer || ''} ${item.p.locality || ''} ${item.p.location || ''} ${item.p.description || ''} ${item.p.bhk || ''} ${item.p.configuration || ''} ${typeName} ${bpText}`.toLowerCase().replace(/[\/\\_-]+/g, ' ');
            const someMatch = qTokens.some((t) => text.includes(t));
            if (!someMatch) return false;
          }
          const price = getPropertyRawPrice(item.p);
          if (price > 0) {
            if (criteria.maxBudget && price > criteria.maxBudget) return false;
            if (criteria.minBudget && price < criteria.minBudget) return false;
          }
          return true;
        })
        .sort((a, b) => b.score - a.score)
        .map((item) => item.p);
    }

    // Direct Typography / Configuration exact filtering (only applied when NOT a multi-category search)
    if (!isMultiCat && qBhk && qBhk !== 'All') {
      const lower = qBhk.toLowerCase().trim();
      if (lower.includes('it park') || lower.includes('tech park')) {
        list = list.filter((p) => {
          const full = `${p.configuration || ''} ${p.bhk || ''} ${p.name || ''} ${p.description || ''}`.toLowerCase();
          return full.includes('it park') || full.includes('tech park');
        });
      } else if (lower.includes('hospital') || lower.includes('medical') || lower.includes('healthcare') || lower.includes('clinic')) {
        list = list.filter((p) => {
          const full = `${p.configuration || ''} ${p.bhk || ''} ${p.name || ''} ${p.description || ''}`.toLowerCase();
          return full.includes('hospital') || full.includes('medical') || full.includes('clinic') || full.includes('healthcare');
        });
      } else if (lower.includes('shop') || lower.includes('showroom') || lower.includes('retail') || lower.includes('store') || lower.includes('boutique')) {
        list = list.filter((p) => {
          const full = `${p.configuration || ''} ${p.bhk || ''} ${p.name || ''} ${p.description || ''}`.toLowerCase();
          return (
            full.includes('shop') ||
            full.includes('showroom') ||
            full.includes('retail') ||
            full.includes('store') ||
            full.includes('boutique') ||
            (p.isCommercial && (p.configuration?.toLowerCase().includes('shop') || p.bhk?.toLowerCase().includes('shop')))
          );
        });
      } else if (lower.includes('industrial') || lower.includes('factory') || lower.includes('warehouse') || lower.includes('godown') || lower.includes('shed') || lower.includes('manufacturing')) {
        list = list.filter((p) => {
          const full = `${p.configuration || ''} ${p.bhk || ''} ${p.name || ''} ${p.description || ''}`.toLowerCase();
          return (
            full.includes('industrial') ||
            full.includes('factory') ||
            full.includes('warehouse') ||
            full.includes('godown') ||
            full.includes('shed') ||
            full.includes('manufacturing')
          );
        });
      } else if (lower.includes('office') || lower.includes('commercial office') || lower.includes('coworking')) {
        list = list.filter((p) => {
          const full = `${p.configuration || ''} ${p.bhk || ''} ${p.name || ''} ${p.description || ''}`.toLowerCase();
          return (
            full.includes('office') ||
            full.includes('commercial office') ||
            full.includes('coworking') ||
            (p.isCommercial &&
              !full.includes('shop') &&
              !full.includes('showroom') &&
              !full.includes('industrial') &&
              !full.includes('factory') &&
              !full.includes('warehouse') &&
              !full.includes('hospital'))
          );
        });
      } else if (lower.includes('penthouse')) {
        list = list.filter((p) => {
          const full = `${p.configuration || ''} ${p.bhk || ''} ${p.name || ''}`.toLowerCase();
          return full.includes('penthouse') || full.includes('sky suite');
        });
      } else if (lower.includes('villa') || lower.includes('bungalow') || lower.includes('bunglow') || lower.includes('row house')) {
        list = list.filter((p) => {
          const full = `${p.configuration || ''} ${p.bhk || ''} ${p.name || ''}`.toLowerCase();
          return full.includes('villa') || full.includes('bungalow') || full.includes('bunglow') || full.includes('row house');
        });
      } else if (lower.includes('plot') || lower.includes('land')) {
        list = list.filter((p) => {
          const full = `${p.configuration || ''} ${p.bhk || ''} ${p.name || ''}`.toLowerCase();
          return full.includes('plot') || full.includes('land');
        });
      } else if (lower.includes('prelease') || lower.includes('pre-lease') || lower.includes('preleased') || lower.includes('pre-rented')) {
        list = list.filter((p) => {
          const full = `${p.configuration || ''} ${p.bhk || ''} ${p.name || ''} ${p.description || ''}`.toLowerCase();
          return full.includes('prelease') || full.includes('pre-lease') || full.includes('preleased') || full.includes('pre-rented') || full.includes('yield');
        });
      } else {
        const num = lower.match(/\d+(?:\.5)?/)?.[0];
        if (num) {
          const parsed = parseFloat(num);
          list = list.filter((p) => {
            const full = `${p.configuration || ''} ${p.bhk || ''}`.toLowerCase();
            return p.bhkNum === parsed || full.includes(`${num} bhk`) || full.includes(`${num}bhk`);
          });
        } else {
          // Robust token match for any other custom category
          const cleanTokens = lower.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter((t) => t.length >= 3);
          if (cleanTokens.length > 0) {
            list = list.filter((p) => {
              const full = `${p.configuration || ''} ${p.bhk || ''} ${p.name || ''} ${p.description || ''}`.toLowerCase();
              return cleanTokens.some((t) => full.includes(t));
            });
          }
        }
      }
    }

    // Direct Locality exact/substring filtering
    if (qLocality && qLocality !== 'All') {
      const lowerLoc = qLocality.toLowerCase();
      list = list.filter((p) => {
        const full = `${p.locality || ''} ${p.location || ''} ${p.name || ''} ${p.description || ''}`.toLowerCase();
        return full.includes(lowerLoc);
      });
    }

    // Status filtering
    if (qStatus && qStatus !== 'All') {
      if (qStatus.toLowerCase().includes('ready')) {
        list = list.filter((p) => p.status.toLowerCase().includes('ready'));
      } else if (qStatus.toLowerCase().includes('under')) {
        list = list.filter((p) => p.status.toLowerCase().includes('under') || p.status.toLowerCase().includes('construction'));
      } else {
        list = list.filter((p) => p.status.toLowerCase().includes(qStatus.toLowerCase()));
      }
    }

    // Price filtering
    if (qPrice && qPrice !== 'All') {
      if (qPrice.includes('Under ₹1.5')) {
        list = list.filter((p) => (p.priceRaw || 15000000) <= 15000000);
      } else if (qPrice.includes('1.5') && qPrice.includes('2.5')) {
        list = list.filter((p) => (p.priceRaw || 20000000) >= 15000000 && (p.priceRaw || 20000000) <= 25000000);
      } else if (qPrice.includes('2.5') && qPrice.includes('4.0')) {
        list = list.filter((p) => (p.priceRaw || 30000000) >= 25000000 && (p.priceRaw || 30000000) <= 40000000);
      } else if (qPrice.includes('4.0')) {
        list = list.filter((p) => (p.priceRaw || 50000000) >= 40000000);
      }
    }

    // Business Purpose Filtering (Exact slug, ID, or name match)
    if (qPurpose && qPurpose !== 'All' && qPurpose !== 'all') {
      const pLower = qPurpose.toLowerCase().trim();
      list = list.filter((p) => {
        if (!p.businessPurposes || p.businessPurposes.length === 0) return false;
        return p.businessPurposes.some(
          (bp) =>
            bp.slug.toLowerCase() === pLower ||
            String(bp.id) === pLower ||
            bp.name.toLowerCase() === pLower
        );
      });
    }

    // Transaction Type Filtering (Buy vs Rent)
    if (qTransactionType && qTransactionType !== 'All' && qTransactionType !== 'all') {
      const ttLower = qTransactionType.toLowerCase().trim();
      if (ttLower.includes('rent') || ttLower.includes('lease')) {
        list = list.filter((p) => {
          const lt = String(p.listingType || '').toLowerCase();
          return lt.includes('rent') || lt.includes('lease');
        });
      } else if (ttLower.includes('buy') || ttLower.includes('sale')) {
        list = list.filter((p) => {
          const lt = String(p.listingType || '').toLowerCase();
          return lt.includes('sale') || lt.includes('buy') || !p.listingType;
        });
      }
    }

    // Intelligent Typo Autocorrect Fallback: If query returned 0 matches, test if it has a known typo
    if (list.length === 0 && qSearch.trim().length >= 3) {
      const auto = detectQueryAutocorrect(qSearch);
      if (auto.hasCorrection) {
        return filterClientSide(auto.correctedQuery, qLocality, qBhk, qPrice, qStatus, qPurpose, qTransactionType);
      }
    }

    return list;
  };

  // Helper rank function for configuration / typography sorting
  const getTypologySortRank = (p: PropertyItem): number => {
    if (p.bhkNum && p.bhkNum > 0) return p.bhkNum;
    const str = `${p.configuration || ''} ${p.bhk || ''}`.toLowerCase();
    if (str.includes('1 bhk') || str.includes('1bhk')) return 1;
    if (str.includes('2 bhk') || str.includes('2bhk')) return 2;
    if (str.includes('3 bhk') || str.includes('3bhk')) return 3;
    if (str.includes('4 bhk') || str.includes('4bhk')) return 4;
    if (str.includes('penthouse') || str.includes('sky')) return 5;
    if (str.includes('villa') || str.includes('bungalow') || str.includes('bunglow') || str.includes('estate')) return 6;
    if (str.includes('office')) return 10;
    if (str.includes('shop') || str.includes('showroom') || str.includes('retail')) return 11;
    if (str.includes('restaurant')) return 12;
    if (str.includes('hotel') || str.includes('resort')) return 13;
    if (str.includes('hospital') || str.includes('medical') || str.includes('clinic')) return 14;
    if (str.includes('industrial') || str.includes('factory') || str.includes('shed') || str.includes('manufacturing')) return 15;
    if (str.includes('warehouse') || str.includes('godown')) return 16;
    if (str.includes('plot') || str.includes('land')) return 17;
    return 25;
  };

  // Live Instant Filtering: When ANY search or filter dropdown changes, immediately filter and show properties in front!
  const sortedProperties = useMemo(() => {
    const q = (deferredQuery || '').trim();
    let list = filterClientSide(q, selectedLocality, selectedBhk, selectedPriceRange, selectedStatus, selectedPurpose, selectedTransactionType);

    if (selectedDeveloper && selectedDeveloper !== 'All') {
      const devLower = selectedDeveloper.toLowerCase();
      list = list.filter((p) => (p.developer || '').toLowerCase().includes(devLower));
    }

    if (sortBy === 'price_low') {
      list.sort((a, b) => {
        const pA = getPropertyRawPrice(a);
        const pB = getPropertyRawPrice(b);
        return pA - pB;
      });
    } else if (sortBy === 'price_high') {
      list.sort((a, b) => {
        const pA = getPropertyRawPrice(a);
        const pB = getPropertyRawPrice(b);
        return pB - pA;
      });
    } else if (sortBy === 'size_high' || sortBy === 'size' || sortBy === 'area_high') {
      list.sort((a, b) => getPropertySqftNumber(b) - getPropertySqftNumber(a));
    } else if (sortBy === 'size_low' || sortBy === 'area_low') {
      list.sort((a, b) => getPropertySqftNumber(a) - getPropertySqftNumber(b));
    } else if (sortBy === 'name_asc') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'name_desc') {
      list.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (sortBy === 'developer_asc') {
      list.sort((a, b) => (a.developer || '').localeCompare(b.developer || ''));
    } else if (sortBy === 'locality_asc') {
      list.sort((a, b) => (a.locality || a.location || '').localeCompare(b.locality || b.location || ''));
    } else if (sortBy === 'locality_desc') {
      list.sort((a, b) => (b.locality || b.location || '').localeCompare(a.locality || a.location || ''));
    } else if (sortBy === 'typography_asc') {
      list.sort((a, b) => {
        const valA = (a.configuration || a.bhk || '').trim();
        const valB = (b.configuration || b.bhk || '').trim();
        return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
      });
    } else if (sortBy === 'typography_desc') {
      list.sort((a, b) => {
        const valA = (a.configuration || a.bhk || '').trim();
        const valB = (b.configuration || b.bhk || '').trim();
        return valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
      });
    } else if (sortBy === 'bhk_asc') {
      list.sort((a, b) => {
        const rankA = getTypologySortRank(a);
        const rankB = getTypologySortRank(b);
        if (rankA !== rankB) return rankA - rankB;
        return (a.configuration || a.bhk || '').localeCompare(b.configuration || b.bhk || '');
      });
    } else if (sortBy === 'bhk_desc') {
      list.sort((a, b) => {
        const rankA = getTypologySortRank(a);
        const rankB = getTypologySortRank(b);
        if (rankA !== rankB) return rankB - rankA;
        return (b.configuration || b.bhk || '').localeCompare(a.configuration || a.bhk || '');
      });
    } else if (sortBy === 'status_ready') {
      list.sort((a, b) => (b.status?.toLowerCase().includes('ready') ? 1 : 0) - (a.status?.toLowerCase().includes('ready') ? 1 : 0));
    }
    return list;
  }, [initialProperties, properties, deferredQuery, selectedLocality, selectedBhk, selectedPriceRange, selectedStatus, selectedPurpose, selectedTransactionType, selectedDeveloper, sortBy]);

  // Initial State Display Limits: 4 for Comparison Table, 2 for Property Cards
  const [showAllComparison, setShowAllComparison] = useState(false);
  const [showAllCards, setShowAllCards] = useState(false);
  const [propertyViewMode, setPropertyViewMode] = useState<'both' | 'table' | 'paragraph'>('both');
  const isViewMode = (mode: 'both' | 'table' | 'paragraph') => propertyViewMode === mode;

  const displayedComparisonProperties = useMemo(() => {
    if (showAllComparison) return sortedProperties;
    return sortedProperties.slice(0, 4);
  }, [sortedProperties, showAllComparison]);

  const displayedCardProperties = useMemo(() => {
    if (showAllCards || propertyViewMode === 'paragraph') return sortedProperties;
    return sortedProperties.slice(0, 2);
  }, [sortedProperties, showAllCards, propertyViewMode]);

  const handleShareWhatsApp = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://anvreeality.com';
    const queryTerm = (catalogueSearch || searchQuery || '').trim();
    const queryDesc = queryTerm ? `matching "${queryTerm}"` : 'in prime Pune corridors';

    let propertiesListText = '';
    if (sortedProperties && sortedProperties.length > 0) {
      propertiesListText = sortedProperties.slice(0, 3).map((p, i) =>
        `${i + 1}. *${p.name}* - ${p.bhk} in ${p.locality || 'Pune'} (${formatPriceDisplay(p.price)})`
      ).join('\n');
    }

    const shareText = `🏢 *ANV REEALTY - Verified Properties Portfolio*\n` +
      `Explore verified properties ${queryDesc}:\n\n` +
      (propertiesListText ? `${propertiesListText}\n\n` : '') +
      `🔗 *View All Properties*: ${currentUrl}\n\n` +
      `📞 *ANV REEALTY Central Advisory Desk*: +91 93730 20701`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Execute Search: Synchronizes browser URL & fetches unified search if needed
  const executeSearch = async (overrideParams?: {
    search?: string;
    locality?: string;
    bhk?: string;
    priceRange?: string;
    status?: string;
    purpose?: string;
    transactionType?: string;
  }) => {
    setIsSearching(true);
    setShowAllBlogs(false);

    const isDirectBarSearch =
      overrideParams === undefined ||
      (overrideParams.search !== undefined && overrideParams.bhk === undefined && overrideParams.locality === undefined && overrideParams.purpose === undefined);

    let qSearch = overrideParams?.search !== undefined ? overrideParams.search : (catalogueSearch || searchQuery);
    setActiveFilterQuery(qSearch.trim());
    let qLocality = overrideParams?.locality !== undefined ? overrideParams.locality : selectedLocality;
    let qBhk = overrideParams?.bhk !== undefined ? overrideParams.bhk : selectedBhk;
    let qPrice = overrideParams?.priceRange !== undefined ? overrideParams.priceRange : selectedPriceRange;
    let qStatus = overrideParams?.status !== undefined ? overrideParams.status : selectedStatus;
    let qPurpose = overrideParams?.purpose !== undefined ? overrideParams.purpose : selectedPurpose;
    let qTransactionType = overrideParams?.transactionType !== undefined ? overrideParams.transactionType : selectedTransactionType;

    const normalizedSearch = qSearch
      .replace(/[-_/\(\)\[\]]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();

    const isSellerText =
      isUserSeller(normalizedSearch) ||
      /\b(?:want|need|find|get|looking for|require|seeking)\s+(?:a\s+|an\s+|the\s+)?buyers?\b/i.test(normalizedSearch) ||
      /\bbuyers?\s+(?:for|needed|required|wanted)\b/i.test(normalizedSearch) ||
      /\b(?:sell|selling)\s+(?:my\s+|a\s+)?(?:flat|apartment|property|home|house|plot|commercial|office)\b/i.test(normalizedSearch);

    if (isDirectBarSearch && normalizedSearch) {
      const parsedCriteria = parseQueryCriteria(normalizedSearch);
      const isMultiCat = parsedCriteria.isMultiCategory || (parsedCriteria.typologyIntents && parsedCriteria.typologyIntents.length > 1) || (parsedCriteria.bhkNums && parsedCriteria.bhkNums.length > 1);

      // BHK / Typology extraction
      let detectedBhk = 'All';
      if (!isMultiCat) {
        if (/\b(?:commercial\s*office|it\s*park|tech\s*park|corporate)\b/i.test(normalizedSearch)) {
          detectedBhk = 'Commercial Office';
        } else if (/\b(?:showroom)\b/i.test(normalizedSearch)) {
          detectedBhk = 'Showroom';
        } else if (/\b(?:shop|retail)\b/i.test(normalizedSearch)) {
          detectedBhk = 'Shop';
        } else if (/\b(?:hospital|clinic)\b/i.test(normalizedSearch)) {
          detectedBhk = 'Hospital';
        } else if (/\b(?:industrial|warehouse|factory)\b/i.test(normalizedSearch)) {
          detectedBhk = 'Industrial Factory';
        } else {
          const bhkMatch =
            normalizedSearch.match(/\b([1-9])\s*(?:bhk|bedroom|bed)s?\b/i) ||
            normalizedSearch.match(/\b(?:bhk|bedroom|bed)s?\s*([1-9])\b/i);
          if (bhkMatch) {
            detectedBhk = `${bhkMatch[1]} BHK`;
          } else if (/\bpenthouses?\b/i.test(normalizedSearch)) {
            detectedBhk = '4.5+ BHK Penthouse';
          }
        }
      }
      if (detectedBhk !== 'All') {
        qBhk = detectedBhk;
        setSelectedBhk(detectedBhk);
      } else {
        qBhk = 'All';
        setSelectedBhk('All');
      }

      // Locality extraction
      let detectedLoc = 'All';
      for (const loc of availableLocalities) {
        if (loc === 'All') continue;
        if (
          new RegExp(`\\b${loc.replace(/\\s+/g, '[\\s-]+')}\\b`, 'i').test(qSearch) ||
          new RegExp(`\\b${loc}\\b`, 'i').test(normalizedSearch)
        ) {
          detectedLoc = loc;
          break;
        }
      }
      if (detectedLoc !== 'All') {
        qLocality = detectedLoc;
        setSelectedLocality(detectedLoc);
      }

      if (isSellerText) {
        setActiveResultTab('buyer_leads');
      } else {
        setActiveResultTab('properties');
      }
    }

    try {
      const params = new URLSearchParams();
      if (qSearch.trim()) params.set('search', qSearch.trim());
      if (qLocality && qLocality !== 'All') params.set('locality', qLocality);
      if (qBhk && qBhk !== 'All') params.set('bhk', qBhk);
      if (qPrice && qPrice !== 'All') params.set('priceRange', qPrice);
      if (qStatus && qStatus !== 'All') params.set('status', qStatus);
      if (qPurpose && qPurpose !== 'All') params.set('purpose', qPurpose);
      if (qTransactionType && qTransactionType !== 'All') params.set('transactionType', qTransactionType);

      // Sync URL without page reload
      if (typeof window !== 'undefined') {
        const isMultiCatSearch = parseQueryCriteria(normalizedSearch).isMultiCategory;
        const matchedCategorySlug = isMultiCatSearch ? null : findMatchingCategorySlug(qSearch);
        if (
          matchedCategorySlug &&
          (!qLocality || qLocality === 'All') &&
          (!qBhk || qBhk === 'All') &&
          (!qPrice || qPrice === 'All') &&
          (!qStatus || qStatus === 'All')
        ) {
          window.history.replaceState(null, '', `/${matchedCategorySlug}`);
        } else {
          const qs = params.toString();
          const basePath = isDedicatedSearchPage ? '/properties' : '/';
          window.history.replaceState(null, '', qs ? `${basePath}?${qs}` : basePath);
        }
      }

      // Fetch from search API
      const res = await fetch(`/api/unified-search?${params.toString()}`);
      const data = await res.json();

      let fetchedProperties: PropertyItem[] = [];
      let fetchedDemands: BuyerDemandItem[] = [];

      if (data.success) {
        if (Array.isArray(data.properties)) fetchedProperties = data.properties;
        if (Array.isArray(data.buyerDemands)) fetchedDemands = data.buyerDemands;
        if (isSellerText || data.ai?.primaryView === 'buyer_leads' || data.ai?.intent === 'seller') {
          setActiveResultTab('buyer_leads');
        } else {
          setActiveResultTab('properties');
        }
        setProperties(fetchedProperties);
        setBuyerDemands(fetchedDemands);
      } else {
        const fallbackMatched = filterClientSide(qSearch, qLocality, qBhk, qPrice, qStatus, qPurpose, qTransactionType);
        setProperties(fallbackMatched);
      }

      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById('search-results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.log('Search fallback:', err);
      const fallbackMatched = filterClientSide(qSearch, qLocality, qBhk, qPrice, qStatus, qPurpose, qTransactionType);
      setProperties(fallbackMatched);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCatalogueSearch('');
    setActiveFilterQuery('');
    setCatalogueBuyerFilter('');
    setSelectedLocality('All');
    setBuyerLocalityFilter('All');
    setSelectedBhk('All');
    setBuyerBhkFilter('All');
    setSelectedPriceRange('All');
    setSelectedStatus('All');
    setSelectedDeveloper('All');
    setSelectedPurpose('All');
    setSelectedTransactionType('All');
    setSortBy('price_low');
    setProperties(initialProperties || []);
    setActiveResultTab('properties');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', isDedicatedSearchPage ? '/properties' : '/');
    }
    showToast('Filters cleared. Showing all verified properties.');
  };

  const renderSortDropdownContent = () => {
    const isPriceActive = ['price_low', 'price_high'].includes(sortBy);
    const isNameActive = ['name_asc', 'name_desc'].includes(sortBy);
    const isLocActive = ['locality_asc', 'locality_desc'].includes(sortBy);
    const isAreaActive = ['size_low', 'size_high', 'area_low', 'area_high'].includes(sortBy);

    const getActiveBadge = (type: 'price' | 'name' | 'location' | 'area') => {
      if (type === 'price' && isPriceActive) {
        return sortBy === 'price_low' ? 'Low → High' : 'High → Low';
      }
      if (type === 'name' && isNameActive) {
        return sortBy === 'name_asc' ? 'A → Z' : 'Z → A';
      }
      if (type === 'location' && isLocActive) {
        return sortBy === 'locality_asc' ? 'A → Z' : 'Z → A';
      }
      if (type === 'area' && isAreaActive) {
        return sortBy === 'size_low' || sortBy === 'area_low' ? 'Low → High' : 'High → Low';
      }
      return null;
    };

    const toggleCategory = (cat: 'price' | 'name' | 'location' | 'area') => {
      setExpandedSortCategory((prev) => (prev === cat ? null : cat));
    };

    return (
      <div className="w-full sm:w-88 p-3.5 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-zinc-200 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 font-normal select-none text-left space-y-2 z-[90] text-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
          <div className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-600" />
            <span>Sort Properties</span>
          </div>
          {sortBy !== 'price_low' && (
            <button
              type="button"
              onClick={() => {
                setSortBy('price_low');
                setExpandedSortCategory(null);
                setActiveHeaderDropdown(null);
              }}
              className="text-[11px] font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
            >
              Reset (Low to High)
            </button>
          )}
        </div>

        {/* 1. Price */}
        <div className={`rounded-xl border transition-all ${expandedSortCategory === 'price' ? 'border-amber-400/80 bg-amber-50/20 shadow-xs' : 'border-zinc-200/80 bg-zinc-50/70 hover:bg-zinc-100/60'}`}>
          <button
            type="button"
            onClick={() => toggleCategory('price')}
            className="w-full p-2.5 flex items-center justify-between text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Tag className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-bold text-zinc-900 truncate">1. Price</span>
              {getActiveBadge('price') && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                  {getActiveBadge('price')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <ChevronDown
                className={`w-4 h-4 text-zinc-400 group-hover:text-amber-600 transition-transform duration-200 ${
                  expandedSortCategory === 'price' ? 'rotate-180 text-amber-600' : ''
                }`}
              />
            </div>
          </button>

          {expandedSortCategory === 'price' && (
            <div className="p-2.5 pt-0 border-t border-amber-100/80 mt-1 grid grid-cols-2 gap-1.5 text-xs animate-in fade-in duration-150">
              <button
                type="button"
                onClick={() => {
                  setSortBy('price_low');
                  setActiveHeaderDropdown(null);
                }}
                className={`px-2.5 py-2 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                  sortBy === 'price_low'
                    ? 'bg-amber-500 font-black text-zinc-950 shadow-xs'
                    : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200/80'
                }`}
              >
                <span>Low to High (Default)</span>
                {sortBy === 'price_low' && <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSortBy('price_high');
                  setActiveHeaderDropdown(null);
                }}
                className={`px-2.5 py-2 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                  sortBy === 'price_high'
                    ? 'bg-amber-500 font-black text-zinc-950 shadow-xs'
                    : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200/80'
                }`}
              >
                <span>High to Low</span>
                {sortBy === 'price_high' && <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />}
              </button>
            </div>
          )}
        </div>

        {/* 2. Building Name */}
        <div className={`rounded-xl border transition-all ${expandedSortCategory === 'name' ? 'border-amber-400/80 bg-amber-50/20 shadow-xs' : 'border-zinc-200/80 bg-zinc-50/70 hover:bg-zinc-100/60'}`}>
          <button
            type="button"
            onClick={() => toggleCategory('name')}
            className="w-full p-2.5 flex items-center justify-between text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-bold text-zinc-900 truncate">2. Building Name</span>
              {getActiveBadge('name') && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                  {getActiveBadge('name')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <ChevronDown
                className={`w-4 h-4 text-zinc-400 group-hover:text-amber-600 transition-transform duration-200 ${
                  expandedSortCategory === 'name' ? 'rotate-180 text-amber-600' : ''
                }`}
              />
            </div>
          </button>

          {expandedSortCategory === 'name' && (
            <div className="p-2.5 pt-0 border-t border-amber-100/80 mt-1 grid grid-cols-2 gap-1.5 text-xs animate-in fade-in duration-150">
              <button
                type="button"
                onClick={() => {
                  setSortBy('name_asc');
                  setActiveHeaderDropdown(null);
                }}
                className={`px-2.5 py-2 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                  sortBy === 'name_asc'
                    ? 'bg-amber-500 font-black text-zinc-950 shadow-xs'
                    : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200/80'
                }`}
              >
                <span>A → Z</span>
                {sortBy === 'name_asc' && <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSortBy('name_desc');
                  setActiveHeaderDropdown(null);
                }}
                className={`px-2.5 py-2 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                  sortBy === 'name_desc'
                    ? 'bg-amber-500 font-black text-zinc-950 shadow-xs'
                    : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200/80'
                }`}
              >
                <span>Z → A</span>
                {sortBy === 'name_desc' && <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />}
              </button>
            </div>
          )}
        </div>

        {/* 3. Location */}
        <div className={`rounded-xl border transition-all ${expandedSortCategory === 'location' ? 'border-amber-400/80 bg-amber-50/20 shadow-xs' : 'border-zinc-200/80 bg-zinc-50/70 hover:bg-zinc-100/60'}`}>
          <button
            type="button"
            onClick={() => toggleCategory('location')}
            className="w-full p-2.5 flex items-center justify-between text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-bold text-zinc-900 truncate">3. Location</span>
              {getActiveBadge('location') && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                  {getActiveBadge('location')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <ChevronDown
                className={`w-4 h-4 text-zinc-400 group-hover:text-amber-600 transition-transform duration-200 ${
                  expandedSortCategory === 'location' ? 'rotate-180 text-amber-600' : ''
                }`}
              />
            </div>
          </button>

          {expandedSortCategory === 'location' && (
            <div className="p-2.5 pt-0 border-t border-amber-100/80 mt-1 grid grid-cols-2 gap-1.5 text-xs animate-in fade-in duration-150">
              <button
                type="button"
                onClick={() => {
                  setSortBy('locality_asc');
                  setActiveHeaderDropdown(null);
                }}
                className={`px-2.5 py-2 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                  sortBy === 'locality_asc'
                    ? 'bg-amber-500 font-black text-zinc-950 shadow-xs'
                    : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200/80'
                }`}
              >
                <span>A → Z</span>
                {sortBy === 'locality_asc' && <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSortBy('locality_desc');
                  setActiveHeaderDropdown(null);
                }}
                className={`px-2.5 py-2 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                  sortBy === 'locality_desc'
                    ? 'bg-amber-500 font-black text-zinc-950 shadow-xs'
                    : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200/80'
                }`}
              >
                <span>Z → A</span>
                {sortBy === 'locality_desc' && <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />}
              </button>
            </div>
          )}
        </div>

        {/* 4. Area (Sq.Ft.) */}
        <div className={`rounded-xl border transition-all ${expandedSortCategory === 'area' ? 'border-amber-400/80 bg-amber-50/20 shadow-xs' : 'border-zinc-200/80 bg-zinc-50/70 hover:bg-zinc-100/60'}`}>
          <button
            type="button"
            onClick={() => toggleCategory('area')}
            className="w-full p-2.5 flex items-center justify-between text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Grid className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-bold text-zinc-900 truncate">4. Area (Sq.Ft.)</span>
              {getActiveBadge('area') && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                  {getActiveBadge('area')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <ChevronDown
                className={`w-4 h-4 text-zinc-400 group-hover:text-amber-600 transition-transform duration-200 ${
                  expandedSortCategory === 'area' ? 'rotate-180 text-amber-600' : ''
                }`}
              />
            </div>
          </button>

          {expandedSortCategory === 'area' && (
            <div className="p-2.5 pt-0 border-t border-amber-100/80 mt-1 grid grid-cols-2 gap-1.5 text-xs animate-in fade-in duration-150">
              <button
                type="button"
                onClick={() => {
                  setSortBy('size_low');
                  setActiveHeaderDropdown(null);
                }}
                className={`px-2.5 py-2 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                  sortBy === 'size_low' || sortBy === 'area_low'
                    ? 'bg-amber-500 font-black text-zinc-950 shadow-xs'
                    : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200/80'
                }`}
              >
                <span>Low to High</span>
                {(sortBy === 'size_low' || sortBy === 'area_low') && <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSortBy('size_high');
                  setActiveHeaderDropdown(null);
                }}
                className={`px-2.5 py-2 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                  sortBy === 'size_high' || sortBy === 'area_high'
                    ? 'bg-amber-500 font-black text-zinc-950 shadow-xs'
                    : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200/80'
                }`}
              >
                <span>High to Low</span>
                {(sortBy === 'size_high' || sortBy === 'area_high') && <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-zinc-950/95 backdrop-blur-xl text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.3)] border border-emerald-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40 shadow-inner">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-white font-bold">{toastMessage}</div>
          </div>
        </div>
      )}

      {/* ================= UNIFIED SEARCH RESULTS (PROPERTIES & BUYER DEMANDS) ================= */}
      <section
        id="search-results-section"
        className="w-full max-w-full pt-0"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
          {/* ================= SEARCH BAR ONLY ================= */}
          <div
            id="properties-search-bar"
            className="sticky top-[58px] sm:top-[73px] z-35 w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-md hover:shadow-lg border border-zinc-200/90 p-3 sm:p-4 mb-8 transition-all"
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div ref={searchContainerRef} className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="main-search-input"
                  type="text"
                  value={catalogueSearch}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCatalogueSearch(val);
                    setSearchQuery(val);
                  }}
                  onFocus={() => {
                    if ((searchSuggestions.length > 0 || didYouMean) && catalogueSearch.trim().length >= 2) {
                      setIsSearchSuggestionsOpen(true);
                    }
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search verified properties by location, type, project, or price (e.g. Baner, 3 BHK, Hospital, Undri)..."
                  className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 rounded-xl pl-10 pr-9 py-2.5 sm:py-3 text-base sm:text-sm font-medium text-zinc-900 placeholder:text-zinc-400 outline-none transition"
                />
                {catalogueSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setCatalogueSearch('');
                      setSearchQuery('');
                      setActiveFilterQuery('');
                      setCatalogueBuyerFilter('');
                      setActiveResultTab('properties');
                      setIsSearchSuggestionsOpen(false);
                      setSearchSuggestions([]);
                      setDidYouMean(null);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* AUTOFILL & AUTOCORRECT POPUP */}
                {isSearchSuggestionsOpen && (didYouMean || searchSuggestions.length > 0) && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-zinc-200/90 ring-1 ring-black/5 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* 1. "Did you mean?" Autocorrect Banner */}
                    {didYouMean && (
                      <div className="p-3 bg-amber-50/90 border-b border-amber-200/80 flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 text-xs text-amber-950 min-w-0">
                          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="text-zinc-600 shrink-0">Did you mean:</span>
                          <button
                            type="button"
                            onClick={() => applyCorrection(didYouMean)}
                            className="font-black text-amber-900 hover:text-amber-700 underline underline-offset-2 decoration-amber-500 cursor-pointer truncate"
                          >
                            {didYouMean}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => applyCorrection(didYouMean)}
                          className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-xs transition cursor-pointer shrink-0"
                        >
                          Apply Fix
                        </button>
                      </div>
                    )}

                    {/* 2. Autofill Suggestions List */}
                    {searchSuggestions.length > 0 && (
                      <div className="p-1.5 max-h-72 overflow-y-auto space-y-0.5">
                        <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider px-3 py-1 flex items-center justify-between">
                          <span>Suggestions</span>
                          <span className="text-[9px] text-zinc-400 font-normal">Use ↑ ↓ and Enter to select</span>
                        </div>

                        {searchSuggestions.map((suggestion, index) => {
                          const isSelected = selectedSuggestionIndex === index;
                          return (
                            <button
                              key={suggestion.id}
                              type="button"
                              onClick={() => applySuggestion(suggestion)}
                              onMouseEnter={() => setSelectedSuggestionIndex(index)}
                              className={`w-full px-3 py-2 rounded-xl text-left transition flex items-center justify-between gap-3 cursor-pointer ${
                                isSelected ? 'bg-amber-500/10 text-zinc-950 font-bold' : 'text-zinc-700 hover:bg-zinc-100/80'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {suggestion.type === 'location' && (
                                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                                    <MapPin className="w-3.5 h-3.5" />
                                  </div>
                                )}
                                {suggestion.type === 'developer' && (
                                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                                    <Building2 className="w-3.5 h-3.5" />
                                  </div>
                                )}
                                {suggestion.type === 'typology' && (
                                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                                    <Tag className="w-3.5 h-3.5" />
                                  </div>
                                )}
                                {suggestion.type === 'property' && (
                                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                                    <Home className="w-3.5 h-3.5" />
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-zinc-900 truncate">
                                    {suggestion.label}
                                  </div>
                                  {suggestion.subtitle && (
                                    <div className="text-[11px] text-zinc-400 truncate">
                                      {suggestion.subtitle}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                                    suggestion.type === 'location'
                                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                                      : suggestion.type === 'developer'
                                      ? 'bg-blue-50 text-blue-900 border-blue-200'
                                      : suggestion.type === 'typology'
                                      ? 'bg-purple-50 text-purple-900 border-purple-200'
                                      : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                  }`}
                                >
                                  {suggestion.badge}
                                </span>
                                <ArrowRight className="w-3 h-3 text-zinc-300" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>


            {/* Real-time Counts & View Mode Switcher */}
            <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 text-xs">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-950 text-white select-none cursor-default shadow-xs"
                  title="Total properties matching search"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    <span className="hidden sm:inline">Properties </span>({sortedProperties.length})
                  </span>
                </span>

                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-zinc-950 select-none cursor-default shadow-xs"
                  title="Total buyers registered in Pune"
                >
                  <Users className="w-3.5 h-3.5 text-zinc-950" />
                  <span>
                    <span className="hidden sm:inline">Buyers </span>({filteredCatalogueBuyerDemands.length})
                  </span>
                </span>
              </div>

              {/* View Switcher: Table Type vs Paragraph Type */}
              <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200/90 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setPropertyViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    propertyViewMode === 'table'
                      ? 'bg-zinc-950 text-white shadow-xs font-black'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/80'
                  }`}
                  title="View data as Table Type"
                >
                  <Table className="w-3.5 h-3.5 text-amber-400" />
                  <span>Table Type</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPropertyViewMode('paragraph')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    propertyViewMode === 'paragraph'
                      ? 'bg-zinc-950 text-white shadow-xs font-black'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/80'
                  }`}
                  title="View data as Paragraph / Card Type"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Paragraph Type</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPropertyViewMode('both')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer hidden sm:flex ${
                    propertyViewMode === 'both'
                      ? 'bg-zinc-950 text-white shadow-xs font-black'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/80'
                  }`}
                  title="View Both Table and Paragraph Type"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Both</span>
                </button>
              </div>

              {isUserSeller(catalogueSearch || searchQuery) && (
                <div className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-in fade-in select-none cursor-default">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Showing registered buyers for your property query</span>
                </div>
              )}
            </div>
          </div>

          {/* ================= SECTION 1: VERIFIED PROPERTIES ================= */}
          <div id="properties-section" className="space-y-6">
            {/* ================= 1. INSTITUTIONAL COMPARISON TABLE (SEEN FIRST) ================= */}
            {(propertyViewMode === 'table' || propertyViewMode === 'both') && sortedProperties.length > 0 && (
              <div id="properties-table-container" className="mb-4 sm:mb-8 bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-zinc-200 overflow-hidden w-full max-w-full">
                <div className="bg-zinc-950 p-2.5 sm:p-5 text-white flex items-center justify-between gap-2">
                  <div className="hidden sm:block">
                    <h3 className="text-lg font-bold flex items-center gap-2 tracking-tight text-white">
                      <Building2 className="w-5 h-5 text-amber-400" />
                      <span>
                        {sortedProperties.length} {sortedProperties.length === 1 ? 'Property' : 'Properties'} Found
                      </span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap ml-auto sm:ml-0">
                    {/* View Mode Switcher Pill in Table Header */}
                    <div className="inline-flex items-center p-0.5 bg-zinc-900 rounded-xl border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setPropertyViewMode('table')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          isViewMode('table')
                            ? 'bg-amber-400 text-zinc-950 font-black shadow-xs'
                            : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                        }`}
                        title="View data as Table Type"
                      >
                        <Table className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Table Type</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPropertyViewMode('paragraph')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          isViewMode('paragraph')
                            ? 'bg-amber-400 text-zinc-950 font-black shadow-xs'
                            : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                        }`}
                        title="View data as Paragraph / Card Type"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Paragraph Type</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPropertyViewMode('both')}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          isViewMode('both')
                            ? 'bg-amber-400 text-zinc-950 font-black shadow-xs'
                            : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                        }`}
                        title="View Both Table and Paragraph Type"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Both</span>
                      </button>
                    </div>

                    {/* Dedicated Single Sort By Dropdown - MOBILE ONLY (hidden on laptop and big screens) */}
                    <div className="relative sm:hidden">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveHeaderDropdown(activeHeaderDropdown === 'sort' ? null : 'sort');
                          setHeaderSearchQuery('');
                        }}
                        className={`p-2 rounded-xl transition flex items-center justify-center gap-1 shadow-sm cursor-pointer ${
                          sortBy !== 'price_low'
                            ? 'bg-amber-400 text-zinc-950 font-black ring-1 ring-amber-300'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700/80'
                        }`}
                        title={`Sort properties (Active: ${getSortLabel(sortBy)})`}
                        aria-label="Sort properties"
                      >
                        <ArrowUpDown className={`w-4 h-4 ${sortBy !== 'price_low' ? 'text-zinc-950' : 'text-amber-400'}`} />
                      </button>

                      {activeHeaderDropdown === 'sort' && (
                        <div
                          ref={headerDropdownRef}
                          className="absolute right-0 top-full mt-2 z-[90] w-[calc(100vw-32px)] sm:w-88 max-w-sm"
                        >
                          {renderSortDropdownContent()}
                        </div>
                      )}
                    </div>

                    <Link
                      href="/compare"
                      aria-label="Compare properties"
                      className="text-xs bg-amber-500 hover:bg-amber-400 text-black font-extrabold p-2 sm:px-4 sm:py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      title="Compare properties"
                    >
                      <Scale className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      <span className="hidden sm:inline">Compare</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      aria-label="Share properties on WhatsApp"
                      className="text-xs bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold p-2 sm:px-4 sm:py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                      title="Share on WhatsApp"
                    >
                      <svg viewBox="0 0 32 32" className="w-4 h-4 sm:w-3.5 sm:h-3.5 fill-white shrink-0" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 2C8.28 2 2 8.28 2 16c0 2.66.75 5.15 2.05 7.29L2.3 29.7l6.63-1.74A13.9 13.9 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm8.17 19.83c-.34.96-1.7 1.76-2.76 1.99-.73.16-1.68.29-4.88-1.04-4.09-1.69-6.72-5.83-6.93-6.1-.2-.28-1.67-2.22-1.67-4.23s1.05-3.01 1.43-3.42c.38-.41.82-.51 1.1-.51.27 0 .55 0 .79.02.25.01.59-.1.92.7.34.82 1.16 2.83 1.26 3.04.1.2.17.44.03.71-.13.27-.2.44-.4.68-.2.24-.43.53-.61.71-.21.21-.43.44-.19.86.25.41 1.09 1.8 2.34 2.91 1.61 1.43 2.97 1.88 3.39 2.09.42.2.67.18.92-.1.25-.28 1.07-1.24 1.35-1.67.28-.43.56-.36.94-.22.38.14 2.42 1.14 2.83 1.35.41.2.69.31.79.48.1.18.1 1.02-.24 1.98z" />
                      </svg>
                      <span className="hidden sm:inline">Share</span>
                    </button>
                  </div>
                </div>

                {/* ================= DESKTOP VIEW: COMPARISON TABLE (HORIZONTAL SCROLL ON DESKTOP ONLY) ================= */}
                <div className="hidden sm:block overflow-x-auto text-xs w-full">
                  <table className="w-full text-left min-w-[700px]">
                    <thead className="bg-zinc-50 text-zinc-600 font-bold border-b border-zinc-200">
                      <tr>
                        {/* 1. Property & Developer */}
                        <th className="px-5 py-3 relative">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveHeaderDropdown(activeHeaderDropdown === 'developer' ? null : 'developer');
                                setHeaderSearchQuery('');
                              }}
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                selectedDeveloper !== 'All' || ['name_asc', 'name_desc', 'developer_asc'].includes(sortBy)
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'text-zinc-700 hover:bg-zinc-100'
                              }`}
                            >
                              <span>Property &amp; Developer</span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  activeHeaderDropdown === 'developer' ? 'rotate-180 text-amber-600' : 'text-zinc-500'
                                }`}
                              />
                            </button>

                            {selectedDeveloper !== 'All' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                <span>{selectedDeveloper}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDeveloper('All');
                                  }}
                                  className="text-amber-700 hover:text-black cursor-pointer font-black"
                                  title="Clear developer filter"
                                >
                                  ×
                                </button>
                              </span>
                            )}
                          </div>

                          {/* Popover */}
                          {activeHeaderDropdown === 'developer' && (
                            <div
                              ref={headerDropdownRef}
                              className="absolute left-3 top-full mt-1.5 w-64 sm:w-72 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-zinc-200 ring-1 ring-black/5 p-2.5 z-[90] animate-in fade-in zoom-in-95 duration-150 font-normal select-none text-left"
                            >
                              {/* Small Search Box */}
                              <div className="relative mb-2">
                                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                  type="text"
                                  autoFocus
                                  value={headerSearchQuery}
                                  onChange={(e) => setHeaderSearchQuery(e.target.value)}
                                  placeholder="Search property or developer..."
                                  className="w-full pl-8 pr-7 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-amber-400 focus:bg-white transition"
                                />
                                {headerSearchQuery && (
                                  <button
                                    type="button"
                                    onClick={() => setHeaderSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs font-bold cursor-pointer"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>

                              <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider px-2 py-1">
                                Sort Properties
                              </div>

                              <div className="space-y-0.5 text-xs mb-2">
                                {[
                                  { label: 'Default (Featured & Relevancy)', value: 'relevance' },
                                  { label: 'Property Name: A → Z', value: 'name_asc' },
                                  { label: 'Property Name: Z → A', value: 'name_desc' },
                                  { label: 'Developer: A → Z', value: 'developer_asc' }
                                ]
                                  .filter((opt) => !headerSearchQuery || opt.label.toLowerCase().includes(headerSearchQuery.toLowerCase()))
                                  .map((opt) => {
                                    const isSelected = sortBy === opt.value || (sortBy === '' && opt.value === 'relevance');
                                    return (
                                      <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                          setSortBy(opt.value);
                                          setActiveHeaderDropdown(null);
                                        }}
                                        className={`w-full px-2.5 py-1.5 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                                          isSelected ? 'bg-amber-50 font-bold text-amber-900' : 'text-zinc-700 hover:bg-zinc-100'
                                        }`}
                                      >
                                        <span>{opt.label}</span>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                                      </button>
                                    );
                                  })}
                              </div>

                              {/* Developers Filter Section */}
                              {availableDevelopers.length > 0 && (
                                <div className="pt-2 border-t border-zinc-100">
                                  <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider px-2 py-1">
                                    Filter By Developer
                                  </div>
                                  <div className="max-h-40 overflow-y-auto space-y-0.5 text-xs pr-1">
                                    {(!headerSearchQuery || 'all developers'.includes(headerSearchQuery.toLowerCase())) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedDeveloper('All');
                                          setActiveHeaderDropdown(null);
                                        }}
                                        className={`w-full px-2.5 py-1.5 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                                          selectedDeveloper === 'All'
                                            ? 'bg-amber-50 font-bold text-amber-900'
                                            : 'text-zinc-700 hover:bg-zinc-100'
                                        }`}
                                      >
                                        <span>All Developers</span>
                                        {selectedDeveloper === 'All' && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                                      </button>
                                    )}

                                    {filteredHeaderDevelopers.map((dev) => {
                                      const isSelected = selectedDeveloper.toLowerCase() === dev.toLowerCase();
                                      return (
                                        <button
                                          key={dev}
                                          type="button"
                                          onClick={() => {
                                            setSelectedDeveloper(isSelected ? 'All' : dev);
                                            setActiveHeaderDropdown(null);
                                          }}
                                          className={`w-full px-2.5 py-1.5 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                                            isSelected
                                              ? 'bg-amber-50 font-bold text-amber-900'
                                              : 'text-zinc-700 hover:bg-zinc-100'
                                          }`}
                                        >
                                          <span className="truncate">{dev}</span>
                                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                                        </button>
                                      );
                                    })}

                                    {filteredHeaderDevelopers.length === 0 && headerSearchQuery && (
                                      <div className="p-3 text-center text-xs text-zinc-400">
                                        No developers matching "{headerSearchQuery}"
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {(selectedDeveloper !== 'All' || ['name_asc', 'name_desc', 'developer_asc'].includes(sortBy)) && (
                                <div className="pt-2 mt-2 border-t border-zinc-100 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDeveloper('All');
                                      setSortBy('relevance');
                                      setActiveHeaderDropdown(null);
                                    }}
                                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                                  >
                                    Reset Developer &amp; Sort
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </th>

                        {/* 2. Locality */}
                        <th className="px-5 py-3 relative">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveHeaderDropdown(activeHeaderDropdown === 'locality' ? null : 'locality');
                                setHeaderSearchQuery('');
                              }}
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                selectedLocality !== 'All' || ['locality_asc', 'locality_desc'].includes(sortBy)
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'text-zinc-700 hover:bg-zinc-100'
                              }`}
                            >
                              <span>Locality</span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  activeHeaderDropdown === 'locality' ? 'rotate-180 text-amber-600' : 'text-zinc-500'
                                }`}
                              />
                            </button>

                            {selectedLocality !== 'All' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                <span>{selectedLocality}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedLocality('All');
                                  }}
                                  className="text-amber-700 hover:text-black cursor-pointer font-black"
                                  title="Clear location filter"
                                >
                                  ×
                                </button>
                              </span>
                            )}
                          </div>

                          {/* Popover */}
                          {activeHeaderDropdown === 'locality' && (
                            <div
                              ref={headerDropdownRef}
                              className="absolute left-3 top-full mt-1.5 w-64 sm:w-72 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-zinc-200 ring-1 ring-black/5 p-2.5 z-[90] animate-in fade-in zoom-in-95 duration-150 font-normal select-none text-left"
                            >
                              {/* Small Search Box */}
                              <div className="relative mb-2">
                                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                  type="text"
                                  autoFocus
                                  value={headerSearchQuery}
                                  onChange={(e) => setHeaderSearchQuery(e.target.value)}
                                  placeholder="Search locality (e.g. Baner, Wakad)..."
                                  className="w-full pl-8 pr-7 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-amber-400 focus:bg-white transition"
                                />
                                {headerSearchQuery && (
                                  <button
                                    type="button"
                                    onClick={() => setHeaderSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs font-bold cursor-pointer"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>

                              {/* Quick Sort Actions */}
                              <div className="pb-1.5 mb-1.5 border-b border-zinc-100 flex items-center justify-between text-[11px]">
                                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Sort:</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSortBy(sortBy === 'locality_asc' ? 'relevance' : 'locality_asc');
                                      setActiveHeaderDropdown(null);
                                    }}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                      sortBy === 'locality_asc' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                                    }`}
                                  >
                                    A → Z
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSortBy(sortBy === 'locality_desc' ? 'relevance' : 'locality_desc');
                                      setActiveHeaderDropdown(null);
                                    }}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                      sortBy === 'locality_desc' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                                    }`}
                                  >
                                    Z → A
                                  </button>
                                </div>
                              </div>

                              {/* Scrollable Localities List */}
                              <div className="max-h-52 overflow-y-auto space-y-0.5 text-xs pr-1">
                                {(!headerSearchQuery || 'all locations'.includes(headerSearchQuery.toLowerCase())) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedLocality('All');
                                      setActiveHeaderDropdown(null);
                                    }}
                                    className={`w-full px-2.5 py-1.5 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                                      selectedLocality === 'All'
                                        ? 'bg-amber-50 font-bold text-amber-900'
                                        : 'text-zinc-700 hover:bg-zinc-100'
                                    }`}
                                  >
                                    <span>All Locations (Default)</span>
                                    {selectedLocality === 'All' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                                  </button>
                                )}

                                {filteredHeaderLocalities.map((loc) => {
                                  const isSelected = selectedLocality.toLowerCase() === loc.toLowerCase();
                                  return (
                                    <button
                                      key={loc}
                                      type="button"
                                      onClick={() => {
                                        setSelectedLocality(isSelected ? 'All' : loc);
                                        setActiveHeaderDropdown(null);
                                      }}
                                      className={`w-full px-2.5 py-1.5 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                                        isSelected
                                          ? 'bg-amber-50 font-bold text-amber-900'
                                          : 'text-zinc-700 hover:bg-zinc-100'
                                      }`}
                                    >
                                      <span className="truncate">{loc}</span>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                                    </button>
                                  );
                                })}

                                {filteredHeaderLocalities.length === 0 && headerSearchQuery && (
                                  <div className="p-3 text-center text-xs text-zinc-400">
                                    No localities matching "{headerSearchQuery}"
                                  </div>
                                )}
                              </div>

                              {(selectedLocality !== 'All' || ['locality_asc', 'locality_desc'].includes(sortBy)) && (
                                <div className="pt-2 mt-2 border-t border-zinc-100 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedLocality('All');
                                      if (['locality_asc', 'locality_desc'].includes(sortBy)) setSortBy('relevance');
                                      setActiveHeaderDropdown(null);
                                    }}
                                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                                  >
                                    Reset Filter &amp; Sort
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </th>

                        {/* 3. Typography */}
                        <th className="px-5 py-3 relative">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveHeaderDropdown(activeHeaderDropdown === 'typography' ? null : 'typography');
                                setHeaderSearchQuery('');
                              }}
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                selectedBhk !== 'All' ||
                                ['typography_asc', 'typography_desc'].includes(sortBy)
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'text-zinc-700 hover:bg-zinc-100'
                              }`}
                            >
                              <span>Typology</span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  activeHeaderDropdown === 'typography' ? 'rotate-180 text-amber-600' : 'text-zinc-500'
                                }`}
                              />
                            </button>

                            {selectedBhk !== 'All' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                <span>{selectedBhk}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBhk('All');
                                  }}
                                  className="text-amber-700 hover:text-black cursor-pointer font-black"
                                  title="Clear configuration filter"
                                >
                                  ×
                                </button>
                              </span>
                            )}

                            {['typography_asc', 'typography_desc'].includes(sortBy) && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                <span>{sortBy === 'typography_asc' ? 'A → Z' : 'Z → A'}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSortBy('relevance');
                                  }}
                                  className="text-amber-700 hover:text-black cursor-pointer font-black"
                                  title="Clear sort"
                                >
                                  ×
                                </button>
                              </span>
                            )}
                          </div>

                          {/* Popover */}
                          {activeHeaderDropdown === 'typography' && (
                            <div
                              ref={headerDropdownRef}
                              className="absolute left-3 top-full mt-1.5 w-72 sm:w-80 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-zinc-200 ring-1 ring-black/5 p-2.5 z-[90] animate-in fade-in zoom-in-95 duration-150 font-normal select-none text-left"
                            >
                              {/* Small Search Box */}
                              <div className="relative mb-2">
                                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                  type="text"
                                  autoFocus
                                  value={headerSearchQuery}
                                  onChange={(e) => setHeaderSearchQuery(e.target.value)}
                                  placeholder="Search typology (e.g. 3 BHK, Office)..."
                                  className="w-full pl-8 pr-7 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-amber-400 focus:bg-white transition"
                                />
                                {headerSearchQuery && (
                                  <button
                                    type="button"
                                    onClick={() => setHeaderSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs font-bold cursor-pointer"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>

                              {/* Quick Sort Actions */}
                              <div className="pb-1.5 mb-1.5 border-b border-zinc-100 flex items-center justify-between text-[11px]">
                                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Sort:</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSortBy(sortBy === 'typography_asc' ? 'relevance' : 'typography_asc');
                                      setActiveHeaderDropdown(null);
                                    }}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                      sortBy === 'typography_asc' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                                    }`}
                                  >
                                    A → Z
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSortBy(sortBy === 'typography_desc' ? 'relevance' : 'typography_desc');
                                      setActiveHeaderDropdown(null);
                                    }}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                      sortBy === 'typography_desc' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                                    }`}
                                  >
                                    Z → A
                                  </button>
                                </div>
                              </div>

                              {/* Scrollable Typologies List */}
                              <div className="max-h-52 overflow-y-auto space-y-0.5 text-xs pr-1">
                                {(!headerSearchQuery || 'all configurations'.includes(headerSearchQuery.toLowerCase())) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedBhk('All');
                                      setActiveHeaderDropdown(null);
                                    }}
                                    className={`w-full px-2.5 py-1.5 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                                      selectedBhk === 'All'
                                        ? 'bg-amber-50 font-bold text-amber-900'
                                        : 'text-zinc-700 hover:bg-zinc-100'
                                    }`}
                                  >
                                    <span>All Configurations (Default)</span>
                                    {selectedBhk === 'All' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                                  </button>
                                )}

                                {filteredHeaderTypologies.map((t) => {
                                  const isSelected = selectedBhk.toLowerCase() === t.value.toLowerCase();
                                  return (
                                    <button
                                      key={t.value}
                                      type="button"
                                      onClick={() => {
                                        setSelectedBhk(isSelected ? 'All' : t.value);
                                        setActiveHeaderDropdown(null);
                                      }}
                                      className={`w-full px-2.5 py-1.5 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                                        isSelected
                                          ? 'bg-amber-50 font-bold text-amber-900'
                                          : 'text-zinc-700 hover:bg-zinc-100'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 truncate">
                                        <span className="truncate">{t.label}</span>
                                        {t.group && (
                                          <span className="text-[9px] text-zinc-400 font-mono">({t.group})</span>
                                        )}
                                      </div>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                                    </button>
                                  );
                                })}

                                {filteredHeaderTypologies.length === 0 && headerSearchQuery && (
                                  <div className="p-3 text-center text-xs text-zinc-400">
                                    No typologies matching "{headerSearchQuery}"
                                  </div>
                                )}
                              </div>

                              {(selectedBhk !== 'All' ||
                                ['typography_asc', 'typography_desc'].includes(sortBy)) && (
                                <div className="pt-2 mt-2 border-t border-zinc-100 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedBhk('All');
                                      if (['typography_asc', 'typography_desc'].includes(sortBy)) {
                                        setSortBy('relevance');
                                      }
                                      setActiveHeaderDropdown(null);
                                    }}
                                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                                  >
                                    Reset Filter &amp; Sort
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </th>

                        {/* 4. Price */}
                        <th className="px-5 py-3 relative">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveHeaderDropdown(activeHeaderDropdown === 'price' ? null : 'price');
                                setHeaderSearchQuery('');
                              }}
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                selectedPriceRange !== 'All' || sortBy === 'price_high'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'text-zinc-700 hover:bg-zinc-100'
                              }`}
                            >
                              <span>Price</span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  activeHeaderDropdown === 'price' ? 'rotate-180 text-amber-600' : 'text-zinc-500'
                                }`}
                              />
                            </button>

                            {sortBy === 'price_high' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                <span>High → Low</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSortBy('price_low');
                                  }}
                                  className="text-amber-700 hover:text-black cursor-pointer font-black"
                                  title="Reset price sort"
                                >
                                  ×
                                </button>
                              </span>
                            )}

                            {selectedPriceRange !== 'All' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                <span>{selectedPriceRange}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPriceRange('All');
                                  }}
                                  className="text-amber-700 hover:text-black cursor-pointer font-black"
                                  title="Clear price filter"
                                >
                                  ×
                                </button>
                              </span>
                            )}

                            {selectedStatus !== 'All' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                <span>{selectedStatus}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedStatus('All');
                                  }}
                                  className="text-amber-700 hover:text-black cursor-pointer font-black"
                                  title="Clear status filter"
                                >
                                  ×
                                </button>
                              </span>
                            )}
                          </div>

                          {/* Dedicated Price Sort & Filter Popover */}
                          {activeHeaderDropdown === 'price' && (
                            <div
                              ref={headerDropdownRef}
                              className="absolute right-0 top-full mt-1.5 w-64 sm:w-72 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-zinc-200 ring-1 ring-black/5 p-3 z-[90] animate-in fade-in zoom-in-95 duration-150 font-normal select-none text-left space-y-3 text-zinc-900"
                            >
                              {/* Header */}
                              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                                <div className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                                  <Tag className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Sort &amp; Filter Price</span>
                                </div>
                                {(sortBy !== 'price_low' || selectedPriceRange !== 'All') && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSortBy('price_low');
                                      setSelectedPriceRange('All');
                                      setActiveHeaderDropdown(null);
                                    }}
                                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                                  >
                                    Reset Price
                                  </button>
                                )}
                              </div>

                              {/* Price Sort Order */}
                              <div>
                                <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1.5">
                                  Sort By Price
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSortBy('price_low');
                                      setActiveHeaderDropdown(null);
                                    }}
                                    className={`px-2.5 py-2 rounded-xl text-left transition flex items-center justify-between cursor-pointer ${
                                      sortBy === 'price_low'
                                        ? 'bg-amber-500 font-black text-zinc-950 shadow-xs'
                                        : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200/80'
                                    }`}
                                  >
                                    <span>Low to High</span>
                                    {sortBy === 'price_low' && <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSortBy('price_high');
                                      setActiveHeaderDropdown(null);
                                    }}
                                    className={`px-2.5 py-2 rounded-xl text-left transition flex items-center justify-between cursor-pointer ${
                                      sortBy === 'price_high'
                                        ? 'bg-amber-500 font-black text-zinc-950 shadow-xs'
                                        : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200/80'
                                    }`}
                                  >
                                    <span>High to Low</span>
                                    {sortBy === 'price_high' && <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />}
                                  </button>
                                </div>
                              </div>

                              {/* Filter by Budget / Price Range */}
                              {filterOptions?.priceRanges && filterOptions.priceRanges.length > 0 && (
                                <div className="pt-2 border-t border-zinc-100">
                                  <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1.5">
                                    Filter By Budget / Price
                                  </div>
                                  <div className="space-y-1 text-xs">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedPriceRange('All');
                                        setActiveHeaderDropdown(null);
                                      }}
                                      className={`w-full px-2.5 py-1.5 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                                        selectedPriceRange === 'All'
                                          ? 'bg-amber-50 font-bold text-amber-900'
                                          : 'text-zinc-700 hover:bg-zinc-100'
                                      }`}
                                    >
                                      <span>All Budgets (Default)</span>
                                      {selectedPriceRange === 'All' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                                    </button>

                                    {filterOptions.priceRanges.map((range) => {
                                      const isSelected = selectedPriceRange === range.value;
                                      return (
                                        <button
                                          key={range.value}
                                          type="button"
                                          onClick={() => {
                                            setSelectedPriceRange(isSelected ? 'All' : range.value);
                                            setActiveHeaderDropdown(null);
                                          }}
                                          className={`w-full px-2.5 py-1.5 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                                            isSelected
                                              ? 'bg-amber-50 font-bold text-amber-900'
                                              : 'text-zinc-700 hover:bg-zinc-100'
                                          }`}
                                        >
                                          <span>{range.label}</span>
                                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </th>

                        {/* 5. Site Visit */}
                        <th className="px-5 py-3 text-right font-bold text-zinc-700 whitespace-nowrap">Site Visit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {displayedComparisonProperties.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-amber-50/50 transition-colors group"
                        >
                          {/* 1. Property & Developer - ONLY hovering this area opens the preview card */}
                          <td
                            className="px-5 py-3.5 cursor-pointer"
                            onMouseEnter={(e) => handleTablePropertyHover(e, row)}
                            onMouseMove={(e) => {
                              if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                              if (!hoveredTableProperty || hoveredTableProperty.property.id !== row.id) {
                                handleTablePropertyHover(e, row);
                              }
                            }}
                            onMouseLeave={handleTablePropertyLeave}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  openPropertyGallery(row, 'photos');
                                }}
                                className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-zinc-200 hover:border-amber-500 hover:ring-2 hover:ring-amber-400/30 shadow-2xs bg-zinc-100 block group/thumb cursor-pointer text-left"
                                title={`Click to view photo & video gallery for ${row.name}`}
                              >
                                <Image
                                  src={
                                    row.image ||
                                    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                                  }
                                  alt={row.name}
                                  fill
                                  unoptimized
                                  className="object-cover group-hover/thumb:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="w-6 h-6 rounded-lg bg-black/70 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 shadow-xs">
                                    <Expand className="w-3.5 h-3.5 text-white drop-shadow stroke-[2.5]" />
                                  </div>
                                </div>
                              </button>
                              <div className="min-w-0">
                                <Link
                                  href={getPropertyUrl(row)}
                                  className="font-bold text-zinc-900 group-hover:text-amber-700 hover:underline block truncate max-w-xs sm:max-w-sm transition-colors"
                                >
                                  <span className="inline-flex items-center gap-1.5 flex-wrap">
                                    <span className="truncate">{row.name}</span>
                                    {row.hideName && (
                                      <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                        Confidential
                                      </span>
                                    )}
                                  </span>
                                </Link>
                                {row.developer &&
                                  !/anv\s*(signature\s*partner|verified\s*developer|partner\s*developer)/i.test(row.developer) && (
                                    <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                                      {row.developer}
                                    </div>
                                  )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5" onMouseEnter={handleTablePropertyLeave}>
                            <span className="font-semibold text-zinc-800">{row.locality || 'Pune'}</span>
                          </td>
                          <td className="px-5 py-3.5" onMouseEnter={handleTablePropertyLeave}>
                            {(() => {
                              const rawVal = row.configuration || row.bhk || '';
                              const isPreleased = /\b(?:preleased|pre-leased)\b/i.test(rawVal);
                              const isPreLaunch = /\b(?:prelaunch|pre-launch)\b/i.test(rawVal);
                              const isNew = /\bnew\b/i.test(rawVal);
                              const baseCategory = rawVal
                                .replace(/\s*\((?:Preleased|New|PreLaunch|Pre-Launch)\)\s*/gi, '')
                                .replace(/^(?:Preleased|Pre-Leased|New|PreLaunch|Pre-Launch)\s+/gi, '')
                                .trim();

                              return (
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-zinc-800">{baseCategory || rawVal}</span>
                                    {isPreleased && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                        Preleased
                                      </span>
                                    )}
                                    {isPreLaunch && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-100 text-purple-900 border border-purple-300">
                                        PreLaunch
                                      </span>
                                    )}
                                    {isNew && !isPreleased && !isPreLaunch && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                                        New
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-zinc-400 font-medium">{cleanSqft(row.sqft)}</div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-5 py-3.5" onMouseEnter={handleTablePropertyLeave}>
                            <div className="font-black text-zinc-950">{formatPriceDisplay(row.price)}</div>
                            <div className="text-[10px] text-zinc-400">{row.status}</div>
                          </td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap" onMouseEnter={handleTablePropertyLeave}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPropertyForSiteVisit(row);
                                setSiteVisitModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 group"
                              title={`Book VIP Site Visit for ${row.name}`}
                            >
                              <Calendar className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />
                              <span>Site Visit</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ================= MOBILE VIEW: RESPONSIVE CARDS (ZERO HORIZONTAL SCROLL) ================= */}
                <div className="sm:hidden w-full bg-white divide-y divide-zinc-100">
                  {/* Mobile Property List Cards */}

                  {/* Mobile Property List Cards */}
                  {displayedComparisonProperties.length === 0 ? (
                    <div className="p-8 text-center bg-zinc-50/50">
                      <Building2 className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-zinc-700">No properties match your active filters.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLocality('All');
                          setSelectedBhk('All');
                          setSelectedStatus('All');
                          setSelectedDeveloper('All');
                          setSortBy('price_low');
                        }}
                        className="mt-3 text-xs font-bold text-amber-700 hover:text-amber-800 underline cursor-pointer"
                      >
                        Reset all filters
                      </button>
                    </div>
                  ) : (
                    displayedComparisonProperties.map((row) => (
                      <div key={row.id} className="p-3.5 bg-white space-y-2.5 hover:bg-amber-50/30 transition-colors">
                        {/* 1. Property & Developer */}
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openPropertyGallery(row, 'photos');
                            }}
                            className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-zinc-200 shadow-2xs bg-zinc-100 block group/thumb cursor-pointer text-left active:scale-95 transition-transform"
                            title={`Click to view photo & video gallery for ${row.name}`}
                          >
                            <Image
                              src={
                                row.image ||
                                'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                              }
                              alt={row.name}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                              <div className="w-6 h-6 rounded-lg bg-black/70 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 shadow-xs">
                                <Expand className="w-3.5 h-3.5 text-white drop-shadow stroke-[2.5]" />
                              </div>
                            </div>
                          </button>

                          <div className="flex-1 min-w-0">
                            <Link
                              href={getPropertyUrl(row)}
                              className="font-bold text-zinc-950 text-sm leading-snug line-clamp-2 hover:text-amber-700 active:text-amber-800 transition-colors"
                            >
                              <span className="inline-flex items-center gap-1.5 flex-wrap">
                                <span>{row.name}</span>
                                {row.hideName && (
                                  <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                    Confidential
                                  </span>
                                )}
                              </span>
                            </Link>
                            {row.developer &&
                              !/anv\s*(signature\s*partner|verified\s*developer|partner\s*developer)/i.test(row.developer) && (
                                <div className="text-[11px] text-zinc-500 font-medium truncate mt-0.5 flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-zinc-400 shrink-0" />
                                  <span>{row.developer}</span>
                                </div>
                              )}
                          </div>
                        </div>

                        {/* 2. Directly down to Property & Developer: Locality, Typography, Price & Status */}
                        <div className="grid grid-cols-2 gap-2 bg-zinc-50/90 p-2.5 rounded-xl border border-zinc-100 text-xs">
                          {/* Locality */}
                          <div>
                            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Locality</span>
                            <div className="flex items-center gap-1 font-semibold text-zinc-800 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="truncate">{row.locality || 'Pune'}</span>
                            </div>
                          </div>

                          {/* Typology */}
                          <div>
                            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Typology</span>
                            <div className="font-bold text-zinc-900 truncate mt-0.5">{row.configuration || row.bhk}</div>
                            {row.sqft && <div className="text-[10px] text-zinc-400 font-medium">{cleanSqft(row.sqft)}</div>}
                          </div>

                          {/* Price */}
                          <div className="pt-1.5 border-t border-zinc-200/60">
                            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Price</span>
                            <div className="font-black text-zinc-950 text-sm mt-0.5">{formatPriceDisplay(row.price)}</div>
                          </div>

                          {/* Status */}
                          <div className="pt-1.5 border-t border-zinc-200/60">
                            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Status</span>
                            <div className="mt-0.5">
                              <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                                {row.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Site Visit icon & button */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPropertyForSiteVisit(row);
                              setSiteVisitModalOpen(true);
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-black text-xs shadow-xs transition-all cursor-pointer"
                            title={`Book VIP Site Visit for ${row.name}`}
                          >
                            <Calendar className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />
                            <span>Site Visit</span>
                          </button>

                          <Link
                            href={getPropertyUrl(row)}
                            className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-800 font-bold text-xs transition-all cursor-pointer"
                            title="Explore property"
                          >
                            <span>Explore</span>
                            <ArrowRight className="w-3 h-3 text-zinc-600" />
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* FLOATING HOVER DETAILS PREVIEW CARD */}
                {hoveredTableProperty && (
                  <div
                    style={{
                      position: 'fixed',
                      top: `${hoveredTableProperty.y}px`,
                      left: `${hoveredTableProperty.x}px`,
                      width: '350px',
                      maxHeight: 'min(450px, calc(100vh - 90px))'
                    }}
                    className="hidden sm:flex z-[75] bg-white rounded-2xl shadow-2xl border border-amber-300/90 ring-1 ring-black/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex-col pointer-events-auto"
                    onMouseEnter={() => {
                      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                    }}
                    onMouseLeave={() => {
                      hoverTimerRef.current = setTimeout(() => {
                        setHoveredTableProperty(null);
                      }, 220);
                    }}
                  >
                    {/* Top Preview Image */}
                    <div
                      className="relative w-full h-32 bg-zinc-950 overflow-hidden shrink-0 cursor-pointer group/hoverimg"
                      onClick={() => {
                        openPropertyGallery(hoveredTableProperty.property, 'photos');
                        setHoveredTableProperty(null);
                      }}
                      title="Click to view full photo & video gallery"
                    >
                      <Image
                        src={
                          hoveredTableProperty.property.image ||
                          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                        }
                        alt={hoveredTableProperty.property.name}
                        fill
                        unoptimized
                        className="object-cover group-hover/hoverimg:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                      {/* Badges on preview image */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md shadow-xs ${hoveredTableProperty.property.isCommercial ||
                              hoveredTableProperty.property.bhk.includes('Commercial')
                              ? 'bg-blue-950/90 text-blue-200 border border-blue-400/40'
                              : 'bg-zinc-950/90 text-amber-300 border border-amber-500/40'
                            }`}
                        >
                          {hoveredTableProperty.property.isCommercial ||
                            hoveredTableProperty.property.bhk.includes('Commercial')
                            ? 'Commercial'
                            : 'Verified Listing'}
                        </span>
                      </div>

                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-900/90 text-white backdrop-blur-md uppercase tracking-wider">
                          {hoveredTableProperty.property.status}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-md uppercase tracking-wider group-hover/hoverimg:bg-amber-500 group-hover/hoverimg:text-zinc-950 transition-colors flex items-center gap-1">
                          <Expand className="w-3 h-3" />
                          <span>Expand</span>
                        </span>
                      </div>

                      {/* Price on preview image */}
                      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white">
                        <div className="text-lg font-black text-white tracking-tight drop-shadow-sm">
                          {formatPriceDisplay(hoveredTableProperty.property.price)}
                        </div>
                      </div>
                    </div>

                    {/* Details Content Body */}
                    <div className="p-3 flex flex-col gap-2 overflow-y-auto max-h-full">
                      <div>
                        <h4 className="font-extrabold text-sm text-zinc-950 line-clamp-1 flex items-center gap-1.5">
                          <span className="truncate">{hoveredTableProperty.property.name}</span>
                          {hoveredTableProperty.property.hideName && (
                            <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              Confidential
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-500 mt-0.5">
                          <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate">{hoveredTableProperty.property.location}</span>
                        </div>
                      </div>

                      {/* Specifications Grid */}
                      <div className="grid grid-cols-2 gap-1.5 p-2 bg-zinc-50 rounded-xl border border-zinc-100 text-xs">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">Typology</span>
                          <span className="font-extrabold text-zinc-900 truncate block text-[11px]">
                            {hoveredTableProperty.property.configuration || hoveredTableProperty.property.bhk}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">Carpet Area</span>
                          <span className="font-extrabold text-zinc-900 block text-[11px]">
                            {cleanSqft(hoveredTableProperty.property.sqft)}
                          </span>
                        </div>
                        {hoveredTableProperty.property.developer &&
                          !/anv\s*(signature\s*partner|verified\s*developer|partner\s*developer)/i.test(hoveredTableProperty.property.developer) && (
                            <div>
                              <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">Developer</span>
                              <span className="font-semibold text-zinc-800 truncate block text-[11px]">
                                {hoveredTableProperty.property.developer}
                              </span>
                            </div>
                          )}
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">MahaRERA</span>
                          <span className="font-mono font-bold text-emerald-700 text-[10px] truncate block">
                            {hoveredTableProperty.property.reraNumber || 'Verified Registered'}
                          </span>
                        </div>
                      </div>

                      {/* Short Description */}
                      <p className="text-[11px] text-zinc-600 line-clamp-2 leading-relaxed">
                        {hoveredTableProperty.property.description}
                      </p>

                      {/* Quick Action Buttons */}
                      <div className="flex items-center gap-2 pt-1 border-t border-zinc-100 shrink-0 mt-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDetailsProperty(hoveredTableProperty.property);
                            setDetailsModalOpen(true);
                            setHoveredTableProperty(null);
                          }}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Quick Specs</span>
                        </button>
                        <Link
                          href={getPropertyUrl(hoveredTableProperty.property)}
                          className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition flex items-center justify-center gap-1 shadow-xs active:scale-95"
                        >
                          <span>Explore</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show More / Show Less for Comparison Table (Top 4 initially) */}
                {sortedProperties.length > 4 && (
                  <div className="p-4 bg-zinc-50 border-t border-zinc-200 text-center flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setShowAllComparison(!showAllComparison)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition shadow-sm cursor-pointer group"
                    >
                      <span>
                        {showAllComparison
                          ? 'Show Less Comparison (Show Top 4)'
                          : `Show More Comparison (${sortedProperties.length - 4} More Properties)`}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-amber-400 transition-transform duration-200 ${showAllComparison ? 'rotate-180' : ''
                          }`}
                      />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ================= 2. PROPERTY PREVIEW CARDS (SEEN SECOND, 2 INITIALLY + SHOW MORE) ================= */}
            {sortedProperties.length > 0 ? (
              (propertyViewMode === 'paragraph' || propertyViewMode === 'both') ? (
                <div id="properties-showcase-container" className="space-y-6">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-200/80">
                    <h3 className="text-sm sm:text-base font-extrabold text-zinc-950 tracking-tight flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-amber-500" />
                      <span>Property Showcase {propertyViewMode === 'paragraph' ? '(Paragraph Type)' : ''}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {sortedProperties.length} Available
                      </span>
                    </h3>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {/* Sort Icon Button for Cards View - Mobile Only (hidden on laptop/desktop) */}
                      <div className="relative sm:hidden">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveHeaderDropdown(activeHeaderDropdown === 'sort_cards' ? null : 'sort_cards');
                            setHeaderSearchQuery('');
                          }}
                          className={`p-1.5 sm:px-2 sm:py-1.5 rounded-xl transition flex items-center justify-center gap-1 shadow-xs cursor-pointer ${
                            sortBy !== 'price_low'
                              ? 'bg-amber-400 text-zinc-950 font-black ring-1 ring-amber-300'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200'
                          }`}
                          title={`Sort properties (Active: ${getSortLabel(sortBy)})`}
                          aria-label="Sort properties"
                        >
                          <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy !== 'price_low' ? 'text-zinc-950' : 'text-amber-600'}`} />
                        </button>

                        {activeHeaderDropdown === 'sort_cards' && (
                          <div
                            ref={headerDropdownRef}
                            className="absolute right-0 top-full mt-2 z-[90] w-[calc(100vw-32px)] sm:w-88 max-w-sm"
                          >
                            {renderSortDropdownContent()}
                          </div>
                        )}
                      </div>

                      {/* View Switcher Pill in Cards Header */}
                      <div className="inline-flex items-center p-0.5 bg-zinc-100 rounded-xl border border-zinc-200">
                        <button
                          type="button"
                          onClick={() => setPropertyViewMode('table')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            isViewMode('table')
                              ? 'bg-zinc-950 text-white font-black shadow-xs'
                              : 'text-zinc-600 hover:text-zinc-950'
                          }`}
                          title="Switch to Table Type"
                        >
                          <Table className="w-3.5 h-3.5 text-amber-500" />
                          <span className="hidden sm:inline">Table Type</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPropertyViewMode('paragraph')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            isViewMode('paragraph')
                              ? 'bg-zinc-950 text-white font-black shadow-xs'
                              : 'text-zinc-600 hover:text-zinc-950'
                          }`}
                          title="Switch to Paragraph Type"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-500" />
                          <span className="hidden sm:inline">Paragraph Type</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPropertyViewMode('both')}
                          className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            isViewMode('both')
                              ? 'bg-zinc-950 text-white font-black shadow-xs'
                              : 'text-zinc-600 hover:text-zinc-950'
                          }`}
                          title="Show Both Table & Paragraph"
                        >
                          <Layers className="w-3.5 h-3.5 text-amber-500" />
                          <span className="hidden sm:inline">Both</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {displayedCardProperties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        onInstantEnquiry={handleInstantEnquiry}
                        onQuickView={(p) => {
                          setSelectedDetailsProperty(p);
                          setDetailsModalOpen(true);
                        }}
                        onOpenGallery={openPropertyGallery}
                      />
                    ))}
                  </div>

                  {/* Show More / Show Less for Property Cards (Top 2 initially when viewing Both) */}
                  {propertyViewMode === 'both' && sortedProperties.length > 2 && (
                    <div className="pt-2 text-center flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setShowAllCards(!showAllCards)}
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-sm font-black transition shadow-md hover:shadow-lg cursor-pointer group"
                      >
                        <span>
                          {showAllCards
                            ? 'Show Less Properties (Show Top 2)'
                            : `Show All Properties (${sortedProperties.length - 2} More Available)`}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-zinc-950 transition-transform duration-200 ${showAllCards ? 'rotate-180' : ''
                            }`}
                        />
                      </button>
                    </div>
                  )}
                </div>
              ) : null
            ) : isUserSeller(catalogueSearch || searchQuery) ? (
              <div className="bg-amber-50/70 rounded-3xl border border-amber-300/80 p-8 sm:p-10 text-center space-y-4 shadow-sm w-full max-w-2xl mx-auto my-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center mx-auto shadow-2xs">
                  <Users className="w-7 h-7 text-amber-700" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                    Seller Query Detected
                  </h3>
                  <p className="text-zinc-600 text-xs sm:text-sm font-medium">
                    Looking for buyers for your property? Active buyers are displayed in the <strong>Buyers Table</strong> right below.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href="#buyers-section"
                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black px-6 py-3 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Scroll to Buyer Table ({filteredCatalogueBuyerDemands.length} Buyers)</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBuyerRefForConnect(undefined);
                      setSelectedBuyerSummaryForConnect(undefined);
                      setSellerModalOpen(true);
                    }}
                    className="w-full sm:w-auto bg-zinc-950 hover:bg-zinc-800 text-white font-bold px-6 py-3 rounded-xl text-xs transition cursor-pointer"
                  >
                    Register My Property
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-zinc-200/90 p-10 sm:p-14 text-center space-y-6 shadow-sm w-full max-w-xl mx-auto my-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
                  <Search className="w-8 h-8 text-amber-600" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
                    0 Properties Found
                  </h3>
                  <p className="text-zinc-500 text-sm font-medium">
                    Please modify your search
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setRequirementModalOpen(true)}
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black px-8 py-3.5 rounded-xl text-sm shadow-md hover:shadow-lg transition cursor-pointer"
                  >
                    Please Fill Your Requirement
                  </button>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-zinc-500 hover:text-zinc-900 px-4 py-2 transition cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ================= SECTION 2: BUYERS ================= */}
          <div id="buyers-section" className="space-y-8 pt-12 border-t border-zinc-200/90">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
                  Active Buyers
                </h3>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBuyerRefForConnect(undefined);
                    setSelectedBuyerSummaryForConnect(undefined);
                    setSellerModalOpen(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold px-5 py-2.5 rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Register Property to Match Buyers</span>
                </button>
              </div>
            </div>

            {/* ================= BUYERS COMPARISON TABLE ================= */}
            {sortedBuyerDemands.length > 0 ? (
              <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden w-full max-w-full">
                <div className="bg-zinc-950 p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 tracking-tight text-white">
                      <Users className="w-5 h-5 text-amber-400" />
                      <span>
                        {sortedBuyerDemands.length} {sortedBuyerDemands.length === 1 ? 'Buyer' : 'Buyers'} Found
                      </span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBuyerRefForConnect(undefined);
                        setSelectedBuyerSummaryForConnect(undefined);
                        setSellerModalOpen(true);
                      }}
                      className="text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Match My Property</span>
                    </button>
                  </div>
                </div>

                <div className="hidden sm:block overflow-x-auto text-xs w-full">
                  <table className="w-full text-left min-w-[760px]">
                    <thead className="bg-zinc-50 text-zinc-600 font-bold border-b border-zinc-200">
                      <tr>
                        {/* 1. Buyer & Reference */}
                        <th className="px-5 py-3">
                          <span className="font-bold text-zinc-700 whitespace-nowrap">Buyer & Reference</span>
                        </th>

                        {/* 2. Target Locality */}
                        <th className="px-5 py-3 relative">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveHeaderDropdown(activeHeaderDropdown === 'buyer_locality' ? null : 'buyer_locality');
                                setHeaderSearchQuery('');
                              }}
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                buyerLocalityFilter !== 'All' || ['locality_asc', 'locality_desc'].includes(buyerSortBy)
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'text-zinc-700 hover:bg-zinc-100'
                              }`}
                            >
                              <span>Target Locality</span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  activeHeaderDropdown === 'buyer_locality' ? 'rotate-180 text-amber-600' : 'text-zinc-500'
                                }`}
                              />
                            </button>

                            {buyerLocalityFilter !== 'All' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                <span>{buyerLocalityFilter}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setBuyerLocalityFilter('All');
                                  }}
                                  className="text-amber-700 hover:text-black cursor-pointer font-black"
                                  title="Clear location filter"
                                >
                                  ×
                                </button>
                              </span>
                            )}
                          </div>

                          {/* Popover */}
                          {activeHeaderDropdown === 'buyer_locality' && (
                            <div
                              ref={headerDropdownRef}
                              className="absolute left-3 top-full mt-1.5 w-64 sm:w-72 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-zinc-200 ring-1 ring-black/5 p-2.5 z-[90] animate-in fade-in zoom-in-95 duration-150 font-normal select-none text-left"
                            >
                              {/* Small Search Box */}
                              <div className="relative mb-2">
                                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                  type="text"
                                  autoFocus
                                  value={headerSearchQuery}
                                  onChange={(e) => setHeaderSearchQuery(e.target.value)}
                                  placeholder="Search target locality..."
                                  className="w-full pl-8 pr-7 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-amber-400 focus:bg-white transition"
                                />
                                {headerSearchQuery && (
                                  <button
                                    type="button"
                                    onClick={() => setHeaderSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs font-bold cursor-pointer"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>

                              {/* Quick Sort Actions */}
                              <div className="pb-1.5 mb-1.5 border-b border-zinc-100 flex items-center justify-between text-[11px]">
                                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Sort:</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBuyerSortBy(buyerSortBy === 'locality_asc' ? 'relevance' : 'locality_asc');
                                      setActiveHeaderDropdown(null);
                                    }}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                      buyerSortBy === 'locality_asc' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                                    }`}
                                  >
                                    A → Z
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBuyerSortBy(buyerSortBy === 'locality_desc' ? 'relevance' : 'locality_desc');
                                      setActiveHeaderDropdown(null);
                                    }}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                      buyerSortBy === 'locality_desc' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                                    }`}
                                  >
                                    Z → A
                                  </button>
                                </div>
                              </div>

                              {/* Scrollable Localities List */}
                              <div className="max-h-52 overflow-y-auto space-y-0.5 text-xs pr-1">
                                {(!headerSearchQuery || 'all locations'.includes(headerSearchQuery.toLowerCase())) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBuyerLocalityFilter('All');
                                      setActiveHeaderDropdown(null);
                                    }}
                                    className={`w-full px-2.5 py-1.5 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                                      buyerLocalityFilter === 'All'
                                        ? 'bg-amber-50 font-bold text-amber-900'
                                        : 'text-zinc-700 hover:bg-zinc-100'
                                    }`}
                                  >
                                    <span>All Locations (Default)</span>
                                    {buyerLocalityFilter === 'All' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                                  </button>
                                )}

                                {filteredHeaderLocalities.map((loc) => {
                                  const isSelected = buyerLocalityFilter.toLowerCase() === loc.toLowerCase();
                                  return (
                                    <button
                                      key={loc}
                                      type="button"
                                      onClick={() => {
                                        setBuyerLocalityFilter(isSelected ? 'All' : loc);
                                        setActiveHeaderDropdown(null);
                                      }}
                                      className={`w-full px-2.5 py-1.5 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                                        isSelected
                                          ? 'bg-amber-50 font-bold text-amber-900'
                                          : 'text-zinc-700 hover:bg-zinc-100'
                                      }`}
                                    >
                                      <span className="truncate">{loc}</span>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                                    </button>
                                  );
                                })}

                                {filteredHeaderLocalities.length === 0 && headerSearchQuery && (
                                  <div className="p-3 text-center text-xs text-zinc-400">
                                    No localities matching "{headerSearchQuery}"
                                  </div>
                                )}
                              </div>

                              {(buyerLocalityFilter !== 'All' || ['locality_asc', 'locality_desc'].includes(buyerSortBy)) && (
                                <div className="pt-2 mt-2 border-t border-zinc-100 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBuyerLocalityFilter('All');
                                      if (['locality_asc', 'locality_desc'].includes(buyerSortBy)) setBuyerSortBy('relevance');
                                      setActiveHeaderDropdown(null);
                                    }}
                                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                                  >
                                    Reset Filter &amp; Sort
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </th>

                        {/* 3. Typography */}
                        <th className="px-5 py-3 relative">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveHeaderDropdown(activeHeaderDropdown === 'buyer_typography' ? null : 'buyer_typography');
                                setHeaderSearchQuery('');
                              }}
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                buyerBhkFilter !== 'All' ||
                                ['typography_asc', 'typography_desc', 'bhk_asc', 'bhk_desc'].includes(buyerSortBy)
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'text-zinc-700 hover:bg-zinc-100'
                              }`}
                            >
                              <span>Typology</span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  activeHeaderDropdown === 'buyer_typography' ? 'rotate-180 text-amber-600' : 'text-zinc-500'
                                }`}
                              />
                            </button>

                            {buyerBhkFilter !== 'All' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                <span>{buyerBhkFilter}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setBuyerBhkFilter('All');
                                  }}
                                  className="text-amber-700 hover:text-black cursor-pointer font-black"
                                  title="Clear configuration filter"
                                >
                                  ×
                                </button>
                              </span>
                            )}
                          </div>

                          {/* Popover */}
                          {activeHeaderDropdown === 'buyer_typography' && (
                            <div
                              ref={headerDropdownRef}
                              className="absolute left-3 top-full mt-1.5 w-64 sm:w-72 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-zinc-200 ring-1 ring-black/5 p-2.5 z-[90] animate-in fade-in zoom-in-95 duration-150 font-normal select-none text-left"
                            >
                              {/* Small Search Box */}
                              <div className="relative mb-2">
                                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                  type="text"
                                  autoFocus
                                  value={headerSearchQuery}
                                  onChange={(e) => setHeaderSearchQuery(e.target.value)}
                                  placeholder="Search typology / configuration..."
                                  className="w-full pl-8 pr-7 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-amber-400 focus:bg-white transition"
                                />
                                {headerSearchQuery && (
                                  <button
                                    type="button"
                                    onClick={() => setHeaderSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs font-bold cursor-pointer"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>

                              {/* Quick Sort Actions */}
                              <div className="pb-1.5 mb-1.5 border-b border-zinc-100 flex items-center justify-between text-[11px]">
                                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Sort:</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBuyerSortBy(buyerSortBy === 'typography_asc' ? 'relevance' : 'typography_asc');
                                      setActiveHeaderDropdown(null);
                                    }}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                      buyerSortBy === 'typography_asc' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                                    }`}
                                  >
                                    A → Z
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBuyerSortBy(buyerSortBy === 'typography_desc' ? 'relevance' : 'typography_desc');
                                      setActiveHeaderDropdown(null);
                                    }}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                      buyerSortBy === 'typography_desc' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                                    }`}
                                  >
                                    Z → A
                                  </button>
                                </div>
                              </div>

                              {/* Scrollable Typologies List */}
                              <div className="max-h-52 overflow-y-auto space-y-0.5 text-xs pr-1">
                                {(!headerSearchQuery || 'all configurations'.includes(headerSearchQuery.toLowerCase())) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBuyerBhkFilter('All');
                                      setActiveHeaderDropdown(null);
                                    }}
                                    className={`w-full px-2.5 py-1.5 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                                      buyerBhkFilter === 'All'
                                        ? 'bg-amber-50 font-bold text-amber-900'
                                        : 'text-zinc-700 hover:bg-zinc-100'
                                    }`}
                                  >
                                    <span>All Configurations (Default)</span>
                                    {buyerBhkFilter === 'All' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                                  </button>
                                )}

                                {filteredHeaderTypologies.map((item) => {
                                  const isSelected = buyerBhkFilter.toLowerCase() === item.value.toLowerCase();
                                  return (
                                    <button
                                      key={item.value}
                                      type="button"
                                      onClick={() => {
                                        setBuyerBhkFilter(isSelected ? 'All' : item.value);
                                        setActiveHeaderDropdown(null);
                                      }}
                                      className={`w-full px-2.5 py-1.5 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                                        isSelected
                                          ? 'bg-amber-50 font-bold text-amber-900'
                                          : 'text-zinc-700 hover:bg-zinc-100'
                                      }`}
                                    >
                                      <span className="truncate">{item.label}</span>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                                    </button>
                                  );
                                })}

                                {filteredHeaderTypologies.length === 0 && headerSearchQuery && (
                                  <div className="p-3 text-center text-xs text-zinc-400">
                                    No typologies matching "{headerSearchQuery}"
                                  </div>
                                )}
                              </div>

                              {(buyerBhkFilter !== 'All' || ['typography_asc', 'typography_desc', 'bhk_asc', 'bhk_desc'].includes(buyerSortBy)) && (
                                <div className="pt-2 mt-2 border-t border-zinc-100 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBuyerBhkFilter('All');
                                      if (['typography_asc', 'typography_desc', 'bhk_asc', 'bhk_desc'].includes(buyerSortBy)) setBuyerSortBy('relevance');
                                      setActiveHeaderDropdown(null);
                                    }}
                                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                                  >
                                    Reset Filter &amp; Sort
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </th>

                        {/* 4. Budget & Purpose */}
                        <th className="px-5 py-3">
                          <span className="font-bold text-zinc-700 whitespace-nowrap">Budget & Purpose</span>
                        </th>

                        {/* 5. Requirement Brief */}
                        <th className="px-5 py-3">
                          <span className="font-bold text-zinc-700 whitespace-nowrap">Requirement Brief</span>
                        </th>

                        {/* 6. Action */}
                        <th className="px-5 py-3 text-right font-bold text-zinc-700 whitespace-nowrap">Match / Connect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {displayedComparisonBuyers.map((demand) => (
                        <tr key={demand.id} className="hover:bg-amber-50/30 transition">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-zinc-900">{demand.maskedName}</div>
                            <div className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded mt-0.5">
                              Ref: {demand.referenceCode}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-zinc-800">{demand.locality}</div>
                            <div className="text-[10px] text-zinc-400">Pune</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-zinc-900">{demand.bhk}</div>
                            <div className="text-[10px] text-zinc-500">Timeline: {demand.timeline}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-black text-amber-700">{demand.budget}</div>
                            <div className="text-[10px] text-zinc-500">{demand.purpose}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-zinc-600 text-xs line-clamp-2 max-w-xs leading-snug">
                              {demand.requirements}
                            </p>
                          </td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBuyerRefForConnect(demand.referenceCode);
                                  setSelectedBuyerSummaryForConnect(`${demand.bhk} in ${demand.locality} (${demand.budget})`);
                                  setSellerModalOpen(true);
                                }}
                                className="bg-zinc-950 hover:bg-amber-600 hover:text-zinc-950 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition inline-flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                              >
                                <span>Connect</span>
                                <ArrowRight className="w-3 h-3 text-amber-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ================= MOBILE VIEW: BUYER DEMANDS RESPONSIVE CARDS (ZERO HORIZONTAL SCROLL) ================= */}
                <div className="sm:hidden w-full bg-white divide-y divide-zinc-100">
                  {/* Mobile Buyer Demands Filter Bar */}
                  <div className="p-3 bg-zinc-50 border-b border-zinc-200">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                      {/* Buyer Locality Pill */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveHeaderDropdown(activeHeaderDropdown === 'buyer_locality' ? null : 'buyer_locality');
                          setHeaderSearchQuery('');
                        }}
                        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          buyerLocalityFilter !== 'All' || ['locality_asc', 'locality_desc'].includes(buyerSortBy)
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-white text-zinc-700 border border-zinc-200/90 shadow-2xs'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        <span>{buyerLocalityFilter === 'All' ? 'Target Locality' : buyerLocalityFilter}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            activeHeaderDropdown === 'buyer_locality' ? 'rotate-180 text-amber-600' : 'text-zinc-400'
                          }`}
                        />
                      </button>

                      {/* Buyer Typology Pill */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveHeaderDropdown(activeHeaderDropdown === 'buyer_typography' ? null : 'buyer_typography');
                          setHeaderSearchQuery('');
                        }}
                        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          buyerBhkFilter !== 'All'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-white text-zinc-700 border border-zinc-200/90 shadow-2xs'
                        }`}
                      >
                        <Home className="w-3.5 h-3.5 text-amber-600" />
                        <span>{buyerBhkFilter === 'All' ? 'Configuration' : buyerBhkFilter}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            activeHeaderDropdown === 'buyer_typography' ? 'rotate-180 text-amber-600' : 'text-zinc-400'
                          }`}
                        />
                      </button>

                      {/* Quick Reset Button if active */}
                      {(buyerLocalityFilter !== 'All' || buyerBhkFilter !== 'All' || buyerSortBy !== 'relevance') && (
                        <button
                          type="button"
                          onClick={() => {
                            setBuyerLocalityFilter('All');
                            setBuyerBhkFilter('All');
                            setBuyerSortBy('relevance');
                            setActiveHeaderDropdown(null);
                          }}
                          className="shrink-0 p-1.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-700 transition cursor-pointer"
                          title="Reset buyer filters"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Buyer Mobile Dropdown Panel */}
                    {activeHeaderDropdown && ['buyer_locality', 'buyer_typography'].includes(activeHeaderDropdown) && (
                      <div
                        ref={headerDropdownRef}
                        className="mt-2.5 p-3 bg-white rounded-2xl shadow-xl border border-zinc-200 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 text-left"
                      >
                        {activeHeaderDropdown === 'buyer_locality' && (
                          <div>
                            <div className="relative mb-2">
                              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                autoFocus
                                value={headerSearchQuery}
                                onChange={(e) => setHeaderSearchQuery(e.target.value)}
                                placeholder="Search locality..."
                                className="w-full pl-8 pr-7 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-amber-400 focus:bg-white transition"
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto space-y-0.5 text-xs pr-1">
                              {(!headerSearchQuery || 'all locations'.includes(headerSearchQuery.toLowerCase())) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBuyerLocalityFilter('All');
                                    setActiveHeaderDropdown(null);
                                  }}
                                  className={`w-full px-2.5 py-1.5 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                                    buyerLocalityFilter === 'All' ? 'bg-amber-50 font-bold text-amber-900' : 'text-zinc-700 hover:bg-zinc-100'
                                  }`}
                                >
                                  <span>All Locations</span>
                                  {buyerLocalityFilter === 'All' && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                                </button>
                              )}
                              {filteredHeaderLocalities.map((loc) => {
                                const isSelected = buyerLocalityFilter.toLowerCase() === loc.toLowerCase();
                                return (
                                  <button
                                    key={loc}
                                    type="button"
                                    onClick={() => {
                                      setBuyerLocalityFilter(loc);
                                      setActiveHeaderDropdown(null);
                                    }}
                                    className={`w-full px-2.5 py-1.5 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                                      isSelected ? 'bg-amber-50 font-bold text-amber-900' : 'text-zinc-700 hover:bg-zinc-100'
                                    }`}
                                  >
                                    <span>{loc}</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {activeHeaderDropdown === 'buyer_typography' && (
                          <div>
                            <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider px-1 py-1">
                              Filter By Configuration
                            </div>
                            <div className="max-h-52 overflow-y-auto space-y-0.5 text-xs pr-1">
                              {(!headerSearchQuery || 'all configurations'.includes(headerSearchQuery.toLowerCase())) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBuyerBhkFilter('All');
                                    setActiveHeaderDropdown(null);
                                  }}
                                  className={`w-full px-2.5 py-1.5 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                                    buyerBhkFilter === 'All' ? 'bg-amber-50 font-bold text-amber-900' : 'text-zinc-700 hover:bg-zinc-100'
                                  }`}
                                >
                                  <span>All Configurations</span>
                                  {buyerBhkFilter === 'All' && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                                </button>
                              )}
                              {[
                                { label: '2 BHK', value: '2 BHK' },
                                { label: '3 BHK', value: '3 BHK' },
                                { label: '4 BHK', value: '4 BHK' },
                                { label: '5+ BHK / Penthouse', value: '5 BHK' },
                                { label: 'Commercial Office / Retail', value: 'Commercial' },
                                { label: 'Villa / Plot', value: 'Villa' }
                              ].map((item) => {
                                const isSelected = buyerBhkFilter.toLowerCase() === item.value.toLowerCase();
                                return (
                                  <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => {
                                      setBuyerBhkFilter(item.value);
                                      setActiveHeaderDropdown(null);
                                    }}
                                    className={`w-full px-2.5 py-1.5 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                                      isSelected ? 'bg-amber-50 font-bold text-amber-900' : 'text-zinc-700 hover:bg-zinc-100'
                                    }`}
                                  >
                                    <span>{item.label}</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Buyer List Cards */}
                  {displayedComparisonBuyers.length === 0 ? (
                    <div className="p-8 text-center bg-zinc-50/50">
                      <Users className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-zinc-700">No buyer demands match your active filters.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setBuyerLocalityFilter('All');
                          setBuyerBhkFilter('All');
                          setBuyerSortBy('relevance');
                        }}
                        className="mt-3 text-xs font-bold text-amber-700 hover:text-amber-800 underline cursor-pointer"
                      >
                        Reset buyer filters
                      </button>
                    </div>
                  ) : (
                    displayedComparisonBuyers.map((demand) => (
                      <div key={demand.id} className="p-3.5 bg-white space-y-2.5 hover:bg-amber-50/20 transition-colors">
                        {/* 1. Buyer & Reference */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-zinc-900 text-sm">{demand.maskedName}</div>
                            <div className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded mt-0.5">
                              Ref: {demand.referenceCode}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-amber-700 text-sm">{demand.budget}</div>
                            <div className="text-[10px] text-zinc-500 font-medium">{demand.purpose}</div>
                          </div>
                        </div>

                        {/* 2. Locality & Typology Grid */}
                        <div className="grid grid-cols-2 gap-2 bg-zinc-50/90 p-2.5 rounded-xl border border-zinc-100 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Target Locality</span>
                            <div className="flex items-center gap-1 font-semibold text-zinc-800 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="truncate">{demand.locality}</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Configuration</span>
                            <div className="font-bold text-zinc-900 truncate mt-0.5">{demand.bhk}</div>
                            <div className="text-[10px] text-zinc-400">Timeline: {demand.timeline}</div>
                          </div>
                        </div>

                        {/* 3. Requirement Brief */}
                        {demand.requirements && (
                          <p className="text-xs text-zinc-600 leading-snug bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/60">
                            {demand.requirements}
                          </p>
                        )}

                        {/* 4. Connect Button */}
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBuyerRefForConnect(demand.referenceCode);
                              setSelectedBuyerSummaryForConnect(`${demand.bhk} in ${demand.locality} (${demand.budget})`);
                              setSellerModalOpen(true);
                            }}
                            className="w-full bg-zinc-950 hover:bg-amber-600 hover:text-zinc-950 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition inline-flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                          >
                            <span>Connect with Verified Buyer</span>
                            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                                {sortedBuyerDemands.length > 5 && (
                  <div className="p-4 bg-zinc-50 border-t border-zinc-200 text-center">
                    <button
                      type="button"
                      onClick={() => setShowAllBuyerComparison(!showAllBuyerComparison)}
                      className="text-xs font-bold text-zinc-700 hover:text-zinc-950 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-zinc-200/90 shadow-2xs hover:bg-zinc-100 transition cursor-pointer"
                    >
                      <span>
                        {showAllBuyerComparison
                          ? 'Show Top 5 Buyers in Table'
                          : `Show All Buyers in Table (${sortedBuyerDemands.length - 5} More Available)`}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-zinc-600 transition-transform duration-200 ${showAllBuyerComparison ? 'rotate-180' : ''
                          }`}
                      />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-zinc-200/90 p-10 text-center space-y-4 shadow-sm w-full max-w-xl mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                  <Search className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-zinc-950">0 Buyers Found</h4>
                  <p className="text-zinc-500 text-xs mt-1">Please modify your search or register your property to reach active buyers.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBuyerRefForConnect(undefined);
                    setSelectedBuyerSummaryForConnect(undefined);
                    setSellerModalOpen(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-2.5 rounded-xl text-xs shadow transition cursor-pointer"
                >
                  Register Property for Buyer Matching
                </button>
              </div>
            )}

            {/* Direct Seller & Buyer Desk Banner */}
            <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white rounded-3xl p-6 sm:p-7 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-5 shadow-sm">
              <div className="flex items-center gap-4 text-center md:text-left">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 mx-auto md:mx-0">
                  <Building2 className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Direct Seller & Buyer Desk</span>
                  <h4 className="text-base sm:text-lg font-bold text-white">Have a property matching these buyer profiles?</h4>
                  <p className="text-xs text-zinc-400">Our advisory team verifies and conducts confidential introductions between genuine property owners and ready buyers.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBuyerRefForConnect(undefined);
                    setSelectedBuyerSummaryForConnect(undefined);
                    setSellerModalOpen(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black px-6 py-3 rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Register Property</span>
                </button>
              </div>
            </div>

            {/* Buyer Showcase Cards */}
            {sortedBuyerDemands.length > 0 && (
              <div className="space-y-6 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-extrabold text-zinc-950 tracking-tight">
                      Buyer Showcase
                    </h4>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      Detailed requirement briefs from genuine, pre-screened home buyers.
                    </p>
                  </div>
                  {sortedBuyerDemands.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowAllBuyerCards(!showAllBuyerCards)}
                      className="text-xs font-bold text-zinc-700 hover:text-zinc-950 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition cursor-pointer"
                    >
                      <span>{showAllBuyerCards ? 'Show Top 3 Cards' : `View All Cards (${sortedBuyerDemands.length})`}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-zinc-600 transition-transform duration-200 ${showAllBuyerCards ? 'rotate-180' : ''
                          }`}
                      />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedCardBuyers.map((demand) => (
                    <div
                      key={demand.id}
                      className="bg-white rounded-3xl border border-zinc-200/90 shadow-sm hover:shadow-xl hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                    >
                      {/* Top Bar */}
                      <div className="p-5 pb-4 border-b border-zinc-100 bg-gradient-to-r from-zinc-50 to-white">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100/80 border border-amber-200 px-2.5 py-1 rounded-lg">
                            Ref: {demand.referenceCode}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Verified Buyer</span>
                          </span>
                        </div>

                        <h4 className="font-extrabold text-base text-zinc-950 group-hover:text-amber-800 transition">
                          {demand.maskedName}
                        </h4>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Target Area: <strong className="text-zinc-800">{demand.locality}, Pune</strong>
                        </p>
                      </div>

                      {/* Core Specs Grid */}
                      <div className="p-5 space-y-3.5 flex-1">
                        <div className="grid grid-cols-2 gap-2.5 text-xs">
                          <div className="p-2.5 bg-zinc-50 border border-zinc-100 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">Configuration</span>
                            <span className="font-black text-zinc-900">{demand.bhk}</span>
                          </div>
                          <div className="p-2.5 bg-zinc-50 border border-zinc-100 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">Budget</span>
                            <span className="font-black text-amber-700">{demand.budget}</span>
                          </div>
                          <div className="p-2.5 bg-zinc-50 border border-zinc-100 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">Timeline</span>
                            <span className="font-bold text-zinc-800">{demand.timeline}</span>
                          </div>
                          <div className="p-2.5 bg-zinc-50 border border-zinc-100 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">Purpose</span>
                            <span className="font-bold text-zinc-800">{demand.purpose}</span>
                          </div>
                        </div>

                        {/* Requirements Brief */}
                        <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-2xl">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-900 block mb-1">
                            Buyer Requirements Brief
                          </span>
                          <p className="text-xs text-zinc-700 leading-relaxed line-clamp-3">
                            {demand.requirements}
                          </p>
                        </div>

                        {/* Requirement Status Badge */}
                        <div className="p-3 rounded-2xl bg-zinc-950 text-white flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Requirement Status</span>
                            <span className="font-bold text-amber-400 text-xs tracking-wide flex items-center gap-1.5 mt-0.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                              <span>Verified Mandate</span>
                            </span>
                          </div>
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">
                            Active
                          </span>
                        </div>
                      </div>

                      {/* Card Bottom CTA */}
                      <div className="p-5 pt-3 border-t border-zinc-100 bg-zinc-50/70">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBuyerRefForConnect(demand.referenceCode);
                            setSelectedBuyerSummaryForConnect(`${demand.bhk} in ${demand.locality} (${demand.budget})`);
                            setSellerModalOpen(true);
                          }}
                          className="w-full bg-zinc-950 hover:bg-amber-600 hover:text-zinc-950 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow"
                        >
                          <span>Match My Property to this Buyer</span>
                          <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {sortedBuyerDemands.length > 3 && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAllBuyerCards(!showAllBuyerCards)}
                      className="text-xs font-bold text-zinc-700 hover:text-zinc-950 inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-white border border-zinc-200/90 shadow-sm hover:bg-zinc-50 transition cursor-pointer"
                    >
                      <span>
                        {showAllBuyerCards
                          ? 'Show Top 3 Buyer Cards'
                          : `Show All Buyer Cards (${sortedBuyerDemands.length - 3} More Available)`}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-zinc-950 transition-transform duration-200 ${showAllBuyerCards ? 'rotate-180' : ''
                          }`}
                      />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= 4. REAL ESTATE BLOGS & INSIGHTS CONNECTED SECTION ================= */}
      <section id="insights-section" className="bg-white border-t border-zinc-200 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
                Market Insights & Guides
              </h2>
              <p className="text-zinc-500 text-xs sm:text-sm mt-1 font-medium">
                In-depth market research, investment analyses and Pune real estate intelligence.
              </p>
            </div>

            {/* Category Filter Pills for Blogs */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {['All', 'Market Report', 'Buying Guide', 'Legal & RERA'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setBlogCategory(cat);
                      const filtered = (initialBlogs || []).filter(
                        (b) => cat === 'All' || b.category.toLowerCase() === cat.toLowerCase()
                      );
                      setBlogs(filtered);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${blogCategory === cat
                        ? 'bg-zinc-950 text-white shadow-2xs'
                        : 'bg-zinc-100 text-zinc-600 hover:text-zinc-950'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowAllBlogs(!showAllBlogs)}
                className="px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-1.5 shadow-2xs"
              >
                <span>{showAllBlogs ? 'Show Fewer' : `View All (${blogs.length})`}</span>
                <ArrowRight className={`w-3.5 h-3.5 transition-transform ${showAllBlogs ? '-rotate-90' : ''}`} />
              </button>
            </div>
          </div>

          {/* Blogs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(showAllBlogs ? blogs : blogs.slice(0, 3)).map((article) => (
              <div
                key={article.id}
                className="bg-zinc-50/70 rounded-2xl shadow-2xs border border-zinc-200 overflow-hidden group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden bg-zinc-900">
                    <Image
                      src={
                        article.image ||
                        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                      }
                      alt={article.title}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3 bg-zinc-950/90 backdrop-blur-md text-amber-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm border border-amber-500/30">
                      {article.category}
                    </div>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80">
                        <FileText className="w-3 h-3 text-amber-600" />
                        <span>
                          {article.connectedProperty
                            ? `Connected Product: ${article.connectedProperty}`
                            : `Connected: ${article.locality || selectedLocality || 'Pune'} Market`}
                        </span>
                      </span>
                      {article.connectedTypology && (
                        <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
                          {article.connectedTypology}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>By {article.author || 'ANV Research'}</span>
                      <span>{article.readTime || '6 min read'}</span>
                    </div>

                    <h3 className="font-bold text-base text-zinc-950 group-hover:text-amber-800 transition leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-xs text-zinc-600 line-clamp-3 leading-relaxed">
                      {article.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-3 flex items-center justify-between gap-2 border-t border-zinc-100/80">
                  <button
                    type="button"
                    onClick={() => handleOpenFullBlog(article)}
                    className="text-amber-800 hover:text-amber-950 text-xs font-bold flex items-center gap-1.5 group-hover:gap-2.5 transition-all uppercase tracking-wider cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Read Full Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-[10px] font-bold text-zinc-400 bg-zinc-50 border border-zinc-200/80 px-2.5 py-1 rounded-md uppercase tracking-wider">
                    Patron Login Required
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Property Enquiry Modal */}
      <InstantEnquiryModal
        isOpen={consultationModalOpen}
        onClose={() => {
          setConsultationModalOpen(false);
          setSelectedPropertyForEnquiry(null);
        }}
        property={selectedPropertyForEnquiry || undefined}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Institutional Table Site Visit Modal */}
      <SiteVisitModal
        isOpen={siteVisitModalOpen}
        onClose={() => {
          setSiteVisitModalOpen(false);
          setSelectedPropertyForSiteVisit(null);
        }}
        property={selectedPropertyForSiteVisit || undefined}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Property Full Specifications & Financials Modal */}
      <PropertyDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedDetailsProperty(null);
        }}
        property={selectedDetailsProperty}
        onInstantEnquiryClick={() => {
          if (selectedDetailsProperty) {
            setSelectedPropertyForEnquiry(selectedDetailsProperty);
            setConsultationModalOpen(true);
          }
        }}
      />

      {/* Bespoke Property Buying Requirement Popup Modal */}
      <BespokePropertyRequirementModal
        isOpen={requirementModalOpen}
        onClose={() => setRequirementModalOpen(false)}
        initialLocality={selectedLocality !== 'All' ? selectedLocality : (catalogueSearch || searchQuery || 'Baner')}
        initialBhk={selectedBhk !== 'All' ? selectedBhk : '3 BHK'}
        initialBudget={selectedPriceRange !== 'All' ? selectedPriceRange : '₹1.5 Cr - ₹2.5 Cr'}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Seller Lead Capture Modal */}
      <SellerLeadCaptureModal
        isOpen={sellerModalOpen}
        onClose={() => setSellerModalOpen(false)}
        initialLocation={selectedLocality !== 'All' ? selectedLocality : (catalogueSearch || searchQuery)}
        initialBhk={selectedBhk !== 'All' ? selectedBhk : ''}
        buyerRef={selectedBuyerRefForConnect}
        buyerDemandSummary={selectedBuyerSummaryForConnect}
        onSuccessToast={(msg) => showToast(msg)}
      />



      {/* Patron Auth Modal for Full Blog Access */}
      <AuthInquiryModal
        isOpen={blogAuthModalOpen}
        onClose={() => setBlogAuthModalOpen(false)}
        initialMode="login"
        onSuccess={(msg) => {
          showToast(msg);
          setBlogAuthModalOpen(false);
          if (targetBlogForAuth) {
            router.push(`/blogs/${encodeURIComponent(targetBlogForAuth.id)}`);
          }
        }}
      />

      {/* Property Photo & Video Gallery Lightbox Modal */}
      <PropertyGalleryModal
        isOpen={galleryModalOpen}
        onClose={() => {
          setGalleryModalOpen(false);
          setSelectedPropertyForGallery(null);
        }}
        property={selectedPropertyForGallery}
        initialMode={galleryInitialMode}
        onBookSiteVisit={(p) => {
          setSelectedPropertyForSiteVisit(p);
          setSiteVisitModalOpen(true);
        }}
      />
      {/* Floating "Go to Top" Up Arrow Button */}
      {showBackToSearch && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 shadow-[0_10px_25px_rgba(245,158,11,0.35)] hover:shadow-[0_14px_30px_rgba(245,158,11,0.5)] flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-90 hover:-translate-y-1 border border-amber-300/60 animate-in fade-in slide-in-from-bottom-4 group"
          title="Go to top"
          aria-label="Go to top"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5] transition-transform duration-300 group-hover:-translate-y-0.5" />
        </button>
      )}
    </>
  );
}

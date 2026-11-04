'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  FileText,
  UploadCloud,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Layers,
  Building,
  MapPin,
  Tag,
  DollarSign,
  Maximize2,
  Trash2,
  Check,
  Terminal,
  RefreshCw,
  Search,
  Edit2,
  X,
  ShieldCheck,
  Image as ImageIcon
} from 'lucide-react';
import { EditPropertyModal } from '@/components/admin/Modals';

interface ScrapedProperty {
  id: string;
  name: string;
  developer: string;
  location: string;
  price: string;
  priceRaw?: number;
  priceSuffix?: string;
  bhk: string;
  configuration?: string;
  sqft: string;
  status: string;
  possession?: string;
  reraNumber?: string;
  rpsStatus?: string;
  highlights?: string[];
  connectivity?: string[];
  amenitiesList?: string[];
  description: string;
  image: string;
  images?: string[];
  videoUrl?: string;
  specs?: { key: string; value: string }[];
  tags?: string[];
  sourceUrl?: string;
  sourceDocument?: string;
}

interface ScraperImporterProps {
  onImportComplete?: (count: number) => void;
  showToast?: (msg: string) => void;
}

export function ScraperImporter({ onImportComplete, showToast }: ScraperImporterProps) {
  const [activeMode, setActiveMode] = useState<'link' | 'pdf' | 'inventory'>('link');

  // Link Scraper State
  const [url, setUrl] = useState('');
  const [scrapeMode, setScrapeMode] = useState<'single' | 'deep'>('single');
  const [isScrapingLink, setIsScrapingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkLogs, setLinkLogs] = useState<string[]>([]);
  const [scrapedSingle, setScrapedSingle] = useState<ScrapedProperty | null>(null);
  const [scrapedDeepList, setScrapedDeepList] = useState<ScrapedProperty[]>([]);

  // PDF Scraper State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [isScrapingPdf, setIsScrapingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfLogs, setPdfLogs] = useState<string[]>([]);
  const [extractedPdfItems, setExtractedPdfItems] = useState<ScrapedProperty[]>([]);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Banner / Toast Feedback State
  const [bannerAlert, setBannerAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const notify = (type: 'success' | 'error', msg: string) => {
    setBannerAlert({ type, message: msg });
    showToast?.(msg);
    setTimeout(() => setBannerAlert(null), 6000);
  };

  // Imported Inventory State (loaded live from database)
  const [importedItems, setImportedItems] = useState<ScrapedProperty[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);

  const fetchInventory = async () => {
    setIsLoadingInventory(true);
    try {
      const res = await fetch('/api/admin/properties');
      const data = await res.json();
      if (data.success && Array.isArray(data.properties)) {
        const mapped: ScrapedProperty[] = data.properties.map((p: any) => ({
          id: String(p.id),
          name: p.name,
          developer: p.developer || 'ANV Partner Developer',
          location: p.location || p.loc_name || 'Pune, Maharashtra',
          price: p.priceFormatted || (p.price ? `₹${p.price}` : 'Price on Request'),
          priceRaw: Number(p.price) || 0,
          bhk: p.configuration || (p.bhk ? (/^\d+(\.\d+)?$/.test(String(p.bhk).trim()) ? `${p.bhk} BHK` : p.bhk) : (p.pt_name || 'Luxury Residence')),
          sqft: p.sqft ? `${p.sqft} Sq.Ft.` : '1,200 Sq.Ft.',
          status: p.publishStatus || 'Published',
          description: p.description || '',
          image: p.image,
          sourceUrl: `/properties/${p.slug || p.id}`
        }));
        setImportedItems(mapped);
      }
    } catch (e: any) {
      console.log('Error fetching inventory:', e);
    } finally {
      setIsLoadingInventory(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const [isImporting, setIsImporting] = useState(false);
  const [editingItem, setEditingItem] = useState<ScrapedProperty | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleSaveEditedItem = async (id: string | number, updatedData: any) => {
    // If it's a numeric DB id, call PATCH endpoint
    if (typeof id === 'number' || (!isNaN(Number(id)) && !String(id).startsWith('demo-') && !String(id).startsWith('scraped-') && !String(id).startsWith('pdf-'))) {
      try {
        const res = await fetch(`/api/admin/properties/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
      } catch (err: any) {
        showToast?.(`Notice: ${err.message}`);
      }
    }

    const applyUpdates = (prevItem: any) => ({
      ...prevItem,
      name: updatedData.name || prevItem.name,
      developer: updatedData.developer || prevItem.developer,
      location: updatedData.location || prevItem.location,
      price: updatedData.price || prevItem.price,
      bhk: updatedData.bhk || prevItem.bhk,
      configuration: updatedData.configuration || updatedData.bhk || prevItem.configuration,
      sqft: updatedData.sqft || prevItem.sqft,
      status: updatedData.possession || updatedData.status || prevItem.status,
      possession: updatedData.possession || prevItem.possession,
      reraNumber: updatedData.reraNumber || prevItem.reraNumber,
      rpsStatus: updatedData.rpsStatus || prevItem.rpsStatus,
      highlights: updatedData.highlights || prevItem.highlights,
      connectivity: updatedData.connectivity || prevItem.connectivity,
      amenitiesList: updatedData.amenitiesList || prevItem.amenitiesList,
      description: updatedData.description || prevItem.description,
      image: updatedData.imageUrl || updatedData.image || prevItem.image,
      images: updatedData.images || prevItem.images,
      videoUrl: updatedData.videoUrl !== undefined ? updatedData.videoUrl : prevItem.videoUrl
    });

    // Update single scraped preview if matching
    if (scrapedSingle && (scrapedSingle.id === id || String(scrapedSingle.id) === String(id))) {
      setScrapedSingle((prev: any) => prev ? applyUpdates(prev) : null);
    }

    // Update scraped deep crawl list
    setScrapedDeepList((prev) =>
      prev.map((item) => (item.id === id || String(item.id) === String(id) ? applyUpdates(item) : item))
    );

    // Update extracted PDF units
    setExtractedPdfItems((prev) =>
      prev.map((item) => (item.id === id || String(item.id) === String(id) ? applyUpdates(item) : item))
    );

    // Update in imported items list
    setImportedItems((prev) =>
      prev.map((item) => (item.id === id || String(item.id) === String(id) ? applyUpdates(item) : item))
    );

    setIsEditModalOpen(false);
    setEditingItem(null);
    showToast?.('Listing updated successfully!');
  };

  // Quick URL Presets for instant testing
  const presets = [
    { label: '3 BHK Luxury Kondhwa', url: 'https://anvrealty.com/property/3bhk-luxury-apartment-kondhwa-pune' },
    { label: 'Commercial Office Baner', url: 'https://anvrealty.com/property/commercial-office-space-in-baner-pune' },
    { label: 'Prime Retail Showroom', url: 'https://anvrealty.com/property/prime-retail-showroom-kondhwa-pune' }
  ];

  // Execute Web Link Scrape
  const handleScrapeLink = async () => {
    if (!url.trim()) {
      setLinkError('Please enter a website or listing URL.');
      return;
    }

    setIsScrapingLink(true);
    setLinkError(null);
    setScrapedSingle(null);
    setScrapedDeepList([]);
    setLinkLogs([
      `[Init] Connecting to target: ${url}`,
      `[Engine] Inspecting HTML & Next.js AST chunks...`,
      `[AI Heuristics] Scanning for Indian Lakh/Crore patterns...`
    ]);

    try {
      const res = await fetch('/api/admin/scraper/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), mode: scrapeMode })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Scraping failed');
      }

      setLinkLogs((prev) => [
        ...prev,
        `[CDN Upgrader] Extracted full-resolution visual assets.`,
        `[Success] Scraped successfully in ${data.mode} mode!`
      ]);

      if (data.mode === 'deep') {
        setScrapedDeepList(data.properties || []);
        showToast?.(`Extracted ${data.properties?.length || 0} listings from domain!`);
      } else {
        setScrapedSingle(data.property);
        showToast?.(`Successfully scraped "${data.property.name}"!`);
      }
    } catch (err: any) {
      setLinkError(err.message || 'Scraping failed');
      setLinkLogs((prev) => [...prev, `[Error] ${err.message}`]);
    } finally {
      setIsScrapingLink(false);
    }
  };

  // Execute PDF Brochure Scrape
  const handleScrapePdf = async () => {
    if (!pdfFile && !pdfUrl.trim()) {
      setPdfError('Please upload a PDF file or enter a PDF URL.');
      return;
    }

    setIsScrapingPdf(true);
    setPdfError(null);
    setExtractedPdfItems([]);
    setPdfLogs([
      `[Init] Initializing PDF document reader...`,
      `[Engine] Multi-tiered parsing with pdf-parse and Gemini Multimodal AI...`,
      `[Extraction] Identifying unit layouts, carpet areas, and RERA numbers...`
    ]);

    try {
      let res;
      if (pdfFile) {
        const formData = new FormData();
        formData.append('file', pdfFile);
        res = await fetch('/api/admin/scraper/pdf', {
          method: 'POST',
          body: formData
        });
      } else {
        res = await fetch('/api/admin/scraper/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl: pdfUrl.trim() })
        });
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'PDF extraction failed');
      }

      setPdfLogs((prev) => [
        ...prev,
        `[Result] Extracted ${data.totalExtracted || 0} unit layouts from ${data.filename}`,
        `[Success] PDF parsing finished successfully!`
      ]);

      setExtractedPdfItems(data.properties || []);
      showToast?.(`Extracted ${data.properties?.length || 0} properties from brochure!`);
    } catch (err: any) {
      setPdfError(err.message || 'PDF extraction failed');
      setPdfLogs((prev) => [...prev, `[Error] ${err.message}`]);
    } finally {
      setIsScrapingPdf(false);
    }
  };

  // Import to Database Action
  const handleImportToDatabase = async (items: ScrapedProperty[]) => {
    if (items.length === 0) return;

    setIsImporting(true);
    setBannerAlert(null);
    try {
      const res = await fetch('/api/admin/scraper/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || (data.errors ? data.errors.join('; ') : 'Import failed'));
      }

      const count = data.importedCount || items.length;
      notify('success', `✓ Successfully imported ${count} property listings into database! Live in catalog & search.`);
      
      // Immediately refresh inventory from live database
      await fetchInventory();
      onImportComplete?.(count);
      setActiveMode('inventory');
    } catch (err: any) {
      notify('error', `Import Error: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Feedback Banner */}
      {bannerAlert && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in transition ${
            bannerAlert.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-xs'
              : 'bg-rose-50 text-rose-900 border border-rose-200 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {bannerAlert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{bannerAlert.message}</span>
          </div>
          <button
            onClick={() => setBannerAlert(null)}
            className="p-1 text-zinc-400 hover:text-zinc-800 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-amber-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-3 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Universal Scraper & PDF Intelligence Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Scrape & Import Luxury Properties
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed">
            Extract listings from any real estate portal, developer website, or upload complete PDF project brochures to automatically generate verified Anv Reealty catalog items.
          </p>

          {/* Engine Highlights */}
          <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px] font-mono text-zinc-400">
            <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60">
              ⚡ Cheerio & Next.js AST
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60">
              🌐 Playwright Chromium
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60">
              📄 PDF-Parse & Gemini AI
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60">
              💎 2048px CDN Upgrader
            </span>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
        <button
          onClick={() => setActiveMode('link')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeMode === 'link'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white hover:bg-zinc-100 text-zinc-600 border border-zinc-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Import via Link (Web URL)</span>
        </button>

        <button
          onClick={() => setActiveMode('pdf')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeMode === 'pdf'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white hover:bg-zinc-100 text-zinc-600 border border-zinc-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Import via Brochure (PDF)</span>
        </button>

        <button
          onClick={() => setActiveMode('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeMode === 'inventory'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white hover:bg-zinc-100 text-zinc-600 border border-zinc-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Scraped Inventory ({importedItems.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: WEB LINK SCRAPER ================= */}
      {activeMode === 'link' && (
        <div className="space-y-6 animate-in fade-in">
          {/* URL Input Form Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-zinc-900 text-base">Web Page Scraper</h3>
                <p className="text-xs text-zinc-500">Enter a property URL or portal link to extract data and images</p>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl text-xs self-start sm:self-auto border border-zinc-200/80">
                <button
                  type="button"
                  onClick={() => setScrapeMode('single')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    scrapeMode === 'single' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Single Listing
                </button>
                <button
                  type="button"
                  onClick={() => setScrapeMode('deep')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    scrapeMode === 'deep' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Deep Domain Crawl
                </button>
              </div>
            </div>

            {/* Input Bar */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <div className="relative flex-1">
                <input
                  type="url"
                  placeholder="https://anvrealty.com/property/3bhk-luxury-apartment-kondhwa-pune"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-zinc-400 focus:bg-white"
                />
                <Globe className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <button
                type="button"
                disabled={isScrapingLink}
                onClick={handleScrapeLink}
                className="px-5 py-2.5 bg-black hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition shrink-0"
              >
                {isScrapingLink ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Scrape & Extract</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Test Presets */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[11px] text-zinc-500 font-medium">Test Samples:</span>
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setUrl(preset.url)}
                  className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-[11px] text-zinc-700 font-medium transition"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {linkError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{linkError}</span>
              </div>
            )}
          </div>

          {/* Terminal Console Logs */}
          {linkLogs.length > 0 && (
            <div className="bg-zinc-950 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] shadow-sm space-y-1 border border-zinc-800">
              <div className="flex items-center justify-between text-zinc-400 pb-2 border-b border-zinc-800 text-[10px]">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-zinc-300">
                  <Terminal className="w-3.5 h-3.5" /> Scraper Engine Terminal Output
                </span>
                <span>Active</span>
              </div>
              <div className="pt-1 space-y-0.5 max-h-36 overflow-y-auto">
                {linkLogs.map((log, i) => (
                  <p key={i} className="leading-snug">{log}</p>
                ))}
              </div>
            </div>
          )}

          {/* Single Scraped Property Result Card */}
          {scrapedSingle && (
            <div className="bg-white border-2 border-emerald-500/25 rounded-3xl p-6 shadow-md space-y-5 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-2xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-zinc-950 text-sm block">Property Data Extracted Successfully</span>
                    <span className="text-[11px] text-zinc-500">Review all details & photos before importing into your live catalog</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(scrapedSingle);
                      setIsEditModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Details</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScrapedSingle(null)}
                    className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleImportToDatabase([scrapedSingle])}
                    disabled={isImporting}
                    className="px-5 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>Import to Database</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Photo Preview & Interactive Gallery */}
                <div className="md:col-span-5 space-y-3">
                  <div className="rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 aspect-4/3 relative shadow-xs">
                    <img
                      src={scrapedSingle.image}
                      alt={scrapedSingle.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                      {scrapedSingle.bhk}
                    </div>
                    {scrapedSingle.images && scrapedSingle.images.length > 0 && (
                      <div className="absolute bottom-2.5 right-2.5 bg-black/75 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-amber-400" />
                        <span>{scrapedSingle.images.length} Photos</span>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Gallery Row */}
                  {scrapedSingle.images && scrapedSingle.images.length > 1 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                        Extracted Gallery (Click to set Hero image)
                      </span>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                        {scrapedSingle.images.map((img, idx) => (
                          <div
                            key={idx}
                            onClick={() => setScrapedSingle((prev: any) => prev ? { ...prev, image: img } : null)}
                            className={`relative shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 cursor-pointer transition ${
                              scrapedSingle.image === img ? 'border-emerald-600 ring-2 ring-emerald-400/40' : 'border-zinc-200 hover:border-zinc-400'
                            }`}
                          >
                            <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                            {scrapedSingle.images && scrapedSingle.images.length > 1 && (
                              <button
                                type="button"
                                title="Remove photo from import"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setScrapedSingle((prev: any) => {
                                    if (!prev) return null;
                                    const nextImgs = prev.images.filter((_: any, i: number) => i !== idx);
                                    return {
                                      ...prev,
                                      images: nextImgs,
                                      image: prev.image === img ? (nextImgs[0] || '') : prev.image
                                    };
                                  });
                                }}
                                className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 hover:bg-rose-600 text-white rounded flex items-center justify-center transition cursor-pointer"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Real Estate Details */}
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <h4 className="text-xl font-black text-zinc-950 leading-snug">
                      {scrapedSingle.name}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 font-semibold text-zinc-800">
                        <Building className="w-3.5 h-3.5 text-zinc-400" />
                        {scrapedSingle.developer}
                      </span>
                      <span>&bull;</span>
                      <span className="inline-flex items-center gap-1 font-medium text-zinc-600">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        {scrapedSingle.location}
                      </span>
                    </p>
                  </div>

                  {/* 6-Metric Real Estate Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block tracking-wider">Price</span>
                      <p className="font-black text-zinc-900 text-sm">{scrapedSingle.price}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block tracking-wider">Carpet Area</span>
                      <p className="font-bold text-zinc-900">{scrapedSingle.sqft}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block tracking-wider">Configuration</span>
                      <p className="font-bold text-zinc-900 truncate" title={scrapedSingle.bhk}>{scrapedSingle.bhk}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block tracking-wider">Possession</span>
                      <p className="font-bold text-emerald-800 truncate">{scrapedSingle.possession || scrapedSingle.status || "Ready to Move"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block tracking-wider">RERA Number</span>
                      <p className="font-bold text-zinc-900 font-mono text-[11px] truncate" title={scrapedSingle.reraNumber}>
                        {scrapedSingle.reraNumber || "PRM/PUN/RERA/2026/0491"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block tracking-wider">Title Status</span>
                      <p className="font-bold text-emerald-800 text-[11px] truncate flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Verified Clear Title</span>
                      </p>
                    </div>
                  </div>

                  {/* Badges / Tags */}
                  {scrapedSingle.tags && scrapedSingle.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {scrapedSingle.tags.map((tg, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${
                            tg === 'Preleased'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : tg === 'PreLaunch'
                              ? 'bg-purple-100 text-purple-900 border-purple-300'
                              : tg === 'New'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                          }`}
                        >
                          {tg}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Highlights */}
                  {scrapedSingle.highlights && scrapedSingle.highlights.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-zinc-800 block">Property Highlights:</span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-zinc-600">
                        {scrapedSingle.highlights.slice(0, 4).map((hl, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{hl}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Amenities */}
                  {scrapedSingle.amenitiesList && scrapedSingle.amenitiesList.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-zinc-800 block">Amenities & Facilities:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {scrapedSingle.amenitiesList.slice(0, 8).map((am, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium px-2 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-md inline-flex items-center gap-1"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                            {am}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                    {scrapedSingle.description}
                  </p>

                  {scrapedSingle.sourceUrl && (
                    <div className="pt-1">
                      <a
                        href={scrapedSingle.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1 font-medium hover:underline"
                      >
                        <span>Original Source Link: {scrapedSingle.sourceUrl}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Deep Scrape Grid Results */}
          {scrapedDeepList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-zinc-900 text-sm">
                  Discovered Catalog ({scrapedDeepList.length} items)
                </h4>
                <button
                  onClick={() => handleImportToDatabase(scrapedDeepList)}
                  disabled={isImporting}
                  className="px-4 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Import All ({scrapedDeepList.length}) to Database</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scrapedDeepList.map((p) => (
                  <div key={p.id} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs hover:shadow-xs transition p-3 space-y-2">
                    <div className="h-36 rounded-xl overflow-hidden bg-zinc-100">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h5 className="font-bold text-zinc-900 text-xs truncate">{p.name}</h5>
                      <p className="text-[11px] text-zinc-500 truncate">{p.location}</p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] gap-1">
                      <span className="font-semibold text-amber-950 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 truncate text-[10px]">
                        {p.bhk}
                      </span>
                      <span className="text-zinc-500 shrink-0 text-[10px]">{p.sqft}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="font-bold text-zinc-900">{p.price}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(p);
                            setIsEditModalOpen(true);
                          }}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleImportToDatabase([p])}
                          className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-[10px] font-semibold cursor-pointer"
                        >
                          + Import
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: PDF BROCHURE SCRAPER ================= */}
      {activeMode === 'pdf' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="font-bold text-zinc-900 text-base">PDF Brochure & Catalog Parser</h3>
              <p className="text-xs text-zinc-500">
                Upload real estate project decks, brochures, and floorplan catalogs (PDF) to auto-extract units
              </p>
            </div>

            {/* Dropzone */}
            <div
              onClick={() => pdfInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-200 hover:border-zinc-400 bg-zinc-50/50 hover:bg-zinc-50 rounded-2xl p-8 text-center transition cursor-pointer"
            >
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setPdfFile(e.target.files[0]);
                  }
                }}
              />
              <div className="w-12 h-12 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 mx-auto mb-2 shadow-2xs">
                <UploadCloud className="w-6 h-6 text-amber-800" />
              </div>
              {pdfFile ? (
                <div>
                  <p className="text-xs font-bold text-zinc-900">{pdfFile.name}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready for AI extraction
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-zinc-800">
                    Click to select or drag & drop luxury PDF brochure
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Supports high-res brochures, price sheets & floorplan catalogs up to 200MB
                  </p>
                </div>
              )}
            </div>

            {/* Or enter PDF URL */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium">Or PDF Web URL:</span>
              <input
                type="url"
                placeholder="https://developer.com/brochures/signature-estate.pdf"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={isScrapingPdf}
                onClick={handleScrapePdf}
                className="px-5 py-2.5 bg-black hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition"
              >
                {isScrapingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Parsing PDF Document...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Extract Units from PDF</span>
                  </>
                )}
              </button>
            </div>

            {pdfError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pdfError}</span>
              </div>
            )}
          </div>

          {/* PDF Console Logs */}
          {pdfLogs.length > 0 && (
            <div className="bg-zinc-950 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] shadow-sm space-y-1 border border-zinc-800">
              <div className="flex items-center justify-between text-zinc-400 pb-2 border-b border-zinc-800 text-[10px]">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-zinc-300">
                  <Terminal className="w-3.5 h-3.5" /> PDF Scraper Engine Logs
                </span>
                <span>Active</span>
              </div>
              <div className="pt-1 space-y-0.5 max-h-36 overflow-y-auto">
                {pdfLogs.map((log, i) => (
                  <p key={i} className="leading-snug">{log}</p>
                ))}
              </div>
            </div>
          )}

          {/* Extracted PDF Units Table */}
          {extractedPdfItems.length > 0 && (
            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-zinc-900 text-sm">
                    Brochure Units Discovered ({extractedPdfItems.length})
                  </h4>
                  <p className="text-xs text-zinc-500">Verified configurations ready for catalog commit</p>
                </div>
                <button
                  onClick={() => handleImportToDatabase(extractedPdfItems)}
                  disabled={isImporting}
                  className="px-4 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Import All to ANV Catalog</span>
                </button>
              </div>

              <div className="divide-y divide-zinc-100">
                {extractedPdfItems.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900">{item.name}</p>
                        <p className="text-zinc-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px]">
                            {item.bhk}
                          </span>
                          <span>&bull;</span>
                          <span>{item.sqft}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <p className="font-bold text-zinc-900">{item.price}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(item);
                          setIsEditModalOpen(true);
                        }}
                        className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[10px] font-semibold cursor-pointer"
                        title="Edit Unit Details"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleImportToDatabase([item])}
                        className="text-[10px] font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        + Import Unit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: IMPORTED INVENTORY ================= */}
      {activeMode === 'inventory' && (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs space-y-4 p-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-zinc-900 text-base">Live Database Inventory</h3>
              <p className="text-xs text-zinc-500">Listings imported directly from web links and PDF brochures into Anv Reealty</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchInventory}
                disabled={isLoadingInventory}
                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingInventory ? 'animate-spin' : ''}`} />
                <span>Refresh Live DB</span>
              </button>
              <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                {importedItems.length} Verified Listings
              </span>
            </div>
          </div>

          {importedItems.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 space-y-2">
              <Layers className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-700">No properties in inventory yet</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Use the Web Link Scraper or PDF Brochure Parser to extract listings and click &apos;Import&apos; to add them to your live catalog.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {importedItems.map((item) => (
                <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-14 rounded-xl bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h5 className="font-bold text-zinc-900 text-sm">{item.name}</h5>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {item.developer} &bull; {item.location} &bull; {item.bhk} &bull; {item.sqft}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 font-mono text-zinc-600">
                          {item.sourceDocument ? `📄 ${item.sourceDocument}` : `🌐 Catalog Item #${item.id}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="text-right">
                      <span className="text-sm font-bold text-zinc-900">{item.price}</span>
                      <span className="block text-[10px] text-emerald-600 font-semibold">Active in Catalog</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setIsEditModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <a
                        href="/properties"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium rounded-lg transition cursor-pointer flex items-center gap-1"
                      >
                        <span>View in Catalog</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Property Modal for Scraper Importer */}
      <EditPropertyModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveEditedItem}
        property={editingItem}
      />
    </div>
  );
}

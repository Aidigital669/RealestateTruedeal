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
  Image as ImageIcon,
  Table,
  Eye,
  Download,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Filter,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { EXCEL_48_COLUMNS, extract48Fields, format48ValueForTable } from '@/lib/excel-48-extractor';
import { scrubPersonalInfo, parseDescriptionBulletPoints } from '@/lib/description-sanitizer';
import { EditPropertyModal } from '@/components/admin/Modals';
import { formatPropertyDescription } from '@/lib/dossier-parser';

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
  const [activeMode, setActiveMode] = useState<'excel' | 'link' | 'pdf' | 'inventory'>('excel');

  // Excel Importer State (48 Schema Fields)
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [excelParseError, setExcelParseError] = useState<string | null>(null);
  const [extractedExcelRows, setExtractedExcelRows] = useState<any[]>([]);
  const [excelSearchQuery, setExcelSearchQuery] = useState('');
  const [excelFilterTx, setExcelFilterTx] = useState<'All' | 'Sale' | 'Rent'>('All');
  const [excelPage, setExcelPage] = useState(1);
  const [excelRowsPerPage, setExcelRowsPerPage] = useState(10);
  const [excelViewMode, setExcelViewMode] = useState<'summary' | 'full48'>('summary');
  const [previewRowForDescription, setPreviewRowForDescription] = useState<any | null>(null);
  const [matchedSchemaColumns, setMatchedSchemaColumns] = useState<string[]>([]);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [excelImportProgress, setExcelImportProgress] = useState<{ processed: number; total: number } | null>(null);
  const [isDraggingExcel, setIsDraggingExcel] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);

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
          developer: p.developer || '',
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

    const applyUpdates = (prevItem: any) => {
      const newBhk = updatedData.bhk || updatedData.configuration || prevItem.bhk;
      const tagMatch = typeof newBhk === 'string' ? newBhk.match(/\(([^)]+)\)/) : null;
      const activeTag = tagMatch ? tagMatch[1] : (prevItem.tags?.[0] || 'New');
      const cleanCategory = typeof newBhk === 'string' ? newBhk.replace(/\s*\([^)]*\)/, '').trim() : newBhk;

      // Dynamically sync specs (Property Type, Configuration, Property Tag)
      const nextSpecs = Array.isArray(prevItem.specs)
        ? prevItem.specs.map((s: any) => {
            if (/property\s*type/i.test(s.key)) {
              return { ...s, value: cleanCategory };
            }
            if (/configuration/i.test(s.key)) {
              return { ...s, value: newBhk };
            }
            if (/property\s*tag/i.test(s.key)) {
              return { ...s, value: activeTag };
            }
            return s;
          })
        : [
            { key: 'Property Type', value: cleanCategory },
            { key: 'Configuration', value: newBhk },
            { key: 'Property Tag', value: activeTag }
          ];

      // Dynamically sync tags
      const nextTags = Array.from(new Set([
        activeTag,
        cleanCategory,
        ...(Array.isArray(prevItem.tags)
          ? prevItem.tags.filter((t: string) => !/office|shop|showroom|residential|flat|apartment|commercial/i.test(t))
          : [])
      ])).filter(Boolean);

      return {
        ...prevItem,
        name: updatedData.name || prevItem.name,
        developer: updatedData.developer || prevItem.developer,
        location: updatedData.location || prevItem.location,
        price: updatedData.price || prevItem.price,
        bhk: newBhk,
        configuration: newBhk,
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
        videoUrl: updatedData.videoUrl !== undefined ? updatedData.videoUrl : prevItem.videoUrl,
        specs: nextSpecs,
        tags: nextTags
      };
    };

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

  // Process and extract 48 fields from uploaded Excel spreadsheet
  const processExcelUpload = async (file: File) => {
    setIsParsingExcel(true);
    setExcelParseError(null);
    setExtractedExcelRows([]);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('The uploaded Excel file does not contain any worksheets.');
      }
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet);

      if (!rawRows || rawRows.length === 0) {
        throw new Error('No data rows found in the selected worksheet.');
      }

      // Detect matched headers from the first row
      const detectedKeys = Object.keys(rawRows[0] || {});
      const matchedSet = new Set<string>();
      for (const col of EXCEL_48_COLUMNS) {
        for (const k of detectedKeys) {
          const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          const colAlpha = col.key.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanK === colAlpha || col.aliases.some(a => a.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanK)) {
            matchedSet.add(col.key);
            break;
          }
        }
      }
      setMatchedSchemaColumns(Array.from(matchedSet));

      // Extract & normalize all 48 fields for each row
      const processed = rawRows.map((row, idx) => {
        const fields48 = extract48Fields(row);
        
        // Count non-empty fields in this row
        let populatedCount = 0;
        Object.values(fields48).forEach((val) => {
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            populatedCount++;
          }
        });

        // Determine title
        const rawTitle = fields48.Title || row.title || row.Title || '';
        const rawBldg = fields48.BuildingName || row.BuildingName || '';
        const rawLoc = fields48.LocationName || fields48.AddressName || row.LocationName || 'Pune';
        const displayTitle = rawTitle || (rawBldg ? `${rawBldg} - ${fields48.PropertyTypeName || 'Commercial Space'}` : `Property ${fields48.RefNumber || idx + 1}`);

        // Price display
        let displayPrice = fields48.ExpectedPrice || '';
        if (displayPrice && !String(displayPrice).startsWith('₹')) {
          const num = parseFloat(String(displayPrice).replace(/[^0-9.]/g, ''));
          if (!isNaN(num) && num > 0) {
            displayPrice = num >= 10000000 ? `₹${(num / 10000000).toFixed(2)} Cr` : (num >= 100000 ? `₹${(num / 100000).toFixed(1)} Lakh` : `₹${num.toLocaleString('en-IN')}`);
          }
        }

        return {
          id: `extracted-${idx + 1}`,
          rowNumber: idx + 2,
          refNumber: fields48.RefNumber || `REF-${idx + 1}`,
          title: displayTitle,
          transactionType: /rent|lease/i.test(fields48.Lease_Sale || fields48.TransactionName || '') ? 'Rent' : 'Sale',
          propertyType: fields48.PropertyTypeName || 'Commercial',
          propertyName: fields48.PropertyName || '',
          buildingName: rawBldg,
          location: rawLoc,
          city: fields48.CityName || 'Pune',
          carpetArea: fields48.CarpetAreaName || '',
          superArea: fields48.SuperAreaName || '',
          plotArea: fields48.PlotSizeName || '',
          price: displayPrice || 'Price on Request',
          pricePsf: fields48.PricePerUnitArea || '',
          monthlyRent: fields48.RentPM || '',
          status: fields48.Status || fields48.PossessionName || 'Ready',
          populatedFieldsCount: populatedCount,
          rawRow: row,
          extracted48: fields48
        };
      });

      setExtractedExcelRows(processed);
      setExcelFile(file);
      setExcelPage(1);
      notify('success', `Successfully extracted ${processed.length} properties! ${matchedSet.size}/48 schema columns matched.`);
    } catch (err: any) {
      console.error('Excel extraction error:', err);
      setExcelParseError(err.message || 'Failed to parse Excel file.');
      notify('error', err.message || 'Failed to parse Excel file.');
    } finally {
      setIsParsingExcel(false);
    }
  };

  const handleImportExtractedExcel = async () => {
    if (!extractedExcelRows || extractedExcelRows.length === 0) return;
    setIsImportingExcel(true);
    setExcelImportProgress({ processed: 0, total: extractedExcelRows.length });

    try {
      const payloadRows = extractedExcelRows.map((r) => ({
        ...r.rawRow,
        ...r.extracted48,
        title: r.title
      }));

      const CHUNK_SIZE = 150;
      let totalImported = 0;

      for (let i = 0; i < payloadRows.length; i += CHUNK_SIZE) {
        const chunk = payloadRows.slice(i, i + CHUNK_SIZE);
        const res = await fetch('/api/admin/properties/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ properties: chunk })
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to import batch');
        }

        totalImported += data.savedCount || chunk.length;
        setExcelImportProgress({ processed: Math.min(i + CHUNK_SIZE, payloadRows.length), total: payloadRows.length });
      }

      notify('success', `🎉 Successfully imported ${totalImported} properties into live database!`);
      onImportComplete?.(totalImported);
      fetchInventory();
      setTimeout(() => {
        setActiveMode('inventory');
      }, 1500);
    } catch (err: any) {
      console.error('Excel import error:', err);
      notify('error', `Import failed: ${err.message}`);
    } finally {
      setIsImportingExcel(false);
      setExcelImportProgress(null);
    }
  };

  const handleDownloadExcelTemplate = () => {
    const sampleRow: Record<string, any> = {
      Title: 'Commercial Office Space for Sale in Kalyani Nagar',
      RefNumber: 'PROPERTY9001',
      Lease_Sale: 'Sale',
      PropertyTypeName: 'Commercial Office',
      PropertyName: 'Trade Center Tower',
      AddressName: 'Central Avenue, Kalyani Nagar, Pune',
      FlatNo: '502',
      BuildingName: 'Trade Center Tower',
      Landmark: 'Near Metro Station',
      SocietyName: 'Trade Center Association',
      Street: 'Central Avenue',
      LocationName: 'Kalyani Nagar',
      CityName: 'Pune',
      StateName: 'Maharashtra',
      FurnishingName: 'Fully Furnished',
      SuperAreaName: '3,200 Sq.Ft.',
      BuiltAreaName: '2,800 Sq.Ft.',
      CarpetAreaName: '2,400 Sq.Ft.',
      PlotSizeName: '',
      MaxAreaName: '',
      MinAreaName: '',
      PricePerUnitArea: '14500',
      ExpectedPrice: '4.64 Cr',
      DepositePrice: '',
      CustomerFullName: 'Mr. Rajesh Verma',
      CustomerMobile: '9822001122',
      CustomerEmail: 'rajesh.verma@example.com',
      Description: 'Grade-A fully furnished office with 35 workstations, 3 cabins, conference room and cafeteria.',
      EmployeeName: 'Amit Deshmukh',
      EmployeeMobile: '9823004455',
      EmployeeEmail: 'amit.d@anvrealty.com',
      PropertyAge: '2 Years',
      SourceName: 'Direct Mandate',
      TransactionName: 'Resale',
      PossessionName: 'Ready to Move',
      Status: 'Available',
      ParkingDetails: '4 Dedicated Covered Slots',
      FloorNumber: '5th Floor',
      SearchKeyword: 'Commercial Office | Kalyani Nagar | Furnished | Resale',
      FacingText: 'North Facing Road View',
      BranchName: 'Kalyani Nagar Branch',
      ROI: '8.5%',
      RentPM: '',
      RentStartDate: '',
      LockinPeriod: '',
      LeasePeriod: '',
      PropertyTax: 'Paid up to 2026',
      MaintainCharges: '₹12,000/month'
    };

    const ws = XLSX.utils.json_to_sheet([sampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Table1');
    XLSX.writeFile(wb, 'ANV_48_Field_Property_Template.xlsx');
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
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveMode('excel')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeMode === 'excel'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white hover:bg-zinc-100 text-zinc-600 border border-zinc-200'
          }`}
        >
          <Table className="w-4 h-4 text-emerald-400" />
          <span>Excel Sheet Drop &amp; Extract (48 Fields)</span>
        </button>

        <button
          onClick={() => setActiveMode('link')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
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
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
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
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeMode === 'inventory'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white hover:bg-zinc-100 text-zinc-600 border border-zinc-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Scraped Inventory ({importedItems.length})</span>
        </button>
      </div>

      {/* ================= TAB 0: EXCEL SHEET DROP & EXTRACT (48 FIELDS) ================= */}
      {activeMode === 'excel' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Dropzone Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                  <Table className="w-5 h-5 text-emerald-600" />
                  <span>Excel Sheet Dropzone &amp; 48-Field Schema Matcher</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Drop your Excel (.xlsx, .xls, .csv) file to extract all 48 fields, inspect the table view, and preview description pages before importing.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition border border-zinc-200 shadow-2xs"
                  title="Download standard 48-column Excel template"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Download 48-Field Template</span>
                </button>

                {extractedExcelRows.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setExtractedExcelRows([]);
                      setExcelFile(null);
                      setMatchedSchemaColumns([]);
                    }}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Extracted Data</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dropzone Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingExcel(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDraggingExcel(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingExcel(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  processExcelUpload(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => excelInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer ${
                isDraggingExcel
                  ? 'border-emerald-500 bg-emerald-50/60'
                  : 'border-zinc-200 hover:border-zinc-400 bg-zinc-50/50 hover:bg-zinc-50'
              }`}
            >
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processExcelUpload(e.target.files[0]);
                  }
                }}
              />

              <div className="w-12 h-12 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 mx-auto mb-2 shadow-2xs">
                {isParsingExcel ? (
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                ) : (
                  <UploadCloud className="w-6 h-6 text-emerald-600" />
                )}
              </div>

              {isParsingExcel ? (
                <div>
                  <p className="text-xs font-bold text-zinc-900">Parsing Excel File &amp; Mapping 48 Columns...</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Matching schema definitions and normalizing property values</p>
                </div>
              ) : excelFile ? (
                <div>
                  <p className="text-xs font-bold text-zinc-900">{excelFile.name}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {(excelFile.size / 1024).toFixed(1)} KB &bull; {extractedExcelRows.length} Properties Extracted &bull; {matchedSchemaColumns.length}/48 Columns Matched
                  </p>
                  <p className="text-[10px] text-emerald-700 font-semibold mt-1">Click or drop another file to replace</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-zinc-800">
                    Click to select or drag &amp; drop your Excel Spreadsheet (.xlsx, .xls, .csv)
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Supports complete 48-column catalog files with automatic schema alignment
                  </p>
                </div>
              )}
            </div>

            {excelParseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{excelParseError}</span>
              </div>
            )}
          </div>

          {/* Extracted Stats & Table View Before Importing */}
          {extractedExcelRows.length > 0 && (() => {
            // Filter by search query & transaction type
            const filtered = extractedExcelRows.filter((r) => {
              if (excelFilterTx !== 'All' && r.transactionType !== excelFilterTx) return false;
              if (!excelSearchQuery.trim()) return true;
              const q = excelSearchQuery.toLowerCase();
              return (
                r.title.toLowerCase().includes(q) ||
                r.refNumber.toLowerCase().includes(q) ||
                r.buildingName.toLowerCase().includes(q) ||
                r.location.toLowerCase().includes(q) ||
                r.propertyType.toLowerCase().includes(q)
              );
            });

            const totalPages = Math.max(1, Math.ceil(filtered.length / excelRowsPerPage));
            const currentPage = Math.min(excelPage, totalPages);
            const startIdx = (currentPage - 1) * excelRowsPerPage;
            const paginatedRows = filtered.slice(startIdx, startIdx + excelRowsPerPage);

            const saleCount = extractedExcelRows.filter(r => r.transactionType === 'Sale').length;
            const rentCount = extractedExcelRows.filter(r => r.transactionType === 'Rent').length;

            return (
              <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs space-y-4 p-5 animate-in fade-in">
                {/* Metric Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Extracted Records</span>
                    <span className="text-base font-black text-zinc-900 block mt-0.5">{extractedExcelRows.length.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/60">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Schema Match</span>
                    <span className="text-base font-black text-emerald-950 block mt-0.5">{matchedSchemaColumns.length} / 48 Columns</span>
                  </div>
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/60">
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">For Sale</span>
                    <span className="text-base font-black text-blue-950 block mt-0.5">{saleCount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">For Rent / Lease</span>
                    <span className="text-base font-black text-amber-950 block mt-0.5">{rentCount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Table Header & Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Filter by ref, title, locality..."
                        value={excelSearchQuery}
                        onChange={(e) => {
                          setExcelSearchQuery(e.target.value);
                          setExcelPage(1);
                        }}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
                      />
                      {excelSearchQuery && (
                        <button
                          onClick={() => setExcelSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Transaction Filter */}
                    <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl text-xs font-semibold">
                      {(['All', 'Sale', 'Rent'] as const).map((tx) => (
                        <button
                          key={tx}
                          onClick={() => {
                            setExcelFilterTx(tx);
                            setExcelPage(1);
                          }}
                          className={`px-2.5 py-1 rounded-lg transition ${
                            excelFilterTx === tx
                              ? 'bg-white text-zinc-950 shadow-2xs'
                              : 'text-zinc-600 hover:text-zinc-900'
                          }`}
                        >
                          {tx}
                        </button>
                      ))}
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl text-xs font-semibold">
                      <button
                        onClick={() => setExcelViewMode('summary')}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          excelViewMode === 'summary'
                            ? 'bg-white text-zinc-950 shadow-2xs'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        Summary View
                      </button>
                      <button
                        onClick={() => setExcelViewMode('full48')}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          excelViewMode === 'full48'
                            ? 'bg-white text-zinc-950 shadow-2xs'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        All 48 Columns Table
                      </button>
                    </div>
                  </div>

                  {/* Import Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleImportExtractedExcel}
                      disabled={isImportingExcel}
                      className="px-4 py-2 bg-black hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-xs cursor-pointer"
                    >
                      {isImportingExcel ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                          <span>
                            Importing ({excelImportProgress?.processed || 0} / {excelImportProgress?.total || extractedExcelRows.length})...
                          </span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Import All {extractedExcelRows.length.toLocaleString('en-IN')} Properties to Database</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Import Progress Bar */}
                {excelImportProgress && (
                  <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full transition-all duration-300"
                      style={{
                        width: `${Math.round((excelImportProgress.processed / excelImportProgress.total) * 100)}%`
                      }}
                    />
                  </div>
                )}

                {/* TABLE VIEW */}
                {excelViewMode === 'summary' ? (
                  /* Summary Table */
                  <div className="border border-zinc-200 rounded-xl overflow-x-auto text-xs">
                    <table className="w-full divide-y divide-zinc-200">
                      <thead className="bg-zinc-50 text-zinc-600 font-bold uppercase text-[10px] tracking-wider text-left">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Ref #</th>
                          <th className="py-2.5 px-3">Title &amp; Property</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Location</th>
                          <th className="py-2.5 px-3">Price / Rate</th>
                          <th className="py-2.5 px-3">Carpet / Super Area</th>
                          <th className="py-2.5 px-3">Fields</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {paginatedRows.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-zinc-400">
                              No properties match your filter criteria.
                            </td>
                          </tr>
                        ) : (
                          paginatedRows.map((row) => (
                            <tr key={row.id} className="hover:bg-zinc-50/70 transition-colors">
                              <td className="py-2.5 px-3 text-zinc-400 font-mono text-[11px]">{row.rowNumber}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-amber-900 text-[11px] whitespace-nowrap">
                                <span className="bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                                  {row.refNumber}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 min-w-[220px]">
                                <p className="font-bold text-zinc-900 truncate max-w-xs" title={row.title}>{row.title}</p>
                                {row.buildingName && (
                                  <p className="text-[11px] text-zinc-500 truncate" title={row.buildingName}>{row.buildingName}</p>
                                )}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] border ${
                                  row.transactionType === 'Rent'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-blue-50 text-blue-800 border-blue-200'
                                }`}>
                                  {row.propertyType} &bull; {row.transactionType}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-zinc-700 whitespace-nowrap">{row.location}</td>
                              <td className="py-2.5 px-3 font-bold text-zinc-950 whitespace-nowrap">
                                {row.price}
                                {row.pricePsf && (
                                  <span className="block text-[10px] text-zinc-400 font-normal">₹{row.pricePsf}/sqft</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap text-zinc-700">
                                {row.carpetArea ? (
                                  <span>{row.carpetArea}</span>
                                ) : (
                                  row.superArea || row.plotArea || '—'
                                )}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  {row.populatedFieldsCount}/48
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setPreviewRowForDescription(row)}
                                  className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition border border-zinc-200/80 cursor-pointer"
                                  title="Live preview dynamic description page for this row"
                                >
                                  <Eye className="w-3.5 h-3.5 text-zinc-600" />
                                  <span>Preview</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Full 48-Column Table */
                  <div className="border border-zinc-200 rounded-xl overflow-x-auto text-xs max-h-[500px]">
                    <table className="w-full divide-y divide-zinc-200">
                      <thead className="bg-zinc-50 text-zinc-600 font-bold uppercase text-[10px] tracking-wider text-left sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3 bg-zinc-50 sticky left-0 z-20">#</th>
                          <th className="py-2.5 px-3 bg-zinc-50 sticky left-8 z-20">Ref #</th>
                          <th className="py-2.5 px-3 text-right">Preview</th>
                          {EXCEL_48_COLUMNS.map((col) => (
                            <th key={col.key} className="py-2.5 px-3 whitespace-nowrap" title={`${col.label} (${col.key})`}>
                              {col.shortLabel || col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {paginatedRows.map((row) => (
                          <tr key={row.id} className="hover:bg-zinc-50/70 transition-colors">
                            <td className="py-2 px-3 text-zinc-400 font-mono text-[11px] bg-white sticky left-0 z-10">{row.rowNumber}</td>
                            <td className="py-2 px-3 font-mono font-bold text-amber-900 text-[11px] bg-white sticky left-8 z-10 whitespace-nowrap">
                              {row.refNumber}
                            </td>
                            <td className="py-2 px-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setPreviewRowForDescription(row)}
                                className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 transition"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Preview</span>
                              </button>
                            </td>
                            {EXCEL_48_COLUMNS.map((col) => {
                              const rawVal = row.extracted48?.[col.key];
                              const displayVal = format48ValueForTable(col.key, rawVal);
                              const isPopulated = rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '';
                              return (
                                <td
                                  key={col.key}
                                  className={`py-2 px-3 whitespace-nowrap text-[11px] ${
                                    isPopulated ? 'text-zinc-900 font-medium' : 'text-zinc-300'
                                  }`}
                                  title={isPopulated ? String(rawVal) : undefined}
                                >
                                  {displayVal}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-zinc-500">
                  <div className="flex items-center gap-2">
                    <span>Rows per page:</span>
                    <select
                      value={excelRowsPerPage}
                      onChange={(e) => {
                        setExcelRowsPerPage(Number(e.target.value));
                        setExcelPage(1);
                      }}
                      className="px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900"
                    >
                      {[10, 25, 50, 100].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <span>
                      Showing {filtered.length === 0 ? 0 : startIdx + 1} to {Math.min(startIdx + excelRowsPerPage, filtered.length)} of {filtered.length.toLocaleString('en-IN')} properties
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setExcelPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1 bg-zinc-50 hover:bg-zinc-100 disabled:opacity-40 border border-zinc-200 rounded-lg font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>
                    <span className="font-semibold text-zinc-800">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setExcelPage(p => Math.min(totalPages, p + 1))}
                      className="px-3 py-1 bg-zinc-50 hover:bg-zinc-100 disabled:opacity-40 border border-zinc-200 rounded-lg font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ================= DYNAMIC PROPERTY DESCRIPTION PAGE LIVE PREVIEW MODAL ================= */}
      {previewRowForDescription && (() => {
        const r = previewRowForDescription;
        const f = (r.extracted48 || {}) as Record<string, any>;

        const cleanVal = (val: any): string => {
          if (val === null || val === undefined) return '';
          const s = String(val).trim();
          if (
            s === '' ||
            s.toLowerCase() === 'null' ||
            s.toLowerCase() === 'undefined' ||
            s.toLowerCase() === 'nan' ||
            s === '—' ||
            s === '-' ||
            s.toLowerCase() === 'n/a'
          ) {
            return '';
          }
          return s;
        };

        const sections = [
          {
            title: 'Property Overview & Identification',
            items: [
              { label: 'Property Title', value: cleanVal(f.Title || r.title) },
              { label: 'Reference Number', value: cleanVal(f.RefNumber || r.refNumber) },
              { label: 'Transaction Type', value: cleanVal(f.Lease_Sale || f.TransactionName || r.transactionType) },
              { label: 'Property Type', value: cleanVal(f.PropertyTypeName || r.propertyType) },
              { label: 'Project / Property Name', value: cleanVal(f.PropertyName || r.propertyName) },
              { label: 'Unit / Flat No.', value: cleanVal(f.FlatNo) },
              { label: 'Building Name', value: cleanVal(f.BuildingName || r.buildingName) },
              { label: 'Society Name', value: cleanVal(f.SocietyName) },
              { label: 'Property Age', value: cleanVal(f.PropertyAge) },
              { label: 'Possession Status', value: cleanVal(f.PossessionName) },
              { label: 'Availability Status', value: cleanVal(f.Status) },
              { label: 'Transaction Classification', value: cleanVal(f.TransactionName) }
            ]
          },
          {
            title: 'Location & Vicinity Details',
            items: [
              { label: 'Locality', value: cleanVal(f.LocationName || r.location) },
              { label: 'Landmark', value: cleanVal(f.Landmark) },
              { label: 'Street', value: cleanVal(f.Street) },
              { label: 'City', value: cleanVal(f.CityName || r.city) },
              { label: 'State', value: cleanVal(f.StateName) },
              { label: 'Full Address', value: cleanVal(f.AddressName) }
            ]
          },
          {
            title: 'Area & Spatial Measurements',
            items: [
              { label: 'Carpet Area', value: cleanVal(f.CarpetAreaName || r.carpetArea) },
              { label: 'Built-up Area', value: cleanVal(f.BuiltAreaName) },
              { label: 'Super Built-up Area', value: cleanVal(f.SuperAreaName || r.superArea) },
              { label: 'Plot Size / Land Area', value: cleanVal(f.PlotSizeName || r.plotArea) },
              { label: 'Minimum Area', value: cleanVal(f.MinAreaName) },
              { label: 'Maximum Area', value: cleanVal(f.MaxAreaName) }
            ]
          },
          {
            title: 'Commercial & Financial Terms',
            items: [
              { label: 'Expected Price', value: cleanVal(f.ExpectedPrice ? (String(f.ExpectedPrice).startsWith('₹') ? f.ExpectedPrice : `₹${f.ExpectedPrice}`) : '') },
              { label: 'Price Per Sq.Ft.', value: cleanVal(f.PricePerUnitArea ? `₹${f.PricePerUnitArea}/Sq.Ft.` : '') },
              { label: 'Monthly Rent', value: cleanVal(f.RentPM ? (String(f.RentPM).startsWith('₹') ? `${f.RentPM}/month` : `₹${f.RentPM}/month`) : '') },
              { label: 'Security Deposit', value: cleanVal(f.DepositePrice ? (String(f.DepositePrice).startsWith('₹') ? f.DepositePrice : `₹${f.DepositePrice}`) : '') },
              { label: 'Maintenance Charges', value: cleanVal(f.MaintainCharges) },
              { label: 'Property Tax', value: cleanVal(f.PropertyTax) },
              { label: 'ROI (Yield %)', value: cleanVal(f.ROI ? (String(f.ROI).endsWith('%') ? f.ROI : `${f.ROI}%`) : '') },
              { label: 'Rent Start Date', value: cleanVal(f.RentStartDate) },
              { label: 'Lock-in Period', value: cleanVal(f.LockinPeriod) },
              { label: 'Lease Period', value: cleanVal(f.LeasePeriod) }
            ]
          },
          {
            title: 'Unit Specifications & Features',
            items: [
              { label: 'Furnishing Status', value: cleanVal(f.FurnishingName) },
              { label: 'Floor Number', value: cleanVal(f.FloorNumber) },
              { label: 'Facing Direction', value: cleanVal(f.FacingText) },
              { label: 'Parking Details', value: cleanVal(f.ParkingDetails) }
            ]
          }
        ];

        // Filter populated sections strictly: only non-empty fields!
        const populatedSections = sections
          .map(s => ({
            ...s,
            items: s.items.filter(item => cleanVal(item.value) !== '')
          }))
          .filter(s => s.items.length > 0);

        const narrativeDesc = cleanVal(f.Description);

        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl border border-zinc-200 max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 animate-in zoom-in-95">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-amber-100 text-amber-900 border border-amber-300">
                      {r.refNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-zinc-100 text-zinc-800">
                      Row #{r.rowNumber}
                    </span>
                  </div>
                  <h3 className="font-black text-zinc-950 text-base sm:text-lg mt-1">{r.title}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Live Dynamic Description Page Verification &bull; {populatedSections.reduce((acc, s) => acc + s.items.length, 0)} non-empty fields active
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewRowForDescription(null)}
                  className="p-1.5 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Strict Conditional Notice */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Strict Conditional Visibility Verified:</strong> Only populated fields from your Excel file are shown. All empty or blank fields are automatically hidden.
                </span>
              </div>

              {/* Rendered Sections */}
              <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
                {populatedSections.map((section, sIdx) => (
                  <div key={sIdx} className="space-y-1.5">
                    <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      <span>{section.title}</span>
                    </h4>
                    <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 overflow-hidden text-xs">
                      {section.items.map(({ label, value }, rIdx) => (
                        <div key={rIdx} className="flex items-start gap-3 px-3 py-2 hover:bg-zinc-50/60 transition-colors">
                          <span className="text-zinc-500 font-semibold shrink-0 w-[140px] sm:w-[180px]">{label}</span>
                          <span className="text-zinc-900 font-medium break-words flex-1">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Narrative Description in Clean Point Format (Privacy Protected) */}
                {(() => {
                  const descPoints = parseDescriptionBulletPoints(narrativeDesc);
                  if (descPoints.length === 0) return null;
                  return (
                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2.5">
                      <span className="text-xs font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-zinc-700" />
                        <span>Property Description &amp; Remarks</span>
                      </span>
                      <ul className="space-y-2 bg-white p-4 rounded-xl border border-zinc-100 divide-y divide-zinc-50">
                        {descPoints.map((pt, idx) => (
                          <li key={idx} className={`flex items-start gap-2.5 text-xs text-zinc-700 leading-relaxed ${idx > 0 ? 'pt-2' : ''}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5"></span>
                            <span className="break-words flex-1 font-medium">{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setPreviewRowForDescription(null)}
                  className="px-5 py-2 bg-zinc-950 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
                  <p className="text-xs text-zinc-600 line-clamp-3 leading-relaxed whitespace-pre-line font-mono">
                    {formatPropertyDescription(scrapedSingle.description)}
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

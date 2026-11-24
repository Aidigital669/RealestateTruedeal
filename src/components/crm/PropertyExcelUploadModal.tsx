'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Search,
  Building2,
  MapPin,
  Eye,
  Table as TableIcon,
  LayoutGrid,
  Check,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Layers,
  Info,
  Phone,
  Mail,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import Image from 'next/image';
import * as XLSX from 'xlsx';
import {
  EXCEL_48_COLUMNS,
  extract48Fields,
  detectActive48Columns,
  format48ValueForTable,
  type Excel48ColumnDef
} from '@/lib/excel-48-extractor';

export interface ParsedPropertyRow {
  id: string;
  title: string;
  category: string;
  location: string;
  buildingName?: string;
  price: string | number;
  priceFormatted: string;
  status: string;
  sqft: string | number;
  carpetArea?: number | string | null;
  superArea?: number | string | null;
  developer: string;
  imageUrl: string;
  description: string;
  publishStatus: string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  videoUrl?: string;
  isValid: boolean;
  errors?: string[];
  rawRow?: any;
  extracted48?: Record<string, any>;
}

interface PropertyExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (count: number) => void;
}

const SAMPLE_TEMPLATE_PROPERTIES = [
  {
    "Property Name": "Giga Space IT Park Grade-A Commercial Office",
    "Category": "Commercial Office",
    "Location": "Viman Nagar, Pune",
    "Price": "₹1.58 Cr",
    "Status": "Ready to Move",
    "Carpet Area (sqft)": 2480,
    "Developer": "Giga Group",
    "Image URL": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    "Description": "Prime Grade-A commercial corporate office space in Giga Space IT Park with 100% power backup and multi-level car parking.",
    "Publish Status": "Published",
    "Bedrooms": "",
    "Bathrooms": 2,
    "Video URL": ""
  },
  {
    "Property Name": "Commercial Medical / Hospital Facility",
    "Category": "Hospital",
    "Location": "Undri, Pune",
    "Price": "₹6.00 Cr",
    "Status": "Ready to Move",
    "Carpet Area (sqft)": 6200,
    "Developer": "Undri MediCorp",
    "Image URL": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
    "Description": "High-yield healthcare & multi-specialty hospital infrastructure with oxygen lines, stretcher elevators, and clear approvals.",
    "Publish Status": "Published",
    "Bedrooms": "",
    "Bathrooms": 6,
    "Video URL": ""
  },
  {
    "Property Name": "WestView Corporate Office Space by Panchshil",
    "Category": "Office Space",
    "Location": "Koregaon Park, Pune",
    "Price": "₹14.32 Cr",
    "Status": "Ready to Move",
    "Carpet Area (sqft)": 11500,
    "Developer": "Panchshil Realty",
    "Image URL": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    "Description": "Iconic glass-facade LEED certified commercial tower overlooking lush greenery in Koregaon Park.",
    "Publish Status": "Published",
    "Bedrooms": "",
    "Bathrooms": 4,
    "Video URL": ""
  },
  {
    "Property Name": "Skyline Presidential Penthouse with Private Deck",
    "Category": "Penthouse",
    "Location": "Baner, Pune",
    "Price": "₹3.85 Cr",
    "Status": "Ready to Move",
    "Carpet Area (sqft)": 3800,
    "Developer": "VTP Realty",
    "Image URL": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    "Description": "Ultra-luxury duplex penthouse with wrap-around private sundeck, Italian marble flooring, and smart home automation.",
    "Publish Status": "Published",
    "Bedrooms": 4,
    "Bathrooms": 5,
    "Video URL": ""
  },
  {
    "Property Name": "High-Street Retail Showroom & Commercial Boutique",
    "Category": "Shop/Showroom",
    "Location": "Kalyani Nagar, Pune",
    "Price": "₹2.90 Cr",
    "Status": "Ready to Move",
    "Carpet Area (sqft)": 1850,
    "Developer": "K Raheja Corp",
    "Image URL": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    "Description": "Road-facing high-visibility commercial showroom ideal for jewelry, automobile, or luxury flagship stores.",
    "Publish Status": "Published",
    "Bedrooms": "",
    "Bathrooms": 2,
    "Video URL": ""
  }
];

// Curated high-res architectural photos by category for varied visual cards
const CATEGORY_IMAGE_POOLS: Record<string, string[]> = {
  'Hospital': [
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=80'
  ],
  'Office Space': [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=80'
  ],
  'Commercial Office': [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'
  ],
  'Office in IT Park': [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'
  ],
  'Shop/Showroom': [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80'
  ],
  'Restaurant': [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80'
  ],
  'Hotel / Resort': [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
  ],
  'Residential Bunglow': [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
  ],
  'Penthouse': [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
  ],
  'Residential Apartment': [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'
  ]
};

function getCategoryPhoto(categoryStr: string, idx: number): string {
  const pool = CATEGORY_IMAGE_POOLS[categoryStr] || CATEGORY_IMAGE_POOLS['Commercial Office'];
  return pool[idx % pool.length];
}

function getFallbackImage(categoryStr: string): string {
  return getCategoryPhoto(categoryStr, 0);
}


const DEVELOPER_PATTERNS = [
  { match: /panchshil/i, name: 'Panchshil Realty' },
  { match: /godrej/i, name: 'Godrej Properties' },
  { match: /bramha/i, name: 'BramhaCorp' },
  { match: /vtp/i, name: 'VTP Realty' },
  { match: /amar\s*madhuban|amar\s*summit|amar/i, name: 'Amar Builders' },
  { match: /ganga|geol\s*ganga/i, name: 'Goel Ganga Developments' },
  { match: /mantra/i, name: 'Mantra Properties' },
  { match: /solitaire/i, name: 'Solitaire Group' },
  { match: /tribeca/i, name: 'Tribeca Developers' },
  { match: /kolte/i, name: 'Kolte Patil Developers' },
  { match: /raheja/i, name: 'K Raheja Corp' },
  { match: /gera/i, name: 'Gera Developments' },
  { match: /pride/i, name: 'Pride Purple Group' },
  { match: /atrium/i, name: 'Atrium Group' },
  { match: /trade\s*park/i, name: 'Trade Park Group' },
  { match: /teerth/i, name: 'Teerth Realties' },
  { match: /kotibhaskar/i, name: 'Kotibhaskar Group' },
  { match: /orville/i, name: 'Orville Realties' }
];

function cleanLocality(raw: any): string {
  if (!raw) return 'Pune, Maharashtra';
  let s = String(raw).trim();
  if (s.toLowerCase() === 'others/pune') return 'Pune, Maharashtra';
  if (/baner\s*mahalunge/i.test(s)) return 'Baner-Mahalunge Road, Pune';
  if (/ganesh\s*kinde|ganeshkhind/i.test(s)) return 'Ganeshkhind Road, Shivaji Nagar, Pune';
  if (/sadhu\s*vaswani/i.test(s)) return 'Sadhu Vaswani Chowk, Camp, Pune';
  if (/magarpatta/i.test(s)) return 'Magarpatta City, Pune';
  if (/nibm/i.test(s)) return 'NIBM Road, Pune';
  if (!s.toLowerCase().includes('pune')) s += ', Pune';
  return s;
}

function normalizeCategory(raw: any): string {
  if (!raw) return 'Commercial Office';
  const s = String(raw).trim();
  if (/medical|hospital|clinic|healthcare/i.test(s)) return 'Hospital';
  if (/office\s*in\s*it\s*park|it park|tech park|cyber|coworking|co-working|office|space|corporate|building/i.test(s)) return 'Office Space';
  if (/showroom|shop|retail|boutique/i.test(s)) return 'Shop/Showroom';
  if (/restaurant|cafe|dining|bar|lounge|f&b/i.test(s)) return 'Restaurant';
  if (/hotel|resort|hospitality/i.test(s)) return 'Hotel / Resort';
  if (/warehouse|godown|logistics/i.test(s)) return 'Warehouse';
  if (/plot|land|farm|agriculture/i.test(s)) return 'Residential/Commercial Land/Plot';
  if (/bungalow|bunglow|villa|row house/i.test(s)) return 'Residential Bunglow';
  if (/penthouse/i.test(s)) return 'Penthouse';
  if (/apartment|flat|bhk|residence/i.test(s)) return 'Residential Apartment';
  return s;
}

function parseAreaNumber(raw: any): number {
  if (typeof raw === 'number' && !isNaN(raw) && raw > 0) return raw;
  if (!raw) return 1200;
  const str = String(raw).replace(/,/g, '');
  const m = str.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!m) return 1200;
  let val = parseFloat(m[1]);
  if (/sq\.?\s*meter|sqm|meter/i.test(str)) {
    val = Math.round(val * 10.7639);
  }
  return val;
}

function parseIndianPriceNumber(priceRaw: any): number {
  if (typeof priceRaw === 'number' && !isNaN(priceRaw)) return priceRaw;
  if (!priceRaw) return 0;
  const str = String(priceRaw).trim().toLowerCase();
  if (str === 'price on request' || str === 'on request' || str === 'n/a') return 0;

  const crMatch = str.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:cr|crore|crores)/i);
  if (crMatch) return Math.round(parseFloat(crMatch[1]) * 10000000);

  const lMatch = str.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:lakh|lakhs|lac|lacs|l)\b/i);
  if (lMatch) return Math.round(parseFloat(lMatch[1]) * 100000);

  const cleanNum = parseFloat(str.replace(/[^0-9.]/g, ''));
  return !isNaN(cleanNum) ? cleanNum : 0;
}

function formatPriceForDisplay(rawPrice: any): string {
  if (typeof rawPrice === 'number' && !isNaN(rawPrice)) {
    if (rawPrice >= 10000000) return `₹${(rawPrice / 10000000).toFixed(2)} Cr`;
    if (rawPrice >= 100000) return `₹${(rawPrice / 100000).toFixed(1)} Lakh`;
    if (rawPrice > 0) return `₹${rawPrice.toLocaleString('en-IN')}`;
    return 'Price on Request';
  }
  if (!rawPrice) return 'Price on Request';
  const str = String(rawPrice).trim();
  if (/on request/i.test(str)) return 'Price on Request';
  const num = parseFloat(str.replace(/[^0-9.]/g, ''));
  if (isNaN(num) || num <= 0) return 'Price on Request';
  if (/^₹?\s*0+(\.0+)?\s*(lakh|cr|crore|lac)?$/i.test(str)) return 'Price on Request';
  if (/^₹/.test(str)) return str;
  if (/cr|crore|lakh|lac/i.test(str)) return `₹${str}`;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)} Lakh`;
  return `₹${num.toLocaleString('en-IN')}`;
}

function calculatePriceData(row: any, area: number, fields48?: Record<string, any>): { price: number; formatted: string } {
  const isRent = fields48?.Lease_Sale && /lease|rent/i.test(String(fields48.Lease_Sale));

  // If Rent / Lease property, prioritize RentPM
  if (isRent) {
    const rentVal = fields48?.RentPM || row.RentPM || row['Rent PM'] || row.rent_pm || row.Rent || row['Monthly Rent'];
    if (rentVal !== undefined && rentVal !== null && String(rentVal).trim() !== '') {
      const r = parseFloat(String(rentVal).replace(/[^0-9.]/g, ''));
      if (!isNaN(r) && r > 0) {
        const depRaw = fields48?.DepositePrice || row.DepositePrice || row.DepositPrice;
        let depSuffix = '';
        if (depRaw) {
          const d = parseFloat(String(depRaw).replace(/[^0-9.]/g, ''));
          if (!isNaN(d) && d > 0) {
            depSuffix = ` (Deposit: ₹${d >= 100000 ? (d / 100000).toFixed(1) + ' Lakh' : d.toLocaleString('en-IN')})`;
          }
        }
        return {
          price: r * 100,
          formatted: `₹${r >= 100000 ? (r / 100000).toFixed(2) + ' Lakh' : r.toLocaleString('en-IN')}/mo${depSuffix}`
        };
      }
    }
  }

  // 1. Direct total price columns (ExpectedPrice first)
  const expectedVal = fields48?.ExpectedPrice || row.ExpectedPrice || row['Expected Price'] || row.expected_price;
  if (expectedVal !== undefined && expectedVal !== null && String(expectedVal).trim() !== '') {
    const p = parseIndianPriceNumber(expectedVal);
    if (p > 10000) {
      return { price: p, formatted: formatPriceForDisplay(p) };
    }
  }

  const directPriceKeys = [
    'Price', 'price', 'Total Price', 'total_price', 'Budget', 'budget',
    'Cost', 'cost', 'TotalCost', 'total_cost', 'Amount', 'amount', 'Total Amount'
  ];
  for (const k of directPriceKeys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      const p = parseIndianPriceNumber(row[k]);
      if (p > 10000) {
        return { price: p, formatted: formatPriceForDisplay(p) };
      }
    }
  }

  // 2. Price Per Unit Area (Rate / SqFt)
  const puaVal = fields48?.PricePerUnitArea || row.PricePerUnitArea || row['Price Per Unit Area'] || row['Price/Sqft'] || row.Rate || row['Rate/Sqft'];
  if (puaVal !== undefined && puaVal !== null && String(puaVal).trim() !== '') {
    const pua = parseFloat(String(puaVal).replace(/[^0-9.]/g, ''));
    if (!isNaN(pua) && pua >= 500 && area > 0) {
      const total = Math.round(area * pua);
      let rentSuffix = '';
      const rentRaw = fields48?.RentPM || row.RentPM || row['Rent PM'];
      if (rentRaw) {
        const r = parseFloat(String(rentRaw).replace(/[^0-9.]/g, ''));
        if (!isNaN(r) && r > 0) {
          rentSuffix = ` (Rent: ₹${(r / 100000).toFixed(1)} L/mo)`;
        }
      }
      return { price: total, formatted: `${formatPriceForDisplay(total)}${rentSuffix}` };
    }
    if (!isNaN(pua) && pua > 0 && pua < 500 && area > 0) {
      const monthlyRent = Math.round(area * pua);
      return { price: monthlyRent * 100, formatted: `₹${(monthlyRent / 100000).toFixed(1)} Lakh/mo (Rent)` };
    }
  }

  // 3. Rent PM fallback
  const rentRaw = fields48?.RentPM || row.RentPM || row['Rent PM'] || row.rent_pm || row.Rent || row['Monthly Rent'];
  if (rentRaw) {
    const r = parseFloat(String(rentRaw).replace(/[^0-9.]/g, ''));
    if (!isNaN(r) && r > 0) {
      return { price: r * 100, formatted: `₹${(r / 100000).toFixed(1)} Lakh/mo (Rent)` };
    }
  }

  // 4. Deposit Price fallback
  const depVal = fields48?.DepositePrice || row.DepositePrice || row.DepositPrice;
  if (depVal) {
    const d = parseFloat(String(depVal).replace(/[^0-9.]/g, ''));
    if (!isNaN(d) && d > 10000) {
      return { price: 0, formatted: `Deposit: ₹${(d / 100000).toFixed(1)} Lakh` };
    }
  }

  return { price: 0, formatted: 'Price on Request' };
}

function isCustomerOrAgent(val: string, custFull: string): boolean {
  if (!val) return true;
  const v = val.toLowerCase().replace(/[^a-z]/g, '');
  if (!v) return true;
  if (custFull) {
    const c = custFull.toLowerCase().replace(/[^a-z]/g, '');
    if (v === c || v.includes(c) || c.includes(v)) return true;
  }
  return /^(nikkhil|santosh|jadhav|jain|sharma|patil|gupta|verma|deshmukh|drparmar)$/i.test(v);
}

function constructPropertyTitle(row: any, category: string, location: string, area: number, fields48?: Record<string, any>): string {
  // If Title is explicitly provided in fields48 or row, use it directly!
  const directTitle = fields48?.Title || row.Title || row.title || row.PropertyTitle || row['Property Title'];
  if (directTitle && String(directTitle).trim() && !isCustomerOrAgent(String(directTitle).trim(), fields48?.CustomerFullName || row.CustomerFullName)) {
    return formatCleanTitleWithLocation(String(directTitle).trim(), location);
  }

  const directTitleKeys = [
    'PropertyName', 'Property Name', 'property_name', 'Project Name'
  ];
  for (const k of directTitleKeys) {
    const val = row[k] ? String(row[k]).trim() : '';
    if (val && !isCustomerOrAgent(val, fields48?.CustomerFullName || row.CustomerFullName)) {
      return formatCleanTitleWithLocation(val, location);
    }
  }

  const bldg = (row['BuildingName'] || row['Building Name'] || row['Building'] || '')
    .toString()
    .replace(/[\u2018\u2019\u201c\u201d"'`]/g, '')
    .trim();
  const prop = (row['PropertyName'] || row['Property'] || '')
    .toString()
    .replace(/[\u2018\u2019\u201c\u201d"'`]/g, '')
    .trim();
  const cust = (row['CustomerFullName'] || '').toString().trim();
  const fl = (row['FloorNumber'] || '').toString().trim();
  const areaFormatted = area ? `${area.toLocaleString('en-IN')} Sq.Ft. ` : '';

  let namePart = '';

  if (bldg && !isCustomerOrAgent(bldg, cust)) {
    namePart = bldg;
  } else if (prop && !isCustomerOrAgent(prop, cust)) {
    namePart = prop;
  }

  let fullTitle = '';
  if (namePart) {
    const hasCat = new RegExp(category.replace('/', '|'), 'i').test(namePart);
    const catSuffix = hasCat ? '' : ` ${category}`;
    const flSuffix = (fl && /^\d+(st|nd|rd|th)?\s*floor$/i.test(fl)) ? ` (${fl})` : '';
    fullTitle = `${namePart}${catSuffix}${flSuffix}`;
  } else {
    fullTitle = `${areaFormatted}${category}`;
  }

  return formatCleanTitleWithLocation(fullTitle, location);
}

function formatCleanTitleWithLocation(title: string, location: string): string {
  let clean = title.replace(/[\u2018\u2019\u201c\u201d"'`]/g, '').replace(/\s+/g, ' ').trim();
  const locPure = location.replace(', Pune', '').replace(', Maharashtra', '').trim();
  if (locPure && !clean.toLowerCase().includes(locPure.toLowerCase())) {
    clean += ` in ${location}`;
  } else if (!clean.toLowerCase().includes('pune')) {
    clean += ', Pune';
  }
  return clean;
}

function detectDeveloper(bldg: string, prop: string, rowDev: string): string {
  if (rowDev && rowDev.trim()) {
    const trimmed = rowDev.trim();
    if (!/anv\b/i.test(trimmed)) return trimmed;
  }
  return '';
}

export function PropertyExcelUploadModal({
  isOpen,
  onClose,
  onImportComplete
}: PropertyExcelUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedPropertyRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; percent: number; statusText?: string } | null>(null);
  const [clearExistingBeforeImport, setClearExistingBeforeImport] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'cards' | 'table'>('table');
  const [tableViewMode, setTableViewMode] = useState<'all-48' | 'standard'>('all-48');
  const [selectedRowDetail, setSelectedRowDetail] = useState<ParsedPropertyRow | null>(null);
  const [searchPreview, setSearchPreview] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const active48Columns = useMemo(() => {
    return detectActive48Columns(parsedRows);
  }, [parsedRows]);

  const filteredPreview = useMemo(() => {
    if (!searchPreview.trim()) return parsedRows;
    const q = searchPreview.toLowerCase();
    return parsedRows.filter(p => {
      const basicMatch = (
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q) ||
        (p.developer && p.developer.toLowerCase().includes(q))
      );
      if (basicMatch) return true;
      if (p.extracted48) {
        return Object.values(p.extracted48).some(v =>
          v !== undefined && v !== null && String(v).toLowerCase().includes(q)
        );
      }
      return false;
    });
  }, [parsedRows, searchPreview]);

  if (!isOpen) return null;

  // Download Sample Template (.xlsx)
  const handleDownloadTemplate = (format: 'xlsx' | 'csv' = 'xlsx') => {
    try {
      const ws = XLSX.utils.json_to_sheet(SAMPLE_TEMPLATE_PROPERTIES);

      // Auto-size columns for clean presentation
      ws['!cols'] = [
        { wch: 45 }, // Property Name
        { wch: 22 }, // Category
        { wch: 24 }, // Location
        { wch: 15 }, // Price
        { wch: 18 }, // Status
        { wch: 18 }, // Carpet Area (sqft)
        { wch: 22 }, // Developer
        { wch: 40 }, // Image URL
        { wch: 45 }, // Description
        { wch: 16 }, // Publish Status
        { wch: 10 }, // Bedrooms
        { wch: 10 }, // Bathrooms
        { wch: 30 }  // Video URL
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Property_Catalog");

      if (format === 'csv') {
        XLSX.writeFile(wb, "ANV_Properties_Upload_Template.csv", { bookType: 'csv' });
      } else {
        XLSX.writeFile(wb, "ANV_Properties_Upload_Template.xlsx");
      }
    } catch (e: any) {
      console.error("Error downloading template:", e);
      setErrorMessage("Could not generate template: " + e.message);
    }
  };

  // Process File buffer & parse rows
  const processUploadedFile = (uploadedFile: File) => {
    setIsParsing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) throw new Error("Could not read file data");

        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error("Excel sheet contains no pages");

        const sheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (!rawJson || rawJson.length === 0) {
          throw new Error("No data rows found in the uploaded spreadsheet.");
        }

        const normalized: ParsedPropertyRow[] = rawJson
          .map((row, idx) => {
            // Extract all 48 custom Excel columns cleanly
            const fields48 = extract48Fields(row);

            // 1. Resolve Category
            const rawCat = fields48.PropertyTypeName || row["PropertyTypeName"] || row["Category"] || row.category || row["Configuration"] || row.configuration || row["Property Type"] || row.type || row["BHK"] || row.bhk;
            const category = normalizeCategory(rawCat);

            // 2. Resolve Location
            const rawLoc = cleanLocality(
              fields48.LocationName ||
              row["LocationName"] ||
              row["Location"] ||
              row.location ||
              fields48.AddressName ||
              row["AddressName"] ||
              row["Address"] ||
              row.address ||
              fields48.SocietyName ||
              fields48.Landmark ||
              fields48.CityName ||
              row["CityName"] ||
              row["City"] ||
              row.city ||
              row["Locality"]
            );

            // 3. Resolve Area metrics independently - DO NOT equate Carpet Area with Super Area
            const rawCarpet = (fields48.CarpetAreaName || row["CarpetAreaName"] || row["Carpet Area (sqft)"] || row["Carpet Area"] || row["carpet"] || "").toString().trim();
            const rawSuper = (fields48.SuperAreaName || row["SuperAreaName"] || row["Super Built-up Area"] || row["Super Area"] || row["Saleable Area"] || row["sbua"] || "").toString().trim();
            const rawBuilt = (fields48.BuiltAreaName || row["BuiltAreaName"] || row["Built-up Area"] || row["bua"] || "").toString().trim();
            const rawPlot = (fields48.PlotSizeName || row["PlotSizeName"] || row["Plot Area"] || "").toString().trim();

            const numCarpet = rawCarpet ? parseAreaNumber(rawCarpet) : 0;
            const numSuper = rawSuper ? parseAreaNumber(rawSuper) : 0;
            const numBuilt = rawBuilt ? parseAreaNumber(rawBuilt) : 0;
            const numPlot = rawPlot ? parseAreaNumber(rawPlot) : 0;

            const effectiveArea = numCarpet || numSuper || numBuilt || numPlot || 1200;

            // 4. Construct Clean, Realistic Title
            const title = constructPropertyTitle(row, category, rawLoc, effectiveArea, fields48);

            // 5. Calculate and Format Price
            const { price, formatted: priceFormatted } = calculatePriceData(row, effectiveArea, fields48);

            // 6. Resolve Status & Possession (Preserve authentic possession dates like "3/2030" or "Immediately")
            const rawPossession = (fields48.PossessionName || row["PossessionName"] || '').toString().trim();
            const rawStatus = (row.status || fields48.Status || row["Status"] || fields48.TransactionName || row["TransactionName"] || fields48.PossessionName || row["PossessionName"] || row["Construction Status"] || '').toString().trim();

            let status = 'Possession on Request';
            if (rawPossession) {
              if (/immediately|immediate/i.test(rawPossession)) {
                status = 'Immediate Possession';
              } else if (/ready\s*to\s*move/i.test(rawPossession)) {
                status = 'Ready to Move';
              } else if (/under\s*construction/i.test(rawPossession)) {
                status = 'Under Construction';
              } else {
                status = rawPossession;
              }
            } else if (rawStatus) {
              if (/under\s*construction/i.test(rawStatus)) status = 'Under Construction';
              else if (/pre\s*lease/i.test(rawStatus)) status = 'Pre-Leased';
              else if (/new\s*launch/i.test(rawStatus)) status = 'New Launch';
              else if (/ready\s*to\s*move/i.test(rawStatus)) status = 'Ready to Move';
              else if (/immediately|immediate/i.test(rawStatus)) status = 'Immediate Possession';
              else status = rawStatus;
            }

            // 7. Developer
            const bldg = (fields48.BuildingName || row['BuildingName'] || row['Building Name'] || '').toString();
            const prop = (fields48.PropertyName || row['PropertyName'] || row['Property'] || '').toString();
            const rawDev = (row["Developer"] || row.developer || row["Builder"] || row.builder || "").toString();
            const developer = detectDeveloper(bldg, prop, rawDev);

            // 8. Custom or Category Photo
            const imageRaw = (row["Image URL"] || row["ImageUrl"] || row.image || row["Image"] || "").toString().trim();
            const imageUrl = imageRaw.startsWith('http') ? imageRaw : getCategoryPhoto(category, idx);

            // 9. Detailed Description
            const furnishing = (fields48.FurnishingName || row["FurnishingName"] || "").toString().trim();
            const floor = (fields48.FloorNumber || row["FloorNumber"] || "").toString().trim();
            const parking = (fields48.ParkingDetails || row["ParkingDetails"] || "").toString().trim();
            const roi = (fields48.ROI || row["ROI"] || "").toString().trim();
            const rentVal = fields48.RentPM || row["RentPM"];
            const rent = rentVal ? parseFloat(String(rentVal).replace(/[^0-9.]/g, '')) : 0;
            const refNumber = (fields48.RefNumber || row["RefNumber"] || "").toString().trim();
            const facing = (fields48.FacingText || row["FacingText"] || "").toString().trim();
            const lockin = (fields48.LockinPeriod || "").toString().trim();
            const leasePeriod = (fields48.LeasePeriod || "").toString().trim();
            const maintenance = (fields48.MaintainCharges || "").toString().trim();

            const rentInfo = rent > 0 ? `, generating ₹${(rent / 100000).toFixed(2)} Lakh monthly rental income` : '';
            const roiInfo = roi ? `, with ${roi}% verified ROI` : '';
            const refInfo = refNumber ? ` [Ref: ${refNumber}]` : '';
            const facingInfo = facing ? `, ${facing}` : '';
            const leaseInfo = leasePeriod ? ` Lease Tenure: ${leasePeriod}.` : '';
            const lockinInfo = lockin ? ` Lock-in Period: ${lockin}.` : '';
            const maintInfo = maintenance ? ` Maintenance: ${maintenance}.` : '';

            const areaNarrative = fields48.CarpetAreaName
              ? `${fields48.CarpetAreaName} Carpet Area${fields48.SuperAreaName ? ' (' + fields48.SuperAreaName + ' Super Area)' : ''}`
              : (fields48.SuperAreaName ? `${fields48.SuperAreaName} Super Built-up Area` : `${effectiveArea.toLocaleString('en-IN')} Sq.Ft.`);

            const description = (
              fields48.Description ||
              row["Description"] ||
              row.description ||
              `Prime ${category} available in ${rawLoc}${facingInfo}. Featuring ${areaNarrative}${furnishing ? ' with ' + furnishing + ' specifications' : ''}${floor ? ', located on ' + floor : ''}${parking ? ', including ' + parking + ' reserved parking spaces' : ''}${rentInfo}${roiInfo}.${leaseInfo}${lockinInfo}${maintInfo} Verified commercial listing with clean titles and complete compliance.${refInfo}`
            ).toString().trim();

            const publishStatus = (row["Publish Status"] || row.publishStatus || "Published").toString().trim();

            const bldgName = (fields48.BuildingName || row['BuildingName'] || row['Building Name'] || row['Building'] || '').toString().trim();

            return {
              id: `row-${idx}-${Date.now()}`,
              title,
              category,
              location: rawLoc,
              buildingName: bldgName,
              price,
              priceFormatted,
              status,
              sqft: numCarpet > 0 ? numCarpet : (numSuper > 0 ? numSuper : effectiveArea),
              carpetArea: numCarpet > 0 ? numCarpet : null,
              superArea: numSuper > 0 ? numSuper : null,
              developer,
              imageUrl,
              description,
              publishStatus: /draft/i.test(publishStatus) ? "Draft" : "Published",
              bedrooms: row["Bedrooms"] || row.bedrooms || "",
              bathrooms: row["Bathrooms"] || row.bathrooms || "",
              videoUrl: row["Video URL"] || row.videoUrl || "",
              isValid: true,
              errors: [],
              rawRow: row,
              extracted48: fields48
            };
          })
          .filter(r => r.title.length > 0);

        if (normalized.length === 0) {
          throw new Error("No valid property records found in spreadsheet.");
        }

        setParsedRows(normalized);
      } catch (err: any) {
        console.error("Parse error:", err);
        setErrorMessage(err.message || "Failed to parse spreadsheet");
        setParsedRows([]);
      } finally {
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
      setIsParsing(false);
      setErrorMessage("Failed to read the file. Please ensure it is a valid .xlsx or .csv file.");
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveRow = (id: string) => {
    setParsedRows(prev => prev.filter(r => r.id !== id));
  };

  // High-Speed 1-Click Import to Database in Batches of 500
  const handleImportToDatabase = async () => {
    if (parsedRows.length === 0) {
      setErrorMessage("No properties to import.");
      return;
    }

    setIsImporting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setImportProgress({ current: 0, total: parsedRows.length, percent: 0, statusText: "Preparing import..." });

    try {
      if (clearExistingBeforeImport) {
        setImportProgress({ current: 0, total: parsedRows.length, percent: 0, statusText: "Clearing existing catalog..." });
        await fetch('/api/admin/properties/bulk', { method: 'DELETE' });
      }

      const CHUNK_SIZE = 500;
      let totalImported = 0;

      for (let i = 0; i < parsedRows.length; i += CHUNK_SIZE) {
        const chunk = parsedRows.slice(i, i + CHUNK_SIZE);
        const payload = {
          properties: chunk.map(r => ({
            ...(r.rawRow || {}),
            ...(r.extracted48 || {}),
            title: r.title,
            category: r.category,
            location: r.location,
            price: r.price,
            status: r.status,
            sqft: r.carpetArea || (r.extracted48?.CarpetAreaName ? r.sqft : undefined),
            carpetArea: r.carpetArea,
            superArea: r.superArea,
            developer: r.developer,
            imageUrl: r.imageUrl,
            description: r.description,
            publishStatus: r.publishStatus,
            bedrooms: r.bedrooms,
            bathrooms: r.bathrooms,
            videoUrl: r.videoUrl
          }))
        };

        // Up to 2 retries per batch in case of brief network interruptions
        let chunkSuccess = false;
        let lastError = "";

        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const res = await fetch('/api/admin/properties/bulk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            const resText = await res.text();
            let data: any;
            try {
              data = JSON.parse(resText);
            } catch {
              throw new Error(
                `Server returned error (HTTP ${res.status}): ${resText.slice(0, 150).replace(/<[^>]*>/g, '') || res.statusText || 'Unable to process chunk'}`
              );
            }

            if (!res.ok || (data && data.success === false)) {
              throw new Error(data?.error || `Server error during batch ${Math.floor(i / CHUNK_SIZE) + 1} (HTTP ${res.status})`);
            }

            totalImported += (typeof data?.count === 'number' ? data.count : chunk.length);
            chunkSuccess = true;
            break;
          } catch (retryErr: any) {
            lastError = retryErr.message;
            if (attempt === 1) {
              await new Promise(r => setTimeout(r, 600));
            }
          }
        }

        if (!chunkSuccess) {
          throw new Error(lastError || `Failed to commit batch ${Math.floor(i / CHUNK_SIZE) + 1}`);
        }

        const processed = Math.min(i + CHUNK_SIZE, parsedRows.length);
        const percent = Math.round((processed / parsedRows.length) * 100);
        setImportProgress({
          current: processed,
          total: parsedRows.length,
          percent,
          statusText: `Imported ${processed} of ${parsedRows.length}...`
        });
      }

      setSuccessMessage(`✓ Successfully published all ${totalImported.toLocaleString('en-IN')} properties to live catalog!`);

      setTimeout(() => {
        onImportComplete(totalImported);
        onClose();
      }, 1500);
    } catch (e: any) {
      console.error("Bulk commit error:", e);
      setErrorMessage(e.message || "Bulk import failed. Please check your data.");
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-zinc-900">
                  Excel Sheet Property Upload
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Bulk Catalog Importer
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Upload your Excel spreadsheet (.xlsx, .xls, .csv) to generate live property inventory cards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadTemplate('xlsx')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
              title="Download pre-filled Excel template (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Download Excel Template</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3 text-xs animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Error Processing Sheet</p>
                <p className="mt-0.5 text-rose-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="font-bold">{successMessage}</div>
            </div>
          )}

          {/* Upload Dropzone & Template Download Card */}
          {parsedRows.length === 0 ? (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition cursor-pointer flex flex-col items-center justify-center ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/60 scale-[0.99]'
                    : 'border-zinc-300 hover:border-emerald-500 bg-zinc-50/50 hover:bg-emerald-50/30'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4 shadow-sm group-hover:scale-105 transition">
                  {isParsing ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <UploadCloud className="w-8 h-8" />
                  )}
                </div>

                <h3 className="text-base font-bold text-zinc-900 mb-1">
                  {isParsing ? 'Analyzing Excel Spreadsheet...' : 'Drop your Excel or CSV file here'}
                </h3>
                <p className="text-xs text-zinc-500 max-w-md mb-4">
                  Supports <strong className="text-zinc-700">.xlsx, .xls, or .csv</strong> spreadsheets.
                  We automatically map columns for Title, Category, Location, Price, Status, Carpet Area, and Images!
                </p>

                <div className="flex items-center gap-3">
                  <span className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition">
                    Browse File on Device
                  </span>
                </div>
              </div>

              {/* Step-by-step guidance & sample download */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">1</span>
                    <h4 className="text-xs font-bold text-zinc-900">Get the Template</h4>
                  </div>
                  <p className="text-[11px] text-zinc-500 mb-3 leading-relaxed">
                    Download our ready-made template formatted with the exact headers needed for cards.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownloadTemplate('xlsx')}
                      className="flex-1 py-1.5 px-2 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>.XLSX Template</span>
                    </button>
                    <button
                      onClick={() => handleDownloadTemplate('csv')}
                      className="py-1.5 px-2 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 shadow-2xs transition"
                    >
                      <span>.CSV</span>
                    </button>
                  </div>
                </div>

                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">2</span>
                    <h4 className="text-xs font-bold text-zinc-900">Supported Columns</h4>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    <strong>Property Name</strong>, <strong>Category</strong> (Commercial Office, Hospital, etc.), <strong>Location</strong>, <strong>Price</strong> (e.g. ₹1.5 Cr), <strong>Status</strong>, <strong>Carpet Area</strong>, <strong>Image URL</strong>.
                  </p>
                </div>

                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">3</span>
                    <h4 className="text-xs font-bold text-zinc-900">Automatic Card Creation</h4>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Missing images automatically get high-res architectural photos matching the category. Preview cards live before saving!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Parsed Records View */
            <div className="space-y-4">
              {/* File Info Bar & View Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 truncate max-w-[200px] sm:max-w-xs">
                        {file?.name || 'Uploaded Spreadsheet'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {parsedRows.length} {parsedRows.length === 1 ? 'property' : 'properties'} loaded
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      All properties verified and ready for live inventory catalog
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mode switcher: Card View vs Table View */}
                  <div className="flex items-center bg-white border border-zinc-200 rounded-xl p-1 shadow-2xs">
                    <button
                      onClick={() => setPreviewMode('cards')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        previewMode === 'cards'
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Card View</span>
                    </button>
                    <button
                      onClick={() => setPreviewMode('table')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        previewMode === 'table'
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      <span>Table View</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setParsedRows([]);
                      setFile(null);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Upload New</span>
                  </button>
                </div>
              </div>

              {/* Search in preview */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter parsed properties by name, location, or category..."
                  value={searchPreview}
                  onChange={(e) => setSearchPreview(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-2xs"
                />
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* CARD PREVIEW: Exact copy of Property Inventory cards */}
              {previewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto p-1">
                  {filteredPreview.map((prop) => (
                    <div
                      key={prop.id}
                      className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs hover:shadow-md transition relative group"
                    >
                      <div className="relative h-44 w-full bg-zinc-100 overflow-hidden">
                        {prop.imageUrl ? (
                          <img
                            src={prop.imageUrl}
                            alt={prop.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            onError={(e) => {
                              // Fallback on broken image link
                              (e.target as HTMLImageElement).src = getFallbackImage(prop.category);
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-10 h-10 text-zinc-300" />
                          </div>
                        )}

                        {/* Category Badge on Top-Left (Identical to screenshot) */}
                        <div className="absolute top-3 left-3 px-2 py-1 bg-white/95 backdrop-blur-xs rounded-md text-[10px] font-bold text-zinc-900 border border-black/5 shadow-xs">
                          {prop.category}
                        </div>

                        {/* Status Badge on Top-Right (Identical to screenshot: Amber Ready to Move) */}
                        <div className="absolute top-3 right-3 px-2 py-1 bg-amber-500 text-white rounded-md text-[10px] font-bold shadow-xs">
                          {prop.status}
                        </div>

                        {/* Delete preview row button */}
                        <button
                          onClick={() => handleRemoveRow(prop.id)}
                          className="absolute bottom-2 right-2 p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                          title="Remove from import"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-bold text-sm text-zinc-900 line-clamp-1">{prop.title}</h3>
                          <div className="flex items-center gap-1 text-[11px] text-zinc-500 mt-1">
                            <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span className="truncate">{prop.location}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                            <span className="text-zinc-500 block mb-0.5">Price</span>
                            <span className="font-bold text-zinc-900">{prop.priceFormatted}</span>
                          </div>
                          <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                            <span className="text-zinc-500 block mb-0.5">Configuration</span>
                            <span className="font-bold text-zinc-900 truncate block">
                              {prop.category}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md border text-emerald-600 bg-emerald-50 border-emerald-100">
                            Active on Website
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {prop.sqft ? `${prop.sqft} Sq.Ft.` : '1,200 Sq.Ft.'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TABLE PREVIEW */}
              {previewMode === 'table' && (
                <div className="space-y-3">
                  {/* Table Sub-Mode Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTableViewMode('all-48')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
                          tableViewMode === 'all-48'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>All 48 Fields Table ({active48Columns.length} Active Columns)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTableViewMode('standard')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
                          tableViewMode === 'standard'
                            ? 'bg-zinc-900 text-white shadow-xs'
                            : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'
                        }`}
                      >
                        <TableIcon className="w-3.5 h-3.5" />
                        <span>Standard 7 Columns</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-medium">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                        <Check className="w-3 h-3" />
                        <span>{active48Columns.length} / 48 Fields Extracted</span>
                      </span>
                      {tableViewMode === 'all-48' && (
                        <span className="hidden sm:inline text-zinc-400">
                          (Scroll horizontally to inspect all 48 columns)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Scroll Table Wrapper */}
                  <div className="border border-zinc-200 rounded-2xl overflow-hidden max-h-[50vh] flex flex-col bg-white shadow-2xs">
                    <div className="overflow-x-auto overflow-y-auto flex-1 scrollbar-thin">
                      {tableViewMode === 'all-48' ? (
                        <table className="w-full text-left text-xs border-collapse min-w-max">
                          <thead className="bg-zinc-100/90 border-b border-zinc-200 sticky top-0 z-30 text-[11px] font-bold text-zinc-700 backdrop-blur-xs">
                            <tr>
                              <th className="py-2.5 px-3 sticky left-0 z-30 bg-zinc-100 border-r border-zinc-200 w-12 text-center">
                                #
                              </th>
                              <th className="py-2.5 px-3.5 sticky left-12 z-30 bg-zinc-100 border-r border-zinc-300 min-w-[240px] max-w-[280px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                                Property Title
                              </th>
                              {active48Columns
                                .filter(col => col.key !== 'Title')
                                .map(col => (
                                  <th
                                    key={col.key}
                                    className="py-2.5 px-3 whitespace-nowrap border-r border-zinc-200/80 bg-zinc-50/90"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        col.group === 'Pricing' ? 'bg-amber-500' :
                                        col.group === 'Area' ? 'bg-emerald-500' :
                                        col.group === 'Contacts' ? 'bg-purple-500' :
                                        col.group === 'Location' ? 'bg-blue-500' :
                                        col.group === 'Specs' ? 'bg-indigo-500' : 'bg-zinc-400'
                                      }`} />
                                      <span>{col.label}</span>
                                    </div>
                                  </th>
                                ))}
                              <th className="py-2.5 px-3 sticky right-0 z-30 bg-zinc-100 border-l border-zinc-300 text-center shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.08)] min-w-[100px]">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200">
                            {filteredPreview.map((row, idx) => (
                              <tr key={row.id} className="hover:bg-amber-50/30 transition group">
                                <td className="py-2.5 px-3 sticky left-0 z-10 bg-white group-hover:bg-amber-50/50 font-mono text-[10px] text-zinc-400 border-r border-zinc-200 text-center">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3.5 sticky left-12 z-10 bg-white group-hover:bg-amber-50/50 font-semibold text-zinc-900 border-r border-zinc-300 min-w-[240px] max-w-[280px] truncate shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]" title={row.title}>
                                  {row.title}
                                </td>
                                {active48Columns
                                  .filter(col => col.key !== 'Title')
                                  .map(col => {
                                    const rawVal = row.extracted48?.[col.key];
                                    const displayVal = format48ValueForTable(col.key, rawVal);
                                    return (
                                      <td
                                        key={col.key}
                                        className="py-2.5 px-3 whitespace-nowrap border-r border-zinc-100 max-w-[220px] truncate text-zinc-700"
                                        title={rawVal ? String(rawVal) : ''}
                                      >
                                        {col.key === 'Lease_Sale' && rawVal ? (
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            /rent|lease/i.test(String(rawVal))
                                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          }`}>
                                            {rawVal}
                                          </span>
                                        ) : col.key === 'PropertyTypeName' && rawVal ? (
                                          <span className="px-2 py-0.5 bg-zinc-100 rounded text-[11px] font-medium text-zinc-700 border border-zinc-200">
                                            {rawVal}
                                          </span>
                                        ) : (col.key === 'Status' || col.key === 'PossessionName') && rawVal ? (
                                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                            {rawVal}
                                          </span>
                                        ) : col.key === 'ExpectedPrice' || col.key === 'RentPM' ? (
                                          <span className="font-bold text-zinc-900">{displayVal}</span>
                                        ) : (
                                          <span>{displayVal}</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                <td className="py-2.5 px-3 sticky right-0 z-10 bg-white group-hover:bg-amber-50/50 border-l border-zinc-300 text-center shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedRowDetail(row)}
                                      className="p-1 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 rounded transition cursor-pointer"
                                      title="Inspect All 48 Fields"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveRow(row.id)}
                                      className="p-1 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 rounded transition cursor-pointer"
                                      title="Delete row"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-zinc-50 border-b border-zinc-200 sticky top-0 z-10 text-[11px] font-bold text-zinc-600">
                            <tr>
                              <th className="py-2.5 px-3">#</th>
                              <th className="py-2.5 px-3">Property Title</th>
                              <th className="py-2.5 px-3">Building / Project</th>
                              <th className="py-2.5 px-3">Unit No.</th>
                              <th className="py-2.5 px-3">Category</th>
                              <th className="py-2.5 px-3">Location</th>
                              <th className="py-2.5 px-3">Price</th>
                              <th className="py-2.5 px-3">Possession</th>
                              <th className="py-2.5 px-3">Carpet Area</th>
                              <th className="py-2.5 px-3">Super Area</th>
                              <th className="py-2.5 px-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200">
                            {filteredPreview.map((row, idx) => (
                              <tr key={row.id} className="hover:bg-zinc-50/80 transition">
                                <td className="py-2.5 px-3 font-mono text-[10px] text-zinc-400">{idx + 1}</td>
                                <td className="py-2.5 px-3 font-semibold text-zinc-900 max-w-[180px] truncate" title={row.title}>
                                  {row.title}
                                </td>
                                <td className="py-2.5 px-3">
                                  {row.buildingName || row.extracted48?.BuildingName ? (
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-900 border border-blue-200/60 rounded text-[11px] font-bold truncate max-w-[140px] inline-block" title={row.buildingName || row.extracted48?.BuildingName}>
                                      {row.buildingName || row.extracted48?.BuildingName}
                                    </span>
                                  ) : (
                                    <span className="text-zinc-400 text-[11px]">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  {row.extracted48?.FlatNo ? (
                                    <span className="px-2 py-0.5 bg-zinc-100 rounded text-[11px] font-bold text-zinc-800">
                                      {row.extracted48.FlatNo}
                                    </span>
                                  ) : (
                                    <span className="text-zinc-400 text-[11px]">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 bg-zinc-100 rounded text-[11px] font-medium text-zinc-700">
                                    {row.category}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-zinc-600 truncate max-w-[130px]" title={row.location}>{row.location}</td>
                                <td className="py-2.5 px-3 font-bold text-zinc-900">{row.priceFormatted}</td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    /immediate|ready/i.test(row.status)
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : /request/i.test(row.status)
                                      ? 'bg-zinc-50 text-zinc-600 border-zinc-200'
                                      : 'bg-blue-50 text-blue-800 border-blue-200'
                                  }`}>
                                    {row.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-zinc-600">
                                  {row.extracted48?.CarpetAreaName || (row.carpetArea ? `${row.carpetArea} sqft` : '—')}
                                </td>
                                <td className="py-2.5 px-3 text-zinc-600">
                                  {row.extracted48?.SuperAreaName || (row.superArea ? `${row.superArea} sqft` : '—')}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedRowDetail(row)}
                                      className="p-1 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 rounded transition cursor-pointer"
                                      title="Inspect All 48 Fields"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveRow(row.id)}
                                      className="p-1 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 rounded transition cursor-pointer"
                                      title="Delete row"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50/80 shrink-0">
          <div className="text-xs text-zinc-500 w-full sm:w-auto">
            {importProgress ? (
              <div className="flex flex-col gap-1.5 min-w-[280px]">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                  <span>{importProgress.statusText || `Importing: ${importProgress.current} / ${importProgress.total} properties`}</span>
                  <span>{importProgress.percent}%</span>
                </div>
                <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress.percent}%` }}
                  />
                </div>
              </div>
            ) : parsedRows.length > 0 ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span>
                  Ready to import <strong className="text-zinc-900 font-semibold">{parsedRows.length.toLocaleString('en-IN')}</strong> verified properties.
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-600 hover:text-zinc-900 select-none bg-white px-2.5 py-1 rounded-lg border border-zinc-200 shadow-2xs">
                  <input
                    type="checkbox"
                    checked={clearExistingBeforeImport}
                    onChange={(e) => setClearExistingBeforeImport(e.target.checked)}
                    disabled={isImporting}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 border-zinc-300"
                  />
                  <span>Replace existing catalog</span>
                </label>
              </div>
            ) : (
              <span>Upload an Excel or CSV file to begin.</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs disabled:opacity-50"
            >
              Cancel
            </button>

            {parsedRows.length > 0 && (
              <button
                onClick={handleImportToDatabase}
                disabled={isImporting}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {importProgress ? `Importing (${importProgress.current}/${importProgress.total})...` : 'Importing to Catalog...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Publish All {parsedRows.length.toLocaleString('en-IN')} Properties</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full 48-Fields Row Inspector Modal */}
      {selectedRowDetail && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 border border-zinc-200 shadow-2xl flex flex-col max-h-[90vh] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-950 text-base line-clamp-1">{selectedRowDetail.title}</h3>
                  <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                    <span>48-Column End-to-End Extraction Audit</span>
                    <span>&bull;</span>
                    <span className="font-mono">{selectedRowDetail.location}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRowDetail(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable 48-Field Audit Grid */}
            <div className="overflow-y-auto flex-1 space-y-4 pr-1 text-xs">
              {/* 1. Core Identification */}
              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-zinc-900 text-xs">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Core Listing &amp; Typology</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-[11px]">
                  <div className="bg-white p-2.5 rounded-xl border border-zinc-200/80">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Title</span>
                    <span className="font-bold text-zinc-900 block mt-0.5 truncate">{selectedRowDetail.extracted48?.Title || selectedRowDetail.title}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-zinc-200/80">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Ref Number</span>
                    <span className="font-mono font-bold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.RefNumber || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-zinc-200/80">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Lease / Sale</span>
                    <span className="font-bold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.Lease_Sale || 'Sale'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-zinc-200/80">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Property Type</span>
                    <span className="font-bold text-zinc-900 block mt-0.5 truncate">{selectedRowDetail.extracted48?.PropertyTypeName || selectedRowDetail.category}</span>
                  </div>
                </div>
              </div>

              {/* 2. Location & Address */}
              <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-200/80 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-blue-950 text-xs">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Location &amp; Address Hierarchy</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-[11px]">
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100 col-span-2">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Full Address</span>
                    <span className="font-medium text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.AddressName || selectedRowDetail.location}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Flat / Unit No</span>
                    <span className="font-semibold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.FlatNo || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Building Name</span>
                    <span className="font-semibold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.BuildingName || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Society</span>
                    <span className="font-semibold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.SocietyName || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Landmark</span>
                    <span className="font-semibold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.Landmark || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Street</span>
                    <span className="font-semibold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.Street || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Location / City</span>
                    <span className="font-semibold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.LocationName || selectedRowDetail.location}, {selectedRowDetail.extracted48?.CityName || 'Pune'}</span>
                  </div>
                </div>
              </div>

              {/* 3. Pricing, Financials & Lease */}
              <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Commercial Pricing, Rent &amp; Lease Terms</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-[11px]">
                  <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Expected Price</span>
                    <span className="font-black text-zinc-900 block mt-0.5">{format48ValueForTable('ExpectedPrice', selectedRowDetail.extracted48?.ExpectedPrice || selectedRowDetail.price)}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Rate / PSF</span>
                    <span className="font-bold text-zinc-900 block mt-0.5">{format48ValueForTable('PricePerUnitArea', selectedRowDetail.extracted48?.PricePerUnitArea)}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Deposit Price</span>
                    <span className="font-bold text-zinc-900 block mt-0.5">{format48ValueForTable('DepositePrice', selectedRowDetail.extracted48?.DepositePrice)}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Monthly Rent</span>
                    <span className="font-bold text-zinc-900 block mt-0.5">{format48ValueForTable('RentPM', selectedRowDetail.extracted48?.RentPM)}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">ROI %</span>
                    <span className="font-bold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.ROI ? `${selectedRowDetail.extracted48.ROI}%` : '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Lock-in Period</span>
                    <span className="font-semibold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.LockinPeriod || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Lease Tenure</span>
                    <span className="font-semibold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.LeasePeriod || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">CAM / Maintenance</span>
                    <span className="font-semibold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.MaintainCharges || '—'}</span>
                  </div>
                </div>
              </div>

              {/* 4. Areas & Dimensions */}
              <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-xs">
                  <Maximize2 className="w-4 h-4 text-emerald-600" />
                  <span>Areas &amp; Dimensions</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-[11px]">
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Carpet Area</span>
                    <span className="font-bold text-zinc-900 block mt-0.5">{format48ValueForTable('CarpetAreaName', selectedRowDetail.extracted48?.CarpetAreaName || (selectedRowDetail.carpetArea ? `${selectedRowDetail.carpetArea} sqft` : '—'))}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Built Area</span>
                    <span className="font-semibold text-zinc-900 block mt-0.5">{format48ValueForTable('BuiltAreaName', selectedRowDetail.extracted48?.BuiltAreaName)}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Super Area</span>
                    <span className="font-semibold text-zinc-900 block mt-0.5">{format48ValueForTable('SuperAreaName', selectedRowDetail.extracted48?.SuperAreaName)}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Plot Size / Range</span>
                    <span className="font-semibold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.PlotSizeName || `${selectedRowDetail.extracted48?.MinAreaName || '—'} to ${selectedRowDetail.extracted48?.MaxAreaName || '—'}`}</span>
                  </div>
                </div>
              </div>

              {/* 5. Specifications & Parking */}
              <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-200/80 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-indigo-950 text-xs">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                  <span>Specifications, Fit-out &amp; Status</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-[11px]">
                  <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Furnishing</span>
                    <span className="font-semibold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.FurnishingName || 'Bare Shell'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Floor Number</span>
                    <span className="font-semibold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.FloorNumber || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Parking Details</span>
                    <span className="font-semibold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.ParkingDetails || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Facing</span>
                    <span className="font-semibold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.FacingText || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Property Age</span>
                    <span className="font-semibold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.PropertyAge || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Possession</span>
                    <span className="font-semibold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.PossessionName || selectedRowDetail.status}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Status</span>
                    <span className="font-semibold text-zinc-900 block mt-0.5">{selectedRowDetail.status}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Property Tax</span>
                    <span className="font-semibold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.PropertyTax || '—'}</span>
                  </div>
                </div>
              </div>

              {/* 6. Contacts & CRM Assignment */}
              <div className="p-3.5 bg-purple-50/50 rounded-2xl border border-purple-200/80 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-purple-950 text-xs">
                  <Phone className="w-4 h-4 text-purple-600" />
                  <span>CRM Contacts &amp; Desk Assignment</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                  <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Owner / Client Name</span>
                    <span className="font-bold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.CustomerFullName || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Owner Mobile</span>
                    <span className="font-mono font-semibold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.CustomerMobile || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Owner Email</span>
                    <span className="font-mono text-zinc-900 block mt-0.5 truncate">{selectedRowDetail.extracted48?.CustomerEmail || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Assigned Agent / RM</span>
                    <span className="font-bold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.EmployeeName || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Agent Mobile</span>
                    <span className="font-mono font-semibold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.EmployeeMobile || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Agent Email</span>
                    <span className="font-mono text-zinc-900 block mt-0.5 truncate">{selectedRowDetail.extracted48?.EmployeeEmail || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Lead Source</span>
                    <span className="font-semibold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.SourceName || 'Excel Import'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Branch Name</span>
                    <span className="font-semibold text-zinc-900 block mt-0.5">{selectedRowDetail.extracted48?.BranchName || 'Pune Main'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Keywords</span>
                    <span className="text-zinc-700 block mt-0.5 truncate">{selectedRowDetail.extracted48?.SearchKeyword || '—'}</span>
                  </div>
                </div>
              </div>

              {/* 7. Full Description */}
              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-zinc-900 text-xs">
                  <FileText className="w-4 h-4 text-zinc-600" />
                  <span>Formatted Description &amp; Specifications</span>
                </div>
                <p className="text-[11px] text-zinc-700 leading-relaxed whitespace-pre-line bg-white p-3 rounded-xl border border-zinc-200">
                  {selectedRowDetail.description}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-zinc-500">
                All 48 attributes mapped &amp; ready to persist to database.
              </span>
              <button
                type="button"
                onClick={() => setSelectedRowDetail(null)}
                className="px-4 py-2 bg-zinc-900 text-white font-bold rounded-xl text-xs hover:bg-zinc-800 transition cursor-pointer"
              >
                Done Inspecting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

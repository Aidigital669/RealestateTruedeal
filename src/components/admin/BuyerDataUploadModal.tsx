'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Search,
  Building2,
  Home,
  MapPin,
  Clock,
  Tag,
  User,
  Users,
  Eye,
  Check,
  RefreshCw,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';

export interface ParsedBuyerRow {
  id: string;
  referenceCode: string;
  name: string;
  maskedName: string;
  phone: string;
  email: string;
  locality: string;
  bhk: string;
  budget: string;
  purpose: string;
  timeline: string;
  requirements: string;
  status: string;
  isValid: boolean;
  errors?: string[];
}

interface BuyerDataUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (count: number) => void;
}

const SAMPLE_TEMPLATE_BUYERS = [
  {
    "Buyer Name": "Rajesh Kulkarni",
    "Contact Phone": "9822014589",
    "Email": "rajesh.kulkarni@gmail.com",
    "Target Locality": "Baner",
    "Typology": "3 BHK",
    "Budget Range": "₹1.80 Cr - ₹2.50 Cr",
    "Buying Purpose": "Self-Use",
    "Timeline": "Ready to Move / 60 Days",
    "Requirements": "Looking for premium high-floor 3 BHK apartment in Baner with 2 covered car parkings and clubhouse amenities.",
    "Verification Status": "Verified Active Buyer"
  },
  {
    "Buyer Name": "Dr. Ananya Joshi",
    "Contact Phone": "9890123456",
    "Email": "dr.ananya@healthcarepune.org",
    "Target Locality": "Undri",
    "Typology": "Hospital / Healthcare",
    "Budget Range": "₹6.00 Cr - ₹15.00 Cr",
    "Buying Purpose": "Healthcare Facility",
    "Timeline": "Immediate / 30 Days",
    "Requirements": "Mandate for standalone pre-leased hospital or clinic premise with high ceiling height and lift access in South Pune corridor.",
    "Verification Status": "VIP Mandate"
  },
  {
    "Buyer Name": "Vikramaditya Singhania",
    "Contact Phone": "9923456789",
    "Email": "vikram.singhania@corp.in",
    "Target Locality": "Kalyani Nagar",
    "Typology": "Commercial Office",
    "Budget Range": "₹3.50 Cr - ₹8.00 Cr",
    "Buying Purpose": "Corporate Expansion",
    "Timeline": "Ready to Move / 60 Days",
    "Requirements": "Grade-A corporate office space required in IT/Finance corridor with 100% DG backup and reserved basement parking.",
    "Verification Status": "Verified Active Buyer"
  },
  {
    "Buyer Name": "Pooja Mehta",
    "Contact Phone": "9765432100",
    "Email": "pooja.mehta@outlook.com",
    "Target Locality": "Koregaon Park",
    "Typology": "4.5+ BHK Penthouse",
    "Budget Range": "₹4.50 Cr+",
    "Buying Purpose": "Luxury Upgrade",
    "Timeline": "Immediate / 30 Days",
    "Requirements": "Exclusive top-floor penthouse with private terrace and green canopy views in Koregaon Park Annexe.",
    "Verification Status": "HNI Investor"
  },
  {
    "Buyer Name": "Siddharth Deshmukh",
    "Contact Phone": "9881234567",
    "Email": "siddharth.d@techlead.com",
    "Target Locality": "Hinjewadi",
    "Typology": "2 BHK",
    "Budget Range": "₹85 Lakh - ₹1.20 Cr",
    "Buying Purpose": "Investment / ROI",
    "Timeline": "Under Construction / 1 Year",
    "Requirements": "Looking for 2 BHK near Phase 1 IT park for steady rental returns and capital appreciation.",
    "Verification Status": "Verified Active Buyer"
  }
];

function maskBuyerName(name: string | null | undefined): string {
  if (!name || !name.trim()) return "Verified Patron (Pune)";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    const p = parts[0];
    return p.length > 2 ? `${p.slice(0, 2)}*** (Verified Buyer)` : "Verified Buyer";
  }
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() || "";
  return `${first} ${lastInitial}.*** (Verified Buyer)`;
}

export function BuyerDataUploadModal({
  isOpen,
  onClose,
  onImportSuccess
}: BuyerDataUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'excel' | 'pdf' | null>(null);
  const [parsedBuyers, setParsedBuyers] = useState<ParsedBuyerRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'preview'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Download Excel Template
  const handleDownloadTemplate = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(SAMPLE_TEMPLATE_BUYERS);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Buyer Mandates");

      // Auto-fit column widths
      ws['!cols'] = [
        { wch: 24 }, // Name
        { wch: 16 }, // Phone
        { wch: 28 }, // Email
        { wch: 18 }, // Locality
        { wch: 22 }, // Typology
        { wch: 22 }, // Budget
        { wch: 20 }, // Purpose
        { wch: 26 }, // Timeline
        { wch: 45 }, // Requirements
        { wch: 22 }, // Verification Status
      ];

      XLSX.writeFile(wb, "ANV_Verified_Buyers_Template.xlsx");
    } catch (err: any) {
      console.error("Template download error:", err);
    }
  };

  // Helper to extract field from flexible headers
  const getField = (row: any, candidates: string[]): string => {
    for (const key of Object.keys(row)) {
      const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const cand of candidates) {
        if (cleanKey === cand.toLowerCase().replace(/[^a-z0-9]/g, '')) {
          const val = row[key];
          return val !== undefined && val !== null ? String(val).trim() : '';
        }
      }
    }
    return '';
  };

  // Process Excel/CSV File
  const processExcelFile = async (selectedFile: File) => {
    setIsParsing(true);
    setParseError(null);
    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet);

      if (rawRows.length === 0) {
        throw new Error("No data rows found in the uploaded spreadsheet.");
      }

      const rows: ParsedBuyerRow[] = rawRows.map((r, idx) => {
        const name = getField(r, ['buyername', 'name', 'clientname', 'client', 'customer', 'contactname']) || `Verified Buyer ${idx + 1}`;
        const phone = getField(r, ['contactphone', 'phone', 'mobile', 'mobilenumber', 'contact', 'cell']) || '9373020701';
        const email = getField(r, ['email', 'emailid', 'mail', 'contactemail']) || 'leads@anvrealty.com';
        const locality = getField(r, ['targetlocality', 'locality', 'location', 'preferredlocation', 'area', 'corridor']) || 'Pune Prime';
        const bhk = getField(r, ['typology', 'bhk', 'configuration', 'propertytype', 'unittype']) || '3 BHK';
        const budget = getField(r, ['budgetrange', 'budget', 'targetbudget', 'pricerange', 'price']) || '₹1.50 Cr - ₹2.50 Cr';
        const purpose = getField(r, ['buyingpurpose', 'purpose', 'intent', 'buyingintent', 'use']) || 'Self-Use';
        const timeline = getField(r, ['timeline', 'timeframe', 'possession', 'possessionrequired']) || 'Ready to Move / 60 Days';
        const requirements = getField(r, ['requirements', 'notes', 'remarks', 'criteria', 'description', 'message']) ||
          `Looking for ${bhk} in ${locality} with budget ${budget}.`;
        const status = getField(r, ['verificationstatus', 'status', 'tier', 'category']) || 'Verified Active Buyer';

        const isValid = Boolean(name && (locality || bhk || budget));

        return {
          id: `excel-buyer-${Date.now()}-${idx}`,
          referenceCode: `REQ-${new Date().getFullYear()}-${String(100 + idx + 1).padStart(3, '0')}`,
          name,
          maskedName: maskBuyerName(name),
          phone,
          email,
          locality,
          bhk,
          budget: budget.startsWith('₹') ? budget : `₹${budget}`,
          purpose,
          timeline,
          requirements,
          status,
          isValid
        };
      });

      setParsedBuyers(rows);
      setActiveTab('preview');
    } catch (err: any) {
      console.error("Excel parse error:", err);
      setParseError(err.message || "Failed to parse spreadsheet file.");
    } finally {
      setIsParsing(false);
    }
  };

  // Process PDF File
  const processPdfFile = async (selectedFile: File) => {
    setIsParsing(true);
    setParseError(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/admin/buyers/parse-pdf", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to extract buyer records from PDF.");
      }

      if (!data.buyers || data.buyers.length === 0) {
        throw new Error("No buyer records could be recognized from the PDF text.");
      }

      setParsedBuyers(data.buyers);
      setActiveTab('preview');
    } catch (err: any) {
      console.error("PDF parse error:", err);
      setParseError(err.message || "Failed to process PDF file.");
    } finally {
      setIsParsing(false);
    }
  };

  // Handle File Drop / Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      const ext = f.name.toLowerCase().split('.').pop();
      if (ext === 'pdf') {
        setFileType('pdf');
        processPdfFile(f);
      } else if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
        setFileType('excel');
        processExcelFile(f);
      } else {
        setParseError("Unsupported file type. Please upload an Excel (.xlsx, .xls, .csv) or PDF (.pdf) file.");
      }
    }
  };

  // Remove individual row from preview
  const handleRemoveRow = (id: string) => {
    setParsedBuyers((prev) => prev.filter((r) => r.id !== id));
  };

  // Commit and Import Buyers to Database
  const handleImportSubmit = async () => {
    if (parsedBuyers.length === 0) return;
    setIsImporting(true);
    setParseError(null);

    try {
      const res = await fetch("/api/admin/buyers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyers: parsedBuyers })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to import buyers.");
      }

      if (onImportSuccess) {
        onImportSuccess(data.count || parsedBuyers.length);
      }
      onClose();
    } catch (err: any) {
      console.error("Import error:", err);
      setParseError(err.message || "Failed to import buyers to database.");
    } finally {
      setIsImporting(false);
    }
  };

  // Filtered preview rows
  const filteredRows = parsedBuyers.filter((b) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.locality.toLowerCase().includes(q) ||
      b.bhk.toLowerCase().includes(q) ||
      b.budget.toLowerCase().includes(q) ||
      b.requirements.toLowerCase().includes(q) ||
      b.referenceCode.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 text-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= MODAL HEADER ================= */}
        <div className="p-4 sm:p-6 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Upload Buyer Mandates &amp; Leads
                </h2>
                <span className="text-[10px] bg-amber-500 text-zinc-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Excel &amp; PDF
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Bulk upload verified buyer requirements into CRM &amp; Live Matchmaking Desk.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/10 cursor-pointer"
              title="Download sample Excel template"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Download Excel Template</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              title="Close Modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= MODAL TABS ================= */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-zinc-50 border-b border-zinc-200 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>1. Choose File</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              disabled={parsedBuyers.length === 0}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : parsedBuyers.length > 0
                  ? 'text-zinc-700 hover:bg-zinc-200/60'
                  : 'text-zinc-300 cursor-not-allowed'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>2. Preview Buyers ({parsedBuyers.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="sm:hidden inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline"
          >
            <Download className="w-3 h-3" />
            <span>Sample Template</span>
          </button>
        </div>

        {/* ================= MODAL BODY ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {parseError && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{parseError}</span>
            </div>
          )}

          {activeTab === 'upload' ? (
            /* ================= VIEW 1: DROPZONE & UPLOAD ================= */
            <div className="space-y-6">
              {/* Dropzone Container */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-300 hover:border-amber-500 rounded-3xl p-8 sm:p-12 text-center bg-zinc-50/60 hover:bg-amber-50/30 transition-all cursor-pointer group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-3xl bg-amber-100/80 text-amber-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform shadow-xs">
                  {isParsing ? (
                    <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                  ) : (
                    <UploadCloud className="w-8 h-8" />
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-black text-zinc-900">
                    {isParsing ? "Analyzing & Extracting Buyer Data..." : "Drop your Excel or PDF Buyer File here"}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-500">
                    Supports <strong>Excel (.xlsx, .xls, .csv)</strong> and <strong>PDF (.pdf)</strong> buyer mandate documents
                  </p>
                </div>

                <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950 text-white font-bold text-xs group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors shadow-xs">
                  <span>Browse Document from Device</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Supported Format Guide */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/90 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                      Option A: Excel / CSV Spreadsheet
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Auto-maps headers like <code>Buyer Name</code>, <code>Locality</code>, <code>BHK</code>, <code>Budget</code>, <code>Phone</code>, and <code>Requirements</code>.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 underline pt-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Pre-Formatted Excel Template</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/90 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-rose-600" />
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                      Option B: PDF Client Mandate Document
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Powered by <code>PDFParse</code> engine. Automatically extracts buyer requirements, budgets, contacts, and Pune corridors from text circulars.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* ================= VIEW 2: INTERACTIVE BUYER TABLE PREVIEW ================= */
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search parsed buyers..."
                    className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setParsedBuyers([]);
                      setActiveTab('upload');
                    }}
                    className="text-xs font-bold text-zinc-600 hover:text-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 transition cursor-pointer"
                  >
                    Upload Another File
                  </button>
                  <span className="text-xs font-bold text-zinc-700 bg-zinc-100 px-3 py-1.5 rounded-xl">
                    {filteredRows.length} of {parsedBuyers.length} Ready
                  </span>
                </div>
              </div>

              {/* Table Container Styled as per our Current Buyer Design */}
              <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto text-xs w-full">
                  <table className="w-full text-left min-w-[760px]">
                    <thead className="bg-zinc-50 text-zinc-600 font-bold border-b border-zinc-200">
                      <tr>
                        <th className="px-4 py-3">Buyer &amp; Reference</th>
                        <th className="px-4 py-3">Target Locality</th>
                        <th className="px-4 py-3">Typology</th>
                        <th className="px-4 py-3">Budget</th>
                        <th className="px-4 py-3">Timeline &amp; Purpose</th>
                        <th className="px-4 py-3">Requirements</th>
                        <th className="px-4 py-3">Direct Contact</th>
                        <th className="px-3 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium">
                      {filteredRows.map((b) => (
                        <tr key={b.id} className="hover:bg-amber-50/20 transition-colors">
                          {/* 1. Buyer & Reference */}
                          <td className="px-4 py-3">
                            <div className="font-bold text-zinc-900 text-xs">{b.name}</div>
                            <div className="text-[10px] text-zinc-400">{b.maskedName}</div>
                            <span className="inline-block font-mono text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded mt-0.5">
                              {b.referenceCode}
                            </span>
                          </td>

                          {/* 2. Target Locality */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1 font-semibold text-zinc-800">
                              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>{b.locality}</span>
                            </div>
                          </td>

                          {/* 3. Typology */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
                              {b.bhk.includes('Commercial') || b.bhk.includes('Office') || b.bhk.includes('Hospital') ? (
                                <Building2 className="w-3 h-3 text-amber-600" />
                              ) : (
                                <Home className="w-3 h-3 text-amber-600" />
                              )}
                              <span>{b.bhk}</span>
                            </span>
                          </td>

                          {/* 4. Budget */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-black text-amber-700 text-xs">
                              {b.budget}
                            </span>
                          </td>

                          {/* 5. Timeline & Purpose */}
                          <td className="px-4 py-3">
                            <div className="font-semibold text-zinc-900 text-[11px]">{b.purpose}</div>
                            <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-zinc-400" />
                              <span>{b.timeline}</span>
                            </div>
                          </td>

                          {/* 6. Requirements */}
                          <td className="px-4 py-3 max-w-xs">
                            <p className="text-zinc-600 text-xs line-clamp-2 leading-relaxed" title={b.requirements}>
                              {b.requirements}
                            </p>
                          </td>

                          {/* 7. Direct Contact */}
                          <td className="px-4 py-3 whitespace-nowrap text-[11px]">
                            <div className="flex items-center gap-1 text-zinc-700 font-mono">
                              <Phone className="w-3 h-3 text-zinc-400" />
                              <span>{b.phone}</span>
                            </div>
                            <div className="flex items-center gap-1 text-zinc-500 text-[10px]">
                              <Mail className="w-3 h-3 text-zinc-400" />
                              <span className="truncate max-w-[120px]">{b.email}</span>
                            </div>
                          </td>

                          {/* 8. Action */}
                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(b.id)}
                              className="w-7 h-7 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition flex items-center justify-center cursor-pointer ml-auto"
                              title="Remove from import"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="p-4 sm:p-5 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              All imported buyers will automatically connect with <strong>Live Buyer Demands</strong> and <strong>CRM Leads Pipeline</strong>.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>

            {activeTab === 'preview' && (
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={isImporting || parsedBuyers.length === 0}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-black transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Importing {parsedBuyers.length} Buyers...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Confirm &amp; Import ({parsedBuyers.length}) Buyers</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

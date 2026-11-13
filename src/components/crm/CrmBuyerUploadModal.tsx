'use client';

import React, { useState, useRef, useCallback } from 'react';
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
  Users,
  Check,
  RefreshCw,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';

export interface ParsedBuyerRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  bhk: string;
  budget: string;
  purpose: string;
  timeline: string;
  notes: string;
  isValid: boolean;
  errors: string[];
}

interface CrmBuyerUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (count: number) => void;
}

// ─── Sample template data ────────────────────────────────────────────────────
const SAMPLE_TEMPLATE: Record<string, string>[] = [
  {
    'Full Name': 'Rajesh Kumar',
    'Phone': '9876543210',
    'Email': 'rajesh@example.com',
    'Preferred Location': 'Baner',
    'BHK / Configuration': '3 BHK',
    'Budget (₹ Cr)': '1.80 - 2.50 Cr',
    'Buying Purpose': 'Self-Use',
    'Timeline': 'Ready to Move / 60 Days',
    'Notes / Requirements': 'High floor preferred, west facing, needs parking for 2 cars'
  },
  {
    'Full Name': 'Anjali Mehta',
    'Phone': '9123456789',
    'Email': 'anjali@example.com',
    'Preferred Location': 'Koregaon Park',
    'BHK / Configuration': '4 BHK',
    'Budget (₹ Cr)': '3.00 - 4.50 Cr',
    'Buying Purpose': 'Investment / ROI',
    'Timeline': 'Immediate / 30 Days',
    'Notes / Requirements': 'Looking for branded residences or preleased commercial'
  },
  {
    'Full Name': 'Dr. Suresh Patel',
    'Phone': '9988776655',
    'Email': 'drsuresh@hospital.com',
    'Preferred Location': 'Undri',
    'BHK / Configuration': 'Hospital / Healthcare',
    'Budget (₹ Cr)': '5.00 - 12.00 Cr',
    'Buying Purpose': 'Healthcare Facility',
    'Timeline': '3 - 6 Months',
    'Notes / Requirements': 'Ground floor, min 8,000 sqft carpet, OC received mandatory'
  }
];

// ─── Parsing helpers ──────────────────────────────────────────────────────────
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 10) return digits;
  return digits;
}

function parseBuyerRow(row: Record<string, any>, index: number): ParsedBuyerRow {
  const errors: string[] = [];

  const name = String(row['Full Name'] || row['Name'] || row['Buyer Name'] || '').trim();
  const rawPhone = String(row['Phone'] || row['Mobile'] || row['Contact'] || '').trim();
  const phone = normalizePhone(rawPhone);
  const email = String(row['Email'] || row['Email ID'] || '').trim().toLowerCase();
  const location = String(row['Preferred Location'] || row['Location'] || row['Area'] || '').trim();
  const bhk = String(row['BHK / Configuration'] || row['BHK'] || row['Configuration'] || row['Type'] || '').trim();
  const budget = String(row['Budget (₹ Cr)'] || row['Budget'] || row['Budget Range'] || '').trim();
  const purpose = String(row['Buying Purpose'] || row['Purpose'] || row['Use Case'] || '').trim();
  const timeline = String(row['Timeline'] || row['Possession Timeline'] || row['Urgency'] || '').trim();
  const notes = String(row['Notes / Requirements'] || row['Notes'] || row['Requirements'] || row['Remarks'] || '').trim();

  if (!name || name.length < 2) errors.push('Name is required');
  if (!phone || phone.length < 10) errors.push('Valid 10-digit phone is required');
  if (!location) errors.push('Preferred location is required');
  if (!bhk) errors.push('BHK / Configuration is required');

  return {
    id: `buyer-${index}-${Date.now()}`,
    name,
    phone,
    email,
    location,
    bhk,
    budget,
    purpose,
    timeline,
    notes,
    isValid: errors.length === 0,
    errors
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function CrmBuyerUploadModal({
  isOpen,
  onClose,
  onImportComplete
}: CrmBuyerUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedBuyerRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; count: number; message: string } | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');

  const handleClose = () => {
    setParsedRows([]);
    setFileName('');
    setSearchTerm('');
    setImportResult(null);
    setStep('upload');
    onClose();
  };

  // ─── Template Download ───────────────────────────────────────────────────
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(SAMPLE_TEMPLATE);
    ws['!cols'] = [
      { wch: 22 }, { wch: 14 }, { wch: 28 }, { wch: 20 },
      { wch: 22 }, { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 45 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Buyer Requirements');
    XLSX.writeFile(wb, 'ANV_Verified_Buyers_Template.xlsx');
  };

  // ─── File Parsing ────────────────────────────────────────────────────────
  const parseFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const rows = rawRows
          .filter((r) => Object.values(r).some((v) => String(v).trim().length > 0))
          .map((r, i) => parseBuyerRow(r, i));
        setParsedRows(rows);
        setStep('preview');
      } catch (err) {
        alert('Could not parse file. Please use the template format provided.');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      parseFile(file);
    }
  }, [parseFile]);

  const handleRemoveRow = (id: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== id));
  };

  // ─── Import ──────────────────────────────────────────────────────────────
  const handleImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setIsImporting(true);
    let successCount = 0;
    const errors: string[] = [];

    for (const row of validRows) {
      try {
        const code = `BYR-${Math.floor(1000 + Math.random() * 9000)}`;
        const res = await fetch('/api/crm/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            name: row.name,
            phone: row.phone,
            email: row.email,
            location: row.location,
            bhk: row.bhk,
            budget: row.budget,
            propertyInterest: `${row.bhk} in ${row.location}`,
            source: 'Excel Bulk Upload',
            sourceType: 'bulk_upload',
            stage: 'new',
            temperature: 'warm',
            status: 'New Lead',
            notes: [
              row.purpose && `Purpose: ${row.purpose}`,
              row.timeline && `Timeline: ${row.timeline}`,
              row.notes
            ].filter(Boolean).join(' | '),
            designation: 'Verified Buyer',
            assignedTo: 'Unassigned'
          })
        });
        const data = await res.json();
        if (data.success) {
          successCount++;
        } else {
          errors.push(`${row.name}: ${data.error || 'Failed'}`);
        }
      } catch {
        errors.push(`${row.name}: Network error`);
      }
    }

    setIsImporting(false);
    setImportResult({
      success: successCount > 0,
      count: successCount,
      message:
        successCount === validRows.length
          ? `All ${successCount} buyer lead${successCount !== 1 ? 's' : ''} imported successfully!`
          : `${successCount} of ${validRows.length} imported. ${errors.length} failed.`
    });
    setStep('done');
    if (successCount > 0) {
      onImportComplete(successCount);
    }
  };

  if (!isOpen) return null;

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;
  const filteredRows = parsedRows.filter((r) =>
    !searchTerm ||
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.phone.includes(searchTerm) ||
    r.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.bhk.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-zinc-200">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-zinc-200 bg-zinc-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-zinc-950 tracking-tight">Upload Buyer Requirements</h2>
              <p className="text-[11px] text-zinc-500">Import verified buyer leads from Excel (.xlsx / .csv)</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── STEP 1: Upload Zone ── */}
        {step === 'upload' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Template Download */}
            <div className="flex items-center justify-between p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-amber-700 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-zinc-900">Download our Excel template</p>
                  <p className="text-[11px] text-zinc-500">Pre-filled with correct column headers and sample data</p>
                </div>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Template</span>
              </button>
            </div>

            {/* Required columns reference */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-2">
              <p className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">Required Columns</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {[
                  'Full Name', 'Phone', 'Email',
                  'Preferred Location', 'BHK / Configuration', 'Budget (₹ Cr)',
                  'Buying Purpose', 'Timeline', 'Notes / Requirements'
                ].map((col) => (
                  <div key={col} className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>{col}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-amber-500 bg-amber-50 scale-[1.01]'
                  : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50 hover:bg-zinc-100'
              }`}
            >
              <UploadCloud className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-amber-500' : 'text-zinc-400'}`} />
              <p className="text-sm font-bold text-zinc-800">
                {isDragging ? 'Drop it here!' : 'Drag & drop your Excel file'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">or click to browse — .xlsx, .xls, .csv supported</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        )}

        {/* ── STEP 2: Preview Table ── */}
        {step === 'preview' && (
          <>
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-zinc-100 bg-white shrink-0 flex-wrap">
              <div className="flex items-center gap-3 text-xs flex-wrap">
                <span className="font-bold text-zinc-900">{parsedRows.length} rows from <span className="text-amber-700">{fileName}</span></span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">{validCount} valid</span>
                {invalidCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-bold">{invalidCount} errors</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search rows..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs border border-zinc-200 rounded-lg bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300 w-40"
                  />
                </div>
                <button
                  onClick={() => { setParsedRows([]); setFileName(''); setStep('upload'); }}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-upload</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-zinc-50 border-b border-zinc-200 z-10">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-bold text-zinc-600 text-[11px] uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-4 py-2.5 text-left font-bold text-zinc-600 text-[11px] uppercase tracking-wider whitespace-nowrap">Name</th>
                    <th className="px-4 py-2.5 text-left font-bold text-zinc-600 text-[11px] uppercase tracking-wider whitespace-nowrap">Phone</th>
                    <th className="px-4 py-2.5 text-left font-bold text-zinc-600 text-[11px] uppercase tracking-wider whitespace-nowrap">Location</th>
                    <th className="px-4 py-2.5 text-left font-bold text-zinc-600 text-[11px] uppercase tracking-wider whitespace-nowrap">BHK</th>
                    <th className="px-4 py-2.5 text-left font-bold text-zinc-600 text-[11px] uppercase tracking-wider whitespace-nowrap">Budget</th>
                    <th className="px-4 py-2.5 text-left font-bold text-zinc-600 text-[11px] uppercase tracking-wider whitespace-nowrap">Purpose</th>
                    <th className="px-4 py-2.5 text-left font-bold text-zinc-600 text-[11px] uppercase tracking-wider whitespace-nowrap">Timeline</th>
                    <th className="px-3 py-2.5 text-center font-bold text-zinc-600 text-[11px] uppercase tracking-wider">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredRows.map((row) => (
                    <tr key={row.id} className={`hover:bg-zinc-50 transition ${!row.isValid ? 'bg-red-50/60' : ''}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[10px]">
                            <Check className="w-3.5 h-3.5" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 font-bold text-[10px]" title={row.errors.join(', ')}>
                            <AlertCircle className="w-3.5 h-3.5" /> Error
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-zinc-900 whitespace-nowrap">{row.name || '—'}</div>
                        {row.email && <div className="text-zinc-400 text-[10px]">{row.email}</div>}
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-700 whitespace-nowrap">{row.phone || '—'}</td>
                      <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">{row.location || '—'}</td>
                      <td className="px-4 py-3 font-bold text-zinc-900 whitespace-nowrap">{row.bhk || '—'}</td>
                      <td className="px-4 py-3 text-amber-800 font-bold whitespace-nowrap">{row.budget || '—'}</td>
                      <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{row.purpose || '—'}</td>
                      <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{row.timeline || '—'}</td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => handleRemoveRow(row.id)}
                          className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                          title="Remove row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-10 text-center text-zinc-400 text-xs">
                        No rows match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer CTA */}
            <div className="px-5 py-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between gap-3 shrink-0 flex-wrap">
              <div className="text-xs text-zinc-500">
                {validCount > 0 ? (
                  <span><span className="font-bold text-zinc-900">{validCount}</span> valid leads ready to import into CRM</span>
                ) : (
                  <span className="text-red-600 font-semibold">No valid rows — fix errors before importing</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleClose} className="px-4 py-2 text-xs font-semibold text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition cursor-pointer">
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={validCount === 0 || isImporting}
                  className="flex items-center gap-1.5 px-5 py-2 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-black transition cursor-pointer shadow-sm"
                >
                  {isImporting ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Importing...</span></>
                  ) : (
                    <><Users className="w-3.5 h-3.5" /><span>Import {validCount} Buyer{validCount !== 1 ? 's' : ''}</span></>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── STEP 3: Done ── */}
        {step === 'done' && importResult && (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-5">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${importResult.success ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {importResult.success ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-500" />
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-950 mb-1">
                {importResult.success ? 'Import Successful!' : 'Import Completed with Errors'}
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">{importResult.message}</p>
              {importResult.success && (
                <p className="text-[11px] text-zinc-400 mt-2">
                  New leads are now visible in the Leads pipeline. Assigned as "Unassigned" — reassign from the table.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setParsedRows([]); setFileName(''); setStep('upload'); setImportResult(null); }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-zinc-200 rounded-lg hover:bg-zinc-50 transition cursor-pointer text-zinc-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Upload More</span>
              </button>
              <button
                onClick={handleClose}
                className="flex items-center gap-1.5 px-5 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg text-xs font-black transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Done</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

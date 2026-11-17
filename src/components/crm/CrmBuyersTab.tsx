'use client';

import React, { useState } from 'react';
import {
  Table as TableIcon,
  Columns as KanbanIcon,
  SlidersHorizontal,
  ArrowUpDown,
  Download,
  UploadCloud,
  Plus,
  RotateCw,
  Copy,
  Check,
  Star,
  ShieldCheck,
  Building,
  UserPlus,
  Phone,
  Calendar,
  Send,
  UserCheck,
  Archive,
  ChevronDown,
  X,
  ExternalLink,
  Flame,
  Clock,
  Sparkles,
  MessageCircle,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  Users,
  Briefcase
} from 'lucide-react';
import { CrmLead } from '@/lib/crm-data';
import { CrmEditLeadModal } from './CrmEditLeadModal';

interface CrmBuyersTabProps {
  buyers: CrmLead[];
  isLoading?: boolean;
  onOpenAddBuyer: () => void;
  onOpenUploadBuyers?: () => void;
  onSelectBuyer: (buyer: CrmLead) => void;
  onRefresh: () => void;
  selectedBuyerId?: string;
}

export function CrmBuyersTab({
  buyers,
  isLoading = false,
  onOpenAddBuyer,
  onOpenUploadBuyers,
  onSelectBuyer,
  onRefresh,
  selectedBuyerId
}: CrmBuyersTabProps) {
  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Checkbox selections
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filters
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'commercial' | 'residential' | 'luxury'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [budgetFilter, setBudgetFilter] = useState<string>('all');
  const [advisorFilter, setAdvisorFilter] = useState<string>('all');
  const [followUpDate, setFollowUpDate] = useState<string>('2025-05-18');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [newAdvisor, setNewAdvisor] = useState('Prem Sharma');

  // Edit & Delete state
  const [editingBuyer, setEditingBuyer] = useState<CrmLead | null>(null);
  const [buyerToDelete, setBuyerToDelete] = useState<CrmLead | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // Derived Metrics tailored for Buyers
  const totalCount = buyers.length;
  const commercialCount = buyers.filter(
    (b) =>
      b.interest?.property?.toLowerCase().includes('commercial') ||
      b.interest?.bhk?.toLowerCase().includes('commercial') ||
      b.name?.toLowerCase().includes('commercial')
  ).length;
  const residentialCount = buyers.filter(
    (b) =>
      b.interest?.bhk?.toLowerCase().includes('bhk') ||
      b.interest?.property?.toLowerCase().includes('bhk') ||
      b.interest?.property?.toLowerCase().includes('residence')
  ).length;
  const highBudgetCount = buyers.filter((b) => {
    const raw = b.interest?.rawBudget || 0;
    const txt = b.interest?.budget || '';
    return raw >= 30000000 || txt.includes('3.') || txt.includes('4.') || txt.includes('5.') || txt.includes('6.') || txt.includes('Cr');
  }).length;
  const verifiedCount = buyers.filter((b) => b.reraVerified !== false).length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`Copied ${label}: ${text}`);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredBuyers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBuyers.map((b) => b.id));
    }
  };

  const handleToggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Buyer Code',
      'Name / Title',
      'Phone',
      'Email',
      'Property Requirement',
      'Typology',
      'Budget',
      'Location',
      'Advisor',
      'Status',
      'Notes'
    ];
    const rows = filteredBuyers.map((b) => [
      b.code,
      `"${b.name}"`,
      `"${b.phone}"`,
      `"${b.email}"`,
      `"${b.interest?.property || ''}"`,
      `"${b.interest?.bhk || ''}"`,
      `"${b.interest?.budget || ''}"`,
      `"${b.location}"`,
      `"${b.assignedTo}"`,
      `"${b.status}"`,
      `"${(b.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `anv_verified_buyers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredBuyers.length} buyers to CSV`);
  };

  // Delete single buyer
  const handleConfirmSingleDelete = async () => {
    if (!buyerToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/crm/leads?id=${buyerToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete buyer');
      }

      showToast(`Deleted ${buyerToDelete.name || buyerToDelete.code}`);
      setBuyerToDelete(null);
      setSelectedIds((prev) => prev.filter((id) => id !== buyerToDelete.id));
      onRefresh();
    } catch (err: any) {
      console.error('Delete error:', err);
      showToast(`Error: ${err.message || 'Failed to delete'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete bulk selected buyers
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);

    try {
      const res = await fetch('/api/crm/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete selected buyers');
      }

      showToast(`Successfully deleted ${data.count || selectedIds.length} buyer records.`);
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
      onRefresh();
    } catch (err: any) {
      console.error('Bulk delete error:', err);
      showToast(`Error: ${err.message || 'Failed to delete selected'}`);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setTypeFilter('all');
    setLocationFilter('all');
    setBudgetFilter('all');
    setAdvisorFilter('all');
    setActiveTabFilter('all');
    setSearchQuery('');
    showToast('Filters reset to default');
  };

  // Apply filters
  const filteredBuyers = buyers.filter((buyer) => {
    // Quick category tab filter
    if (activeTabFilter === 'commercial') {
      const text = `${buyer.name} ${buyer.interest?.property} ${buyer.interest?.bhk}`.toLowerCase();
      if (!text.includes('commercial') && !text.includes('office') && !text.includes('showroom') && !text.includes('land') && !text.includes('plot')) {
        return false;
      }
    } else if (activeTabFilter === 'residential') {
      const text = `${buyer.name} ${buyer.interest?.property} ${buyer.interest?.bhk}`.toLowerCase();
      if (!text.includes('bhk') && !text.includes('residence') && !text.includes('apartment') && !text.includes('villa')) {
        return false;
      }
    } else if (activeTabFilter === 'luxury') {
      const text = `${buyer.interest?.budget} ${buyer.notes}`.toLowerCase();
      const raw = buyer.interest?.rawBudget || 0;
      if (raw < 30000000 && !text.includes('3.') && !text.includes('4.') && !text.includes('5.') && !text.includes('6.') && !text.includes('cr')) {
        return false;
      }
    }

    // Property Type
    if (typeFilter !== 'all') {
      const text = `${buyer.interest?.bhk} ${buyer.interest?.property} ${buyer.name}`.toLowerCase();
      if (!text.includes(typeFilter.toLowerCase())) return false;
    }

    // Micro-Location
    if (locationFilter !== 'all') {
      const loc = (buyer.location || '').toLowerCase();
      const req = (buyer.interest?.property || '').toLowerCase();
      if (!loc.includes(locationFilter.toLowerCase()) && !req.includes(locationFilter.toLowerCase())) {
        return false;
      }
    }

    // Budget Filter
    if (budgetFilter !== 'all') {
      const raw = buyer.interest?.rawBudget || 0;
      const budgetTxt = buyer.interest?.budget || '';
      if (budgetFilter === 'under2') {
        if (raw > 20000000 && !budgetTxt.includes('1.')) return false;
      } else if (budgetFilter === '2to4') {
        if (raw < 20000000 || raw > 40000000) return false;
      } else if (budgetFilter === 'above4') {
        if (raw < 40000000 && !budgetTxt.includes('4.') && !budgetTxt.includes('5.')) return false;
      }
    }

    // Advisor Filter
    if (advisorFilter !== 'all') {
      if (buyer.assignedTo !== advisorFilter) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const combined = `${buyer.name} ${buyer.phone} ${buyer.email} ${buyer.code} ${buyer.location} ${buyer.interest?.property} ${buyer.interest?.bhk} ${buyer.interest?.budget}`.toLowerCase();
      if (!combined.includes(q)) return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-zinc-950 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h1 className="text-base font-bold text-zinc-950 tracking-tight flex items-center gap-2">
                <span>Verified Buyers & Demands</span>
                <span className="text-xs font-mono font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                  {isLoading ? 'Loading...' : `${totalCount} Active Demands`}
                </span>
              </h1>
              <p className="text-xs text-zinc-500">
                Direct buyer mandates, commercial requirements & residential acquisition briefs
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-zinc-950 font-bold shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-zinc-100 text-zinc-950 font-bold shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <KanbanIcon className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-zinc-600 hover:text-zinc-950 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {onOpenUploadBuyers && (
            <button
              onClick={onOpenUploadBuyers}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
            >
              <UploadCloud className="w-3.5 h-3.5 text-zinc-950" />
              <span>Upload Buyers</span>
            </button>
          )}

          <button
            onClick={onOpenAddBuyer}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>+ Add Buyer</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards Grid for Buyers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: TOTAL BUYERS */}
        <div
          onClick={() => setActiveTabFilter('all')}
          className={`bg-white border ${
            activeTabFilter === 'all'
              ? 'border-zinc-900 ring-1 ring-zinc-900'
              : 'border-zinc-200 hover:border-zinc-400'
          } rounded-xl p-3.5 shadow-2xs flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98]`}
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              ALL BUYERS
            </span>
            <Users className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-zinc-900">{isLoading ? "..." : totalCount}</span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Verified
            </span>
          </div>
        </div>

        {/* Card 2: COMMERCIAL DEMANDS */}
        <div
          onClick={() => setActiveTabFilter('commercial')}
          className={`bg-white border ${
            activeTabFilter === 'commercial'
              ? 'border-amber-500 ring-1 ring-amber-500'
              : 'border-zinc-200 hover:border-amber-300'
          } rounded-xl p-3.5 shadow-2xs flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98]`}
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              COMMERCIAL
            </span>
            <Building className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-zinc-900">{isLoading ? "..." : commercialCount}</span>
            <span className="text-xs text-zinc-500 font-medium">Offices / Shops</span>
          </div>
        </div>

        {/* Card 3: RESIDENTIAL DEMANDS */}
        <div
          onClick={() => setActiveTabFilter('residential')}
          className={`bg-white border ${
            activeTabFilter === 'residential'
              ? 'border-sky-500 ring-1 ring-sky-500'
              : 'border-zinc-200 hover:border-sky-300'
          } rounded-xl p-3.5 shadow-2xs flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98]`}
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
              RESIDENTIAL
            </span>
            <Building className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-zinc-900">{isLoading ? "..." : residentialCount}</span>
            <span className="text-xs text-zinc-500 font-medium">2, 3, 4 BHKs</span>
          </div>
        </div>

        {/* Card 4: LUXURY / HIGH BUDGET */}
        <div
          onClick={() => setActiveTabFilter('luxury')}
          className={`bg-white border ${
            activeTabFilter === 'luxury'
              ? 'border-purple-500 ring-1 ring-purple-500'
              : 'border-zinc-200 hover:border-purple-300'
          } rounded-xl p-3.5 shadow-2xs flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98]`}
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
              HIGH BUDGET (&gt;₹3 Cr)
            </span>
            <Flame className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-zinc-900">{isLoading ? "..." : highBudgetCount}</span>
            <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              Premium
            </span>
          </div>
        </div>

        {/* Card 5: VERIFIED PATRONS */}
        <div className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              DIRECT DESK
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-zinc-900">100%</span>
            <span className="text-xs text-zinc-500 font-medium">+91 93730 20701</span>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs space-y-3">
        {/* Row 1: Search & Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5">
          {/* Search Box */}
          <div className="md:col-span-2">
            <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              SEARCH BUYERS
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code, name, phone, area, budget..."
              className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 font-medium focus:outline-none focus:border-zinc-400"
            />
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              PROPERTY TYPE
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 font-medium focus:outline-none focus:border-zinc-400 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="commercial">Commercial</option>
              <option value="office">Office / Space</option>
              <option value="showroom">Showroom</option>
              <option value="land">Land / Plot</option>
              <option value="3 bhk">3 BHK</option>
              <option value="4 bhk">4 BHK</option>
            </select>
          </div>

          {/* Micro-Location */}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              MICRO-LOCATION
            </label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 font-medium focus:outline-none focus:border-zinc-400 cursor-pointer"
            >
              <option value="all">All Pune Prime</option>
              <option value="baner">Baner</option>
              <option value="balewadi">Balewadi</option>
              <option value="undri">Undri</option>
              <option value="koregaon">Koregaon Park</option>
              <option value="kharadi">Kharadi</option>
              <option value="wakad">Wakad</option>
            </select>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              BUDGET
            </label>
            <select
              value={budgetFilter}
              onChange={(e) => setBudgetFilter(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 font-medium focus:outline-none focus:border-zinc-400 cursor-pointer"
            >
              <option value="all">All Budgets</option>
              <option value="under2">Under ₹2 Cr</option>
              <option value="2to4">₹2 Cr - ₹4 Cr</option>
              <option value="above4">Above ₹4 Cr</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              title="Reset Filters"
              className="w-full h-8 flex items-center justify-center gap-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg transition text-xs font-semibold text-zinc-600 hover:text-zinc-900 cursor-pointer shadow-2xs"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Row 2: Master Bulk Action Bar (Visible always, highlighted when selected!) */}
        <div className="pt-2 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedIds.length > 0 && selectedIds.length === filteredBuyers.length}
              onChange={handleToggleSelectAll}
              className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
            />
            <span className="text-xs text-zinc-700">
              Select All {filteredBuyers.length} Buyers{' '}
              <span className="text-zinc-400 mx-1">|</span>{' '}
              <span className="text-amber-800 font-bold">
                {selectedIds.length} Buyers Selected
              </span>
            </span>
          </div>

          {/* Bulk Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              disabled={selectedIds.length === 0}
              onClick={() => setIsReassignModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <UserCheck className="w-3.5 h-3.5 text-zinc-500" />
              <span>Reassign Rep</span>
            </button>

            <button
              disabled={selectedIds.length === 0}
              onClick={() => setIsBroadcastModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5 text-zinc-500" />
              <span>WhatsApp Broadcast</span>
            </button>

            {/* DELETE SELECTED BUTTON - REQUESTED BY USER */}
            <button
              disabled={selectedIds.length === 0}
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-600 hover:text-white text-rose-700 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
              title="Delete all selected buyer records"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Buyers Data Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredBuyers.length}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">LEAD DETAILS</th>
                <th className="py-3 px-4">CONTACT</th>
                <th className="py-3 px-4">INTERESTED PROPERTY</th>
                <th className="py-3 px-4">BUDGET</th>
                <th className="py-3 px-4">LOCATION</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredBuyers.map((buyer) => {
                const isChecked = selectedIds.includes(buyer.id);
                const isSelected = selectedBuyerId === buyer.id;

                return (
                  <tr
                    key={buyer.id}
                    onClick={() => onSelectBuyer(buyer)}
                    className={`transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-amber-50/50 hover:bg-amber-50/70'
                        : isChecked
                        ? 'bg-amber-50/30 hover:bg-amber-50/50'
                        : 'hover:bg-zinc-50/80'
                    }`}
                  >
                    {/* Checkbox */}
                    <td
                      className="py-3 px-4"
                      onClick={(e) => handleToggleSelectRow(buyer.id, e)}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
                      />
                    </td>

                    {/* Buyer Details */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white font-bold text-xs flex items-center justify-center shrink-0 select-none">
                          {buyer.name.slice(0, 2).toUpperCase() || 'CL'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-zinc-950 text-xs">
                              {buyer.name}
                            </span>
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            {buyer.leadScore && (
                              <span className="px-1.5 py-0.2 rounded font-extrabold text-[9px] bg-amber-400 text-black shadow-2xs flex items-center gap-0.5">
                                <span>⚡</span>
                                <span>{buyer.leadScore}</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                            {buyer.code}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-zinc-800">
                          {buyer.phone}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(buyer.phone, 'Phone');
                          }}
                          title="Copy Phone"
                          className="p-1 text-zinc-400 hover:text-zinc-800 transition cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <a
                          href={`tel:${buyer.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          title="Call Buyer"
                          className="p-1 text-zinc-400 hover:text-emerald-600 transition cursor-pointer"
                        >
                          <Phone className="w-3 h-3" />
                        </a>
                        <a
                          href={`https://wa.me/${buyer.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="WhatsApp Buyer"
                          className="p-1 text-zinc-400 hover:text-emerald-500 transition cursor-pointer"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate max-w-[150px] mt-0.5">
                        {buyer.email || 'leads@anvrealty.com'}
                      </div>
                    </td>

                    {/* Interested Property */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0">
                          <Building className="w-3 h-3 text-amber-700" />
                        </div>
                        <span className="font-medium text-xs text-zinc-900 line-clamp-1 max-w-[280px]">
                          {buyer.interest?.property || `${buyer.interest?.bhk} in ${buyer.location}`}
                        </span>
                      </div>
                    </td>

                    {/* Budget */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-zinc-900 text-xs">
                        {buyer.interest?.budget || '₹3.00 Cr'}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        {buyer.funding || 'Direct'}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 text-xs font-medium text-zinc-800">
                      {buyer.location || 'Pune'}
                    </td>

                    {/* ACTIONS COLUMN - EDIT & DELETE BUTTONS REQUESTED BY USER */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => setEditingBuyer(buyer)}
                          className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950 transition cursor-pointer shadow-2xs"
                          title="Edit Buyer Details"
                          aria-label="Edit Buyer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setBuyerToDelete(buyer)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white transition cursor-pointer shadow-2xs"
                          title="Delete Buyer"
                          aria-label="Delete Buyer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

                            {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-zinc-400">
                    <Loader2 className="w-8 h-8 mx-auto text-amber-500 animate-spin mb-3" />
                    <p className="text-sm font-bold text-zinc-700">Loading verified buyer mandates...</p>
                    <p className="text-xs text-zinc-400 mt-1">Connecting directly to secure CRM database</p>
                  </td>
                </tr>
              ) : filteredBuyers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-400">
                    <Users className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
                    <p className="text-sm font-bold text-zinc-700">No buyers found</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Upload buyers via Excel or click &quot;+ Add Buyer&quot; to register a demand.
                    </p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Buyer Modal */}
      {editingBuyer && (
        <CrmEditLeadModal
          isOpen={true}
          lead={editingBuyer}
          isBuyer={true}
          onClose={() => setEditingBuyer(null)}
          onSave={() => {
            showToast('Buyer details updated successfully.');
            setEditingBuyer(null);
            onRefresh();
          }}
        />
      )}

      {/* Single Delete Confirmation Modal */}
      {buyerToDelete && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => { if (!isDeleting) setBuyerToDelete(null); }}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-zinc-950">Delete Buyer Requirement</h3>
                <p className="text-xs text-zinc-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-700 leading-relaxed bg-zinc-50 p-3 rounded-lg border border-zinc-200">
              Are you sure you want to permanently delete{' '}
              <strong className="text-zinc-950">{buyerToDelete.name}</strong> ({buyerToDelete.code})?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setBuyerToDelete(null)}
                className="px-4 py-2 rounded-lg border border-zinc-300 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmSingleDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Buyer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => { if (!isBulkDeleting) setShowBulkDeleteConfirm(false); }}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-zinc-950">
                  Delete {selectedIds.length} Selected Buyers
                </h3>
                <p className="text-xs text-zinc-500">Permanent batch deletion</p>
              </div>
            </div>

            <p className="text-xs text-zinc-700 leading-relaxed bg-zinc-50 p-3 rounded-lg border border-zinc-200">
              Are you sure you want to permanently delete all{' '}
              <strong className="text-rose-600 font-black">{selectedIds.length}</strong> selected buyer requirements from the system? This action is permanent and cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg border border-zinc-300 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={handleConfirmBulkDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting {selectedIds.length}...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete All {selectedIds.length}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

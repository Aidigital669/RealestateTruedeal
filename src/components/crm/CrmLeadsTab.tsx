'use client';

import React, { useState } from 'react';
import {
  Table as TableIcon,
  Columns as KanbanIcon,
  SlidersHorizontal,
  ArrowUpDown,
  Download,
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
  MessageCircle
} from 'lucide-react';
import { CrmLead } from '@/lib/crm-data';

interface CrmLeadsTabProps {
  leads: CrmLead[];
  onOpenAddLead: () => void;
  onSelectLead: (lead: CrmLead) => void;
  selectedLeadId?: string;
}

export function CrmLeadsTab({
  leads,
  onOpenAddLead,
  onSelectLead,
  selectedLeadId
}: CrmLeadsTabProps) {
  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Checkbox selections
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filters
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [activeIntent, setActiveIntent] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [budgetFilter, setBudgetFilter] = useState<string>('all');
  const [advisorFilter, setAdvisorFilter] = useState<string>('all');
  const [followUpDate, setFollowUpDate] = useState<string>('2025-05-18');

  // Modals & Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [newAdvisor, setNewAdvisor] = useState('Prem Sharma');
  const [broadcastMessage, setBroadcastMessage] = useState(
    'Hello from Anv Reealty! We have exclusive private previews of newly released high-floor suites in Baner & Balewadi. Would you like to schedule a private walkthrough this weekend?'
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Derived Metrics
  const totalCount = leads.length;
  const newCount = leads.filter((l) => l.stage === 'new').length;
  const contactedCount = leads.filter((l) => l.stage === 'contacted').length;
  const qualifiedCount = leads.filter((l) => l.stage === 'qualified').length;
  const shortlistedCount = leads.filter((l) => l.stage === 'shortlisted').length;
  const siteVisitCount = leads.filter((l) => l.stage === 'site_visit').length;
  const negotiationCount = leads.filter((l) => l.stage === 'negotiation').length;
  const convertedCount = leads.filter((l) => l.stage === 'converted').length;
  const overdueCount = leads.filter((l) => l.followUp?.isOverdue).length;

  // Toast trigger
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Copy to clipboard
  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`Copied ${label}: ${text}`);
    }
  };

  // Handle master select all
  const handleToggleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((l) => l.id));
    }
  };

  // Handle individual row select
  const handleToggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Lead Code',
      'Name',
      'Phone',
      'Email',
      'Property',
      'Budget',
      'Funding',
      'Location',
      'Source',
      'Advisor',
      'Status',
      'Temperature'
    ];
    const rows = leads.map((l) => [
      l.code,
      `"${l.name}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${l.interest?.property || ''}"`,
      `"${l.interest?.budget || ''}"`,
      `"${l.funding || ''}"`,
      `"${l.location}"`,
      `"${l.source}"`,
      `"${l.assignedTo}"`,
      `"${l.status}"`,
      `"${l.temperature}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Anv_Reeality_Leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported 86 leads to CSV successfully');
  };

  // Reset filters
  const handleResetFilters = () => {
    setActiveStatus('all');
    setActiveIntent('all');
    setSourceFilter('all');
    setTypeFilter('all');
    setLocationFilter('all');
    setBudgetFilter('all');
    setAdvisorFilter('all');
    showToast('Filters reset to default view');
  };

  // Filtered Leads
  const filteredLeads = leads.filter((lead) => {
    // Status filter
    if (activeStatus !== 'all') {
      const s = activeStatus.toLowerCase();
      if (s === 'new' && lead.status.toLowerCase() !== 'new lead') return false;
      if (s === 'contacted' && lead.status.toLowerCase() !== 'contacted') return false;
      if (s === 'qualified' && lead.status.toLowerCase() !== 'qualified') return false;
      if (s === 'shortlisted' && !lead.status.toLowerCase().includes('shortlist')) return false;
      if (s === 'site_visit' && !lead.status.toLowerCase().includes('site visit')) return false;
      if (s === 'negotiation' && lead.status.toLowerCase() !== 'negotiation') return false;
      if (s === 'converted' && lead.status.toLowerCase() !== 'converted') return false;
    }

    // Intent filter
    if (activeIntent !== 'all' && lead.temperature !== activeIntent) {
      return false;
    }

    // Source filter
    if (sourceFilter !== 'all' && lead.sourceType !== sourceFilter) {
      return false;
    }

    // Advisor filter
    if (advisorFilter !== 'all' && !lead.assignedTo.includes(advisorFilter)) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-zinc-950 text-white px-4 py-2.5 rounded-xl shadow-xl border border-zinc-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Header Title & Top View Controls matching screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">Leads</h1>
            <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-600 font-semibold text-[10px] tracking-wide">
              HNI PRIVATE CLIENTS
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage property enquiries, sales opportunities and customer interactions.
          </p>
        </div>

        {/* View Switchers & Export & Add Lead */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-white border border-zinc-200 rounded-lg p-0.5 shadow-2xs text-xs overflow-x-auto max-w-full scrollbar-none">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-zinc-100 text-zinc-950 font-bold shadow-2xs'
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
              onClick={() => showToast('Advanced Filter Drawer opened')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-zinc-600 hover:text-zinc-950 transition cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
            <button
              onClick={() => showToast('Sorting by High Budget & Hot Intent')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-zinc-600 hover:text-zinc-950 transition cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-zinc-600 hover:text-zinc-950 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <button
            onClick={onOpenAddLead}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>+ Add Lead</span>
          </button>
        </div>
      </div>

      {/* 2. 6 KPI Cards Grid */}
      {(() => {

        return (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {/* Card 1: NEW LEADS */}
            <div 
              onClick={() => setActiveStatus(activeStatus === 'new' ? 'all' : 'new')}
              className={`bg-white border ${activeStatus === 'new' ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200 hover:border-zinc-400'} rounded-xl p-3.5 shadow-2xs flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98]`}
            >
              <div className="flex items-center justify-between text-zinc-400">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${activeStatus === 'new' ? 'text-zinc-900' : 'text-zinc-500'}`}>
                  NEW LEADS
                </span>
                <UserPlus className={`w-3.5 h-3.5 ${activeStatus === 'new' ? 'text-zinc-900' : 'text-zinc-400'}`} />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-zinc-900">{newCount}</span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
            </div>

            {/* Card 2: CONTACTED */}
            <div 
              onClick={() => setActiveStatus(activeStatus === 'contacted' ? 'all' : 'contacted')}
              className={`bg-white border ${activeStatus === 'contacted' ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200 hover:border-zinc-400'} rounded-xl p-3.5 shadow-2xs flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98]`}
            >
              <div className="flex items-center justify-between text-zinc-400">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${activeStatus === 'contacted' ? 'text-zinc-900' : 'text-zinc-500'}`}>
                  CONTACTED
                </span>
                <Phone className={`w-3.5 h-3.5 ${activeStatus === 'contacted' ? 'text-zinc-900' : 'text-zinc-400'}`} />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-zinc-900">{contactedCount}</span>
                <span className="text-xs text-zinc-400 font-medium">In Touch</span>
              </div>
            </div>

            {/* Card 3: QUALIFIED */}
            <div 
              onClick={() => setActiveStatus(activeStatus === 'qualified' ? 'all' : 'qualified')}
              className={`bg-white border ${activeStatus === 'qualified' ? 'border-amber-500 ring-1 ring-amber-500' : 'border-zinc-200 hover:border-amber-300'} rounded-xl p-3.5 shadow-2xs flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98]`}
            >
              <div className="flex items-center justify-between text-zinc-400">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${activeStatus === 'qualified' ? 'text-amber-700' : 'text-zinc-500'}`}>
                  QUALIFIED
                </span>
                <ShieldCheck className={`w-3.5 h-3.5 ${activeStatus === 'qualified' ? 'text-amber-600' : 'text-amber-500'}`} />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-zinc-900">{qualifiedCount}</span>
                <span className="text-xs font-semibold text-zinc-700">Verified</span>
              </div>
            </div>

            {/* Card 4: SITE VISITS */}
            <div 
              onClick={() => setActiveStatus(activeStatus === 'site_visit' ? 'all' : 'site_visit')}
              className={`bg-white border ${activeStatus === 'site_visit' ? 'border-sky-500 ring-1 ring-sky-500' : 'border-zinc-200 hover:border-sky-300'} rounded-xl p-3.5 shadow-2xs flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98]`}
            >
              <div className="flex items-center justify-between text-zinc-400">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${activeStatus === 'site_visit' ? 'text-sky-700' : 'text-zinc-500'}`}>
                  SITE VISITS
                </span>
                <Building className={`w-3.5 h-3.5 ${activeStatus === 'site_visit' ? 'text-sky-600' : 'text-zinc-400'}`} />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-zinc-900">{siteVisitCount}</span>
                <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
                  Scheduled
                </span>
              </div>
            </div>

            {/* Card 5: CONVERTED */}
            <div 
              onClick={() => setActiveStatus(activeStatus === 'converted' ? 'all' : 'converted')}
              className={`bg-white border ${activeStatus === 'converted' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-zinc-200 hover:border-emerald-300'} rounded-xl p-3.5 shadow-2xs flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98]`}
            >
              <div className="flex items-center justify-between text-zinc-400">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${activeStatus === 'converted' ? 'text-emerald-700' : 'text-zinc-500'}`}>
                  CONVERTED
                </span>
                <ShieldCheck className={`w-3.5 h-3.5 ${activeStatus === 'converted' ? 'text-emerald-600' : 'text-emerald-500'}`} />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-zinc-900">{convertedCount}</span>
                <span className="text-xs font-semibold text-emerald-600">Closed</span>
              </div>
              <div className={`w-full h-1 rounded-full mt-2.5 ${activeStatus === 'converted' ? 'bg-emerald-600' : 'bg-emerald-600/60'}`} />
            </div>

            {/* Card 6: OVERDUE */}
            <div 
              onClick={() => setActiveStatus(activeStatus === 'overdue' ? 'all' : 'overdue')}
              className={`bg-white border ${activeStatus === 'overdue' ? 'border-rose-500 ring-1 ring-rose-500' : 'border-zinc-200 hover:border-rose-300'} rounded-xl p-3.5 shadow-2xs flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98]`}
            >
              <div className="flex items-center justify-between text-rose-500">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${activeStatus === 'overdue' ? 'text-rose-700' : 'text-rose-600'}`}>
                  OVERDUE
                </span>
                <Clock className={`w-3.5 h-3.5 ${activeStatus === 'overdue' ? 'text-rose-600' : 'text-rose-500'}`} />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-rose-600">{overdueCount}</span>
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                  Pending
                </span>
              </div>
              <div className={`w-full h-1 rounded-full mt-2.5 ${activeStatus === 'overdue' ? 'bg-rose-600' : 'bg-rose-600/60'}`} />
            </div>
          </div>
        );
      })()}

      {/* 3. Filter Controls Box matching screenshot */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3.5 space-y-3 shadow-2xs text-xs">
        {/* Row 1: STATUS pills on left & INTENT pills on right */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-zinc-700 uppercase tracking-wide text-[10px] mr-1">
              STATUS:
            </span>
            {[
              { id: 'all', label: `All (${totalCount})` },
              { id: 'new', label: `New (${newCount})` },
              { id: 'contacted', label: `Contacted (${contactedCount})` },
              { id: 'qualified', label: `Qualified (${qualifiedCount})` },
              { id: 'shortlisted', label: `Property Shortlisted (${shortlistedCount})` },
              { id: 'site_visit', label: `Site Visit (${siteVisitCount})` },
              { id: 'negotiation', label: `Negotiation (${negotiationCount})` },
              { id: 'converted', label: `Converted (${convertedCount})` }
            ].map((st) => {
              const isActive = activeStatus === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setActiveStatus(st.id)}
                  className={`px-3 py-1 rounded-md text-xs transition cursor-pointer ${
                    isActive
                      ? 'bg-zinc-950 text-white font-bold'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          {/* Intent Pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-bold text-zinc-700 uppercase tracking-wide text-[10px] mr-1">
              INTENT:
            </span>
            {[
              { id: 'all', label: 'All' },
              { id: 'hot', label: '🔥 Hot' },
              { id: 'warm', label: '🔥 Warm' },
              { id: 'cold', label: '🔵 Cold' }
            ].map((it) => {
              const isActive = activeIntent === it.id;
              return (
                <button
                  key={it.id}
                  onClick={() => setActiveIntent(it.id)}
                  className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer ${
                    isActive
                      ? 'bg-zinc-100 border border-zinc-300 text-zinc-950 font-bold'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  {it.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 pt-0.5">
          {/* Source */}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              SOURCE
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 font-medium focus:outline-hidden focus:border-zinc-400 cursor-pointer"
            >
              <option value="all">All Sources</option>
              <option value="website">Website Enquiry</option>
              <option value="whatsapp">WhatsApp Direct</option>
              <option value="google_ads">Meta Ads</option>
              <option value="referral">Client Referral</option>
              <option value="walk_in">Walk-in Gallery</option>
            </select>
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              PROPERTY TYPE
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 font-medium focus:outline-hidden focus:border-zinc-400 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="3bhk">3 BHK</option>
              <option value="4bhk">4 BHK</option>
              <option value="duplex">Duplex</option>
              <option value="penthouse">Penthouse</option>
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
              className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 font-medium focus:outline-hidden focus:border-zinc-400 cursor-pointer"
            >
              <option value="all">All Pune Prime</option>
              <option value="Baner">Baner</option>
              <option value="Balewadi">Balewadi High St</option>
              <option value="Mahalunge">Mahalunge</option>
              <option value="Wakad">Wakad</option>
              <option value="Shivajinagar">Shivajinagar</option>
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
              className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 font-medium focus:outline-hidden focus:border-zinc-400 cursor-pointer"
            >
              <option value="all">All Budgets</option>
              <option value="under2">Under ₹2 Cr</option>
              <option value="2to4">₹2 Cr - ₹4 Cr</option>
              <option value="above4">Above ₹4 Cr</option>
            </select>
          </div>

          {/* Assigned Advisor */}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              ASSIGNED ADVISOR
            </label>
            <select
              value={advisorFilter}
              onChange={(e) => setAdvisorFilter(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 font-medium focus:outline-hidden focus:border-zinc-400 cursor-pointer"
            >
              <option value="all">All Advisors</option>
              <option value="Prem Sharma">Prem Sharma</option>
              <option value="Neha Patil">Neha Patil</option>
              <option value="Rajesh Varma">Rajesh Varma</option>
            </select>
          </div>

          {/* Follow-up Window */}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              FOLLOW-UP WINDOW
            </label>
            <div className="relative">
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 font-medium focus:outline-hidden focus:border-zinc-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Refresh Button */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              title="Reset Filters"
              className="w-full h-8 flex items-center justify-center bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg transition text-zinc-600 hover:text-zinc-900 cursor-pointer shadow-2xs"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 3: Bulk Selection Bar matching screenshot */}
        <div className="pt-2 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedIds.length > 0}
              onChange={handleToggleSelectAll}
              className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
            />
            <span className="text-xs text-zinc-700">
              Select All {totalCount} Leads{' '}
              <span className="text-zinc-400 mx-1">|</span>{' '}
              <span className="text-amber-800 font-bold">
                {selectedIds.length} Leads Selected
              </span>
            </span>
          </div>

          {/* Bulk Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsReassignModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-zinc-500" />
              <span>Reassign Rep</span>
            </button>

            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs"
            >
              <Send className="w-3.5 h-3.5 text-zinc-500" />
              <span>WhatsApp Broadcast</span>
            </button>

            <button
              onClick={() => showToast(`Archived ${selectedIds.length} selected leads`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 hover:bg-rose-50 text-rose-600 hover:border-rose-200 rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Table View or Kanban View */}
      {viewMode === 'table' ? (
        <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 text-zinc-600 font-bold border-b border-zinc-200 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredLeads.length && filteredLeads.length > 0}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">LEAD DETAILS</th>
                  <th className="py-3 px-4">CONTACT</th>
                  <th className="py-3 px-4">INTERESTED PROPERTY</th>
                  <th className="py-3 px-4">BUDGET</th>
                  <th className="py-3 px-4">LOCATION</th>
                  <th className="py-3 px-4">SOURCE</th>
                  <th className="py-3 px-4">ADVISOR</th>
                  <th className="py-3 px-4">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredLeads.map((lead) => {
                  const isChecked = selectedIds.includes(lead.id);
                  const isSelected = selectedLeadId === lead.id;

                  // Status style mapping
                  let statusBadgeClass =
                    'border border-zinc-300 text-zinc-700 bg-white';
                  if (lead.status === 'Qualified') {
                    statusBadgeClass =
                      'border border-emerald-400 text-emerald-600 bg-white';
                  } else if (lead.status === 'Site Visit Sched') {
                    statusBadgeClass =
                      'border border-sky-400 text-sky-600 bg-white';
                  } else if (lead.status === 'Negotiation') {
                    statusBadgeClass =
                      'border border-amber-400 text-amber-600 bg-white';
                  }

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className={`transition-colors cursor-pointer group ${
                        isSelected
                          ? 'bg-amber-50/40 hover:bg-amber-50/60'
                          : 'hover:bg-zinc-50/80'
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3 px-4"
                        onClick={(e) => handleToggleSelectRow(lead.id, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
                        />
                      </td>

                      {/* Lead Details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 select-none ${
                              lead.avatarColor || 'bg-zinc-900 text-white'
                            }`}
                          >
                            {lead.avatarInitials || lead.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-zinc-950 text-xs">
                                {lead.name}
                              </span>
                              {lead.reraVerified && (
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              )}
                              {lead.starred && (
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                              )}
                              {lead.isNri && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold text-[9px] uppercase tracking-wider">
                                  NRI
                                </span>
                              )}
                              {lead.leadScore && (
                                <span className={`px-1.5 py-0.2 rounded font-extrabold text-[9px] flex items-center gap-0.5 ${
                                  lead.leadScore >= 75
                                    ? 'bg-amber-400 text-black shadow-2xs'
                                    : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                                }`}>
                                  <span>{lead.leadScore >= 75 ? '🔥' : '⚡'}</span>
                                  <span>{lead.leadScore}</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                              {lead.code}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-zinc-800">
                            {lead.phone}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(lead.phone, 'Phone');
                            }}
                            title="Copy Phone"
                            className="p-1 text-zinc-400 hover:text-zinc-800 transition cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <a
                            href={`tel:${lead.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            title="Call"
                            className="p-1 text-zinc-400 hover:text-emerald-600 transition cursor-pointer"
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                          <a
                            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="WhatsApp"
                            className="p-1 text-zinc-400 hover:text-emerald-500 transition cursor-pointer"
                          >
                            <MessageCircle className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate max-w-[140px] mt-0.5">
                          {lead.email}
                        </div>
                      </td>

                      {/* Interested Property */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0">
                            <Building className="w-3 h-3 text-amber-700" />
                          </div>
                          <span className="font-medium text-xs text-zinc-900">
                            {lead.interest?.property || 'Custom Property'}
                          </span>
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-900 text-xs">
                          {lead.interest?.budget || '₹1.50 Cr'}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          {lead.funding || 'Direct'}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-xs font-medium text-zinc-800">
                        {lead.location}
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[11px] font-medium whitespace-nowrap">
                          {lead.source}
                        </span>
                      </td>

                      {/* Advisor */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 select-none ${
                              lead.advisorColor || 'bg-zinc-900 text-white'
                            }`}
                          >
                            {lead.advisorInitials ||
                              lead.assignedTo
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)}
                          </div>
                          <span className="text-xs font-medium text-zinc-800 whitespace-nowrap">
                            {lead.assignedTo}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${statusBadgeClass}`}
                        >
                          {lead.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-zinc-400">
                      <UserCheck className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                      <p className="text-sm font-semibold text-zinc-700">No leads found</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Click &quot;+ Add Lead&quot; to register a client requirement</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 5. Pagination matching screenshot */}
          <div className="px-4 py-3 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
            <div className="flex items-center gap-3">
              <span>
                Showing {filteredLeads.length > 0 ? 1 : 0} to {filteredLeads.length} of {leads.length} leads
              </span>
              <span className="text-zinc-300">|</span>
              <div className="flex items-center gap-1.5">
                <span>Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="bg-white border border-zinc-200 rounded px-1.5 py-0.5 text-xs text-zinc-700 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Page number buttons */}
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 disabled:opacity-40 transition cursor-pointer"
              >
                Previous
              </button>

              <button
                onClick={() => setCurrentPage(1)}
                className={`px-2.5 py-1 rounded font-bold transition cursor-pointer ${
                  currentPage === 1
                    ? 'bg-black text-white'
                    : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                1
              </button>

              <button
                onClick={() => setCurrentPage(2)}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  currentPage === 2
                    ? 'bg-black text-white font-bold'
                    : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                2
              </button>

              <button
                onClick={() => setCurrentPage(3)}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  currentPage === 3
                    ? 'bg-black text-white font-bold'
                    : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                3
              </button>

              <span className="px-1 text-zinc-400 select-none">...</span>

              <button
                onClick={() => setCurrentPage(18)}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  currentPage === 18
                    ? 'bg-black text-white font-bold'
                    : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                18
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(18, p + 1))}
                className="px-2.5 py-1 rounded border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'new', title: 'New Leads', count: 18, color: 'bg-zinc-100 text-zinc-800' },
            { id: 'qualified', title: 'Qualified', count: 22, color: 'bg-emerald-50 text-emerald-800' },
            { id: 'site_visit', title: 'Site Visit', count: 8, color: 'bg-sky-50 text-sky-800' },
            { id: 'negotiation', title: 'Negotiation', count: 6, color: 'bg-amber-50 text-amber-800' }
          ].map((col) => {
            const colLeads = leads.filter((l) => {
              if (col.id === 'new') return l.stage === 'new';
              if (col.id === 'qualified') return l.stage === 'qualified';
              if (col.id === 'site_visit') return l.stage === 'site_visit';
              if (col.id === 'negotiation') return l.stage === 'negotiation';
              return false;
            });

            return (
              <div
                key={col.id}
                className="bg-zinc-50/70 border border-zinc-200 rounded-xl p-3 flex flex-col gap-3 min-h-[400px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-zinc-900">{col.title}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${col.color}`}>
                      {col.count}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 flex-1">
                  {colLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className="bg-white border border-zinc-200 rounded-lg p-3 shadow-2xs hover:shadow-md transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-zinc-950 flex items-center gap-1.5">
                          <span>{lead.name}</span>
                          {lead.leadScore && (
                            <span className="px-1 py-0.2 rounded bg-amber-400 text-black font-extrabold text-[8px]">
                              {lead.leadScore}
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">{lead.code}</span>
                      </div>
                      <p className="text-[11px] text-zinc-600 font-medium truncate">
                        {lead.interest?.property}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100 text-[10px]">
                        <span className="font-bold text-zinc-900">{lead.interest?.budget}</span>
                        <span className="text-zinc-500">{lead.assignedTo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reassign Rep Modal */}
      {isReassignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-zinc-800" />
                <h3 className="font-bold text-sm text-zinc-900">
                  Reassign {selectedIds.length} Selected Leads
                </h3>
              </div>
              <button
                onClick={() => setIsReassignModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Select the sales advisor or client relations manager to reassign these high-value opportunities to:
            </p>

            <div className="space-y-2">
              {['Prem Sharma', 'Neha Patil', 'Rajesh Varma'].map((advisor) => (
                <label
                  key={advisor}
                  className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                    newAdvisor === advisor
                      ? 'border-zinc-950 bg-zinc-50'
                      : 'border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-zinc-950 text-white font-bold text-xs flex items-center justify-center">
                      {advisor
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-zinc-900">{advisor}</p>
                      <p className="text-[10px] text-zinc-400">Executive Advisor • Active</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="advisor"
                    checked={newAdvisor === advisor}
                    onChange={() => setNewAdvisor(advisor)}
                    className="w-4 h-4 text-black focus:ring-black"
                  />
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setIsReassignModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-zinc-600 hover:text-zinc-900"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsReassignModalOpen(false);
                  showToast(
                    `Reassigned ${selectedIds.length} leads to ${newAdvisor}`
                  );
                }}
                className="px-4 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition"
              >
                Confirm Reassign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Broadcast Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-zinc-900">
                  WhatsApp Broadcast to {selectedIds.length} Clients
                </h3>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Personalized luxury broadcast using verified Meta WhatsApp Business Cloud API:
            </p>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Broadcast Template
              </label>
              <textarea
                rows={4}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-hidden focus:border-zinc-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-zinc-600 hover:text-zinc-900"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsBroadcastModalOpen(false);
                  showToast(
                    `Broadcast dispatched to ${selectedIds.length} WhatsApp numbers`
                  );
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
              >
                Dispatch Broadcast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

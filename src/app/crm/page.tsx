'use client';

import React, { useState, useEffect } from 'react';
import { CrmAuthGate } from '@/components/crm/CrmAuthGate';
import { CrmSidebar } from '@/components/crm/CrmSidebar';
import { CrmNavbar } from '@/components/crm/CrmNavbar';
import { CrmLeadsTab } from '@/components/crm/CrmLeadsTab';
import { CrmCustomersTab } from '@/components/crm/CrmCustomersTab';
import { CrmSiteVisitsTab } from '@/components/crm/CrmSiteVisitsTab';
import { CrmCallsTab } from '@/components/crm/CrmCallsTab';
import { CrmKpiGrid } from '@/components/crm/CrmKpiGrid';
import { CrmPipelineStages } from '@/components/crm/CrmPipelineStages';
import { CrmLeadDossier } from '@/components/crm/CrmLeadDossier';
import { CrmTelephonyBanner } from '@/components/crm/CrmTelephonyBanner';
import { CrmPropertiesTab } from '@/components/crm/CrmPropertiesTab';
import { CrmAddLeadModal } from '@/components/crm/CrmAddLeadModal';
import { CRM_LEADS_DATA, CrmLead } from '@/lib/crm-data';
import { X } from 'lucide-react';

export default function CrmPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Default active tab
  const [sidebarTab, setSidebarTab] = useState<'dashboard' | 'leads' | 'customers' | 'site_visits' | string>('leads');
  const [activeNavTab, setActiveNavTab] = useState('pipeline');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('qualified');
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/crm/leads');
      const data = await res.json();
      if (data.success && data.leads && data.leads.length > 0) {
        const mapped = data.leads.map((l: any) => ({
          id: String(l.id),
          code: l.code,
          name: l.name,
          phone: l.phone,
          email: l.email || '',
          designation: l.designation || 'Private Buyer',
          company: l.company || '',
          residence: l.residence || l.location,
          location: l.location || 'Pune, Maharashtra',
          isNri: !!l.isNri,
          nriTag: l.nriTag || '',
          reraVerified: true,
          status: l.status || 'New',
          stage: l.stage || 'new',
          temperature: l.temperature || 'warm',
          assignedTo: l.assignedTo || 'Unassigned',
          interest: {
            property: l.propertyInterest || 'Curated Portfolio',
            bhk: l.bhk || '3 BHK',
            sqft: l.carpetSqft || '1,200 Sq.Ft.',
            budget: l.budget || '₹1.5 - 2.5 Cr',
            rawBudget: Number(l.budgetRaw) || 15000000
          },
          source: l.source || 'Website',
          sourceType: l.sourceType || 'website',
          followUp: l.followUp || { display: 'In 2 days', subtext: 'Site visit review' },
          dna: l.dna || {
            configuration: l.bhk || '3 BHK',
            targetBudget: l.budget || '₹1.5 - 2.5 Cr',
            preferredLocations: l.location || 'Pune',
            purchasePurpose: 'Primary Residence',
            possessionHorizon: 'Within 6 months',
            financingStatus: 'Self-Funded'
          },
          matchedProperties: [],
          callTimeline: [],
          leadScore: l.leadScore,
          scoreBreakdown: l.scoreBreakdown,
          churnRisk: l.churnRisk,
          churnRiskLevel: l.churnRiskLevel,
          nextBestAction: l.nextBestAction,
          nextBestActionSubtext: l.nextBestActionSubtext,
          nextBestActionType: l.nextBestActionType,
          slaLabel: l.slaLabel
        }));
        setLeads(mapped);
        if (mapped.length > 0) {
          setSelectedLead(mapped[0]);
        }
      } else {
        setLeads([]);
        setSelectedLead(null);
      }
    } catch (err) {
      console.log('CRM leads live fetch notice:', err);
      setLeads([]);
      setSelectedLead(null);
    }
  };

  // Check existing session & fetch live leads
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('anv_crm_auth');
      if (stored === 'true') {
        setIsAuthenticated(true);
        fetchLeads();
      } else {
        setIsAuthenticated(false);
      }
      setIsCheckingAuth(false);
    }
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    fetchLeads();
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('anv_crm_auth');
      localStorage.removeItem('anv_crm_user');
      localStorage.removeItem('anv_crm_email');
      localStorage.removeItem('anv_crm_initials');
      localStorage.removeItem('anv_crm_title');
      localStorage.removeItem('anv_crm_role');
      localStorage.removeItem('anv_crm_territory');
    }
    setIsAuthenticated(false);
  };

  const handleAddLead = async (newLead: CrmLead) => {
    // Optimistic UI update
    setLeads([newLead, ...leads]);
    setSelectedLead(newLead);

    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLead.name,
          phone: newLead.phone,
          email: newLead.email,
          designation: newLead.designation,
          company: newLead.company,
          location: newLead.location,
          propertyInterest: newLead.interest?.property,
          bhk: newLead.interest?.bhk,
          carpetSqft: newLead.interest?.sqft,
          budget: newLead.interest?.budget,
          stage: newLead.stage,
          temperature: newLead.temperature,
          assignedTo: newLead.assignedTo
        })
      });
      const data = await res.json();
      if (data.success && data.lead) {
        fetchLeads();
      }
    } catch (err) {
      console.error('Failed to save lead to backend:', err);
    }
  };

  const handleUpdateStage = async (leadId: string, newStage: string) => {
    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId ? { ...l, stage: newStage as any, status: 'Negotiation' } : l
      )
    );
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead((prev) =>
        prev
          ? {
              ...prev,
              stage: newStage as any,
              status: 'Negotiation'
            }
          : null
      );
    }

    try {
      await fetch(`/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage, status: 'Negotiation' })
      });
    } catch (err) {
      console.error('Failed to update stage in backend:', err);
    }
  };

  const handleSelectLeadFromTable = (lead: CrmLead) => {
    setSelectedLead(lead);
    setIsDossierOpen(true);
  };

  const handleSidebarTabChange = (tab: string) => {
    setSidebarTab(tab);
    if (tab === 'leads') {
      setActiveNavTab('pipeline');
    } else if (tab === 'dashboard') {
      setActiveNavTab('dashboard');
    } else if (tab === 'properties') {
      setActiveNavTab('properties');
    } else if (tab === 'reports') {
      setActiveNavTab('reports');
    }
  };

  const handleNavTabChange = (tab: string) => {
    setActiveNavTab(tab);
    if (tab === 'pipeline') {
      setSidebarTab('leads');
    } else if (tab === 'dashboard') {
      setSidebarTab('dashboard');
    } else if (tab === 'properties') {
      setSidebarTab('properties');
    } else if (tab === 'reports') {
      setSidebarTab('reports');
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-amber-400 text-xs font-semibold">
        Verifying CRM authorization...
      </div>
    );
  }

  // Not authenticated? Show the CRM authentication gate!
  if (!isAuthenticated) {
    return <CrmAuthGate onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex text-zinc-900 font-sans antialiased">
      {/* 1. Left Sidebar matching screenshot */}
      <CrmSidebar
        currentTab={sidebarTab}
        onTabChange={handleSidebarTabChange}
        onOpenAddLead={() => setIsAddLeadOpen(true)}
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Main Content View Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar matching each tab's screenshot */}
        <CrmNavbar
          currentTab={sidebarTab}
          activeNavTab={activeNavTab}
          onNavTabChange={handleNavTabChange}
          onOpenAddAction={() => setIsAddLeadOpen(true)}
          searchTerm={searchTerm}
          onSearchChange={(val) => setSearchTerm(val)}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        {/* Scrollable CRM Body */}
        <main className="p-3 sm:p-6 space-y-4 sm:space-y-5 max-w-7xl w-full mx-auto overflow-y-auto">
          {/* Tab 2: Leads (Screenshot 1 of first prompt) */}
          {sidebarTab === 'leads' && (
            <CrmLeadsTab
              leads={leads}
              onOpenAddLead={() => setIsAddLeadOpen(true)}
              onSelectLead={handleSelectLeadFromTable}
              selectedLeadId={selectedLead?.id}
            />
          )}

          {/* Tab 3: Customers (Screenshot 2 of latest prompt) */}
          {sidebarTab === 'customers' && (
            <CrmCustomersTab />
          )}

          {/* Tab 5: Site Visits (Screenshot 1 of latest prompt) */}
          {sidebarTab === 'site_visits' && (
            <CrmSiteVisitsTab />
          )}

          {/* Tab 8: Calls (Screenshot 1 of latest prompt) */}
          {sidebarTab === 'calls' && (
            <CrmCallsTab />
          )}
          
          {/* Tab: Properties */}
          {sidebarTab === 'properties' && (
            <CrmPropertiesTab />
          )}

          {/* Tab 1: Dashboard */}
          {sidebarTab === 'dashboard' && (
            <div className="space-y-5">
              <CrmKpiGrid />
              <CrmPipelineStages
                selectedStage={selectedStage}
                onSelectStage={(stageId) => setSelectedStage(stageId)}
              />
            </div>
          )}

          {/* Other Sidebar Tabs Fallback */}
          {sidebarTab !== 'leads' &&
            sidebarTab !== 'customers' &&
            sidebarTab !== 'site_visits' &&
            sidebarTab !== 'calls' &&
            sidebarTab !== 'properties' &&
            sidebarTab !== 'dashboard' && (
              <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center space-y-3">
                <h2 className="text-base font-bold text-zinc-900 capitalize">
                  {sidebarTab.replace('_', ' ')} Directory
                </h2>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                  Viewing live enterprise module for {sidebarTab}. Switch to the{' '}
                  <button
                    onClick={() => handleSidebarTabChange('leads')}
                    className="text-amber-800 font-bold underline cursor-pointer"
                  >
                    Leads (Tab 2)
                  </button>
                  ,{' '}
                  <button
                    onClick={() => handleSidebarTabChange('customers')}
                    className="text-amber-800 font-bold underline cursor-pointer"
                  >
                    Customers (Tab 3)
                  </button>
                  ,{' '}
                  <button
                    onClick={() => handleSidebarTabChange('site_visits')}
                    className="text-amber-800 font-bold underline cursor-pointer"
                  >
                    Site Visits (Tab 5)
                  </button>
                  ,{' '}
                  <button
                    onClick={() => handleSidebarTabChange('employees')}
                    className="text-amber-800 font-bold underline cursor-pointer"
                  >
                    Employees
                  </button>
                  , or{' '}
                  <button
                    onClick={() => handleSidebarTabChange('calls')}
                    className="text-amber-800 font-bold underline cursor-pointer"
                  >
                    Calls
                  </button>{' '}
                  to access the active operational pipelines.
                </p>
              </div>
            )}
        </main>
      </div>

      {/* Lead Intelligence Dossier Drawer */}
      {isDossierOpen && selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex justify-end animate-in fade-in">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-zinc-200 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-zinc-950">
                  Lead Intelligence Dossier
                </span>
                <span className="text-xs font-mono text-zinc-500 bg-zinc-200 px-1.5 py-0.5 rounded">
                  {selectedLead.code}
                </span>
              </div>
              <button
                onClick={() => setIsDossierOpen(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <CrmLeadDossier
                lead={selectedLead}
                onUpdateStage={handleUpdateStage}
              />
            </div>
          </div>
        </div>
      )}

      {/* Interactive + Add Lead Modal */}
      <CrmAddLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        onAddLead={handleAddLead}
      />
    </div>
  );
}

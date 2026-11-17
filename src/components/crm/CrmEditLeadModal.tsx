'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  IndianRupee,
  Calendar,
  Save,
  Loader2,
  Tag,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { CrmLead } from '@/lib/crm-data';

interface CrmEditLeadModalProps {
  isOpen: boolean;
  lead: CrmLead | null;
  onClose: () => void;
  onSave: (updatedLead: CrmLead) => void;
  isBuyer?: boolean;
}

export function CrmEditLeadModal({
  isOpen,
  lead,
  onClose,
  onSave,
  isBuyer = false
}: CrmEditLeadModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    propertyInterest: '',
    bhk: '',
    budget: '',
    status: 'New Lead',
    stage: 'new',
    temperature: 'hot',
    assignedTo: 'Unassigned',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        location: lead.location || '',
        propertyInterest: lead.interest?.property || '',
        bhk: lead.interest?.bhk || '',
        budget: lead.interest?.budget || '',
        status: lead.status || 'New Lead',
        stage: lead.stage || 'new',
        temperature: lead.temperature || 'warm',
        assignedTo: lead.assignedTo || 'Unassigned',
        notes: lead.notes || ''
      });
      setErrorMessage(null);
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setErrorMessage('Name and phone number are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/crm/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: lead.id,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          location: formData.location.trim(),
          propertyInterest: formData.propertyInterest.trim() || `${formData.bhk} in ${formData.location}`,
          bhk: formData.bhk.trim(),
          budget: formData.budget.trim(),
          status: formData.status,
          stage: formData.stage,
          temperature: formData.temperature,
          assignedTo: formData.assignedTo,
          notes: formData.notes.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update lead');
      }

      // Optimistically update parent
      const updated: CrmLead = {
        ...lead,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        location: formData.location.trim(),
        status: formData.status as any,
        stage: formData.stage as any,
        temperature: formData.temperature as any,
        assignedTo: formData.assignedTo,
        notes: formData.notes.trim(),
        interest: {
          ...lead.interest,
          property: formData.propertyInterest.trim() || `${formData.bhk} in ${formData.location}`,
          bhk: formData.bhk.trim(),
          budget: formData.budget.trim(),
          sqft: lead.interest?.sqft || '1,200 Sq.Ft.',
          rawBudget: lead.interest?.rawBudget || 15000000
        }
      };

      onSave(updated);
      onClose();
    } catch (err: any) {
      console.error('Update lead error:', err);
      setErrorMessage(err.message || 'Network error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-zinc-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 bg-zinc-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center text-amber-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-zinc-950">
                  {isBuyer ? 'Edit Buyer Requirement' : 'Edit Lead Details'}
                </h2>
                <span className="text-[10px] font-mono bg-zinc-200 text-zinc-800 px-1.5 py-0.5 rounded">
                  {lead.code}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Update requirement parameters, client contact, or pipeline stage
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Row 1: Name and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Full Name / Title <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Client (Commercial Showroom - Baner)"
                  className="w-full bg-white border border-zinc-300 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Contact Phone <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9373020701"
                  className="w-full bg-white border border-zinc-300 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Email and Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. client@example.com"
                  className="w-full bg-white border border-zinc-300 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Location / Prime Micro-Market
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Baner, Pune"
                  className="w-full bg-white border border-zinc-300 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Typology & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Configuration / Typology
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.bhk}
                  onChange={(e) => setFormData({ ...formData, bhk: e.target.value })}
                  placeholder="e.g. 3 BHK or Commercial Office"
                  className="w-full bg-white border border-zinc-300 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Target Budget
              </label>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="e.g. ₹3.00 Cr or ₹1.5 - 2.5 Cr"
                  className="w-full bg-white border border-zinc-300 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Property Interest Title */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Interested Property / Requirement Summary
            </label>
            <input
              type="text"
              value={formData.propertyInterest}
              onChange={(e) => setFormData({ ...formData, propertyInterest: e.target.value })}
              placeholder="e.g. Commercial Showroom (1500 Sq.Ft.) in Baner, Pune"
              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
            />
          </div>

          {/* Row 5: Stage, Status & Advisor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Pipeline Stage
              </label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
              >
                <option value="new">New Demand / Lead</option>
                <option value="contacted">Contacted / Briefed</option>
                <option value="qualified">Qualified / Verified</option>
                <option value="shortlisted">Shortlisted Properties</option>
                <option value="site_visit">Site Visit Scheduled</option>
                <option value="negotiation">Negotiation / Token</option>
                <option value="converted">Closed / Converted</option>
                <option value="lost">Archived / Cold</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Display Status
              </label>
              <input
                type="text"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                placeholder="e.g. Verified Active Buyer"
                className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
              >
              </input>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Assigned Advisor
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
              >
                <option value="Unassigned">Unassigned</option>
                <option value="Prem Sharma">Prem Sharma</option>
                <option value="Neha Patil">Neha Patil</option>
                <option value="Rajesh Varma">Rajesh Varma</option>
              </select>
            </div>
          </div>

          {/* Row 6: Notes / Requirements */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Internal Notes / Mandate Requirements
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Specific floor preference, facing, OC requirement, parking, timeline, or financing status..."
              className="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-zinc-300 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

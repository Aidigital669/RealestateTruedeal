'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  MapPin,
  ArrowRight,
  Loader2,
  Plus,
  DownloadCloud,
  FileSpreadsheet,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle2,
  Shield,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import Image from 'next/image';
import { AddPropertyModal, EditPropertyModal } from '@/components/admin/Modals';
import { ScraperModal } from '@/components/crm/ScraperModal';
import { PropertyExcelUploadModal } from '@/components/crm/PropertyExcelUploadModal';
import { CATEGORY_OPTIONS } from '@/lib/categories-data';

export function CrmPropertiesTab() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [locationsList, setLocationsList] = useState<{ name: string }[]>([]);
  const [propertyTypesList, setPropertyTypesList] = useState<{ name: string }[]>([]);
  const [isScraperOpen, setIsScraperOpen] = useState(false);
  const [isExcelOpen, setIsExcelOpen] = useState(false);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [tempSafeIds, setTempSafeIds] = useState<Set<number | string>>(new Set());
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [showPropertySelector, setShowPropertySelector] = useState(true);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const fetchProperties = () => {
    setLoading(true);
    fetch('/api/admin/properties')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.properties) {
          setProperties(data.properties);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching CRM properties:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProperties();
    // Load locations and typologies for edit/add modal autocomplete
    fetch('/api/admin/locations')
      .then((res) => res.json())
      .then((data) => {
        if (data.locations) setLocationsList(data.locations);
      })
      .catch(() => {});

    fetch('/api/admin/property-types')
      .then((res) => res.json())
      .then((data) => {
        if (data.propertyTypes) setPropertyTypesList(data.propertyTypes);
      })
      .catch(() => {});
  }, []);

  const handleAddProperty = async (propData: any) => {
    try {
      const res = await fetch('/api/admin/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propData)
      });
      if (res.ok) {
        fetchProperties();
        setNotificationMsg('✓ New property added successfully!');
        setTimeout(() => setNotificationMsg(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePublish = async (prop: any) => {
    try {
      const newStatus = prop.publishStatus === 'Published' ? 'Draft' : 'Published';
      const res = await fetch(`/api/admin/properties/${prop.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishStatus: newStatus })
      });
      if (res.ok) {
        fetchProperties();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePropertySafe = async (prop: any) => {
    const newVal = !prop.isSafe;
    // Optimistic UI update
    setProperties((prev) =>
      prev.map((p) => (String(p.id) === String(prop.id) ? { ...p, isSafe: newVal } : p))
    );
    try {
      const res = await fetch(`/api/admin/properties/${prop.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSafe: newVal })
      });
      const data = await res.json();
      if (data.success) {
        setNotificationMsg(
          newVal
            ? `🛡️ Property "${prop.name || 'Listing'}" is now marked SAFE & protected from deletion!`
            : `Property "${prop.name || 'Listing'}" safe protection removed.`
        );
        setTimeout(() => setNotificationMsg(null), 4000);
        fetchProperties();
      } else {
        alert(data.error || 'Failed to update safe status');
        fetchProperties();
      }
    } catch (e: any) {
      console.error(e);
      fetchProperties();
    }
  };

  const handleOpenDeleteAllModal = () => {
    if (properties.length === 0) {
      alert('No properties available to delete.');
      return;
    }
    const safeSet = new Set(properties.filter((p) => p.isSafe).map((p) => p.id));
    setTempSafeIds(safeSet);
    setModalSearchTerm('');
    setShowPropertySelector(true);
    setIsDeleteAllOpen(true);
  };

  const handleToggleTempSafe = (id: number | string) => {
    setTempSafeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllTempSafe = (makeSafe: boolean) => {
    if (makeSafe) {
      setTempSafeIds(new Set(properties.map((p) => p.id)));
    } else {
      setTempSafeIds(new Set());
    }
  };

  const handleDeleteProperty = async (prop: any) => {
    if (prop.isSafe) {
      alert(`Property "${prop.name || 'Listing'}" is marked as SAFE and protected from deletion. Please remove its Safe status first if you wish to delete it.`);
      return;
    }
    if (!confirm('Are you sure you want to delete this property?')) return;
    try {
      const res = await fetch(`/api/admin/properties/${prop.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchProperties();
        setNotificationMsg(`✓ Deleted property "${prop.name || 'Listing'}".`);
        setTimeout(() => setNotificationMsg(null), 4000);
      } else {
        alert(data.error || 'Failed to delete property');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAllProperties = async () => {
    const safeIdsArray = Array.from(tempSafeIds);
    const toDeleteCount = properties.length - safeIdsArray.length;

    if (toDeleteCount <= 0) {
      alert('All properties are marked as SAFE! There are no unprotected properties to delete. If you want to delete properties, deselect them from Safe.');
      return;
    }

    const confirmMsg = safeIdsArray.length > 0
      ? `Are you sure you want to delete ${toDeleteCount} unprotected properties?\n\n🛡️ ${safeIdsArray.length} SAFE properties will be kept intact and NOT deleted.`
      : `Are you sure you want to permanently delete ALL ${properties.length} properties? This cannot be undone!`;

    if (!confirm(confirmMsg)) return;

    setIsDeletingAll(true);
    try {
      // First, persist any newly marked safe properties in DB
      for (const safeId of safeIdsArray) {
        const prop = properties.find((p) => String(p.id) === String(safeId));
        if (prop && !prop.isSafe) {
          await fetch(`/api/admin/properties/${safeId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isSafe: true })
          }).catch(() => {});
        }
      }

      const res = await fetch('/api/admin/properties', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ safeIds: safeIdsArray })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsDeleteAllOpen(false);
        fetchProperties();
        setNotificationMsg(
          data.message ||
          `✓ Successfully deleted ${data.deletedCount} properties. ${data.safePreservedCount || safeIdsArray.length} safe properties were preserved and NOT deleted!`
        );
        setTimeout(() => setNotificationMsg(null), 5000);
      } else {
        alert(data.error || 'Failed to delete all properties');
      }
    } catch (err: any) {
      console.error('Error deleting all properties:', err);
      alert(err.message || 'Error deleting all properties');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleEditPropertySubmit = async (id: string | number, updatedData: any) => {
    try {
      const res = await fetch(`/api/admin/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      const data = await res.json();
      if (data.success) {
        setIsEditOpen(false);
        setEditingProperty(null);
        fetchProperties();
        setNotificationMsg('✓ Property details updated successfully.');
        setTimeout(() => setNotificationMsg(null), 4000);
      } else {
        alert(data.error || 'Failed to update property');
      }
    } catch (e: any) {
      console.error('Error updating property:', e);
      alert(e.message || 'Error updating property');
    }
  };

  const filtered = properties.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.developer?.toLowerCase().includes(searchTerm.toLowerCase());

    const propConfig = (p.configuration || p.bhk || p.pt_name || '').toLowerCase();
    const matchesCategory =
      selectedCategory === 'All' ||
      propConfig.includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Toast Notification Banner */}
      {notificationMsg && (
        <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
          <button
            onClick={() => setNotificationMsg(null)}
            className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Property Inventory Control Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-4">
        {/* Top Tier: Title & Main Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0 shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
                  Property Inventory
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                  {properties.length} {properties.length === 1 ? 'Property' : 'Properties'}
                </span>
                {properties.some((p) => p.isSafe) && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {properties.filter((p) => p.isSafe).length} Safe Protected
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">Live catalog for sales advisors</p>
            </div>
          </div>

          {/* Action Buttons: Responsive & Flex-wrapped so NO button is ever cut off */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Delete All Button (Danger) */}
            {properties.length > 0 && (
              <button
                onClick={handleOpenDeleteAllModal}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs whitespace-nowrap"
                title="Delete all properties with Safe Property protection"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete All</span>
              </button>
            )}

            {/* Excel Upload (Green) */}
            <button
              onClick={() => setIsExcelOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs whitespace-nowrap"
              title="Upload properties in bulk via Excel spreadsheet (.xlsx, .xls, .csv)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel Upload</span>
            </button>

            {/* URL Import (Neutral) */}
            <button
              onClick={() => setIsScraperOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200/80 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs whitespace-nowrap"
              title="Import property from MagicBricks, 99acres or Housing URL"
            >
              <DownloadCloud className="w-4 h-4 text-zinc-600" />
              <span>URL Import</span>
            </button>

            {/* Add Property (Black) */}
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs whitespace-nowrap"
              title="Manually create a new property listing"
            >
              <Plus className="w-4 h-4" />
              <span>Add Property</span>
            </button>
          </div>
        </div>

        {/* Bottom Tier: Search & Category Filter */}
        <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search properties by title, developer, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-zinc-50 hover:bg-zinc-50/80 focus:bg-white border border-zinc-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition shadow-2xs"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 rounded-md cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 bg-zinc-50 hover:bg-zinc-50/80 focus:bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition shadow-2xs cursor-pointer min-w-[180px]"
            >
              <option value="All">All Categories ({properties.length})</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {(searchTerm || selectedCategory !== 'All') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
                className="px-2.5 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition cursor-pointer whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete All Confirmation Modal */}
      {isDeleteAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] p-5 sm:p-6 border border-zinc-200 shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
            {/* Top header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 leading-tight">
                    Delete All Properties?
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Select properties to keep safe before performing bulk deletion
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteAllOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1">
              {/* Prominent Badge requested by user */}
              <div className="bg-amber-50/95 border-2 border-amber-300 rounded-2xl p-4 text-amber-950 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[10px] font-black uppercase tracking-wider mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      Safety Protection Badge
                    </div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-amber-950 leading-snug">
                      &ldquo;If you want to save some property please select the property that you want to safe&rdquo;
                    </h4>
                    <p className="text-[11px] text-amber-900/80 mt-1 font-medium">
                      Select properties below to mark them as <strong className="text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded font-bold">Safe</strong>. Safe properties will <u>NOT</u> be deleted!
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats overview */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-center">
                  <span className="text-[9px] uppercase font-bold text-zinc-400 block tracking-wider">
                    Total
                  </span>
                  <span className="text-base font-black text-zinc-900">
                    {properties.length}
                  </span>
                </div>
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <span className="text-[9px] uppercase font-bold text-emerald-700 block tracking-wider">
                    🛡️ Safe (Kept)
                  </span>
                  <span className="text-base font-black text-emerald-800">
                    {tempSafeIds.size}
                  </span>
                </div>
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-center">
                  <span className="text-[9px] uppercase font-bold text-rose-700 block tracking-wider">
                    ⚠️ Deleting
                  </span>
                  <span className="text-base font-black text-rose-800">
                    {Math.max(0, properties.length - tempSafeIds.size)}
                  </span>
                </div>
              </div>

              {/* Search & Bulk Safe Selection Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search properties to safe..."
                    value={modalSearchTerm}
                    onChange={(e) => setModalSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 focus:outline-hidden focus:border-amber-400 bg-zinc-50"
                  />
                  {modalSearchTerm && (
                    <button
                      onClick={() => setModalSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectAllTempSafe(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>Select All as Safe</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAllTempSafe(false)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-bold transition cursor-pointer"
                  >
                    <span>Clear Safe</span>
                  </button>
                </div>
              </div>

              {/* Property Selection List */}
              <div className="border border-zinc-200 rounded-2xl divide-y divide-zinc-100 max-h-60 overflow-y-auto bg-white">
                {(() => {
                  const filteredList = properties.filter((p) => {
                    if (!modalSearchTerm.trim()) return true;
                    const q = modalSearchTerm.toLowerCase();
                    const name = (p.name || p.title || '').toLowerCase();
                    const loc = (p.location || p.address || '').toLowerCase();
                    return name.includes(q) || loc.includes(q);
                  });

                  if (filteredList.length === 0) {
                    return (
                      <div className="p-6 text-center text-xs text-zinc-400">
                        No properties found matching your search.
                      </div>
                    );
                  }

                  return filteredList.map((prop) => {
                    const isSafe = tempSafeIds.has(prop.id);
                    return (
                      <div
                        key={prop.id}
                        onClick={() => handleToggleTempSafe(prop.id)}
                        className={`p-3 flex items-center justify-between gap-2 transition cursor-pointer ${
                          isSafe
                            ? 'bg-emerald-50/60 hover:bg-emerald-50 border-l-4 border-l-emerald-500'
                            : 'hover:bg-zinc-50 border-l-4 border-l-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSafe}
                            onChange={() => handleToggleTempSafe(prop.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-zinc-900 truncate">
                                {prop.name || prop.title}
                              </span>
                              {isSafe ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-0.5">
                                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                                  Safe (Kept)
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  ⚠️ Deleting
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
                              {prop.location || 'Pune'} &bull; {prop.priceFormatted || 'Price on Request'}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTempSafe(prop.id);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                            isSafe
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                          }`}
                        >
                          <ShieldCheck className={`w-3 h-3 ${isSafe ? 'text-white' : 'text-zinc-500'}`} />
                          <span>{isSafe ? 'Safe' : 'Save Property'}</span>
                        </button>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Warning/Confirmation Note */}
              <div className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                tempSafeIds.size > 0 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50/80 border border-rose-200 text-rose-800'
              }`}>
                {tempSafeIds.size > 0 ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Safe Protection Active:</strong> {tempSafeIds.size} properties are marked as Safe and will <u>NOT</u> be deleted. Only the remaining {properties.length - tempSafeIds.size} unprotected properties will be removed.
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Warning:</strong> 0 properties selected as Safe. All {properties.length} properties will be permanently wiped from the database.
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 mt-1">
              <button
                type="button"
                onClick={() => setIsDeleteAllOpen(false)}
                disabled={isDeletingAll}
                className="px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAllProperties}
                disabled={isDeletingAll || properties.length - tempSafeIds.size === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50 ${
                  properties.length - tempSafeIds.size === 0
                    ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                {isDeletingAll ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Unprotected...</span>
                  </>
                ) : properties.length - tempSafeIds.size === 0 ? (
                  <span>All Properties Safe (Nothing to Delete)</span>
                ) : tempSafeIds.size > 0 ? (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      Delete {properties.length - tempSafeIds.size} Unprotected ({tempSafeIds.size} Safe Kept)
                    </span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete All ({properties.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddPropertyModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onAdd={handleAddProperty} 
      />
      
      <ScraperModal
        isOpen={isScraperOpen}
        onClose={() => {
          setIsScraperOpen(false);
          fetchProperties();
        }}
        onImportComplete={(count) => {
          fetchProperties();
          setNotificationMsg(`✓ Successfully imported ${count} properties from URL!`);
          setTimeout(() => setNotificationMsg(null), 4000);
        }}
      />

      <PropertyExcelUploadModal
        isOpen={isExcelOpen}
        onClose={() => setIsExcelOpen(false)}
        onImportComplete={(count) => {
          fetchProperties();
          setNotificationMsg(`✓ Successfully imported ${count} properties from Excel spreadsheet!`);
          setTimeout(() => setNotificationMsg(null), 4000);
        }}
      />

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-20 bg-white border border-zinc-200 rounded-2xl">
          <Building2 className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-700">No properties found</h3>
          <p className="text-xs text-zinc-500 mt-1">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((prop, idx) => (
            <div key={prop.id || idx} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs hover:shadow-md transition group">
              <div className="relative h-48 w-full bg-zinc-100 overflow-hidden">
                {prop.image ? (
                  <Image
                    src={prop.image}
                    alt={prop.name || 'Property'}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-10 h-10 text-zinc-300" />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                  <div className="px-2 py-1 bg-white/90 backdrop-blur-xs rounded-md text-[10px] font-bold text-zinc-900 border border-black/5 shadow-xs">
                    {prop.configuration || prop.pt_name || 'Commercial'}
                  </div>
                  {prop.isSafe && (
                    <div className="px-2 py-1 bg-emerald-600 text-white rounded-md text-[10px] font-black shadow-xs flex items-center gap-1 border border-emerald-400">
                      <ShieldCheck className="w-3 h-3 text-emerald-200" />
                      Safe
                    </div>
                  )}
                </div>
                {prop.status && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-amber-500 text-white rounded-md text-[10px] font-bold shadow-xs">
                    {prop.status}
                  </div>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 line-clamp-1">{prop.name}</h3>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 mt-1">
                    <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span className="truncate">{prop.location}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                    <span className="text-zinc-500 block mb-0.5">Price</span>
                    <span className="font-bold text-zinc-900">{prop.priceFormatted || 'Price on Request'}</span>
                  </div>
                  <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                    <span className="text-zinc-500 block mb-0.5">Configuration</span>
                    <span className="font-bold text-zinc-900 truncate block">
                      {(() => {
                        const val = prop.configuration || prop.bhk || prop.pt_name;
                        if (!val) return 'Commercial';
                        const str = String(val).trim();
                        if (/^\d+(\.\d+)?$/.test(str)) return `${str} BHK`;
                        return str;
                      })()}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-medium px-2 py-1 rounded-md border ${
                      prop.publishStatus === 'Published' 
                        ? 'text-emerald-600 bg-emerald-50 border-emerald-100' 
                        : 'text-amber-600 bg-amber-50 border-amber-100'
                    }`}>
                      {prop.publishStatus === 'Published' ? 'Active on Website' : 'Draft'}
                    </span>
                    <button className="text-[11px] font-bold text-zinc-600 hover:text-zinc-900 flex items-center gap-1 group/btn cursor-pointer">
                      View Specs
                      <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleTogglePropertySafe(prop)}
                      title={prop.isSafe ? 'Property is Safe (Protected). Click to remove Safe' : 'Mark as Safe (protect from delete all)'}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1 border ${
                        prop.isSafe
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-zinc-200'
                      }`}
                    >
                      <ShieldCheck className={`w-3.5 h-3.5 ${prop.isSafe ? 'text-emerald-600' : 'text-zinc-400'}`} />
                      <span>{prop.isSafe ? 'Safe' : 'Make Safe'}</span>
                    </button>
                    <button 
                      onClick={() => handleTogglePublish(prop)}
                      className={`flex-1 min-w-[100px] py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                        prop.publishStatus === 'Published'
                          ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border-zinc-200'
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200'
                      }`}
                    >
                      {prop.publishStatus === 'Published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button 
                      onClick={() => {
                        setEditingProperty(prop);
                        setIsEditOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center justify-center"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteProperty(prop)}
                      className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center justify-center"
                      title={prop.isSafe ? 'Property is Safe and protected from deletion' : 'Delete property'}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Property Modal */}
      <EditPropertyModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingProperty(null);
        }}
        onSave={handleEditPropertySubmit}
        property={editingProperty}
        availableLocations={locationsList}
        availablePropertyTypes={propertyTypesList}
      />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Save,
  CheckCircle2,
  ExternalLink,
  Video,
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
  X,
  Volume2,
  VolumeX,
  AlertTriangle,
  Settings,
  Phone,
  MessageSquare
} from 'lucide-react';
import {
  PremiumAdItem,
  PremiumAdsConfig,
  DEFAULT_PREMIUM_CONFIG
} from '@/lib/premium-ads-constants';

interface PremiumAdsManagerProps {
  showToast: (msg: string) => void;
}

export function PremiumAdsManager({ showToast }: PremiumAdsManagerProps) {
  const [config, setConfig] = useState<PremiumAdsConfig>(DEFAULT_PREMIUM_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<PremiumAdItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [previewAd, setPreviewAd] = useState<PremiumAdItem | null>(null);
  const [previewMuted, setPreviewMuted] = useState(true);

  // Strip Settings Accordion
  const [showSettings, setShowSettings] = useState(false);

  // Fetch live ads configuration
  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/premium-ads?admin=true');
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
      } else {
        setConfig(DEFAULT_PREMIUM_CONFIG);
      }
    } catch (err) {
      console.error('Failed to fetch premium ads:', err);
      setConfig(DEFAULT_PREMIUM_CONFIG);
      showToast('⚠️ Network error loading ads. Displaying defaults.');
    } finally {
      setLoading(false);
      setHasUnsavedChanges(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  // Save changes to backend
  const handleSaveAll = async (overrideConfig?: PremiumAdsConfig) => {
    setSaving(true);
    const payload = overrideConfig || config;
    try {
      const res = await fetch('/api/premium-ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: payload })
      });
      const data = await res.json();
      if (data.success) {
        showToast('✓ Premium Ads configuration saved successfully!');
        setConfig(data.config);
        setHasUnsavedChanges(false);
      } else {
        showToast(`❌ Error: ${data.error || 'Failed to save'}`);
      }
    } catch (err: any) {
      showToast(`❌ Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Toggle active / hidden status
  const handleToggleActive = (id: string) => {
    const nextAds = config.ads.map((ad) =>
      ad.id === id ? { ...ad, isActive: !ad.isActive } : ad
    );
    const updated = { ...config, ads: nextAds };
    setConfig(updated);
    setHasUnsavedChanges(true);
    const target = nextAds.find((a) => a.id === id);
    showToast(target?.isActive ? `✓ "${target.name}" is now Live` : `👁️ "${target?.name}" is now Hidden`);
  };

  // Reorder items
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= config.ads.length) return;

    const newAds = [...config.ads];
    const temp = newAds[index];
    newAds[index] = newAds[targetIdx];
    newAds[targetIdx] = temp;

    // Recalculate sortOrder
    newAds.forEach((ad, idx) => {
      ad.sortOrder = idx + 1;
    });

    setConfig({ ...config, ads: newAds });
    setHasUnsavedChanges(true);
  };

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingAd({
      id: `client-${Date.now()}`,
      name: '',
      category: '',
      tagline: '',
      description: '',
      badge: 'Sponsored',
      image: '',
      videoUrl: '',
      ctaText: 'Connect Now',
      ctaMessage: 'Hello, I am interested in this offering.',
      linkUrl: '',
      isActive: true,
      sortOrder: config.ads.length + 1
    });
    setModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (ad: PremiumAdItem) => {
    setEditingAd({ ...ad });
    setModalOpen(true);
  };

  // Save Ad from Modal
  const handleSaveModalAd = (ad: PremiumAdItem) => {
    if (!ad.name.trim()) {
      showToast('⚠️ Client / Ad name is required.');
      return;
    }

    const existingIdx = config.ads.findIndex((a) => a.id === ad.id);
    let nextAds: PremiumAdItem[];
    if (existingIdx >= 0) {
      nextAds = [...config.ads];
      nextAds[existingIdx] = ad;
    } else {
      nextAds = [...config.ads, ad];
    }

    const updated = { ...config, ads: nextAds };
    setConfig(updated);
    setModalOpen(false);
    setEditingAd(null);
    setHasUnsavedChanges(true);
    showToast(`✓ Saved "${ad.name}". Remember to click "Save Live Changes".`);
  };

  // Delete Ad
  const handleDeleteAd = (id: string) => {
    const nextAds = config.ads.filter((a) => a.id !== id);
    nextAds.forEach((a, idx) => {
      a.sortOrder = idx + 1;
    });
    const updated = { ...config, ads: nextAds };
    setConfig(updated);
    setDeleteConfirmId(null);
    setHasUnsavedChanges(true);
    showToast('✓ Client Ad deleted.');
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    setConfig(DEFAULT_PREMIUM_CONFIG);
    setResetConfirmOpen(false);
    setHasUnsavedChanges(true);
    showToast('✓ Reset to standard defaults. Click "Save Live Changes" to confirm.');
  };

  const activeAdsCount = config.ads.filter((a) => a.isActive !== false).length;
  const hiddenAdsCount = config.ads.length - activeAdsCount;
  const videoAdsCount = config.ads.filter((a) => Boolean(a.videoUrl)).length;

  return (
    <div className="space-y-6">
      {/* ================= PAGE HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
              VIP Client Showcase
            </span>
            <span className="text-xs text-zinc-400 font-bold">• Floating Sticky Strip</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
            Premium Clients &amp; Ads Strip
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Fully control all floating circular ads, luxury brand campaigns, promotional videos, and WhatsApp conversion leads.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              showSettings ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-zinc-200'
            }`}
            title="Configure strip titles and contact info"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Strip Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-rose-50 text-zinc-700 hover:text-rose-700 border border-zinc-200 hover:border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
            title="Restore default pre-seeded ads"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Client Ad</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveAll()}
            disabled={saving || !hasUnsavedChanges}
            className={`px-4 py-2 rounded-xl text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes *' : 'Saved'}</span>
          </button>
        </div>
      </div>

      {/* ================= METRICS OVERVIEW BAR ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Total Ads</span>
          <span className="text-2xl font-black text-zinc-900 mt-1 block">{config.ads.length}</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-2xs bg-emerald-50/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Live on Site</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{activeAdsCount}</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Hidden Drafts</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{hiddenAdsCount}</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Video Spotlights</span>
          <span className="text-2xl font-black text-indigo-600 mt-1 block">{videoAdsCount}</span>
        </div>
      </div>

      {/* ================= LIVE STRIP PREVIEW ================= */}
      <div className="bg-zinc-950 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-amber-400">
              Interactive Live Strip Preview (Public Viewport)
            </h3>
          </div>
          <span className="text-[10px] text-zinc-400">Click any ad to test the video/photo modal</span>
        </div>

        {/* Floating Simulator Container */}
        <div className="py-4 flex items-center justify-center bg-zinc-900/60 rounded-2xl border border-zinc-800/80 min-h-[90px] overflow-x-auto">
          <div className="relative bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/90 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] p-2 sm:p-2.5 flex items-center gap-2 sm:gap-2.5">
            {/* Crown Logo Badge */}
            <div className="flex items-center justify-center shrink-0 pr-2 border-r border-zinc-800/80">
              <div
                className="relative px-2 py-1 rounded-xl bg-gradient-to-b from-[#2e050f] via-[#420816] to-[#1f030a] border border-amber-400/70 shadow-[0_0_16px_rgba(245,158,11,0.35)] flex items-center justify-center shrink-0"
                title={config.crownTitle}
              >
                <div className="relative w-14 h-7 sm:w-16 sm:h-8 shrink-0">
                  <Image
                    src={config.crownImage || '/premium-crown.png'}
                    alt="Premium Crown"
                    fill
                    unoptimized
                    className="object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
                  />
                </div>
              </div>
            </div>

            {/* Circles Preview Rail */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 px-0.5">
              {config.ads
                .filter((a) => a.isActive !== false)
                .map((ad) => (
                  <button
                    key={ad.id}
                    type="button"
                    onClick={() => {
                      setPreviewAd(ad);
                      setPreviewMuted(true);
                    }}
                    className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer w-[48px] sm:w-[56px]"
                    title={`Preview ${ad.name}`}
                  >
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 shadow-md group-hover:scale-105 transition-transform duration-200">
                      <div className="w-full h-full rounded-full overflow-hidden relative bg-black">
                        <Image
                          src={ad.image || '/opus-thumb.jpg'}
                          alt={ad.name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-zinc-200 group-hover:text-amber-400 truncate max-w-[56px] text-center">
                      {ad.name}
                    </span>
                  </button>
                ))}

              {/* Promote button */}
              <div className="flex flex-col items-center gap-1 shrink-0 w-[48px] sm:w-[56px]">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-dashed border-zinc-700 bg-zinc-900/80 text-zinc-400 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-zinc-500 truncate max-w-[50px] text-center">
                  Promote
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= OPTIONAL STRIP SETTINGS CARD ================= */}
      {showSettings && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-zinc-200 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base text-zinc-950 flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-600" />
              <span>Global Strip Configuration</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="text-xs text-zinc-400 hover:text-zinc-600"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Crown Tooltip / Title</label>
              <input
                type="text"
                value={config.crownTitle}
                onChange={(e) => {
                  setConfig({ ...config, crownTitle: e.target.value });
                  setHasUnsavedChanges(true);
                }}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 font-semibold focus:outline-none focus:border-amber-500"
                placeholder="e.g. Premium Collection"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">Crown Image URL / Asset</label>
              <input
                type="text"
                value={config.crownImage}
                onChange={(e) => {
                  setConfig({ ...config, crownImage: e.target.value });
                  setHasUnsavedChanges(true);
                }}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 font-semibold focus:outline-none focus:border-amber-500"
                placeholder="e.g. /premium-crown.png"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">Promote WhatsApp Number (with Country Code)</label>
              <input
                type="text"
                value={config.promoteWhatsAppNumber}
                onChange={(e) => {
                  setConfig({ ...config, promoteWhatsAppNumber: e.target.value });
                  setHasUnsavedChanges(true);
                }}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 font-semibold focus:outline-none focus:border-amber-500"
                placeholder="e.g. 919373020701"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">Default Promote Enquiry Message</label>
              <input
                type="text"
                value={config.promoteMessage}
                onChange={(e) => {
                  setConfig({ ...config, promoteMessage: e.target.value });
                  setHasUnsavedChanges(true);
                }}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 font-semibold focus:outline-none focus:border-amber-500"
                placeholder="e.g. Hello ANV Realty team, I would like to feature our company ad..."
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= CLIENT ADS LIST / TABLE ================= */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm sm:text-base text-zinc-950">
              Manage Client Ads &amp; Display Order
            </h3>
            <span className="text-xs text-zinc-400">({config.ads.length} total)</span>
          </div>
          <span className="text-xs text-zinc-500 font-medium hidden sm:inline">
            Drag or use arrows to rearrange the order
          </span>
        </div>

        {config.ads.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 space-y-3">
            <AlertTriangle className="w-10 h-10 mx-auto text-amber-500" />
            <p className="font-bold text-zinc-700">No client ads found.</p>
            <button
              onClick={handleResetDefaults}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold"
            >
              Restore Standard Default Ads
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 overflow-x-auto">
            {config.ads.map((ad, index) => {
              const isLive = ad.isActive !== false;
              return (
                <div
                  key={ad.id}
                  className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 transition hover:bg-zinc-50/80 ${
                    !isLive ? 'bg-zinc-50/50 opacity-70' : ''
                  }`}
                >
                  {/* Left Controls: Move Up/Down + Position Number */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-5 text-center font-mono text-xs font-bold text-zinc-400">
                      #{index + 1}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-zinc-200 rounded text-zinc-600 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                        title="Move Left / Earlier"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === config.ads.length - 1}
                        className="p-1 hover:bg-zinc-200 rounded text-zinc-600 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                        title="Move Right / Later"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail Avatar */}
                  <div className="relative w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 to-amber-300 shrink-0 shadow-2xs">
                    <div className="w-full h-full rounded-full overflow-hidden relative bg-zinc-900">
                      <Image
                        src={ad.image || '/opus-thumb.jpg'}
                        alt={ad.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-xs sm:text-sm text-zinc-950 truncate">
                        {ad.name}
                      </h4>
                      {ad.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                          {ad.badge}
                        </span>
                      )}
                      {ad.videoUrl ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Video className="w-2.5 h-2.5" />
                          <span>Video MP4</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
                          <ImageIcon className="w-2.5 h-2.5" />
                          <span>Image</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5 font-medium">
                      {ad.category} &bull; {ad.tagline}
                    </p>
                  </div>

                  {/* Status Indicator */}
                  <div className="hidden md:flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(ad.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isLive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                          : 'bg-zinc-100 text-zinc-500 border border-zinc-200 hover:bg-zinc-200'
                      }`}
                      title={isLive ? 'Click to Hide from site' : 'Click to Unhide on site'}
                    >
                      {isLive ? <Eye className="w-3 h-3 text-emerald-600" /> : <EyeOff className="w-3 h-3 text-zinc-400" />}
                      <span>{isLive ? 'Live on Site' : 'Hidden Draft'}</span>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    {/* Quick eye icon on mobile */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(ad.id)}
                      className="md:hidden p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
                      title={isLive ? 'Hide' : 'Unhide'}
                    >
                      {isLive ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-zinc-400" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPreviewAd(ad);
                        setPreviewMuted(true);
                      }}
                      className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
                      title="Preview Customer Modal"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(ad)}
                      className="p-2 rounded-xl bg-zinc-100 hover:bg-amber-100 text-zinc-700 hover:text-amber-900 transition cursor-pointer"
                      title="Edit Ad Details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(ad.id)}
                      className="p-2 rounded-xl bg-zinc-100 hover:bg-rose-100 text-zinc-500 hover:text-rose-700 transition cursor-pointer"
                      title="Delete Ad"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= ADD / EDIT MODAL ================= */}
      {modalOpen && editingAd && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-zinc-200 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-950">
                    {editingAd.name ? `Edit: ${editingAd.name}` : 'Add New Premium Client Ad'}
                  </h3>
                  <p className="text-xs text-zinc-400">Configure appearance, video, and lead CTA</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-700 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Scroll Body */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveModalAd(editingAd);
              }}
              className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Client / Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={editingAd.name}
                    onChange={(e) => setEditingAd({ ...editingAd, name: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 font-semibold focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Opus, AI Digital, Home Loan"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Category / Domain *</label>
                  <input
                    type="text"
                    required
                    value={editingAd.category}
                    onChange={(e) => setEditingAd({ ...editingAd, category: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 font-semibold focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Signature Luxury Living, Banking"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">Tagline / Subheading *</label>
                <input
                  type="text"
                  required
                  value={editingAd.tagline}
                  onChange={(e) => setEditingAd({ ...editingAd, tagline: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 font-semibold focus:outline-none focus:border-amber-500"
                  placeholder="e.g. 8.40% ROI • 48-Hour Instant In-Principle Sanction"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">Detailed Description *</label>
                <textarea
                  rows={3}
                  required
                  value={editingAd.description}
                  onChange={(e) => setEditingAd({ ...editingAd, description: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 font-normal leading-relaxed focus:outline-none focus:border-amber-500"
                  placeholder="Elaborate on the service, architecture, luxury specifications, or advisory benefits shown to visitors."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Circle Thumbnail Image URL *</label>
                  <input
                    type="text"
                    required
                    value={editingAd.image}
                    onChange={(e) => setEditingAd({ ...editingAd, image: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 font-mono text-[11px] focus:outline-none focus:border-amber-500"
                    placeholder="e.g. /opus-thumb.jpg or Unsplash URL"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Promotional Video URL (Optional MP4)</label>
                  <input
                    type="text"
                    value={editingAd.videoUrl || ''}
                    onChange={(e) => setEditingAd({ ...editingAd, videoUrl: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 font-mono text-[11px] focus:outline-none focus:border-amber-500"
                    placeholder="e.g. /Opusvideo.mp4 or CDN link"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">CTA Button Text *</label>
                  <input
                    type="text"
                    required
                    value={editingAd.ctaText}
                    onChange={(e) => setEditingAd({ ...editingAd, ctaText: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 font-semibold focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Schedule Exclusive Walkthrough"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={editingAd.badge || ''}
                    onChange={(e) => setEditingAd({ ...editingAd, badge: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 font-semibold focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Sponsored, Official Partner, VIP"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">WhatsApp Pre-filled Message *</label>
                <textarea
                  rows={2}
                  required
                  value={editingAd.ctaMessage}
                  onChange={(e) => setEditingAd({ ...editingAd, ctaMessage: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 font-normal focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Hello ANV Realty advisory, I watched the Opus video ad and would like pricing..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">External Website Link (Optional)</label>
                  <input
                    type="text"
                    value={editingAd.linkUrl || ''}
                    onChange={(e) => setEditingAd({ ...editingAd, linkUrl: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 font-mono text-[11px] focus:outline-none focus:border-amber-500"
                    placeholder="e.g. https://opuspune.com"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingAd.isActive !== false}
                      onChange={(e) => setEditingAd({ ...editingAd, isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                  <span className="font-bold text-zinc-800">
                    {editingAd.isActive !== false ? 'Live on Website' : 'Hidden / Inactive'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold shadow-xs transition cursor-pointer"
                >
                  Save Ad Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteConfirmId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-950">Delete Client Ad?</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Are you sure you want to remove this client from the strip? You can also hide it instead of deleting.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-100 transition cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAd(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-xs transition cursor-pointer text-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= RESET DEFAULTS CONFIRMATION MODAL ================= */}
      {resetConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setResetConfirmOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-950">Restore Standard Ads?</h3>
              <p className="text-xs text-zinc-500 mt-1">
                This will reset the strip to the pre-seeded default ads (Opus, AI Digital, Home Loan, Interiors, Legal Due, Vastu, MNC Lease).
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-100 transition cursor-pointer text-xs"
              >
                Keep Current
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold shadow-xs transition cursor-pointer text-xs"
              >
                Yes, Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PREVIEW CUSTOMER MODAL ================= */}
      {previewAd && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewAd(null)}
        >
          <div
            className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl text-white animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between gap-3 bg-zinc-900/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full overflow-hidden relative shrink-0 border border-amber-500/50">
                  <Image
                    src={previewAd.image || '/opus-thumb.jpg'}
                    alt={previewAd.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-white tracking-tight truncate">
                      {previewAd.name}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500 text-zinc-950">
                      {previewAd.badge || 'Sponsored'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate">{previewAd.category}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewAd(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Media Area */}
            <div className="relative w-full bg-black aspect-video max-h-[50vh] flex items-center justify-center overflow-hidden">
              {previewAd.videoUrl ? (
                <>
                  <video
                    src={previewAd.videoUrl}
                    autoPlay
                    loop
                    muted={previewMuted}
                    playsInline
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewMuted(!previewMuted)}
                    className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-xl bg-black/75 hover:bg-black text-white text-xs font-bold border border-white/20 backdrop-blur-sm flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {previewMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{previewMuted ? 'Unmute' : 'Audio On'}</span>
                  </button>
                </>
              ) : (
                <Image
                  src={previewAd.image || '/opus-thumb.jpg'}
                  alt={previewAd.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              )}
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-3.5 overflow-y-auto">
              <h4 className="text-base font-extrabold text-amber-400 tracking-tight leading-snug">
                {previewAd.tagline}
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                {previewAd.description}
              </p>
            </div>

            {/* Footer CTA */}
            <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between gap-3">
              <span className="text-[11px] text-zinc-500 font-medium">Customer Click Action</span>
              <button
                type="button"
                onClick={() => {
                  const phone = config.promoteWhatsAppNumber || '919373020701';
                  const text = encodeURIComponent(previewAd.ctaMessage);
                  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>{previewAd.ctaText}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

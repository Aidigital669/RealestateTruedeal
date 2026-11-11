'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  Building2,
  FileEdit,
  Layout,
  Upload,
  Search,
  Check,
  Laptop,
  Tablet,
  Smartphone,
  ExternalLink,
  MapPin,
  Layers,
  Loader2,
  Plus,
  Trash2,
  Image as ImageIcon,
  Video,
  ArrowUp,
  Compass,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileText,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react';
import { HomepageSectionItem } from './types';
import { CATEGORY_OPTIONS } from '@/lib/categories-data';
import { BusinessPurposesMultiSelect } from './BusinessPurposesMultiSelect';
import { PriceInputWithSuggestions } from './PriceInputWithSuggestions';
import { CategoryTagSelector } from './CategoryTagSelector';
import {
  parseDossierData,
  embedDossierData,
  getDefaultHighlights,
  getDefaultConnectivity,
  PRESET_AMENITIES
} from '@/lib/dossier-parser';

// ================= EDIT SECTION MODAL =================
export function EditSectionModal({
  section,
  isOpen,
  onClose,
  onSave
}: {
  section: HomepageSectionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: HomepageSectionItem) => void;
}) {
  const [formData, setFormData] = useState<HomepageSectionItem | null>(null);

  useEffect(() => {
    if (section) setFormData({ ...section });
  }, [section]);

  if (!isOpen || !formData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-zinc-200 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <h3 className="font-bold text-zinc-900 text-base">Edit Homepage Section</h3>
            <p className="text-xs text-zinc-500">Configure section title, metadata tag and visibility</p>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Section Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-700 mb-1">Badge Tag</label>
              <input
                type="text"
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-400 uppercase font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-zinc-700 mb-1">Tag Styling</label>
              <select
                value={formData.tagVariant || 'default'}
                onChange={(e) => setFormData({ ...formData, tagVariant: e.target.value as any })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-400"
              >
                <option value="default">Default Neutral</option>
                <option value="amber">Amber / Pinned</option>
                <option value="blue">Blue / Locations</option>
                <option value="emerald">Emerald / Active</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-zinc-700 mb-1">Subtitle / Headline Summary</label>
            <textarea
              rows={3}
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="font-medium text-zinc-700">Display on Public Website</span>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formData.isActive ? 'bg-zinc-900' : 'bg-zinc-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  formData.isActive ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(formData);
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-black hover:bg-zinc-800 rounded-lg transition shadow-xs"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ================= ADD PROPERTY MODAL =================
export function AddPropertyModal({
  isOpen,
  onClose,
  onAdd,
  availableLocations = [],
  availablePropertyTypes = []
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (property: any) => void;
  availableLocations?: { name: string }[];
  availablePropertyTypes?: { name: string }[];
}) {
  const [name, setName] = useState('');
  const [developer, setDeveloper] = useState('ANV Signature Collection');
  const [location, setLocation] = useState('Baner, Pune');
  const [price, setPrice] = useState('₹1.85 Cr');
  const [bhk, setBhk] = useState('Office Space');
  const [customConfig, setCustomConfig] = useState('');
  const [isCustomConfig, setIsCustomConfig] = useState(false);
  const [sqft, setSqft] = useState('1,250 Sq.Ft.');
  const [status, setStatus] = useState('Under-Construction');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>(['']);
  const [videoUrl, setVideoUrl] = useState('');
  const [listingType, setListingType] = useState<'Buy' | 'Rent'>('Buy');
  const [publishOnWebsite, setPublishOnWebsite] = useState(true);
  const [selectedPurposes, setSelectedPurposes] = useState<number[]>([]);
  const [hideName, setHideName] = useState(false);
  const [hidePrice, setHidePrice] = useState(false);

  if (!isOpen) return null;

  const handleAddImageSlot = () => setImages((prev) => [...prev, '']);
  const handleRemoveImageSlot = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [''];
    });
  };
  const handleImageChange = (index: number, val: string) => {
    setImages((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };
  const handleMakeCover = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const item = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [item, ...rest];
    });
  };
  const handleFileUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      handleImageChange(index, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-zinc-200 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-amber-800" />
            <div>
              <h3 className="font-bold text-zinc-900 text-base">Add Luxury Property / Product</h3>
              <p className="text-[11px] text-zinc-500">Provide real details, multiple gallery photos, and walkthrough video</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs overflow-y-auto pr-1 flex-1">
          {/* Listing Purpose Tab: Buy vs Rent */}
          <div>
            <label className="block font-semibold text-zinc-800 mb-1.5">Listing Purpose / Intent *</label>
            <div className="flex items-center gap-2 p-1.5 bg-zinc-100 rounded-xl border border-zinc-200">
              <button
                type="button"
                onClick={() => setListingType('Buy')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  listingType === 'Buy'
                    ? 'bg-amber-500 text-zinc-950 shadow-sm font-black'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                }`}
              >
                <span>🏠 For Buy / Sale</span>
              </button>
              <button
                type="button"
                onClick={() => setListingType('Rent')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  listingType === 'Rent'
                    ? 'bg-amber-500 text-zinc-950 shadow-sm font-black'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                }`}
              >
                <span>🔑 For Rent / Lease</span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-zinc-800">Property Name *</label>
              <button
                type="button"
                onClick={() => setHideName(!hideName)}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold transition border cursor-pointer ${
                  hideName
                    ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
                }`}
                title="Toggle hiding property name from public visitors"
              >
                {hideName ? <EyeOff className="w-3.5 h-3.5 text-amber-700" /> : <Eye className="w-3.5 h-3.5 text-zinc-500" />}
                <span>{hideName ? 'Name Hidden (Confidential)' : 'Hide Name'}</span>
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. The Lumina Sky Penthouse / Commercial Office Suite"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-400"
            />
            {hideName && (
              <p className="mt-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                🔒 Public customers will see <strong>"Confidential Property"</strong> instead of the actual name.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-700 mb-1">Developer</label>
              <input
                type="text"
                value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="block font-medium text-zinc-700 mb-1">
                Location / Locality (Pick or Type New)
              </label>
              <input
                type="text"
                list="admin-available-locations"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Koregaon Park, Baner, Viman Nagar"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-400"
              />
              <datalist id="admin-available-locations">
                {availableLocations.map((l, i) => (
                  <option key={i} value={l.name} />
                ))}
                <option value="Koregaon Park, Pune" />
                <option value="Baner, Pune" />
                <option value="Balewadi, Pune" />
                <option value="Kalyani Nagar, Pune" />
                <option value="Bavdhan, Pune" />
                <option value="Mahalunge, Pune" />
                <option value="Shivajinagar, Pune" />
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-zinc-800">
                  {listingType === 'Rent' ? 'Rent (₹ / Month) *' : 'Sale Price (₹) *'}
                </label>
                <button
                  type="button"
                  onClick={() => setHidePrice(!hidePrice)}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold transition border cursor-pointer ${
                    hidePrice
                      ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                      : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
                  }`}
                  title="Toggle hiding price from public visitors"
                >
                  {hidePrice ? <EyeOff className="w-3.5 h-3.5 text-amber-700" /> : <Eye className="w-3.5 h-3.5 text-zinc-500" />}
                  <span>{hidePrice ? 'Price Hidden' : 'Hide Price'}</span>
                </button>
              </div>
              <PriceInputWithSuggestions
                value={price}
                onChange={setPrice}
                listingType={listingType}
                placeholder={listingType === 'Rent' ? 'e.g. ₹45,000 / month' : 'e.g. ₹1.85 Cr'}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-400"
              />
              {hidePrice && (
                <p className="mt-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                  🔒 Customers will see <strong>"Price on Request"</strong> on website.
                </p>
              )}
            </div>
            <div>
              <label className="block font-semibold text-zinc-800 mb-1">
                Category / Configuration *
              </label>
              <CategoryTagSelector
                value={bhk}
                placeholder="-- Choose Category / Configuration --"
                onChange={(val) => {
                  setBhk(val);
                }}
                onTagSelected={(tag) => {
                  if (tag === 'PreLaunch') {
                    setStatus('Pre-Launch');
                  } else if (tag === 'Preleased') {
                    setStatus('Ready to Move');
                  } else if (tag === 'New') {
                    setStatus('Ready to Move');
                  }
                }}
              />
            </div>
            <div>
              <label className="block font-medium text-zinc-700 mb-1">Carpet Area</label>
              <input
                type="text"
                value={sqft}
                onChange={(e) => setSqft(e.target.value)}
                placeholder="e.g. 1,250 Sq.Ft."
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-zinc-700 mb-1">Possession Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-400 bg-white"
            >
              <option value="Ready to Move">Ready to Move</option>
              <option value="Under-Construction">Under-Construction</option>
              <option value="Newly Launched">Newly Launched</option>
              <option value="Pre-Launch">Pre-Launch</option>
              <option value="Draft">Draft (Unpublished)</option>
            </select>
          </div>

          {/* Suitable Business Purposes (Multi-Select) */}
          <BusinessPurposesMultiSelect
            selectedIds={selectedPurposes}
            onChange={setSelectedPurposes}
          />

          {/* Multiple Photos Manager */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-zinc-800">Property Photos ({images.filter(Boolean).length} added)</span>
              </div>
              <button
                type="button"
                onClick={handleAddImageSlot}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Another Photo</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-500">
              Add multiple photos (Photo #1 is the primary cover image). Only uploaded photos will be displayed on the property page.
            </p>

            {/* Thumbnail Preview Strip */}
            {images.filter(Boolean).length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 bg-zinc-50 rounded-xl border border-zinc-200">
                {images.map((url, idx) => {
                  if (!url) return null;
                  return (
                    <div key={idx} className="relative shrink-0 w-16 h-12 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
                      <img src={url} alt={`Photo #${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-[8px] font-bold text-white px-1 py-0.2 rounded">
                        {idx === 0 ? 'Cover' : `#${idx + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Image Inputs */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {images.map((url, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 border border-zinc-200">
                  <div className="w-12 h-10 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-200 shrink-0 flex items-center justify-center relative">
                    {url ? (
                      <img src={url} alt={`#${index + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-zinc-400" />
                    )}
                    <span className="absolute top-0.5 left-0.5 bg-zinc-900/80 text-[8px] font-bold text-white px-1 rounded">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="relative flex-1 flex items-center">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      placeholder={index === 0 ? "Cover Photo URL / Upload (https://...)" : `Photo #${index + 1} URL / Upload (https://...)`}
                      className="w-full pl-3 pr-8 py-1.5 text-xs border border-zinc-200 bg-white rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                    <label className="absolute right-1 cursor-pointer p-1 text-zinc-400 hover:text-amber-600 rounded" title="Upload Local Photo">
                      <Upload className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(index, file);
                        }}
                      />
                    </label>
                  </div>

                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMakeCover(index)}
                      className="p-1.5 text-zinc-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition shrink-0 cursor-pointer"
                      title="Set as Cover Photo"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveImageSlot(index)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0 cursor-pointer"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 1 Video Walkthrough */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Video className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-zinc-800">Video Walkthrough (1 Video)</span>
              </div>
              {videoUrl && (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Video Attached
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500">
              Paste a YouTube walkthrough link, Vimeo, or direct MP4 URL. If empty, no video tour button will appear.
            </p>

            <div className="relative flex items-center">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="e.g. https://www.youtube.com/watch?v=... or https://.../walkthrough.mp4"
                className="w-full pl-3 pr-8 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-400 bg-white"
              />
              {videoUrl && (
                <button
                  type="button"
                  onClick={() => setVideoUrl('')}
                  className="absolute right-2 text-zinc-400 hover:text-rose-600"
                  title="Clear video"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block font-medium text-zinc-700 mb-1">Description Overview</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Exclusive luxury property curated by Anv Reealty..."
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-400 resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="font-medium text-zinc-700">Publish immediately on website</span>
            <button
              type="button"
              onClick={() => setPublishOnWebsite(!publishOnWebsite)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                publishOnWebsite ? 'bg-zinc-900' : 'bg-zinc-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  publishOnWebsite ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!name.trim()) return alert('Please enter property name');
              const cleanImages = images.map((u) => u.trim()).filter(Boolean);
              const finalConfig = (isCustomConfig ? customConfig : bhk).trim() || 'Commercial';
              onAdd({ 
                title: name, 
                name, 
                hideName,
                hidePrice,
                developer, 
                location, 
                price, 
                bhk: finalConfig, 
                configuration: finalConfig,
                propertyType: finalConfig,
                sqft, 
                status, 
                listingType: listingType === 'Rent' ? 'Rent' : 'Sale',
                businessPurposeIds: selectedPurposes,
                businessPurposes: selectedPurposes,
                description, 
                imageUrl: cleanImages[0] || '',
                image: cleanImages[0] || '',
                images: cleanImages,
                videoUrl: videoUrl.trim(),
                publishStatus: publishOnWebsite ? 'Published' : 'Draft' 
              });
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-black hover:bg-zinc-800 rounded-lg transition shadow-xs cursor-pointer"
          >
            {publishOnWebsite ? 'Publish Property' : 'Save as Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ================= EDIT PROPERTY MODAL =================
export function EditPropertyModal({
  isOpen,
  onClose,
  onSave,
  property,
  availableLocations = [],
  availablePropertyTypes = []
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string | number, data: any) => Promise<void> | void;
  property: any;
  availableLocations?: { name: string }[];
  availablePropertyTypes?: { name: string }[];
}) {
  const [name, setName] = useState('');
  const [developer, setDeveloper] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [bhk, setBhk] = useState('');
  const [customConfig, setCustomConfig] = useState('');
  const [isCustomConfig, setIsCustomConfig] = useState(false);
  const [sqft, setSqft] = useState('');
  const [status, setStatus] = useState('Ready to Move');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>(['']);
  const [videoUrl, setVideoUrl] = useState('');
  const [listingType, setListingType] = useState<'Buy' | 'Rent'>('Buy');
  const [selectedPurposes, setSelectedPurposes] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Screenshot Dossier & Full Specifications States
  const [activeTab, setActiveTab] = useState<'overview' | 'dossier' | 'amenities' | 'media'>('overview');
  const [highlights, setHighlights] = useState<string[]>([]);
  const [newHighlight, setNewHighlight] = useState('');
  const [connectivity, setConnectivity] = useState<string[]>([]);
  const [newConnectivity, setNewConnectivity] = useState('');
  const [amenitiesList, setAmenitiesList] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState('');
  const [reraNumber, setReraNumber] = useState('');
  const [rpsStatus, setRpsStatus] = useState('100% Clear Title • Zero Encumbrances');
  const [possession, setPossession] = useState('Ready to Move');
  const [hideName, setHideName] = useState(false);
  const [hidePrice, setHidePrice] = useState(false);

  // Update states when property changes
  React.useEffect(() => {
    if (property) {
      setName(property.name || property.title || '');
      setDeveloper(property.developer || '');
      setLocation(property.location || property.address || '');
      setPrice(property.priceFormatted || (property.price ? String(property.price) : ''));
      
      const bStr = String(property.configuration || property.bhk || property.pt_name || '').trim();
      const isKnown = CATEGORY_OPTIONS.some((c) => c.toLowerCase() === bStr.toLowerCase()) ||
        ['1 BHK', '2 BHK', '3 BHK', '4 BHK', '4.5+ BHK Penthouse', 'Sky Villa'].some((t) => t.toLowerCase() === bStr.toLowerCase());
      
      if (bStr && !isKnown) {
        setIsCustomConfig(true);
        setCustomConfig(bStr);
        setBhk(bStr);
      } else {
        setIsCustomConfig(false);
        setCustomConfig('');
        setBhk(bStr || 'Office Space');
      }
      
      const sStr = String(property.sqft || property.carpetArea || '');
      setSqft(sStr.toLowerCase().includes('sq') ? sStr : (sStr ? `${sStr} Sq.Ft.` : ''));
      
      setStatus(property.status || property.publishStatus || 'Ready to Move');
      
      // Parse dossier metadata
      const { cleanDescription, dossier } = parseDossierData(property.description || '');
      setDescription(cleanDescription || property.description || '');
      setHideName(Boolean(property.hideName ?? dossier.hideName));
      setHidePrice(Boolean(property.hidePrice ?? dossier.hidePrice));

      // Highlights
      let initHl: string[] = [];
      if (Array.isArray(property.highlights) && property.highlights.length > 0) {
        initHl = property.highlights;
      } else if (Array.isArray(dossier.highlights) && dossier.highlights.length > 0) {
        initHl = dossier.highlights;
      } else if (Array.isArray(property.specs) && property.specs.length > 0) {
        initHl = property.specs
          .filter((s: any) => !s.key.toLowerCase().includes('rera') && !s.key.toLowerCase().includes('road') && !s.key.toLowerCase().includes('area'))
          .map((s: any) => `${s.key}: ${s.value}`);
      }
      if (initHl.length === 0) {
        const isComm = (property.bhk || '').toLowerCase().includes('office') || (property.bhk || '').toLowerCase().includes('shop') || (property.bhk || '').toLowerCase().includes('commercial');
        initHl = getDefaultHighlights(isComm, property.bhk || '');
      }
      setHighlights(initHl);

      // Connectivity
      let initConn: string[] = [];
      if (Array.isArray(property.connectivity) && property.connectivity.length > 0) {
        initConn = property.connectivity;
      } else if (Array.isArray(dossier.connectivity) && dossier.connectivity.length > 0) {
        initConn = dossier.connectivity;
      } else if (Array.isArray(property.specs) && property.specs.length > 0) {
        const road = property.specs.find((s: any) => s.key.toLowerCase().includes('road') || s.key.toLowerCase().includes('connectivity'));
        if (road) initConn.push(`Road Connectivity: ${road.value}`);
      }
      if (initConn.length === 0) {
        initConn = getDefaultConnectivity(property.location || '', property.locality || '');
      }
      setConnectivity(initConn);

      // Amenities List
      let initAm: string[] = [];
      if (Array.isArray(property.amenitiesList) && property.amenitiesList.length > 0) {
        initAm = property.amenitiesList.map((a: any) => typeof a === 'string' ? a : a.title || '');
      } else if (Array.isArray(dossier.amenitiesList) && dossier.amenitiesList.length > 0) {
        initAm = dossier.amenitiesList.map((a: any) => typeof a === 'string' ? a : a.title || '');
      } else {
        initAm = PRESET_AMENITIES.slice(0, 8);
      }
      setAmenitiesList(initAm.filter(Boolean));

      // RERA
      setReraNumber(property.reraNumber || dossier.reraNumber || (property.specs?.find((s: any) => s.key.toLowerCase().includes('rera'))?.value) || 'PRM/PUN/RERA/2026/0491');

      // Title & Possession
      setRpsStatus(property.rpsStatus || dossier.rpsStatus || '100% Clear Title • Zero Encumbrances');
      setPossession(property.possession || dossier.possession || property.status || 'Ready to Move');

      // Extract existing images
      let propImages: string[] = [];
      if (Array.isArray(property.images) && property.images.length > 0) {
        propImages = property.images
          .map((img: any) => (typeof img === 'string' ? img : img?.url || ''))
          .filter(Boolean);
      }
      if (propImages.length === 0 && Array.isArray(property.all_images) && property.all_images.length > 0) {
        propImages = property.all_images.filter(Boolean);
      }
      if (propImages.length === 0) {
        const single = property.image || property.imageUrl;
        if (single) propImages = [single];
      }
      setImages(propImages.length > 0 ? propImages : ['']);

      // Extract existing videoUrl
      setVideoUrl(property.videoUrl || property.video || '');

      // Extract existing listingType (Buy vs Rent)
      const rawLt = String(property.listingType || property.listing_type || property.type || '').toLowerCase();
      if (rawLt.includes('rent') || rawLt.includes('lease')) {
        setListingType('Rent');
      } else {
        setListingType('Buy');
      }

      // Extract existing business purposes
      const existingPIds = Array.isArray(property.businessPurposeIds)
        ? property.businessPurposeIds
        : (Array.isArray(property.businessPurposes) ? property.businessPurposes.map((bp: any) => bp.id || bp) : []);
      setSelectedPurposes(existingPIds);
    }
  }, [property]);

  if (!isOpen || !property) return null;

  const handleAddImageSlot = () => setImages((prev) => [...prev, '']);
  const handleRemoveImageSlot = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [''];
    });
  };
  const handleImageChange = (index: number, val: string) => {
    setImages((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };
  const handleMakeCover = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const item = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [item, ...rest];
    });
  };
  const handleFileUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      handleImageChange(index, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddHighlight = () => {
    if (newHighlight.trim()) {
      setHighlights((prev) => [...prev, newHighlight.trim()]);
      setNewHighlight('');
    }
  };

  const handleRemoveHighlight = (idx: number) => {
    setHighlights((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateHighlight = (idx: number, val: string) => {
    setHighlights((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleAddConnectivity = () => {
    if (newConnectivity.trim()) {
      setConnectivity((prev) => [...prev, newConnectivity.trim()]);
      setNewConnectivity('');
    }
  };

  const handleRemoveConnectivity = (idx: number) => {
    setConnectivity((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateConnectivity = (idx: number, val: string) => {
    setConnectivity((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleAddAmenity = (name: string) => {
    const clean = name.trim();
    if (clean && !amenitiesList.includes(clean)) {
      setAmenitiesList((prev) => [...prev, clean]);
      setNewAmenity('');
    }
  };

  const handleRemoveAmenity = (name: string) => {
    setAmenitiesList((prev) => prev.filter((a) => a !== name));
  };

  const handleResetHighlights = () => {
    const isComm = (bhk || '').toLowerCase().includes('office') || (bhk || '').toLowerCase().includes('shop') || (bhk || '').toLowerCase().includes('commercial');
    setHighlights(getDefaultHighlights(isComm, bhk));
  };

  const handleResetConnectivity = () => {
    setConnectivity(getDefaultConnectivity(location, ''));
  };

  const handleSave = async () => {
    if (!name.trim()) return alert('Please enter property name');
    setIsSaving(true);
    try {
      const cleanImages = images.map((u) => u.trim()).filter(Boolean);
      const cleanVideo = videoUrl.trim();
      const finalConfig = (isCustomConfig ? customConfig : bhk).trim() || 'Commercial';

      const finalDescription = embedDossierData(description.trim(), {
        highlights: highlights.filter(Boolean),
        connectivity: connectivity.filter(Boolean),
        amenitiesList: amenitiesList.filter(Boolean),
        reraNumber: reraNumber.trim(),
        possession: possession.trim(),
        rpsStatus: rpsStatus.trim(),
        hideName: Boolean(hideName),
        hidePrice: Boolean(hidePrice)
      });

      await onSave(property.id, {
        name: name.trim(),
        title: name.trim(),
        hideName: Boolean(hideName),
        hidePrice: Boolean(hidePrice),
        developer: developer.trim(),
        location: location.trim(),
        address: location.trim(),
        price,
        bhk: finalConfig,
        configuration: finalConfig,
        propertyType: finalConfig,
        sqft,
        listingType: listingType === 'Rent' ? 'Rent' : 'Sale',
        status: possession || status,
        possession: possession.trim(),
        publishStatus: status === 'Draft' ? 'Draft' : 'Published',
        businessPurposeIds: selectedPurposes,
        businessPurposes: selectedPurposes,
        description: finalDescription,
        highlights: highlights.filter(Boolean),
        connectivity: connectivity.filter(Boolean),
        amenitiesList: amenitiesList.filter(Boolean),
        reraNumber: reraNumber.trim(),
        rpsStatus: rpsStatus.trim(),
        imageUrl: cleanImages[0] || '',
        image: cleanImages[0] || '',
        images: cleanImages,
        videoUrl: cleanVideo
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 border border-zinc-200 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shadow-2xs">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-950 text-base">Edit Property Listing &amp; Dossier</h3>
              <p className="text-[11px] text-zinc-500">Edit core specifications, architectural highlights, connectivity, and amenities</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isSaving} className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg cursor-pointer transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl border border-zinc-200 shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-zinc-950 shadow-xs font-black'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Overview &amp; Typology</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dossier')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'dossier'
                ? 'bg-white text-zinc-950 shadow-xs font-black'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-600" />
            <span>Executive Dossier</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('amenities')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'amenities'
                ? 'bg-white text-zinc-950 shadow-xs font-black'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Amenities &amp; Purposes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'media'
                ? 'bg-white text-zinc-950 shadow-xs font-black'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
            <span>Media (${images.filter(Boolean).length})</span>
          </button>
        </div>

        {/* Tab 1: Overview & Typology */}
        {activeTab === 'overview' && (
          <div className="space-y-3.5 text-xs overflow-y-auto pr-1 flex-1 animate-in fade-in">
            {/* Listing Purpose Tab: Buy vs Rent */}
            <div>
              <label className="block font-semibold text-zinc-800 mb-1.5">Listing Purpose / Intent *</label>
              <div className="flex items-center gap-2 p-1.5 bg-zinc-100 rounded-xl border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setListingType('Buy')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    listingType === 'Buy'
                      ? 'bg-amber-500 text-zinc-950 shadow-sm font-black'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                  }`}
                >
                  <span>🏠 For Buy / Sale</span>
                </button>
                <button
                  type="button"
                  onClick={() => setListingType('Rent')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    listingType === 'Rent'
                      ? 'bg-amber-500 text-zinc-950 shadow-sm font-black'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                  }`}
                >
                  <span>🔑 For Rent / Lease</span>
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-zinc-800">Property Name / Title *</label>
                <button
                  type="button"
                  onClick={() => setHideName(!hideName)}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold transition border cursor-pointer ${
                    hideName
                      ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                      : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
                  }`}
                  title="Toggle hiding property name from public visitors"
                >
                  {hideName ? <EyeOff className="w-3.5 h-3.5 text-amber-700" /> : <Eye className="w-3.5 h-3.5 text-zinc-500" />}
                  <span>{hideName ? 'Name Hidden (Confidential)' : 'Hide Name'}</span>
                </button>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition"
                placeholder="e.g. Signature Sky Suites"
              />
              {hideName && (
                <p className="mt-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                  🔒 Public customers will see <strong>"Confidential Property"</strong> instead of the actual name.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Developer / Brand</label>
                <input
                  type="text"
                  value={developer}
                  onChange={(e) => setDeveloper(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition"
                  placeholder="e.g. ANV Reealty"
                />
              </div>
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Location / Locality</label>
                <input
                  type="text"
                  list="admin-available-locations-edit"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition"
                  placeholder="e.g. Baner, Pune"
                />
                <datalist id="admin-available-locations-edit">
                  {availableLocations.map((l, i) => (
                    <option key={i} value={l.name} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-zinc-800">
                    {listingType === 'Rent' ? 'Rent (₹ / Month) *' : 'Sale Price (₹) *'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setHidePrice(!hidePrice)}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold transition border cursor-pointer ${
                      hidePrice
                        ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
                    }`}
                    title="Toggle hiding price from public visitors"
                  >
                    {hidePrice ? <EyeOff className="w-3.5 h-3.5 text-amber-700" /> : <Eye className="w-3.5 h-3.5 text-zinc-500" />}
                    <span>{hidePrice ? 'Price Hidden' : 'Hide Price'}</span>
                  </button>
                </div>
                <PriceInputWithSuggestions
                  value={price}
                  onChange={setPrice}
                  listingType={listingType}
                  placeholder={listingType === 'Rent' ? 'e.g. ₹45,000 / month' : 'e.g. ₹1.85 Cr'}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition"
                />
                {hidePrice && (
                  <p className="mt-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                    🔒 Customers will see <strong>"Price on Request"</strong> on website.
                  </p>
                )}
              </div>
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">
                  Category / Configuration *
                </label>
                <CategoryTagSelector
                  value={bhk}
                  placeholder="-- Choose Category / Configuration --"
                  onChange={(val) => {
                    setBhk(val);
                  }}
                  onTagSelected={(tag) => {
                    if (tag === 'PreLaunch') {
                      setStatus('Pre-Launch');
                      setPossession('Pre-Launch');
                    } else if (tag === 'Preleased') {
                      setStatus('Ready to Move');
                      setPossession('Ready to Move');
                    } else if (tag === 'New') {
                      setStatus('Ready to Move');
                      setPossession('Ready to Move');
                    }
                  }}
                />
              </div>
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Carpet Area</label>
                <input
                  type="text"
                  value={sqft}
                  onChange={(e) => setSqft(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition"
                  placeholder="e.g. 1,450 Sq.Ft."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Possession / Stage</label>
                <input
                  type="text"
                  value={possession}
                  onChange={(e) => {
                    setPossession(e.target.value);
                    setStatus(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition"
                  placeholder="e.g. Ready to Move or Dec 2026"
                />
              </div>
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Verification Badge</label>
                <input
                  type="text"
                  value={rpsStatus}
                  onChange={(e) => setRpsStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition"
                  placeholder="e.g. Verified Listing ✓ or 100% Clear Title"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-800 mb-1">Architectural Narrative &amp; Orientation (Description)</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 resize-none transition"
                placeholder="Overview of layout, architecture, amenities, and connectivity..."
              />
            </div>
          </div>
        )}

        {/* Tab 2: Executive Dossier */}
        {activeTab === 'dossier' && (
          <div className="space-y-4 text-xs overflow-y-auto pr-1 flex-1 animate-in fade-in">
            {/* Engineering & Architectural Highlights */}
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-zinc-950 text-xs flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>Engineering &amp; Architectural Highlights</span>
                  </h4>
                  <p className="text-[11px] text-zinc-500">Displays in the executive dossier on the property page</p>
                </div>
                <button
                  type="button"
                  onClick={handleResetHighlights}
                  className="text-[10px] font-semibold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Typology Defaults</span>
                </button>
              </div>

              <div className="space-y-2">
                {highlights.map((hl, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={hl}
                      onChange={(e) => handleUpdateHighlight(idx, e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveHighlight(idx)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 cursor-pointer"
                      title="Remove highlight"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddHighlight();
                    }
                  }}
                  placeholder="Type new engineering highlight..."
                  className="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900"
                />
                <button
                  type="button"
                  onClick={handleAddHighlight}
                  disabled={!newHighlight.trim()}
                  className="px-3 py-1.5 bg-zinc-900 text-white font-semibold rounded-lg text-xs disabled:opacity-40 cursor-pointer"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Location Connectivity Advantage */}
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-zinc-950 text-xs flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    <span>Location Connectivity Advantage</span>
                  </h4>
                  <p className="text-[11px] text-zinc-500">Commute corridors, expressways, airports &amp; transit proximity</p>
                </div>
                <button
                  type="button"
                  onClick={handleResetConnectivity}
                  className="text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                  title="Auto-detect nearest metro, expressways, IT hubs & healthcare within 5 km"
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Auto-Detect (&lt; 5 km)</span>
                </button>
              </div>

              <div className="space-y-2">
                {connectivity.map((cn, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={cn}
                      onChange={(e) => handleUpdateConnectivity(idx, e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveConnectivity(idx)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 cursor-pointer"
                      title="Remove advantage"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newConnectivity}
                  onChange={(e) => setNewConnectivity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddConnectivity();
                    }
                  }}
                  placeholder="Type new connectivity advantage..."
                  className="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900"
                />
                <button
                  type="button"
                  onClick={handleAddConnectivity}
                  disabled={!newConnectivity.trim()}
                  className="px-3 py-1.5 bg-zinc-900 text-white font-semibold rounded-lg text-xs disabled:opacity-40 cursor-pointer"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* MahaRERA & Title Clearance */}
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
              <h4 className="font-bold text-zinc-950 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>MahaRERA &amp; Legal Clearance</span>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1 text-[11px]">MahaRERA Registration ID</label>
                  <input
                    type="text"
                    value={reraNumber}
                    onChange={(e) => setReraNumber(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg font-mono text-xs"
                    placeholder="e.g. PRM/PUN/RERA/2026/0491"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1 text-[11px]">Title Clearance Summary</label>
                  <input
                    type="text"
                    value={rpsStatus}
                    onChange={(e) => setRpsStatus(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-emerald-800 font-semibold"
                    placeholder="e.g. 100% Clear Title • Zero Encumbrances"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Amenities & Purposes */}
        {activeTab === 'amenities' && (
          <div className="space-y-4 text-xs overflow-y-auto pr-1 flex-1 animate-in fade-in">
            {/* Lifestyle Amenities Manager */}
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-zinc-950 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Lifestyle &amp; Infrastructure Amenities ({amenitiesList.length})</span>
                  </h4>
                  <p className="text-[11px] text-zinc-500">Pick from presets or add custom property amenities</p>
                </div>
              </div>

              {/* Active Amenities Chips */}
              <div className="flex flex-wrap gap-1.5 min-h-12 p-2 bg-white rounded-xl border border-zinc-200">
                {amenitiesList.length === 0 ? (
                  <span className="text-[11px] text-zinc-400 self-center">No amenities added yet. Click presets below to add.</span>
                ) : (
                  amenitiesList.map((am) => (
                    <span
                      key={am}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-950 border border-amber-300"
                    >
                      <CheckCircle2 className="w-3 h-3 text-amber-600" />
                      <span>{am}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAmenity(am)}
                        className="text-amber-800 hover:text-rose-600 ml-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wide">Quick Add Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_AMENITIES.map((preset) => {
                    const isAdded = amenitiesList.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          if (isAdded) {
                            handleRemoveAmenity(preset);
                          } else {
                            handleAddAmenity(preset);
                          }
                        }}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer border ${
                          isAdded
                            ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                            : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                        }`}
                      >
                        {isAdded ? `✓ ${preset}` : `+ ${preset}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add Custom Amenity Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAmenity(newAmenity);
                    }
                  }}
                  placeholder="Type custom amenity name..."
                  className="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900"
                />
                <button
                  type="button"
                  onClick={() => handleAddAmenity(newAmenity)}
                  disabled={!newAmenity.trim()}
                  className="px-3 py-1.5 bg-zinc-900 text-white font-semibold rounded-lg text-xs disabled:opacity-40 cursor-pointer"
                >
                  + Add Amenity
                </button>
              </div>
            </div>

            {/* Suitable Business Purposes (Multi-Select) */}
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2">
              <BusinessPurposesMultiSelect
                selectedIds={selectedPurposes}
                onChange={setSelectedPurposes}
              />
            </div>
          </div>
        )}

        {/* Tab 4: Media */}
        {activeTab === 'media' && (
          <div className="space-y-4 text-xs overflow-y-auto pr-1 flex-1 animate-in fade-in">
            {/* Multiple Photos Manager */}
            <div className="space-y-2.5 p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-zinc-800">Property Photos ({images.filter(Boolean).length} added)</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddImageSlot}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Another Photo</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">
                Upload local photos or paste URLs. Photo #1 is the primary cover image. You can reorder or add more than 1 photo.
              </p>

              {/* Thumbnail Preview Strip */}
              {images.filter(Boolean).length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 bg-white rounded-xl border border-zinc-200">
                  {images.map((url, idx) => {
                    if (!url) return null;
                    return (
                      <div key={idx} className="relative shrink-0 w-16 h-12 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
                        <img src={url} alt={`Photo #${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-[8px] font-bold text-white px-1 py-0.2 rounded">
                          {idx === 0 ? 'Cover' : `#${idx + 1}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Image Inputs List */}
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {images.map((url, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-xl bg-white border border-zinc-200">
                    <div className="w-12 h-10 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-200 shrink-0 flex items-center justify-center relative">
                      {url ? (
                        <img src={url} alt={`#${index + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-zinc-400" />
                      )}
                      <span className="absolute top-0.5 left-0.5 bg-zinc-900/80 text-[8px] font-bold text-white px-1 rounded">
                        #{index + 1}
                      </span>
                    </div>

                    <div className="relative flex-1 flex items-center">
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => handleImageChange(index, e.target.value)}
                        placeholder={index === 0 ? "Cover Photo URL / Upload (https://...)" : `Photo #${index + 1} URL / Upload (https://...)`}
                        className="w-full pl-3 pr-8 py-1.5 text-xs border border-zinc-200 bg-white rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                      <label className="absolute right-1 cursor-pointer p-1 text-zinc-400 hover:text-amber-600 rounded" title="Upload Local Photo">
                        <Upload className="w-3.5 h-3.5" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(index, file);
                          }}
                        />
                      </label>
                    </div>

                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMakeCover(index)}
                        className="p-1.5 text-zinc-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition shrink-0 cursor-pointer"
                        title="Set as Cover Photo"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveImageSlot(index)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0 cursor-pointer"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 1 Video Walkthrough Tour */}
            <div className="space-y-2 p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-zinc-800">Video Walkthrough (1 Video)</span>
                </div>
                {videoUrl ? (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Video Attached
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-zinc-400">
                    No video
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500">
                Paste a YouTube walkthrough link, Vimeo, or direct MP4 URL. If left empty, no video tour button will be shown.
              </p>

              <div className="relative flex items-center">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="e.g. https://www.youtube.com/watch?v=... or https://.../walkthrough.mp4"
                  className="w-full pl-3 pr-8 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-400 bg-white"
                />
                {videoUrl && (
                  <button
                    type="button"
                    onClick={() => setVideoUrl('')}
                    className="absolute right-2 text-zinc-400 hover:text-rose-600"
                    title="Clear video"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 shrink-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 text-xs font-bold text-white bg-black hover:bg-zinc-800 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AddLocationModal({
  isOpen,
  onClose,
  onAdd
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; city: string; state: string; description: string }) => void;
}) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('Pune');
  const [state, setState] = useState('Maharashtra');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-zinc-200 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-700" />
            <div>
              <h3 className="font-bold text-zinc-900 text-base">Add Locality / Corridor</h3>
              <p className="text-[11px] text-zinc-500">Adds new geographical filter option to public website</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Locality / Area Name *</label>
            <input
              type="text"
              placeholder="e.g. Viman Nagar, Kharadi, Hinjewadi, Model Colony"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block font-medium text-zinc-700 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-zinc-700 mb-1">Corridor Description</label>
            <textarea
              rows={2}
              placeholder="e.g. Affluent IT hub & residential corridor..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!name.trim()) return alert('Please enter locality name');
              onAdd({ name: name.trim(), city: city.trim(), state: state.trim(), description: description.trim() });
              setName('');
              setDescription('');
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-black hover:bg-zinc-800 rounded-lg transition shadow-xs"
          >
            Save Locality
          </button>
        </div>
      </div>
    </div>
  );
}

// ================= ADD PROPERTY TYPE MODAL =================
export function AddPropertyTypeModal({
  isOpen,
  onClose,
  onAdd
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; description: string }) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-zinc-200 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-700" />
            <div>
              <h3 className="font-bold text-zinc-900 text-base">Add Typology / Property Type</h3>
              <p className="text-[11px] text-zinc-500">Adds new classification filter to public website</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Typology Name *</label>
            <input
              type="text"
              placeholder="e.g. Commercial Office, Luxury Penthouse, Sky Villa, Duplex"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-medium text-zinc-700 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="e.g. Grade-A commercial workspace, duplex sky residence..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!name.trim()) return alert('Please enter typology name');
              onAdd({ name: name.trim(), description: description.trim() });
              setName('');
              setDescription('');
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-black hover:bg-zinc-800 rounded-lg transition shadow-xs"
          >
            Save Typology
          </button>
        </div>
      </div>
    </div>
  );
}


// ================= COMMAND PALETTE (⌘K) =================
export function CommandPalette({
  isOpen,
  onClose,
  onNavigate
}: {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (target: string) => void;
}) {
  const [query, setQuery] = useState('');

  const commands = [
    { id: 'dashboard', title: 'Dashboard Overview', category: 'Navigation', icon: Layout },
    { id: 'properties', title: 'Properties (248)', category: 'Navigation', icon: Building },
    { id: 'projects', title: 'Active Projects (24)', category: 'Navigation', icon: Building2 },
    { id: 'homepage-editor', title: 'Homepage Live Section Manager', category: 'CMS', icon: Layout },
    { id: 'blog-posts', title: 'Published Blogs & Insights', category: 'Editorial', icon: FileEdit },
    { id: 'enquiries', title: 'Public Enquiries (128)', category: 'CRM', icon: Search },
    { id: 'public-site', title: 'Visit Public Site (anvrealty.com)', category: 'Quick Action', icon: ExternalLink }
  ];

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggling
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-zinc-200 shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-100">
          <Search className="w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Type a command, search properties, sections, or pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 text-sm bg-transparent outline-hidden text-zinc-900 placeholder-zinc-400"
          />
          <span className="text-[10px] font-mono text-zinc-400 border border-zinc-200 px-1.5 py-0.5 rounded">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              No matching commands or pages found.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-100 text-left transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-zinc-100 group-hover:bg-white text-zinc-600 transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-900">{item.title}</p>
                      <p className="text-[10px] text-zinc-400">{item.category}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">Jump →</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ================= LIVE PREVIEW MODAL =================
export function LivePreviewModal({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/80 backdrop-blur-md animate-in fade-in">
      {/* Modal Top Bar */}
      <div className="h-14 bg-zinc-900 border-b border-zinc-800 px-6 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm tracking-tight text-white">ANV Live Preview</span>
          <span className="text-xs text-zinc-400 border-l border-zinc-800 pl-3">
            Public Website Sandbox
          </span>
        </div>

        {/* Viewport switchers */}
        <div className="flex items-center gap-1 bg-zinc-800/80 p-1 rounded-lg border border-zinc-700">
          <button
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded text-xs flex items-center gap-1.5 transition ${
              device === 'desktop' ? 'bg-zinc-700 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`p-1.5 rounded text-xs flex items-center gap-1.5 transition ${
              device === 'tablet' ? 'bg-zinc-700 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tablet</span>
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`p-1.5 rounded text-xs flex items-center gap-1.5 transition ${
              device === 'mobile' ? 'bg-zinc-700 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            className="text-xs text-zinc-300 hover:text-white px-2.5 py-1 rounded bg-zinc-800 flex items-center gap-1"
          >
            <span>Open in Tab</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-zinc-950">
        <div
          className={`transition-all duration-300 bg-white h-full rounded-xl overflow-hidden shadow-2xl border border-zinc-800 ${
            device === 'desktop'
              ? 'w-full max-w-7xl'
              : device === 'tablet'
              ? 'w-[768px]'
              : 'w-[390px]'
          }`}
        >
          <iframe
            src="/"
            title="Anv Reealty Preview"
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
}

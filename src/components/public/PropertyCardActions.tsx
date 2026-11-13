'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Heart, Scale, Eye, Check, Share2 } from 'lucide-react';
import { InstantEnquiryModal } from '@/components/public/InstantEnquiryModal';
import { SharePropertyModal } from '@/components/public/SharePropertyModal';
import { usePropertyComparison } from '@/context/PropertyComparisonContext';
import { useSavedProperties } from '@/context/SavedPropertiesContext';
import { PropertyItem } from '@/components/public/HomepageSearchablePortal';
import { getClientSession } from '@/lib/user-auth';
import { AuthInquiryModal } from '@/components/auth/AuthInquiryModal';

import { getPropertyUrl } from '@/lib/slug';

interface PropertyCardActionsProps {
  property: PropertyItem | any;
  onInstantEnquiry?: (property: any) => void;
}

export function PropertyCardActions({
  property,
  onInstantEnquiry
}: PropertyCardActionsProps) {
  const { isInCompare, toggleCompare } = usePropertyComparison();
  const { isSaved, toggleSave } = useSavedProperties();
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; showLink?: boolean } | null>(null);

  const saved = isSaved(property.id);

  const handleToggleSave = () => {
    const user = getClientSession();
    if (!user) {
      setAuthNotice('Login or Sign Up is compulsory to save properties to your shortlist.');
      setAuthModalOpen(true);
      return;
    }
    const nextSaved = toggleSave(property.id, property.name);
    if (nextSaved) {
      setToastMsg({
        text: `Saved "${property.name}" to your shortlist`,
        showLink: true
      });
    } else {
      setToastMsg({
        text: `Removed "${property.name}" from your shortlist`,
        showLink: false
      });
    }
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleToggleCompare = () => {
    const user = getClientSession();
    if (!user) {
      setAuthNotice('Login or Sign Up is compulsory to compare properties.');
      setAuthModalOpen(true);
      return;
    }
    toggleCompare(property);
  };

  const isCompared = isInCompare(property.id);

  const handleOpenEnquiry = () => {
    if (onInstantEnquiry) {
      onInstantEnquiry(property);
    } else {
      setEnquiryModalOpen(true);
    }
  };

  return (
    <>
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[95] bg-zinc-950 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-zinc-800 animate-in fade-in flex items-center gap-3">
          <span>{toastMsg.text}</span>
          {toastMsg.showLink && (
            <Link
              href="/saved"
              className="text-amber-400 hover:text-amber-300 font-extrabold underline flex items-center gap-1"
            >
              <span>View Shortlist →</span>
            </Link>
          )}
        </div>
      )}

      {/* 4 ACTION BUTTONS ROW */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 sm:gap-2.5 w-full">
        {/* Left Group: Compare & Save Shortlist & Share */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 1. COMPARE BUTTON */}
          <button
            onClick={handleToggleCompare}
            className={`p-2 sm:px-3 sm:py-2 lg:px-3.5 lg:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border shadow-2xs ${
              isCompared
                ? 'bg-amber-400 text-black border-amber-400 font-extrabold ring-2 ring-amber-400/40 shadow-xs'
                : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:bg-zinc-50'
            }`}
            title={isCompared ? 'Remove from Comparison' : 'Add to Comparison'}
            aria-label={isCompared ? 'Remove from Comparison' : 'Add to Comparison'}
          >
            {isCompared ? (
              <>
                <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                <span className="hidden sm:inline">Compared</span>
              </>
            ) : (
              <>
                <Scale className="w-3.5 h-3.5 text-zinc-500" />
                <span className="hidden sm:inline">Compare</span>
              </>
            )}
          </button>

          {/* 2. SAVE BUTTON (Matching design with Heart icon) */}
          <button
            onClick={handleToggleSave}
            className={`p-2 sm:p-2 lg:p-2.5 border rounded-lg sm:rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-2xs ${
              saved
                ? 'bg-rose-50 border-rose-300 text-rose-600 ring-2 ring-rose-200/50'
                : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 hover:text-rose-500'
            }`}
            title={saved ? 'Remove from saved shortlist' : 'Save Residence'}
            aria-label={saved ? 'Remove from saved shortlist' : 'Save Residence'}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform active:scale-125 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          {/* 3. SHARE BUTTON */}
          <button
            onClick={() => setShareModalOpen(true)}
            className="p-2 sm:p-2 lg:p-2.5 border rounded-lg sm:rounded-xl bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 hover:text-amber-600 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
            title="Share Property Details (WhatsApp, Link, Dossier)"
            aria-label="Share Property Details"
          >
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Right Group: View Details & Instant Enquiry */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 w-full lg:w-auto">
          {/* 4. VIEW DETAILS DIRECT LINK (SEO FRIENDLY SLUG) */}
          <Link
            href={getPropertyUrl(property)}
            className="flex-1 sm:flex-none px-2.5 py-2 sm:px-3 sm:py-2 lg:px-3.5 lg:py-2 border border-zinc-200 hover:border-zinc-950 bg-white hover:bg-zinc-950 hover:text-white rounded-lg sm:rounded-xl text-xs font-bold text-zinc-800 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs group"
            title="View full dedicated property page"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors shrink-0" />
            <span className="truncate">View Details</span>
          </Link>

          {/* 5. INSTANT ENQUIRY BUTTON */}
          <button
            type="button"
            onClick={handleOpenEnquiry}
            className="flex-1 sm:flex-none px-2.5 py-2 sm:px-3.5 sm:py-2 lg:px-4 lg:py-2.5 bg-zinc-950 hover:bg-zinc-850 active:scale-[0.98] rounded-lg sm:rounded-xl text-xs font-black text-white transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer group"
            title="Instant Enquiry / Advisory"
          >
            <span className="truncate">Instant Enquiry</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>
        </div>
      </div>

      {/* Share Property Modal */}
      <SharePropertyModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        property={property}
      />

      {/* Instant Enquiry Modal */}
      <InstantEnquiryModal
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        property={property}
        onSuccess={(msg) => {
          setToastMsg({ text: msg, showLink: false });
          setTimeout(() => setToastMsg(null), 4000);
        }}
      />

      {/* Compulsory Auth Modal for Save / Compare */}
      <AuthInquiryModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthNotice(null);
        }}
        featureNotice={authNotice || undefined}
        onSuccess={(msg) => {
          setToastMsg({ text: msg, showLink: false });
          setTimeout(() => setToastMsg(null), 3500);
        }}
      />
    </>
  );
}

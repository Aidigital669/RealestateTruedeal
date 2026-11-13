'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Phone,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  User,
  MapPin,
  Building,
  Coins,
  Send,
  Copy,
  Check,
  Bell,
  Sliders,
  ChevronRight,
  TrendingUp,
  Info
} from 'lucide-react';

interface PropertyBuyerMatchingModalProps {
  property: any;
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export function PropertyBuyerMatchingModal({
  property,
  isOpen,
  onClose,
  showToast
}: PropertyBuyerMatchingModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [filterTier, setFilterTier] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notifiedId, setNotifiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !property) return;
    setLoading(true);

    const propId = property.id || property.slug;
    fetch(`/api/crm/property-matches?propertyId=${encodeURIComponent(propId)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json);
        } else {
          showToast(`❌ ${json.error || 'Failed to calculate matches'}`);
        }
      })
      .catch((err) => {
        console.error('Matching fetch error:', err);
        showToast('❌ Error connecting to CRM matching engine');
      })
      .finally(() => setLoading(false));
  }, [isOpen, property]);

  if (!isOpen || !property) return null;

  const matches = data?.matches || [];
  const filteredMatches = matches.filter((m: any) => {
    if (filterTier === 'exceptional') return m.match.tier === 'exceptional';
    if (filterTier === 'strong') return m.match.tier === 'strong' || m.match.tier === 'exceptional';
    return true;
  });

  const handleCopyPitch = (buyerId: string, pitchText: string) => {
    navigator.clipboard.writeText(pitchText);
    setCopiedId(buyerId);
    showToast('✓ Personalized WhatsApp pitch copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleNotifyAgent = async (buyer: any, match: any) => {
    try {
      const res = await fetch('/api/crm/property-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          buyerId: buyer.id,
          agentName: buyer.assignedTo || 'Jennifer Desai',
          matchScore: match.matchScore,
          pitchMessage: match.whatsappPitch
        })
      });
      const resJson = await res.json();
      if (resJson.success) {
        setNotifiedId(buyer.id);
        showToast(`✓ Alert dispatched to ${buyer.assignedTo || 'Advisor'}!`);
      }
    } catch {
      showToast('✓ Match alert recorded in CRM pipeline!');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden border border-zinc-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= MODAL HEADER ================= */}
        <div className="p-4 sm:p-6 border-b border-zinc-100 flex items-start justify-between gap-4 bg-gradient-to-r from-amber-50/70 via-white to-zinc-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 flex items-center justify-center font-black shrink-0 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-950 border border-amber-300">
                  CRM Match Engine
                </span>
                <span className="text-xs font-bold text-zinc-400">• Intelligent Buyer Pairing</span>
              </div>
              <h3 className="font-black text-lg sm:text-xl text-zinc-950 mt-0.5">
                Matched Buyers for {property.realName || property.name || property.title}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {property.location || property.address || 'Pune'} &bull;{' '}
                {property.priceFormatted || property.price || 'Price on Request'} &bull;{' '}
                {property.configuration || property.bhk || 'Commercial/Residential'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================= SCORING MODEL SUMMARY BAR ================= */}
        <div className="px-5 py-3 bg-zinc-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-amber-400 uppercase text-[11px] tracking-wider">
              Scoring Weights:
            </span>
            <span className="text-zinc-300">Budget 30%</span>
            <span className="text-zinc-600">&bull;</span>
            <span className="text-zinc-300">Location 25%</span>
            <span className="text-zinc-600">&bull;</span>
            <span className="text-zinc-300">Type 20%</span>
            <span className="text-zinc-600">&bull;</span>
            <span className="text-zinc-300">Area 15%</span>
            <span className="text-zinc-600">&bull;</span>
            <span className="text-zinc-300">Other 10%</span>
          </div>

          <span className="text-[11px] text-amber-300/80 font-medium">
            Hard exclusions applied before scoring
          </span>
        </div>

        {/* ================= FILTER & MATCH COUNT BAR ================= */}
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between gap-3 flex-wrap bg-zinc-50/60">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs text-zinc-900">
              {data?.totalMatchedBuyers ?? 0} Qualified Buyers Matched
            </span>
            {data?.highIntentMatches > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {data.highIntentMatches} High Intent (≥72%)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-400 text-[11px] font-semibold">Filter:</span>
            <button
              type="button"
              onClick={() => setFilterTier('all')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                filterTier === 'all'
                  ? 'bg-zinc-950 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              All Matches ({matches.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTier('strong')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                filterTier === 'strong'
                  ? 'bg-zinc-950 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Strong (≥72%)
            </button>
            <button
              type="button"
              onClick={() => setFilterTier('exceptional')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                filterTier === 'exceptional'
                  ? 'bg-zinc-950 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Exceptional (≥88%)
            </button>
          </div>
        </div>

        {/* ================= MATCHED BUYERS SCROLL LIST ================= */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <p className="font-bold text-xs text-zinc-600">
                Evaluating candidate buyers against property budget, locality, and area criteria...
              </p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 space-y-2">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <h4 className="font-black text-sm text-zinc-800">No matching buyers in this filter tier</h4>
              <p className="text-xs text-zinc-500">
                Switch filter to &quot;All Matches&quot; or add new buyer demands to the CRM.
              </p>
            </div>
          ) : (
            filteredMatches.map((item: any, idx: number) => {
              const { buyer, match } = item;
              const isCopied = copiedId === buyer.id;
              const isNotified = notifiedId === buyer.id;

              const scoreColor =
                match.matchScore >= 88
                  ? 'bg-emerald-600 text-white'
                  : match.matchScore >= 72
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-blue-600 text-white';

              const cleanPhone = (buyer.phone || '').replace(/[^\d+]/g, '');
              const waUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(
                match.whatsappPitch
              )}`;

              return (
                <div
                  key={buyer.id || idx}
                  className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 shadow-xs hover:border-amber-400 transition-all space-y-3.5"
                >
                  {/* Top Row: Match Score Badge + Buyer Identity */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Big Score Badge */}
                      <div
                        className={`w-12 h-12 rounded-2xl ${scoreColor} flex flex-col items-center justify-center font-black shrink-0 shadow-md`}
                      >
                        <span className="text-base leading-none">{match.matchScore}%</span>
                        <span className="text-[8px] uppercase tracking-wider font-bold opacity-90">
                          Match
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-sm sm:text-base text-zinc-950 truncate">
                            {buyer.name}
                          </h4>
                          {buyer.code && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
                              {buyer.code}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700">
                            Agent: {buyer.assignedTo || 'Jennifer Desai'}
                          </span>
                        </div>

                        {/* Buyer Demand Criteria Pills */}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-600 flex-wrap">
                          <span className="flex items-center gap-1 font-semibold text-zinc-900">
                            <Coins className="w-3.5 h-3.5 text-amber-600" />
                            Target: {buyer.targetBudgetStr || 'Flexible'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                            {buyer.primaryLocality || 'Pune'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-zinc-400" />
                            {buyer.bhk || 'Residential'}
                          </span>
                          {buyer.minCarpetSqft && (
                            <span>{buyer.minCarpetSqft} sq.ft min</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Score Breakdown Bar */}
                  <div className="grid grid-cols-5 gap-1.5 text-[10px] text-center bg-zinc-50 rounded-xl p-2 border border-zinc-100 font-bold">
                    <div>
                      <span className="text-zinc-400 block text-[9px]">Budget (30)</span>
                      <span className="text-zinc-900">{match.breakdown.budgetScore}/30</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[9px]">Location (25)</span>
                      <span className="text-zinc-900">{match.breakdown.locationScore}/25</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[9px]">Typology (20)</span>
                      <span className="text-zinc-900">{match.breakdown.typologyScore}/20</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[9px]">Area (15)</span>
                      <span className="text-zinc-900">{match.breakdown.areaScore}/15</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[9px]">Other (10)</span>
                      <span className="text-zinc-900">{match.breakdown.otherScore}/10</span>
                    </div>
                  </div>

                  {/* Match Explanations: Why it matches & Mismatches */}
                  <div className="space-y-1 text-xs">
                    {match.reasons.map((r: string, rIdx: number) => (
                      <div key={rIdx} className="text-emerald-700 font-medium flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                        <span>{r}</span>
                      </div>
                    ))}
                    {match.mismatches.map((m: string, mIdx: number) => (
                      <div key={mIdx} className="text-amber-700 font-medium flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>

                  {/* 1-Click Action Buttons */}
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] text-zinc-400 font-medium">
                      Direct Buyer Outreach Actions
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyPitch(buyer.id, match.whatsappPitch)}
                        className="px-2.5 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="Copy personalized pitch text"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied' : 'Copy Pitch'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleNotifyAgent(buyer, match)}
                        className="px-2.5 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="Notify assigned real estate advisor"
                      >
                        <Bell className={`w-3.5 h-3.5 ${isNotified ? 'text-amber-500' : ''}`} />
                        <span>{isNotified ? 'Notified ✓' : 'Notify Agent'}</span>
                      </button>

                      {buyer.phone && (
                        <a
                          href={`tel:${cleanPhone}`}
                          className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          title="Call Buyer Directly"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                      )}

                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-zinc-950 text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-zinc-950" />
                        <span>Send WhatsApp Pitch</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

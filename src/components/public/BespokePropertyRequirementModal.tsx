'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  Phone,
  Mail,
  User,
  MapPin,
  Calendar,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Compass,
  Car,
  Home,
  IndianRupee,
  Layers,
  Clock,
  MessageSquare
} from 'lucide-react';
import { getClientSession } from '@/lib/user-auth';

interface BespokePropertyRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLocality?: string;
  initialBhk?: string;
  initialBudget?: string;
  onSuccess?: (msg: string) => void;
}

export function BespokePropertyRequirementModal({
  isOpen,
  onClose,
  initialLocality = 'Baner',
  initialBhk = '3 BHK',
  initialBudget = '₹1.5 Cr - ₹2.5 Cr',
  onSuccess
}: BespokePropertyRequirementModalProps) {
  // Contact & Personal Details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredMode, setPreferredMode] = useState<'whatsapp' | 'call' | 'email'>('whatsapp');
  const [preferredTime, setPreferredTime] = useState('Morning (9:00 AM - 12:00 PM)');

  // Property Requirements
  const [locality, setLocality] = useState(initialLocality !== 'All' ? initialLocality : 'Baner');
  const [bhk, setBhk] = useState(initialBhk !== 'All' ? initialBhk : '3 BHK');
  const [budget, setBudget] = useState(initialBudget !== 'All' ? initialBudget : '₹1.5 Cr - ₹2.5 Cr');
  const [timeline, setTimeline] = useState('Ready to Move');
  const [purpose, setPurpose] = useState('Self-Use / Primary Residence');
  const [vastuPreference, setVastuPreference] = useState('East / North Facing (Vastu Compliant)');
  const [parkingPreference, setParkingPreference] = useState('2 Covered Car Parks');
  const [developerPreference, setDeveloperPreference] = useState('Grade-A Developers Only (VTP, Godrej, Panchshil, Lodha)');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync initial props when opened
  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setError(null);
      if (initialLocality && initialLocality !== 'All') setLocality(initialLocality);
      if (initialBhk && initialBhk !== 'All') setBhk(initialBhk);
      if (initialBudget && initialBudget !== 'All') setBudget(initialBudget);

      const user = getClientSession();
      if (user) {
        if (!name) setName(user.name);
        if (!phone && user.phone) setPhone(user.phone);
        if (!email && user.email) setEmail(user.email);
      }
    }
  }, [isOpen, initialLocality, initialBhk, initialBudget]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your full name for contact.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setError('Please provide a valid 10-digit mobile number for future updates.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address to receive property dossiers.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          locality,
          bhk,
          budget,
          timeline,
          purpose,
          preferredMode,
          preferredTime,
          vastuPreference,
          parkingPreference,
          developerPreference,
          message: message.trim(),
          source: 'Bespoke Property Requirement Popup Form'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit requirement');
      }

      setSubmitted(true);
      setConfirmationData(data);
      onSuccess?.('Thank you! Your property requirement has been recorded and forwarded to our senior advisory desk.');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl my-auto bg-zinc-950 text-white rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_50px_rgba(163, 136, 30,0.25)] border border-amber-500/30 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] transition-all animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-sm border border-white/10 transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-amber-500/20 bg-gradient-to-b from-zinc-900 to-zinc-950 shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Off-Market Sourcing Concierge</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Please Mention Your Requirements
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Specify your exact buying requirements below and our senior partners will curate verified off-market matches across Pune for you.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto">
          {submitted ? (
            <div className="py-6 text-center space-y-5 animate-in fade-in">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-mono text-xs font-bold border border-amber-500/30">
                  Ref: {confirmationData?.referenceCode || 'REQ-PUN-2026'}
                </span>
                <h4 className="text-xl font-bold text-white mt-3">
                  Requirement Recorded Successfully!
                </h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto mt-2 leading-relaxed">
                  Thank you, <strong className="text-white">{name}</strong>. Your customized buying brief for a{' '}
                  <strong className="text-amber-400">{bhk} in {locality}</strong> ({budget}) has been dispatched to our Pune luxury desk.
                </p>
              </div>

              {/* Requirement Summary Box */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between text-zinc-400">
                  <span>Contact Person:</span>
                  <span className="font-semibold text-white">{name}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Mobile / WhatsApp:</span>
                  <span className="font-semibold text-emerald-400">{phone}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Locality & Typology:</span>
                  <span className="font-semibold text-white">{locality} &bull; {bhk}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Budget & Status:</span>
                  <span className="font-semibold text-white">{budget} ({timeline})</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white rounded-xl text-xs font-bold transition shadow-lg cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3.5 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* ================= 1. CONTACT PERSON DETAILS ================= */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 pb-1 border-b border-zinc-800">
                  <User className="w-3.5 h-3.5" />
                  <span>1. Contact Person Details (For Future Communication)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Full Name / Contact Person *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Unassigned"
                        className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Phone Number / WhatsApp *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98220 12345"
                        className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Email Address (For Verified Factsheets) *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vikram@example.com"
                        className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                      />
                    </div>
                  </div>

                  {/* Preferred Mode */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Preferred Mode of Contact
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'whatsapp', label: 'WhatsApp' },
                        { id: 'call', label: 'Phone Call' },
                        { id: 'email', label: 'Email' }
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setPreferredMode(mode.id as any)}
                          className={`py-2 text-[11px] font-bold rounded-lg transition border cursor-pointer ${
                            preferredMode === mode.id
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Best Time to Contact */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    Best Time to Contact
                  </label>
                  <input
                    type="text"
                    list="time-suggestions"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    placeholder="e.g. Morning (9:00 AM - 12:00 PM), Evening, Anytime..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                  <datalist id="time-suggestions">
                    <option value="Morning (9:00 AM - 12:00 PM)" />
                    <option value="Afternoon (12:00 PM - 5:00 PM)" />
                    <option value="Evening (5:00 PM - 8:00 PM)" />
                    <option value="Weekend Anytime" />
                  </datalist>
                </div>
              </div>

              {/* ================= 2. PROPERTY SPECIFICATIONS & BUYING CRITERIA ================= */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 pb-1 border-b border-zinc-800">
                  <Home className="w-3.5 h-3.5" />
                  <span>2. Property Buying Requirements & Specifications</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Preferred Locality */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Preferred Locality / Area in Pune
                    </label>
                    <input
                      type="text"
                      list="locality-suggestions"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      placeholder="e.g. Baner, Koregaon Park, Kalyani Nagar..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                    <datalist id="locality-suggestions">
                      <option value="Undri" />
                      <option value="Camp" />
                      <option value="NIBM" />
                      <option value="Baner" />
                      <option value="Balewadi" />
                      <option value="Kalyani Nagar" />
                      <option value="Koregaon Park" />
                      <option value="Bavdhan" />
                      <option value="Mahalunge" />
                      <option value="Shivajinagar" />
                      <option value="Hinjewadi" />
                      <option value="Wakad" />
                      <option value="Viman Nagar" />
                      <option value="Kharadi" />
                      <option value="Aundh" />
                      <option value="Magarpatta" />
                      <option value="Hadapsar" />
                      <option value="Model Colony" />
                      <option value="Any Prime Corridor" />
                    </datalist>
                  </div>

                  {/* Typology */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Typology / Configuration
                    </label>
                    <input
                      type="text"
                      list="bhk-suggestions"
                      value={bhk}
                      onChange={(e) => setBhk(e.target.value)}
                      placeholder="e.g. 2 BHK, 3 BHK, Medical / Hospital, Office..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                    <datalist id="bhk-suggestions">
                      <option value="2 BHK Luxury Apartment" />
                      <option value="3 BHK Luxury Apartment" />
                      <option value="4 BHK Sky Suite" />
                      <option value="4.5+ BHK Trophy Penthouse" />
                      <option value="Medical / Hospital Premise" />
                      <option value="Commercial Office Space" />
                      <option value="Commercial Showroom" />
                      <option value="Pre-Leased Commercial (High ROI)" />
                      <option value="Independent Luxury Villa" />
                      <option value="Industrial / Warehouse Plot" />
                    </datalist>
                  </div>

                  {/* Budget */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Target Budget Range
                    </label>
                    <input
                      type="text"
                      list="budget-suggestions"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g. Under ₹2 Cr, ₹1.5 Cr - ₹2.5 Cr..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                    <datalist id="budget-suggestions">
                      <option value="Under ₹1.0 Cr" />
                      <option value="Under ₹1.5 Cr" />
                      <option value="Under ₹2.0 Cr" />
                      <option value="₹1.5 Cr - ₹2.5 Cr" />
                      <option value="₹2.5 Cr - ₹4.0 Cr" />
                      <option value="₹4.0 Cr - ₹6.5 Cr" />
                      <option value="₹6.5 Cr+ Commercial / Trophy Asset" />
                    </datalist>
                  </div>

                  {/* Possession Status */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Possession Status Timeline
                    </label>
                    <input
                      type="text"
                      list="timeline-suggestions"
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      placeholder="e.g. Ready to Move (Immediate), Within 6-12 Months..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                    <datalist id="timeline-suggestions">
                      <option value="Ready to Move (Immediate)" />
                      <option value="Under-Construction (Within 6-12 Months)" />
                      <option value="Under-Construction (1-2 Years)" />
                      <option value="Newly Launched / Pre-Launch" />
                      <option value="Flexible / Investment" />
                    </datalist>
                  </div>

                  {/* Purpose */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Purpose of Buying
                    </label>
                    <input
                      type="text"
                      list="purpose-suggestions"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="e.g. Self-Use / Primary Residence, Capital Appreciation..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                    <datalist id="purpose-suggestions">
                      <option value="Self-Use / Primary Residence" />
                      <option value="Capital Appreciation / Investment" />
                      <option value="High Rental Income & Yield" />
                      <option value="Vacation / Weekend Luxury Home" />
                      <option value="Commercial Business Expansion" />
                    </datalist>
                  </div>

                  {/* Vastu Preference */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Vastu & Orientation
                    </label>
                    <input
                      type="text"
                      list="vastu-suggestions"
                      value={vastuPreference}
                      onChange={(e) => setVastuPreference(e.target.value)}
                      placeholder="e.g. East / North Facing (100% Vastu), Flexible..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                    <datalist id="vastu-suggestions">
                      <option value="East / North Facing (100% Vastu)" />
                      <option value="East Facing Only" />
                      <option value="North Facing Only" />
                      <option value="Preferred but Flexible" />
                      <option value="No Specific Vastu Preference" />
                    </datalist>
                  </div>
                </div>

                {/* Developer Preference */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Preferred Builder / Grade-A Criteria
                  </label>
                  <input
                    type="text"
                    value={developerPreference}
                    onChange={(e) => setDeveloperPreference(e.target.value)}
                    placeholder="e.g. VTP, Godrej, Panchshil, Lodha or Grade-A"
                    className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Special Requirements & Specific Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. High floor 15+ preferred, scenic view, private plunge pool or servant quarters required..."
                    className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              </div>

              {/* Guarantees Strip */}
              <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  100% Confidential. Zero spam. Authenticated against MahaRERA & RPS records with zero brokerage on developer inventory.
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold rounded-xl text-xs sm:text-sm transition shadow-[0_0_20px_rgba(163, 136, 30,0.3)] hover:shadow-[0_0_30px_rgba(163, 136, 30,0.5)] flex items-center gap-2 cursor-pointer disabled:opacity-50 uppercase tracking-wider"
                >
                  <span>{loading ? 'Confirming...' : 'Confirm'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

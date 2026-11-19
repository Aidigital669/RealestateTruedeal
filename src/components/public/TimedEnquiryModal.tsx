'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  X,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Phone,
  Calendar,
  MapPin,
  User,
  Mail,
  Building2,
  Clock
} from 'lucide-react';
import { getClientSession } from '@/lib/user-auth';

function WhatsAppIcon({ className = 'w-4 h-4 fill-current' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M16 2C8.28 2 2 8.28 2 16c0 2.66.75 5.15 2.05 7.29L2.3 29.7l6.63-1.74A13.9 13.9 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm8.17 19.83c-.34.96-1.7 1.76-2.76 1.99-.73.16-1.68.29-4.88-1.04-4.09-1.69-6.72-5.83-6.93-6.1-.2-.28-1.67-2.22-1.67-4.23s1.05-3.01 1.43-3.42c.38-.41.82-.51 1.1-.51.27 0 .55 0 .79.02.25.01.59-.1.92.7.34.82 1.16 2.83 1.26 3.04.1.2.17.44.03.71-.13.27-.2.44-.4.68-.2.24-.43.53-.61.71-.21.21-.43.44-.19.86.25.41 1.09 1.8 2.34 2.91 1.61 1.43 2.97 1.88 3.39 2.09.42.2.67.18.92-.1.25-.28 1.07-1.24 1.35-1.67.28-.43.56-.36.94-.22.38.14 2.42 1.14 2.83 1.35.41.2.69.31.79.48.1.18.1 1.02-.24 1.98z" />
    </svg>
  );
}

const POPUP_DELAY_MS = 2 * 60 * 1000; // 2 minutes (120,000 ms)

export function TimedEnquiryModal() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'enquiry' | 'visit'>('enquiry');

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [interestType, setInterestType] = useState('Luxury Residential');
  const [budget, setBudget] = useState('₹1.5 - 2.5 Cr');
  const [message, setMessage] = useState('');

  // Site Visit Fields
  const tomorrowStr = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);
  const [visitDate, setVisitDate] = useState(tomorrowStr);
  const [visitSlot, setVisitSlot] = useState('Afternoon (02:00 PM - 05:00 PM)');
  const [pickupAddress, setPickupAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 2-Minute Timer Tracker
  useEffect(() => {
    // Never show on back-office paths
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/crm')) {
      return;
    }

    if (typeof window === 'undefined') return;

    // Check if user already dismissed or submitted the timed popup in this session
    const isDismissed = sessionStorage.getItem('anv_timed_enquiry_dismissed');
    if (isDismissed === 'true') {
      return;
    }

    // Check query param for immediate testing: ?test_popup=true
    if (window.location.search.includes('test_popup=true')) {
      setIsOpen(true);
      return;
    }

    // Track total time on site across pages within the same session
    const storedStart = sessionStorage.getItem('anv_session_start_time');
    let startTime = storedStart ? parseInt(storedStart, 10) : 0;
    if (!startTime || isNaN(startTime)) {
      startTime = Date.now();
      sessionStorage.setItem('anv_session_start_time', startTime.toString());
    }

    const elapsed = Date.now() - startTime;
    const remainingTime = Math.max(0, POPUP_DELAY_MS - elapsed);

    timerRef.current = setTimeout(() => {
      // Re-verify it hasn't been dismissed in the meantime
      const dismissedNow = sessionStorage.getItem('anv_timed_enquiry_dismissed');
      if (dismissedNow !== 'true') {
        setIsOpen(true);
      }
    }, remainingTime);

    // Provide a developer/testing hook in console: window.triggerTimedEnquiry()
    (window as any).triggerTimedEnquiry = () => {
      setIsOpen(true);
    };

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  // Autofill user details if available
  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setError(null);
      const user = getClientSession();
      if (user) {
        if (!name && user.name) setName(user.name);
        if (!phone && user.phone) setPhone(user.phone);
        if (!email && user.email) setEmail(user.email);
        if (user.budget) setBudget(user.budget);
      }
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('anv_timed_enquiry_dismissed', 'true');
    }
  };

  const getWhatsAppUrl = () => {
    const parts = [
      activeTab === 'enquiry'
        ? '*ANV REEALTY - Private Client Consultation*'
        : '*ANV REEALTY - Private Site Visit Request*'
    ];

    if (name.trim()) parts.push(`*Client Name:* ${name.trim()}`);
    if (phone.trim()) parts.push(`*Phone:* ${phone.trim()}`);
    if (email.trim()) parts.push(`*Email:* ${email.trim()}`);

    if (activeTab === 'enquiry') {
      if (interestType) parts.push(`*Looking For:* ${interestType}`);
      if (budget) parts.push(`*Target Budget:* ${budget}`);
      if (message.trim()) parts.push(`*Requirement:* ${message.trim()}`);
      parts.push('\nHello Anv Reealty, I would like to connect with a senior property advisor for verified options in Pune.');
    } else {
      if (visitDate) parts.push(`*Preferred Date:* ${visitDate}`);
      if (visitSlot) parts.push(`*Preferred Slot:* ${visitSlot}`);
      if (pickupAddress.trim()) parts.push(`*Pickup / Locality:* ${pickupAddress.trim()}`);
      parts.push('\nHello Anv Reealty, I would like to schedule a private escorted site visit in Pune.');
    }

    return `https://wa.me/919373020701?text=${encodeURIComponent(parts.join('\n'))}`;
  };

  const handleWhatsAppClick = () => {
    if (phone.trim()) {
      if (activeTab === 'enquiry') {
        fetch('/api/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim() || 'Website Visitor',
            phone: phone.trim(),
            email: email.trim(),
            propertyName: `Consultation (${interestType})`,
            budget,
            message: `[2-Min Timed Popup via WhatsApp] ${message.trim()}`,
            source: '2-Minute Timed Visitor Enquiry'
          })
        }).catch(() => {});
      } else {
        fetch('/api/site-visits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim() || 'Website Visitor',
            phone: phone.trim(),
            email: email.trim(),
            address: pickupAddress.trim() || 'Pune',
            projectName: 'Curated Pune Luxury Residence',
            locality: pickupAddress.trim() || 'Pune',
            bhk: interestType,
            budget,
            visitDate,
            visitTime: visitSlot,
            notes: '[2-Min Timed Popup via WhatsApp]'
          })
        }).catch(() => {});
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Please provide your name and phone number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'enquiry') {
        const res = await fetch('/api/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            propertyName: `Consultation (${interestType})`,
            budget,
            message: `[2-Minute Timed Visitor Enquiry] Interested in: ${interestType}. ${message.trim()}`,
            source: '2-Minute Timed Visitor Enquiry'
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to submit enquiry');
        }
      } else {
        const res = await fetch('/api/site-visits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            address: pickupAddress.trim() || 'Pune',
            projectName: 'Curated Pune Luxury Residence',
            locality: pickupAddress.trim() || 'Pune',
            bhk: interestType,
            budget,
            visitDate,
            visitTime: visitSlot,
            notes: `[2-Minute Timed Site Visit] Preferred slot: ${visitSlot}. Address: ${pickupAddress.trim()}`
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to schedule site visit');
        }
      }

      setSubmitted(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('anv_timed_enquiry_dismissed', 'true');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again or WhatsApp our desk.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative w-full max-w-lg my-auto bg-zinc-950 text-white rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.85),0_0_50px_rgba(163, 136, 30,0.25)] border border-amber-500/30 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] transition-all animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-sm border border-white/10 transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-amber-500/20 bg-gradient-to-b from-zinc-900 to-zinc-950">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Private Client Advisory &bull; VIP Desk</span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Looking for Luxury or Commercial Real Estate in Pune?
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Connect directly with an Anv Reealty partner for verified properties, private walkthroughs &amp; off-market deals.
          </p>

          {/* Tab Switcher: Instant Enquiry vs Site Visit */}
          {!submitted && (
            <div className="flex items-center gap-2 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl mt-3.5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('enquiry');
                  setError(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'enquiry'
                    ? 'bg-[#b9974f] text-zinc-950 font-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Instant Enquiry</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('visit');
                  setError(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'visit'
                    ? 'bg-[#b9974f] text-zinc-950 font-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule Site Visit</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto">
          {submitted ? (
            <div className="text-center py-6 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-[0_0_25px_rgba(185, 151, 79,0.3)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-white">
                  {activeTab === 'enquiry' ? 'Enquiry Received Successfully!' : 'Your Site Visit Request is Confirmed!'}
                </h4>
                <p className="text-xs text-emerald-300 font-semibold mt-1 max-w-sm mx-auto leading-relaxed">
                  We will contact you shortly on <strong className="text-white font-mono">{phone}</strong>.
                </p>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 text-left text-xs space-y-2">
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Assigned Advisor:</span>
                  <span className="font-semibold text-white">Senior Advisory Team</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Client Contact:</span>
                  <span className="font-semibold text-white">{phone}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Category:</span>
                  <span className="font-semibold text-amber-300">{interestType}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Response SLA:</span>
                  <span className="font-semibold text-emerald-400">Under 15 Minutes</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-zinc-950" />
                  <span>Chat on WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                  {error}
                </div>
              )}

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-hidden transition"
                    />
                    <User className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="+91 98200 12345"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-hidden font-mono transition"
                    />
                    <Phone className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Email & Interest Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="patron@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-hidden transition"
                    />
                    <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Property Segment
                  </label>
                  <select
                    value={interestType}
                    onChange={(e) => setInterestType(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-xs text-white focus:outline-hidden"
                  >
                    <option value="Luxury Residential">Luxury Residential (Apartment / Penthouse)</option>
                    <option value="Commercial Office Space">Commercial Office Space (Grade-A / IT Park)</option>
                    <option value="Retail Shop & Showroom">Retail Shop &amp; Showroom (High Street)</option>
                    <option value="Pre-leased Property">Pre-leased Property (High Yield ROI)</option>
                    <option value="Residential Bungalow & Villa">Residential Bungalow &amp; Villa</option>
                    <option value="Commercial / Industrial Land">Strategic Land &amp; Farm Plot</option>
                  </select>
                </div>
              </div>

              {/* Conditional Fields based on Active Tab */}
              {activeTab === 'enquiry' ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Target Budget Range
                    </label>
                    <input
                      type="text"
                      list="timed-budget-suggestions"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g. ₹1.5 - 2.5 Cr, ₹3.5 Cr, Flexible..."
                      className="w-full p-2.5 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-hidden"
                    />
                    <datalist id="timed-budget-suggestions">
                      <option value="₹1.5 - 2.5 Cr" />
                      <option value="₹2.5 - 4.0 Cr" />
                      <option value="₹4.0 - 6.0 Cr" />
                      <option value="₹6.0 Cr+ (Penthouse / Trophy)" />
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Specific Requirements or Locality (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="e.g. Baner / Koregaon Park, 3 BHK higher floor, ready to move..."
                      className="w-full p-2.5 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-hidden transition"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                        Preferred Date *
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          required
                          min={tomorrowStr}
                          value={visitDate}
                          onChange={(e) => setVisitDate(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-xs text-white focus:outline-hidden"
                        />
                        <Calendar className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                        Preferred Timing Slot
                      </label>
                      <div className="relative">
                        <select
                          value={visitSlot}
                          onChange={(e) => setVisitSlot(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-xs text-white focus:outline-hidden"
                        >
                          <option value="Morning (10:00 AM - 01:00 PM)">Morning (10:00 AM - 01:00 PM)</option>
                          <option value="Afternoon (02:00 PM - 05:00 PM)">Afternoon (02:00 PM - 05:00 PM)</option>
                          <option value="Evening (05:00 PM - 07:00 PM)">Evening (05:00 PM - 07:00 PM)</option>
                        </select>
                        <Clock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Pickup Locality / Visitor Address (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. Kalyani Nagar, Viman Nagar, Pune"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-hidden transition"
                      />
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#b9974f] hover:bg-[#a4823d] active:scale-[0.99] text-zinc-950 font-black text-xs rounded-xl shadow-[0_4px_20px_rgba(185,151,79,0.4)] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
              >
                <span>
                  {loading
                    ? 'Submitting...'
                    : activeTab === 'enquiry'
                    ? 'Dispatch Confidential Enquiry'
                    : 'Confirm Site Visit Request'}
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="relative flex items-center justify-center py-0.5">
                <div className="border-t border-zinc-800 w-full" />
                <span className="bg-zinc-950 px-2.5 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  or connect via
                </span>
                <div className="border-t border-zinc-800 w-full" />
              </div>

              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsAppClick}
                className="w-full py-3 bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-zinc-950 border border-[#25D366]/40 hover:border-[#25D366] font-bold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer shadow-sm hover:shadow-[0_4px_20px_rgba(37,211,102,0.25)]"
              >
                <WhatsAppIcon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                <span>
                  {activeTab === 'enquiry' ? 'Enquire Directly on WhatsApp' : 'Book Site Visit via WhatsApp'}
                </span>
              </a>

              <div className="pt-1.5 flex items-center justify-center gap-1.5 text-[10px] text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Zero spam guarantee &bull; Confidential HNI advisory</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}


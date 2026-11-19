'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Users
} from 'lucide-react';
import { getClientSession } from '@/lib/user-auth';

export interface SiteVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  property?: {
    id?: string | number;
    name?: string;
    developer?: string;
    price?: string;
    locality?: string;
    location?: string;
    bhk?: string;
  } | null;
  onSuccess?: (msg: string) => void;
}

export function SiteVisitModal({
  isOpen,
  onClose,
  property,
  onSuccess
}: SiteVisitModalProps) {
  // Tomorrow's date formatted as YYYY-MM-DD for min date
  const tomorrowStr = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const todayStr = React.useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [visitDate, setVisitDate] = useState(tomorrowStr);
  const [visitTime, setVisitTime] = useState('11:00 AM - 01:00 PM');
  const [passengers, setPassengers] = useState('2 Visitors');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWhatsAppUrl = () => {
    const parts: string[] = ['*ANV REEALTY - Private Site Visit Request*'];
    if (property?.name) {
      parts.push(`*Property:* ${property.name}`);
    }
    if (property?.locality || property?.location) {
      parts.push(`*Location:* ${property?.locality || property?.location}`);
    }
    if (property?.price) {
      parts.push(`*Price:* ${property.price}`);
    }
    if (name.trim()) {
      parts.push(`*Visitor Name:* ${name.trim()}`);
    }
    if (phone.trim()) {
      parts.push(`*Phone:* ${phone.trim()}`);
    }
    if (visitDate) {
      parts.push(`*Date:* ${visitDate}`);
    }
    if (visitTime) {
      parts.push(`*Time Window:* ${visitTime}`);
    }
    if (address.trim()) {
      parts.push(`*Pickup / Visitor Locality:* ${address.trim()}`);
    }
    if (passengers) {
      parts.push(`*Group Size:* ${passengers}`);
    }
    if (notes.trim()) {
      parts.push(`*Special Request:* ${notes.trim()}`);
    }
    parts.push('\nHello, I would like to confirm an escorted private site tour with your advisory team.');
    return `https://wa.me/919373020701?text=${encodeURIComponent(parts.join('\n'))}`;
  };

  const handleWhatsAppClick = () => {
    if (phone.trim() || name.trim()) {
      const propName = property?.name || 'Curated Pune Luxury Residence';
      const locality = property?.locality || property?.location || 'Pune';
      fetch('/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'WhatsApp Inquirer',
          phone: phone.trim() || 'Not Provided',
          email: email.trim(),
          address: address.trim() || locality,
          projectName: propName,
          propertyId: property?.id || null,
          locality,
          bhk: property?.bhk || 'Curated',
          budget: property?.price || 'Exclusive',
          visitDate: visitDate || tomorrowStr,
          visitTime,
          passengers,
          notes: `[Initiated via WhatsApp] ${notes.trim()}`
        })
      }).catch(() => { });
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setError(null);
      const user = getClientSession();
      if (user) {
        if (!name && user.name) setName(user.name);
        if (!phone && user.phone) setPhone(user.phone);
        if (!email && user.email) setEmail(user.email);
        if (!address && (user as any).address) setAddress((user as any).address);
      }
    }
  }, [isOpen]);

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
    if (!name.trim() || !phone.trim()) {
      setError('Please provide your name and phone number.');
      return;
    }

    if (!address.trim()) {
      setError("Please provide the visitor's address.");
      return;
    }

    if (!visitDate) {
      setError('Please select a preferred visit date.');
      return;
    }

    setLoading(true);
    setError(null);

    const propName = property?.name || 'Curated Pune Luxury Residence';
    const locality = property?.locality || property?.location || 'Pune';

    try {
      const res = await fetch('/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          pickupLocation: address.trim(),
          projectName: propName,
          propertyId: property?.id || null,
          locality,
          bhk: property?.bhk || '3 BHK',
          budget: property?.price || '₹1.5 - 2.5 Cr',
          visitDate,
          visitTime,
          cabRequired: false,
          passengers,
          notes: notes.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit site visit request');
      }

      setSubmitted(true);
      const toastSuccessMsg = 'Your site visit request is successfully confirmed!';
      onSuccess?.(toastSuccessMsg);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg my-auto bg-zinc-950 text-white rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.85),0_0_50px_rgba(163, 136, 30,0.25)] border border-amber-500/30 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] transition-all animate-in zoom-in-95 duration-200">

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-sm border border-white/10 transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-amber-500/20 bg-gradient-to-b from-zinc-900 to-zinc-950">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>VIP Private Site Tour</span>
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>Schedule Site Visit</span>
          </h3>

          <p className="text-xs text-zinc-400 mt-1">
            {property?.name ? (
              <span>
                Booking for <strong className="text-amber-400">{property.name}</strong>
                {property.locality ? ` • ${property.locality}` : ''}
              </span>
            ) : (
              'Curated on-ground site inspection with Senior Real Estate Advisory.'
            )}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {submitted ? (
            <div className="p-6 bg-emerald-950/70 border border-emerald-500/40 rounded-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.35)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="font-extrabold text-lg text-white">
                  Your site visit request is successfully confirmed!
                </h4>
                <p className="text-xs text-emerald-300 font-semibold mt-1.5 leading-relaxed">
                  Our private client relationship manager is preparing your visit dossier. Your request has been queued on the advisory dashboard.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-black/50 border border-emerald-500/30 rounded-xl p-3.5 text-left text-xs space-y-1.5 text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Property:</span>
                  <span className="font-bold text-white">{property?.name || 'Curated Residence'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Date:</span>
                  <span className="font-bold text-amber-400">{visitDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Time Window:</span>
                  <span className="font-bold text-white">{visitTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Visitor:</span>
                  <span className="font-bold text-white">{name} ({phone})</span>
                </div>
                {address && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Visitor Address:</span>
                    <span className="font-bold text-white truncate max-w-[220px]">{address}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-zinc-950 font-bold text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <svg viewBox="0 0 32 32" className="w-4 h-4 fill-zinc-950" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 2C8.28 2 2 8.28 2 16c0 2.66.75 5.15 2.05 7.29L2.3 29.7l6.63-1.74A13.9 13.9 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm8.17 19.83c-.34.96-1.7 1.76-2.76 1.99-.73.16-1.68.29-4.88-1.04-4.09-1.69-6.72-5.83-6.93-6.1-.2-.28-1.67-2.22-1.67-4.23s1.05-3.01 1.43-3.42c.38-.41.82-.51 1.1-.51.27 0 .55 0 .79.02.25.01.59-.1.92.7.34.82 1.16 2.83 1.26 3.04.1.2.17.44.03.71-.13.27-.2.44-.4.68-.2.24-.43.53-.61.71-.21.21-.43.44-.19.86.25.41 1.09 1.8 2.34 2.91 1.61 1.43 2.97 1.88 3.39 2.09.42.2.67.18.92-.1.25-.28 1.07-1.24 1.35-1.67.28-.43.56-.36.94-.22.38.14 2.42 1.14 2.83 1.35.41.2.69.31.79.48.1.18.1 1.02-.24 1.98z" />
                  </svg>
                  <span>Chat on WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition cursor-pointer shadow-md"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs">
                  {error}
                </div>
              )}

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Full Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rajesh Patil"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>Phone Number *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98230 12345"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Email Address (Optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. client@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                />
              </div>

              {/* Visit Date & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Preferred Date *</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Preferred Time Slot *</span>
                  </label>
                  <select
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition [color-scheme:dark]"
                  >
                    <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM (Morning Slot)</option>
                    <option value="12:00 PM - 02:00 PM">12:00 PM - 02:00 PM (Mid-Day)</option>
                    <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM (Afternoon Slot)</option>
                    <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM (Sunset Slot)</option>
                    <option value="06:00 PM - 08:00 PM">06:00 PM - 08:00 PM (Evening Tour)</option>
                  </select>
                </div>
              </div>

              {/* Number of Visitors */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Number of Attendees</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['1 Visitor', '2 Visitors', '3-4 Family', '5+ Group'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setPassengers(slot)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-semibold border transition text-center cursor-pointer ${passengers === slot
                        ? 'bg-[#b9974f] text-zinc-950 border-[#b9974f] font-black'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                        }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Site Visitor Address */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Site Visitor's Address *</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your address / locality (e.g. Koregaon Park, Baner, Pune)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                />
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1.5">
                  Special Notes or Requirements (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Interested in duplex/penthouse layouts, want sample flat walkthrough"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 resize-none transition"
                />
              </div>

              {/* Security & RERA Assurance */}
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Zero brokerage on direct developer units. RERA & RPS certified walkthrough.</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-[#b9974f] hover:bg-[#a4823d] active:scale-[0.99] disabled:opacity-50 text-zinc-950 font-black text-xs transition-all shadow-[0_10px_30px_rgba(185,151,79,0.35)] flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    <span>Confirming Site Visit...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Site Visit Request</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="relative flex items-center justify-center py-0.5">
                <div className="border-t border-zinc-800 w-full" />
                <span className="bg-zinc-950 px-2.5 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">or connect via</span>
                <div className="border-t border-zinc-800 w-full" />
              </div>

              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsAppClick}
                className="w-full py-3 bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-zinc-950 border border-[#25D366]/40 hover:border-[#25D366] font-bold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer shadow-sm hover:shadow-[0_4px_20px_rgba(37,211,102,0.25)]"
              >
                <svg
                  viewBox="0 0 32 32"
                  className="w-4 h-4 fill-current transition-transform duration-200 group-hover:scale-110"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M16 2C8.28 2 2 8.28 2 16c0 2.66.75 5.15 2.05 7.29L2.3 29.7l6.63-1.74A13.9 13.9 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm8.17 19.83c-.34.96-1.7 1.76-2.76 1.99-.73.16-1.68.29-4.88-1.04-4.09-1.69-6.72-5.83-6.93-6.1-.2-.28-1.67-2.22-1.67-4.23s1.05-3.01 1.43-3.42c.38-.41.82-.51 1.1-.51.27 0 .55 0 .79.02.25.01.59-.1.92.7.34.82 1.16 2.83 1.26 3.04.1.2.17.44.03.71-.13.27-.2.44-.4.68-.2.24-.43.53-.61.71-.21.21-.43.44-.19.86.25.41 1.09 1.8 2.34 2.91 1.61 1.43 2.97 1.88 3.39 2.09.42.2.67.18.92-.1.25-.28 1.07-1.24 1.35-1.67.28-.43.56-.36.94-.22.38.14 2.42 1.14 2.83 1.35.41.2.69.31.79.48.1.18.1 1.02-.24 1.98z" />
                </svg>
                <span>Book Site Visit via WhatsApp</span>
              </a>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

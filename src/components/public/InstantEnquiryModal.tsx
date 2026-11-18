'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  Phone,
  Mail,
  User,
  Calendar,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Clock
} from 'lucide-react';
import { getClientSession } from '@/lib/user-auth';

interface InstantEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  property?: {
    id?: string | number;
    name?: string;
    developer?: string;
    price?: string;
    location?: string;
    bhk?: string;
  };
  onSuccess?: (msg: string) => void;
}

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

export function InstantEnquiryModal({
  isOpen,
  onClose,
  property,
  onSuccess
}: InstantEnquiryModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [budget, setBudget] = useState('₹1.5 - 2.5 Cr');
  const [preferredTime, setPreferredTime] = useState('This Weekend (2:00 PM - 5:00 PM)');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const getWhatsAppUrl = () => {
    const parts: string[] = ['*ANV REEALTY - Luxury Property Enquiry*'];
    if (property?.name) {
      parts.push(`*Property:* ${property.name}`);
    }
    if (property?.location) {
      parts.push(`*Location:* ${property.location}`);
    }
    if (property?.price) {
      parts.push(`*Price:* ${property.price}`);
    }
    if (property?.bhk) {
      parts.push(`*Configuration:* ${property.bhk}`);
    }
    if (name.trim()) {
      parts.push(`*Client Name:* ${name.trim()}`);
    }
    if (phone.trim()) {
      parts.push(`*Phone:* ${phone.trim()}`);
    }
    if (email.trim()) {
      parts.push(`*Email:* ${email.trim()}`);
    }
    if (budget.trim()) {
      parts.push(`*Budget:* ${budget.trim()}`);
    }
    if (preferredTime.trim()) {
      parts.push(`*Preferred Time:* ${preferredTime.trim()}`);
    }
    if (message.trim()) {
      parts.push(`*Requirement/Query:* ${message.trim()}`);
    }
    parts.push('\nHello, I would like to enquire about this property and connect with your advisory desk.');
    return `https://wa.me/919373020701?text=${encodeURIComponent(parts.join('\n'))}`;
  };

  const handleWhatsAppClick = () => {
    if (phone.trim() || name.trim()) {
      fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'WhatsApp Inquirer',
          phone: phone.trim() || 'Not Provided',
          email: email.trim(),
          propertyName: property?.name || 'Exclusive Luxury Portfolio',
          propertyId: property?.id || null,
          budget,
          message: `[Initiated via WhatsApp Button] ${preferredTime ? `Preferred Timing: ${preferredTime}. ` : ''}${message.trim()}`,
          source: property?.name ? `WhatsApp Enquiry: ${property.name}` : 'Website WhatsApp Enquiry'
        })
      }).catch(() => {});
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setError(null);
      const user = getClientSession();
      if (user) {
        if (!name) setName(user.name);
        if (!phone && user.phone) setPhone(user.phone);
        if (!email && user.email) setEmail(user.email);
        if (user.budget) setBudget(user.budget);
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
          propertyName: property?.name || 'Exclusive Luxury Portfolio',
          propertyId: property?.id || null,
          budget,
          message: `${preferredTime ? `Preferred Timing: ${preferredTime}. ` : ''}${message.trim()}`,
          source: property?.name ? `Property Card: ${property.name}` : 'Website Consultation Request'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit enquiry');
      }

      setSubmitted(true);
      setConfirmationData(data);
      onSuccess?.(data.message || 'Enquiry dispatched successfully!');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg my-auto bg-zinc-950 text-white rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.8),0_0_40px_rgba(163, 136, 30,0.2)] border border-amber-500/30 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] transition-all animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-sm border border-white/10 transition"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-amber-500/20 bg-gradient-to-b from-zinc-900 to-zinc-950">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Private Client Concierge</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            {property ? `Enquire on ${property.name}` : 'Request Confidential Consultation'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            {property?.location ? `${property.location} • ` : ''}
            {property?.price ? `${property.price} • ` : ''}
            Direct access to dedicated luxury advisory partner
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto">
          {submitted ? (
            <div className="text-center py-6 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-[0_0_25px_rgba(185, 151, 79,0.3)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Your Site Visit Request is Done!</h4>
                <p className="text-xs text-emerald-300 font-semibold mt-1 max-w-sm mx-auto leading-relaxed">
                  We will contact you soon on <strong className="text-white font-mono">{phone}</strong> to coordinate your private viewing.
                </p>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 text-left text-xs space-y-2">
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Assigned Advisor:</span>
                  <span className="font-semibold text-white">Advisory Team</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Client Phone:</span>
                  <span className="font-semibold text-white">{phone}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Residence:</span>
                  <span className="font-semibold text-amber-300">{property?.name || 'Exclusive Portfolio'}</span>
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
                  onClick={onClose}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Enter your full name"
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
                    Target Budget
                  </label>
                  <input
                    type="text"
                    list="instant-budget-suggestions"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. ₹1.5 - 2.5 Cr, ₹3.5 Cr, Flexible..."
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-hidden"
                  />
                  <datalist id="instant-budget-suggestions">
                    <option value="₹1.5 - 2.5 Cr" />
                    <option value="₹2.5 - 4.0 Cr" />
                    <option value="₹4.0 - 6.0 Cr" />
                    <option value="₹6.0 Cr+ (Penthouse / Trophy)" />
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Preferred Walkthrough Timing
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    placeholder="e.g. This Saturday 4:00 PM"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-hidden transition"
                  />
                  <Clock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Specific Requirements or Questions
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Higher floor unit, 2 dedicated car parking slots, pre-approved bank loan..."
                  className="w-full p-3 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-hidden transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold text-xs rounded-xl shadow-[0_4px_20px_rgba(185, 151, 79,0.3)] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Submitting to Partner Desk...' : 'Dispatch Confidential Enquiry'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
                <WhatsAppIcon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                <span>Enquire Directly on WhatsApp</span>
              </a>

              <div className="pt-2 flex items-center justify-center gap-1.5 text-[10px] text-zinc-500">
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

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import {
  UserProfile,
  DEMO_BUYERS,
  DEMO_SALES_EXECUTIVES,
  ALL_DEMO_USERS,
  getClientSession,
  setClientSession
} from '@/lib/user-auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onSuccess?: (msg: string) => void;
  featureNotice?: string;
  onAuthenticated?: (user: UserProfile) => void;
}

export function AuthInquiryModal({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
  featureNotice,
  onAuthenticated
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(
    initialMode === 'signup' ? 'signup' : 'login'
  );

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode === 'signup' ? 'signup' : 'login');
    setError(null);
  }, [initialMode, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle Sign In
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    setTimeout(() => {
      const input = email.trim();
      
      if (!input || !password.trim()) {
        setLoading(false);
        setError('Please enter your email or phone and password.');
        return;
      }

      // Determine if input is email or phone and validate
      const isEmail = input.includes('@');
      if (isEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input)) {
          setLoading(false);
          setError('Please enter a valid email address.');
          return;
        }
      } else {
        const numericPhone = input.replace(/\D/g, '');
        if (numericPhone.length !== 10) {
          setLoading(false);
          setError('Phone number must be exactly 10 digits.');
          return;
        }
      }

      // Check if signing in as Sales Executive
      const foundExec = DEMO_SALES_EXECUTIVES.find((exec) => {
        const execEmail = exec.email.toLowerCase();
        const cleanInput = input.toLowerCase().trim();
        return (
          execEmail === cleanInput ||
          cleanInput === 'jennifer' ||
          cleanInput === 'muskan' ||
          (exec.id === 'exec-jennifer' && (cleanInput === 'jennifer@anvrealty.com' || cleanInput === 'jennifer.desai@anvrealty.com' || cleanInput === 'rohit.sharma@anvrealty.com')) ||
          (exec.id === 'exec-muskan' && (cleanInput === 'muskan@anvrealty.com' || cleanInput === 'muskan.kapoor@anvrealty.com' || cleanInput === 'priya.patil@anvrealty.com')) ||
          exec.phone.replace(/\s+/g, '') === input.replace(/\s+/g, '')
        );
      });

      if (foundExec) {
        if (password.trim() !== 'sales123' && password.trim() !== 'crm123' && password.trim() !== 'admin123') {
          setLoading(false);
          setError('Invalid password for Sales Executive. Please enter "sales123".');
          return;
        }

        setClientSession(foundExec);
        if (typeof window !== 'undefined') {
          localStorage.setItem('anv_crm_auth', 'true');
          localStorage.setItem('anv_crm_user', foundExec.name);
          localStorage.setItem('anv_crm_email', foundExec.email);
          localStorage.setItem('anv_crm_initials', foundExec.initials || 'SE');
          localStorage.setItem('anv_crm_title', foundExec.title || 'Sales Executive');
          localStorage.setItem('anv_crm_role', 'Sales Executive');
        }
        setLoading(false);
        onAuthenticated?.(foundExec);
        onSuccess?.(`Welcome back, ${foundExec.name} (${foundExec.title})!`);
        onClose();
        return;
      }

      const found = DEMO_BUYERS.find(
        (b) =>
          b.email.toLowerCase() === email.trim().toLowerCase() ||
          b.phone.replace(/\s+/g, '') === email.trim().replace(/\s+/g, '')
      );

      const user: UserProfile = found || {
        id: `usr-${Date.now()}`,
        name: email.split('@')[0].replace(/[._]/g, ' ') || 'Luxury Patron',
        email: email.includes('@') ? email.trim() : `${email.trim()}@client.anvrealty.com`,
        phone: phone.trim() || (email.startsWith('+') || /^\d+$/.test(email) ? email.trim() : '+91 98200 12345'),
        role: 'buyer',
        preferredCity: 'Pune',
        budget: '₹2 - 4 Cr'
      };

      setClientSession(user);
      setLoading(false);
      onAuthenticated?.(user);
      onSuccess?.(`Welcome back, ${user.name}!`);
      onClose();
    }, 400);
  };

  // Handle Register / Sign Up
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    setTimeout(() => {
      if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
        setLoading(false);
        setError('Please fill in all required fields.');
        return;
      }

      // Email Validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setLoading(false);
        setError('Please enter a valid email address.');
        return;
      }

      // Phone Validation (exactly 10 digits)
      const numericPhone = phone.trim().replace(/\D/g, '');
      if (numericPhone.length !== 10) {
        setLoading(false);
        setError('Phone number must be exactly 10 digits.');
        return;
      }

      const user: UserProfile = {
        id: `usr-${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: 'buyer',
        preferredCity: 'Pune',
        budget: '₹1.5 - 2.5 Cr'
      };

      try {
        fetch('/api/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            budget: '₹1.5 - 2.5 Cr',
            source: 'Portal Modal Registration',
            message: 'User registered account via luxury modal.'
          })
        }).catch(() => { });
      } catch (e) { }

      setClientSession(user);
      setLoading(false);
      onAuthenticated?.(user);
      onSuccess?.(`Account created successfully! Welcome, ${user.name}.`);
      onClose();
    }, 450);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[430px] my-auto bg-white rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.5),0_0_30px_rgba(163, 136, 30,0.15)] border border-amber-500/30 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] transition-all animate-in zoom-in-95 duration-200">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-sm border border-white/10 transition"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ambient Top Luxury Header */}
        <div className="relative bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950 text-white px-6 pt-6 pb-5 text-center shrink-0 border-b border-amber-500/20 overflow-hidden">
          {/* Subtle gold glow behind logo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-24 bg-amber-500/20 blur-2xl pointer-events-none" />

          {/* Logo Badge */}
          <div className="relative inline-flex items-center justify-center mb-2">
            <Image
              src="/LogoAnv-original.png"
              alt="ANV REEALTY"
              width={140}
              height={44}
              className="h-10 w-auto object-contain drop-shadow-md"
            />
          </div>
          <p className="text-[11px] text-amber-200/90 font-medium tracking-wide">
            Curated Sanctuaries for the Discerning Elite
          </p>

          {/* Eye-catching Segmented Tab Control: Sign In & Register ONLY */}
          <div className="mt-3.5 p-1 bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 max-w-[280px] mx-auto flex items-center">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs transition-all duration-200 ${mode === 'login'
                  ? 'bg-[#b9974f] text-zinc-950 font-black shadow-md scale-[1.02]'
                  : 'text-zinc-300 hover:text-white'
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs transition-all duration-200 ${mode === 'signup'
                  ? 'bg-[#b9974f] text-zinc-950 font-black shadow-md scale-[1.02]'
                  : 'text-zinc-300 hover:text-white'
                }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Scrollable Form Body with responsive padding */}
        <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain">
          {featureNotice && (
            <div className="mb-3.5 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-950 font-semibold flex items-center gap-2.5 shadow-xs animate-in fade-in">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <span className="leading-snug">{featureNotice}</span>
            </div>
          )}

          {error && (
            <div className="mb-3.5 p-2.5 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-700 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            /* ================= SIGN IN ================= */
            <div className="space-y-3.5">
              <div className="text-center pb-0.5">
                <h4 className="font-bold text-zinc-900 text-sm">Welcome Back</h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Sign in to access verified residences and inquiries
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Email Address or Phone
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. patron@anvrealty.com or +91 98..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-50/80 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition"
                    />
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider">
                      Password
                    </label>
                    <a href="#" className="text-[11px] text-amber-700 hover:text-amber-800 font-medium hover:underline">
                      Forgot Password?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your confidential password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 bg-zinc-50/80 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition"
                    />
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Eye-Catching Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-zinc-950 hover:bg-[#b9974f] hover:text-zinc-950 text-white text-xs font-bold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
                >
                  <span>{loading ? 'Signing in...' : 'Sign In to Portal'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#b9974f] group-hover:text-zinc-950 group-hover:translate-x-1 transition-transform" />
                </button>

              </form>

              {/* Bottom Switcher */}
              <div className="pt-2 text-center border-t border-zinc-100">
                <p className="text-xs text-zinc-500">
                  New to Anv Reealty?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError(null); }}
                    className="font-bold text-amber-700 hover:text-amber-800 hover:underline"
                  >
                    Register here
                  </button>
                </p>
              </div>
            </div>
          ) : (
            /* ================= REGISTER / SIGN UP ================= */
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="text-center pb-0.5">
                <h4 className="font-bold text-zinc-900 text-sm">Create New Account</h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Register to unlock luxury portfolio & private residences
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-zinc-50/80 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition"
                  />
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Email Address & Phone Number - Clean 2-column on desktop, comfortable spacing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      pattern="[0-9]{10}"
                      placeholder="10 digit number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full pl-8 pr-2 py-2 bg-zinc-50/80 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono transition"
                    />
                    <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="name@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 bg-zinc-50/80 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                    />
                    <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Choose a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-zinc-50/80 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition"
                  />
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Eye-Catching Complete Registration Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-zinc-950 hover:bg-[#b9974f] hover:text-zinc-950 text-white text-xs font-bold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:text-zinc-950 transition-colors" />
              </button>

              {/* Bottom Switcher */}
              <div className="pt-2 text-center border-t border-zinc-100">
                <p className="text-xs text-zinc-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null); }}
                    className="font-bold text-amber-700 hover:text-amber-800 hover:underline"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Trust footer banner */}
          <div className="mt-3 pt-2 text-center flex items-center justify-center gap-1.5 text-[10px] text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>256-Bit SSL Encrypted &bull; Strictly Confidential Patron Data</span>
          </div>
        </div>
      </div>
    </div>
  );
}

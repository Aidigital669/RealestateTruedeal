'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  Heart,
  Scale,
  User,
  ShieldCheck,
  LogOut,
  Calendar,
  Sparkles,
  ChevronDown,
  Menu,
  X,
  Building2,
  BookOpen,
  Phone,
  ArrowLeft
} from 'lucide-react';
import { usePropertyComparison } from '@/context/PropertyComparisonContext';
import { useSavedProperties } from '@/context/SavedPropertiesContext';
import {
  UserProfile,
  getClientSession,
  clearClientSession
} from '@/lib/user-auth';
import { AuthInquiryModal } from '@/components/auth/AuthInquiryModal';
import { InstantEnquiryModal } from '@/components/public/InstantEnquiryModal';

export function PublicHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { compareList } = usePropertyComparison();
  const { savedCount } = useSavedProperties();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  const [consultationModalOpen, setConsultationModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const checkSession = () => {
    setCurrentUser(getClientSession());
  };

  useEffect(() => {
    checkSession();
    window.addEventListener('anv_auth_change', checkSession);
    return () => window.removeEventListener('anv_auth_change', checkSession);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleOpenAuth = (
    mode: 'login' | 'signup' = 'login',
    notice?: string,
    redirect?: string
  ) => {
    setAuthModalMode(mode);
    setAuthNotice(notice || null);
    setPendingRedirect(redirect || null);
    setAuthModalOpen(true);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    if (!currentUser) {
      e.preventDefault();
      handleOpenAuth(
        'login',
        'Login or Sign Up is compulsory to access Property Comparison.',
        '/compare'
      );
    }
  };

  const handleSavedClick = (e: React.MouseEvent) => {
    if (!currentUser) {
      e.preventDefault();
      handleOpenAuth(
        'login',
        'Login or Sign Up is compulsory to access your Saved Shortlist.',
        '/saved'
      );
    }
  };

  const handleSignOut = () => {
    clearClientSession();
    setCurrentUser(null);
    setUserDropdownOpen(false);
    showToast('Signed out successfully.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const isNavActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-zinc-950 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl border border-zinc-800 animate-in fade-in">
          {toastMessage}
        </div>
      )}

      <header className={`fixed top-0 inset-x-0 w-full ${mobileMenuOpen ? 'z-[110]' : 'z-50'} px-3.5 sm:px-8 py-3 sm:py-3.5 flex items-center justify-between text-zinc-950 border-b border-zinc-200 backdrop-blur-md bg-white/95 shadow-2xs`}>
        {/* Brand & Back Button */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          {pathname !== '/' && (
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  router.back();
                } else {
                  router.push('/');
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer border border-zinc-200/90 group"
              title="Go back to previous page"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-zinc-700 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <Image
              src="/LogoAnv-original.png"
              alt="ANV REEALTY"
              width={160}
              height={60}
              className="h-8 sm:h-11 w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-200"
              priority
            />
          </Link>
        </div>


        {/* Right User & Consultation Controls */}
        <div className="flex items-center gap-2 sm:gap-4 text-sm">
          <div className="hidden lg:flex items-center gap-2 sm:gap-3">
            {/* Compare Link with counter */}
            <Link
              href="/compare"
              onClick={handleCompareClick}
              className="text-zinc-600 hover:text-amber-600 transition p-1.5 relative flex items-center cursor-pointer"
              title="Compare Properties (Login/Signup Required)"
            >
              <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
              {compareList.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-black font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                  {compareList.length}
                </span>
              )}
            </Link>

            {/* Saved Favorites / Shortlist */}
            <Link
              href="/saved"
              onClick={handleSavedClick}
              title="View Saved Shortlist (Login/Signup Required)"
              className="text-zinc-600 hover:text-amber-600 transition p-1.5 relative flex items-center cursor-pointer"
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${savedCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-black font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {savedCount}
                </span>
              )}
            </Link>

            {/* User Login / Profile Dropdown */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-full py-1 pl-1 pr-2 sm:pr-3 text-xs font-semibold transition text-zinc-900"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-black font-bold text-[10px] flex items-center justify-center">
                    {currentUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[80px] truncate">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-zinc-500" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-2xl shadow-2xl p-2 z-50 text-xs text-zinc-600 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-zinc-100 mb-1">
                      <p className="font-bold text-zinc-900 text-sm">{currentUser.name}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 border border-amber-500/30">
                        Verified Patron &bull; {currentUser.preferredCity || 'Pune'}
                      </span>
                    </div>

                    <Link
                      href="/properties"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-50 text-zinc-700 hover:text-amber-700 transition cursor-pointer"
                    >
                      <Building2 className="w-4 h-4 text-amber-600" />
                      <span>Browse Properties</span>
                    </Link>

                    <Link
                      href="/saved"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-50 text-zinc-700 hover:text-rose-700 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                        <span>My Saved Shortlist</span>
                      </div>
                      {savedCount > 0 && (
                        <span className="bg-amber-400 text-black font-extrabold text-[10px] px-1.5 py-0.2 rounded-full">
                          {savedCount}
                        </span>
                      )}
                    </Link>

                    <Link
                      href="/compare"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-50 text-zinc-700 hover:text-amber-700 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-amber-600" />
                        <span>Property Comparison</span>
                      </div>
                      {compareList.length > 0 && (
                        <span className="bg-amber-400 text-black font-extrabold text-[10px] px-1.5 py-0.2 rounded-full">
                          {compareList.length}
                        </span>
                      )}
                    </Link>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setConsultationModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-50 text-zinc-700 hover:text-amber-700 transition cursor-pointer"
                    >
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <span>Book Consultation</span>
                    </button>

                    <div className="border-t border-zinc-100 my-1" />

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => handleOpenAuth('login')}
                className="hover:text-amber-400 font-medium transition cursor-pointer flex items-center gap-1 text-xs sm:text-sm px-2 py-1"
              >
                <User className="w-4 h-4" />
                <span className="hidden xs:inline">Login</span>
              </button>
            )}
          </div>

          {/* Schedule Consultant Button (Moved to the end) */}
          <button
            onClick={() => setConsultationModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-full transition shadow-sm hover:shadow group ml-1 shrink-0 cursor-pointer"
          >
            <Calendar className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <span>Schedule Consultant</span>
          </button>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>
      {/* Layout Spacer to preserve natural flow under the fixed navbar */}
      <div className="h-[58px] sm:h-[73px] w-full shrink-0" aria-hidden="true" />

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-white lg:hidden pt-24 px-5 pb-8 flex flex-col justify-between overflow-y-auto animate-in fade-in slide-in-from-top-6 duration-200 text-zinc-900">
          <div className="space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-2">
              Navigation Menu
            </div>
            
            <div className="flex flex-col gap-2">
              <Link
                href="/compare"
                onClick={(e) => { setMobileMenuOpen(false); handleCompareClick(e); }}
                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 transition"
              >
                <div className="flex items-center gap-3 font-bold text-sm">
                  <Scale className="w-4 h-4 text-amber-600" />
                  <span>Compare Properties</span>
                </div>
                {compareList.length > 0 && (
                  <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">{compareList.length}</span>
                )}
              </Link>
              
              <Link
                href="/saved"
                onClick={(e) => { setMobileMenuOpen(false); handleSavedClick(e); }}
                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 transition"
              >
                <div className="flex items-center gap-3 font-bold text-sm">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>Saved Shortlist</span>
                </div>
                {savedCount > 0 && (
                  <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">{savedCount}</span>
                )}
              </Link>
              
              {!currentUser ? (
                <button
                  onClick={() => { setMobileMenuOpen(false); handleOpenAuth('login'); }}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 transition font-bold text-sm w-full text-left"
                >
                  <User className="w-4 h-4 text-zinc-600" />
                  <span>Sign In / Create Account</span>
                </button>
              ) : (
                <button
                  onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 transition font-bold text-sm w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out ({currentUser.name.split(' ')[0]})</span>
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-200 space-y-2 mt-4">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setConsultationModalOpen(true);
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-black p-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule Private Consultation</span>
              </button>

              <a
                href="tel:+919373020701"
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold p-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 border border-zinc-800"
              >
                <Phone className="w-4 h-4 text-amber-400" />
                <span>Call Helpline: +91 93730 20701</span>
              </a>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
            <span>&copy; {new Date().getFullYear()} Anv Reealty</span>
            <span className="text-amber-600 font-semibold">Pune Verified</span>
          </div>
        </div>
      )}

      {/* Global Consultation / Enquiry Modal */}
      <InstantEnquiryModal
        isOpen={consultationModalOpen}
        onClose={() => setConsultationModalOpen(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Global Auth Modal */}
      <AuthInquiryModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthNotice(null);
          setPendingRedirect(null);
        }}
        initialMode={authModalMode}
        featureNotice={authNotice || undefined}
        onSuccess={(msg) => showToast(msg)}
        onAuthenticated={() => {
          if (pendingRedirect) {
            const dest = pendingRedirect;
            setPendingRedirect(null);
            router.push(dest);
          }
        }}
      />
    </>
  );
}

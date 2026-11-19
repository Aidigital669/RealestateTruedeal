'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Lock,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Share2,
  LogIn,
  ChevronRight
} from 'lucide-react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { AuthInquiryModal } from '@/components/auth/AuthInquiryModal';
import { UserProfile, getClientSession } from '@/lib/user-auth';

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [session, setSession] = useState<UserProfile | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [article, setArticle] = useState<any>(null);
  const [loadingArticle, setLoadingArticle] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const checkAuth = () => {
    const current = getClientSession();
    setSession(current);
    setLoadingSession(false);
  };

  useEffect(() => {
    checkAuth();
    window.addEventListener('anv_auth_change', checkAuth);
    return () => window.removeEventListener('anv_auth_change', checkAuth);
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/blogs/${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.article) {
          setArticle(data.article);
        }
      })
      .catch((err) => console.log('Article load error:', err))
      .finally(() => setLoadingArticle(false));
  }, [id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      showToast('Article link copied to clipboard!');
    }
  };

  if (loadingArticle || loadingSession) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-400 font-semibold tracking-wider uppercase">
            Decrypting Editorial Dossier...
          </p>
        </div>
      </div>
    );
  }

  const articleTitle = article?.title || 'Luxury Real Estate Intelligence Dossier';

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans flex flex-col">
      <PublicHeader />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-zinc-950 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-500/40 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pt-24 pb-20 max-w-4xl mx-auto px-4 sm:px-6 w-full">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/#insights-section"
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600 hover:text-amber-800 transition py-1.5 px-3 rounded-lg hover:bg-zinc-100"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Market Insights</span>
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition py-1.5 px-3 rounded-lg hover:bg-zinc-100 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Dossier</span>
          </button>
        </div>

        {/* Article Header */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              {article?.category || 'Market Report'}
            </span>
            <span className="text-zinc-300">&bull;</span>
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              {article?.readTime || '6 min read'}
            </span>
            <span className="text-zinc-300">&bull;</span>
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              {article?.publishedAt || 'October 2026'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-zinc-950 tracking-tight leading-tight">
            {articleTitle}
          </h1>

          {article?.subtitle && (
            <p className="text-base sm:text-lg text-zinc-600 font-medium leading-relaxed">
              {article.subtitle}
            </p>
          )}

          {/* Author Strip */}
          <div className="flex items-center gap-3 pt-2 border-t border-zinc-200">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 font-black flex items-center justify-center text-sm border border-amber-300/80">
              {article?.author ? article.author.charAt(0) : 'A'}
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900">
                {article?.author || 'ANV Research'}
              </div>
              <div className="text-[11px] text-zinc-500">
                {article?.authorRole || 'Senior Real Estate Intelligence Advisor'}
              </div>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {article?.image && (
          <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden mb-8 shadow-sm border border-zinc-200">
            <Image
              src={article.image}
              alt={articleTitle}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* ================= GATED VS UNLOCKED CONTENT ================= */}
        {!session ? (
          /* ================= LOCKED PATRON ACCESS GATE ================= */
          <div className="space-y-6">
            {/* Blurred Preview Teaser */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
              <p className="text-base text-zinc-800 font-medium leading-relaxed mb-4">
                {article?.excerpt ||
                  'An institutional analysis of property appreciation, infrastructure expansion, and luxury residential demand in this high-growth corridor.'}
              </p>
              <p className="text-sm text-zinc-500 leading-relaxed blur-xs select-none">
                {article?.content?.[0] ||
                  'Detailed macroeconomic valuations, yield benchmarks, and developer track records are restricted to verified accounts.'}
              </p>
              <div className="h-20 bg-gradient-to-t from-white via-white/80 to-transparent absolute bottom-0 inset-x-0 pointer-events-none" />
            </div>

            {/* MANDATORY LOGIN PROMPT CARD */}
            <div className="bg-gradient-to-b from-zinc-950 to-zinc-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-amber-600/30 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-lg mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-inner">
                  <Lock className="w-7 h-7 text-amber-400" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Patron Login Required</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Sign In to Read Full Article
                </h2>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  This exclusive market intelligence dossier contains privileged valuation metrics, infrastructure timelines, and developer escrow data. Login is compulsory to view full articles.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="w-full sm:w-auto px-6 py-3 bg-[#b9974f] hover:bg-[#a4823d] text-zinc-950 text-xs font-black rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Read Article</span>
                  </button>

                  <Link
                    href={`/login?redirect=/blogs/${encodeURIComponent(id)}`}
                    className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <span>Open Login Page</span>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </Link>
                </div>

                <div className="pt-4 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-center gap-2">
                  <span>New to Anv Reealty?</span>
                  <Link
                    href={`/login?tab=register&redirect=/blogs/${encodeURIComponent(id)}`}
                    className="text-amber-400 font-bold hover:underline"
                  >
                    Create Free Patron Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================= UNLOCKED PATRON FULL ARTICLE ================= */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Authenticated Patron Badge */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 px-4 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">
                  Patron Access Active: <strong>{session.name}</strong> ({session.email})
                </span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Unlocked
              </span>
            </div>

            {/* Key Valuation & Growth Metrics */}
            {article?.metrics && article.metrics.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
                {article.metrics.map((m: any, idx: number) => (
                  <div key={idx} className="p-2.5">
                    <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      {m.label}
                    </div>
                    <div className="text-lg sm:text-xl font-black text-amber-900 mt-1">
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Full Body Content Paragraphs */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-10 shadow-2xs space-y-6 text-sm sm:text-base text-zinc-700 leading-relaxed">
              {article?.content && Array.isArray(article.content) ? (
                article.content.map((para: string, idx: number) => (
                  <p key={idx}>{para}</p>
                ))
              ) : (
                <p>{article?.content || article?.excerpt}</p>
              )}
            </div>

            {/* Key Takeaways & Recommendations Box */}
            {article?.keyTakeaways && article.keyTakeaways.length > 0 && (
              <div className="bg-amber-50/70 border border-amber-300/80 rounded-2xl p-6 sm:p-8 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>Strategic Takeaways for Patrons</span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-800">
                  {article.keyTakeaways.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Private Advisory Consultation Card */}
            <div className="bg-zinc-950 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 border border-zinc-800">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-base font-bold text-white">
                  Looking to acquire property in this corridor?
                </h3>
                <p className="text-xs text-zinc-400 max-w-md">
                  Request an off-market consultation or private developer tour with Anv Reealty advisors.
                </p>
              </div>
              <Link
                href="/#properties-section"
                className="px-5 py-2.5 bg-[#b9974f] hover:bg-[#a4823d] text-zinc-950 text-xs font-black rounded-xl transition shrink-0 cursor-pointer"
              >
                Explore Curated Properties
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Auth Modal for In-Page Login */}
      <AuthInquiryModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode="login"
        onSuccess={(msg) => {
          showToast(msg);
          checkAuth();
        }}
      />
    </div>
  );
}

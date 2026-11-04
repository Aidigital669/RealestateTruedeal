'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-amber-400" />
      </div>
      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2">
        Something went wrong
      </h2>
      <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
        An unexpected error occurred while loading this page. Please try reloading or return to the homepage.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-md"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reload Page</span>
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-bold border border-zinc-800 flex items-center gap-2 transition"
        >
          <Home className="w-4 h-4" />
          <span>Homepage</span>
        </Link>
      </div>
    </div>
  );
}

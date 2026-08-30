'use client';

import React, { useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service if desired
    console.error('Lumira Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-full max-w-md bg-[var(--glass-card-bg)] backdrop-blur-3xl border border-[var(--glass-border)] shadow-[var(--glass-shadow-lg)] rounded-3xl p-8 space-y-4 animate-in fade-in">
        {/* Error Emblem */}
        <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-7 h-7 stroke-[1.75]" />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
            Something went wrong
          </h2>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            We encountered an unexpected issue while illuminating this page.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => reset()}
          className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white text-xs font-bold shadow-lg transition-transform active:scale-95 cursor-pointer inline-flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
}

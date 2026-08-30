'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-[var(--glass-card-bg)] backdrop-blur-3xl border border-[var(--glass-border)] shadow-[var(--glass-shadow-lg)] rounded-3xl p-8 space-y-5 animate-in fade-in">
        {/* Brand Emblem */}
        <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-xl ring-2 ring-purple-500/40 mx-auto">
          <Image
            src="/lumira-logo.png"
            alt="Lumira Logo"
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-bold tracking-widest text-[var(--accent-blue)] uppercase">
            Error 404
          </span>
          <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Moment Not Found
          </h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-xs mx-auto">
            The page or creative moment you&apos;re looking for has either moved or ceased to illuminate.
          </p>
        </div>

        {/* Action Links */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white text-xs font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return Home</span>
          </Link>

          <Link
            href="/explore"
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[var(--glass-input-bg)] hover:bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] text-[var(--text-primary)] text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explore Discovery</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

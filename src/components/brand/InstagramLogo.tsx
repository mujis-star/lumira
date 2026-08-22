'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface InstagramLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  iconOnly?: boolean;
  className?: string;
  showTagline?: boolean;
}

export function InstagramLogo({
  size = 'md',
  iconOnly = false,
  className = '',
  showTagline = false,
}: InstagramLogoProps) {
  if (iconOnly) {
    const iconDimensions = {
      sm: 'w-7 h-7',
      md: 'w-8 h-8',
      lg: 'w-10 h-10',
      xl: 'w-12 h-12',
    };

    return (
      <Link
        href="/"
        className={`inline-flex items-center justify-center group ${className}`}
        aria-label="Lumira Home"
      >
        <div
          className={`relative ${iconDimensions[size]} rounded-xl overflow-hidden shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform`}
        >
          <Image
            src="/lumira-logo.png"
            alt="Lumira Logo"
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>
      </Link>
    );
  }

  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 select-none group ${className}`}
      aria-label="Lumira Home"
    >
      {/* Lumira Glowing Emblem */}
      <div
        className={`relative ${iconSizes[size]} rounded-xl overflow-hidden shadow-lg shadow-purple-500/25 shrink-0 group-hover:scale-105 transition-transform`}
      >
        <Image
          src="/lumira-logo.png"
          alt="Lumira Logo"
          fill
          className="object-cover"
          priority
          unoptimized
        />
      </div>

      {/* Lumira Brand Wordmark & Tagline */}
      <div className="flex flex-col min-w-0">
        <span
          className={`font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity ${textSizes[size]}`}
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            letterSpacing: '-0.02em',
          }}
        >
          Lumira
        </span>
        {showTagline && (
          <span className="text-[9px] font-semibold tracking-widest text-[var(--text-secondary)] uppercase">
            Where Moments Illuminate
          </span>
        )}
      </div>
    </Link>
  );
}

// Alias for seamless backward compatibility
export const LumiraLogo = InstagramLogo;

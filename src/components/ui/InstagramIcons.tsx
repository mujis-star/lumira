'use client';

import React from 'react';

interface IconProps {
  className?: string;
  filled?: boolean;
}

// 1. Home Icon (Instagram style)
export function InstagramHomeIcon({ className = 'w-6 h-6', filled = false }: IconProps) {
  if (filled) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
      >
        <path d="M22 20.25V9.45a2.25 2.25 0 0 0-.79-1.72L13.21 1.54a1.86 1.86 0 0 0-2.42 0L2.79 7.73A2.25 2.25 0 0 0 2 9.45v10.8A2.25 2.25 0 0 0 4.25 22.5h4.5a1.25 1.25 0 0 0 1.25-1.25v-4.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4.5a1.25 1.25 0 0 0 1.25 1.25h4.5A2.25 2.25 0 0 0 22 20.25Z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 9.5 12 2.5l9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

// 2. Search Icon (Instagram style)
export function InstagramSearchIcon({ className = 'w-6 h-6', filled = false }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={filled ? '2.5' : '2'}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// 3. Create [+] Icon (Instagram style)
export function InstagramCreateIcon({ className = 'w-6 h-6', filled = false }: IconProps) {
  if (filled) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
      >
        <path fillRule="evenodd" d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM12 7.5a.75.75 0 0 1 .75.75v3h3a.75.75 0 0 1 0 1.5h-3v3a.75.75 0 0 1-1.5 0v-3h-3a.75.75 0 0 1 0-1.5h3v-3A.75.75 0 0 1 12 7.5Z" clipRule="evenodd" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="4" />
      <line x1="12" x2="12" y1="8" y2="16" />
      <line x1="8" x2="16" y1="12" y2="12" />
    </svg>
  );
}

// 4. Reels Icon (Authentic Instagram Reels clapper with play button)
export function InstagramReelsIcon({ className = 'w-6 h-6', filled = false }: IconProps) {
  if (filled) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-2 14.5v-9l6 4.5-6 4.5Z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Outer rounded clapper frame */}
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      {/* Upper diagonal slashes */}
      <line x1="2.5" y1="8" x2="21.5" y2="8" />
      <line x1="7.5" y1="2.5" x2="6" y2="8" />
      <line x1="13.5" y1="2.5" x2="12" y2="8" />
      <line x1="19.5" y1="2.5" x2="18" y2="8" />
      {/* Center play triangle */}
      <polygon points="10 11 16 14.5 10 18 10 11" fill="currentColor" />
    </svg>
  );
}

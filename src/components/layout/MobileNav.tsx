'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useIsMounted } from '@/lib/useIsMounted';
import { Avatar } from '../ui/Avatar';
import {
  InstagramHomeIcon,
  InstagramSearchIcon,
  InstagramCreateIcon,
  InstagramReelsIcon,
} from '../ui/InstagramIcons';

interface MobileNavProps {
  onCreateClick: () => void;
}

export function MobileNav({ onCreateClick }: MobileNavProps) {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const mounted = useIsMounted();

  const isHome = pathname === '/';
  const isSearch = pathname === '/explore' || pathname === '/search';
  const isReels = pathname === '/reels';
  const isProfile = currentUser ? pathname === `/profile/${currentUser.username}` : false;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-primary)] border-t border-[var(--border-color)] px-4 py-2.5 flex items-center justify-around select-none">
      {/* 1. Home */}
      <Link
        href="/"
        className={`p-1.5 transition-transform active:scale-90 ${
          isHome ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)] opacity-80'
        }`}
        aria-label="Home"
      >
        <InstagramHomeIcon className="w-6 h-6" filled={isHome} />
      </Link>

      {/* 2. Search (Q) */}
      <Link
        href="/explore"
        className={`p-1.5 transition-transform active:scale-90 ${
          isSearch ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)] opacity-80'
        }`}
        aria-label="Search"
      >
        <InstagramSearchIcon className="w-6 h-6" filled={isSearch} />
      </Link>

      {/* 3. Create ([+]) */}
      <button
        onClick={onCreateClick}
        className="p-1.5 text-[var(--text-primary)] opacity-80 hover:opacity-100 transition-transform active:scale-90 cursor-pointer"
        aria-label="Create"
      >
        <InstagramCreateIcon className="w-6 h-6" />
      </button>

      {/* 4. Reels (Clapper) */}
      <Link
        href="/reels"
        className={`p-1.5 transition-transform active:scale-90 ${
          isReels ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)] opacity-80'
        }`}
        aria-label="Reels"
      >
        <InstagramReelsIcon className="w-6 h-6" filled={isReels} />
      </Link>

      {/* 5. Profile */}
      <Link
        href={currentUser ? `/profile/${currentUser.username}` : '/auth'}
        className={`p-0.5 rounded-full transition-all active:scale-90 ${
          isProfile ? 'ring-2 ring-[var(--text-primary)] ring-offset-2 ring-offset-[var(--bg-primary)]' : ''
        }`}
        aria-label="Profile"
      >
        {mounted && currentUser ? (
          <Avatar src={currentUser.avatarUrl} alt={currentUser.displayName} size="xs" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        )}
      </Link>
    </nav>
  );
}

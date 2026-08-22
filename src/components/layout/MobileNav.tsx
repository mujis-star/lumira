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
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-40">
      <nav className="bg-[var(--glass-modal-bg)] backdrop-blur-3xl border border-[var(--glass-border-highlight)] shadow-[var(--glass-shadow-lg)] rounded-2xl px-4 py-2 flex items-center justify-around select-none">
        {/* 1. Home */}
        <Link
          href="/"
          className={`p-2 rounded-xl transition-all active:scale-90 ${
            isHome
              ? 'text-[var(--accent-blue)] bg-[var(--glass-bg-hover)]'
              : 'text-[var(--text-primary)] opacity-80 hover:opacity-100'
          }`}
          aria-label="Home"
        >
          <InstagramHomeIcon className="w-5 h-5" filled={isHome} />
        </Link>

        {/* 2. Search (Q) */}
        <Link
          href="/explore"
          className={`p-2 rounded-xl transition-all active:scale-90 ${
            isSearch
              ? 'text-[var(--accent-blue)] bg-[var(--glass-bg-hover)]'
              : 'text-[var(--text-primary)] opacity-80 hover:opacity-100'
          }`}
          aria-label="Search"
        >
          <InstagramSearchIcon className="w-5 h-5" filled={isSearch} />
        </Link>

        {/* 3. Create ([+]) */}
        <button
          onClick={onCreateClick}
          className="p-2 rounded-xl text-[var(--text-primary)] opacity-90 hover:opacity-100 hover:bg-[var(--glass-bg-hover)] transition-all active:scale-90 cursor-pointer"
          aria-label="Create"
        >
          <InstagramCreateIcon className="w-5 h-5" />
        </button>

        {/* 4. Reels (Clapper) */}
        <Link
          href="/reels"
          className={`p-2 rounded-xl transition-all active:scale-90 ${
            isReels
              ? 'text-[var(--accent-blue)] bg-[var(--glass-bg-hover)]'
              : 'text-[var(--text-primary)] opacity-80 hover:opacity-100'
          }`}
          aria-label="Reels"
        >
          <InstagramReelsIcon className="w-5 h-5" filled={isReels} />
        </Link>

        {/* 5. Profile */}
        <Link
          href={currentUser ? `/profile/${currentUser.username}` : '/auth'}
          className={`p-1 rounded-full transition-all active:scale-90 ${
            isProfile ? 'ring-2 ring-[var(--accent-blue)] ring-offset-2 ring-offset-transparent' : ''
          }`}
          aria-label="Profile"
        >
          {mounted && currentUser ? (
            <Avatar src={currentUser.avatarUrl} alt={currentUser.displayName} size="xs" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          )}
        </Link>
      </nav>
    </div>
  );
}

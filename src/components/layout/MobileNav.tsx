'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useIsMounted } from '@/lib/useIsMounted';
import { Avatar } from '../ui/Avatar';
import { Plus } from 'lucide-react';
import {
  InstagramHomeIcon,
  InstagramSearchIcon,
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
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
      <nav className="bg-[#12131c]/90 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-full px-5 py-2.5 flex items-center justify-between select-none max-w-sm mx-auto">
        {/* 1. Home */}
        <Link
          href="/"
          className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all active:scale-90 ${
            isHome
              ? 'bg-white/15 text-white shadow-xs'
              : 'text-neutral-400 hover:text-white'
          }`}
          aria-label="Home"
        >
          <InstagramHomeIcon className="w-5 h-5" filled={isHome} />
        </Link>

        {/* 2. Search / Explore */}
        <Link
          href="/explore"
          className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all active:scale-90 ${
            isSearch
              ? 'bg-white/15 text-white shadow-xs'
              : 'text-neutral-400 hover:text-white'
          }`}
          aria-label="Search and Explore"
        >
          <InstagramSearchIcon className="w-5 h-5" filled={isSearch} />
        </Link>

        {/* 3. Create Moment (+) */}
        <button
          type="button"
          onClick={onCreateClick}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-[#8b5cf6] to-[#6366f1] text-white shadow-lg shadow-purple-500/25 transition-all active:scale-90 cursor-pointer"
          aria-label="Create new moment"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* 4. Reels */}
        <Link
          href="/reels"
          className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all active:scale-90 ${
            isReels
              ? 'bg-white/15 text-white shadow-xs'
              : 'text-neutral-400 hover:text-white'
          }`}
          aria-label="Reels"
        >
          <InstagramReelsIcon className="w-5 h-5" filled={isReels} />
        </Link>

        {/* 5. Profile */}
        <Link
          href={currentUser ? `/profile/${currentUser.username}` : '/auth'}
          className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all active:scale-90 ${
            isProfile ? 'ring-2 ring-purple-500 bg-white/10' : ''
          }`}
          aria-label="Profile"
        >
          {mounted && currentUser ? (
            <Avatar src={currentUser.avatarUrl} alt={currentUser.displayName} size="xs" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-neutral-700" />
          )}
        </Link>
      </nav>
    </div>
  );
}


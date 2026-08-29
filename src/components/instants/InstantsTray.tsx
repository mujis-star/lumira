'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { useInstants } from '@/context/InstantContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { formatRemainingTime } from '@/lib/utils';
import { Plus, Zap, ChevronRight } from 'lucide-react';

interface InstantsTrayProps {
  showTitle?: boolean;
  onOpenInstant?: (instantId: string) => void;
}

export function InstantsTray({ showTitle = true, onOpenInstant }: InstantsTrayProps) {
  const { todayInstants, userInstants, openInstantViewer, openInstantCreator } = useInstants();
  const { currentUser } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mouse wheel horizontal scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta !== 0) {
        e.preventDefault();
        el.scrollLeft += delta * 1.2;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const hasUserInstant = userInstants.length > 0;
  const friendInstants = todayInstants.filter((item) => item.creatorId !== currentUser?.id);

  const handleInstantClick = (id: string) => {
    if (onOpenInstant) {
      onOpenInstant(id);
    } else {
      openInstantViewer(id);
    }
  };

  return (
    <div className="w-full select-none px-3 sm:px-4 py-2 bg-transparent border-b border-[var(--glass-border-subtle)]">
      {showTitle && (
        <div className="flex items-center justify-between mb-2">
          <Link
            href="/instants"
            className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)] hover:text-[var(--accent-blue)] transition-colors group cursor-pointer"
          >
            <div className="p-1 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-xs">
              <Zap className="w-3 h-3 fill-current" />
            </div>
            <span>Instants</span>
            <ChevronRight className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <button
            type="button"
            onClick={openInstantCreator}
            className="text-[11px] text-[var(--accent-blue)] font-bold hover:underline cursor-pointer flex items-center gap-0.5"
          >
            <Plus className="w-3 h-3" />
            <span>New Instant</span>
          </button>
        </div>
      )}

      {/* Horizontal Tray Scroll */}
      <div
        ref={scrollRef}
        className="flex items-center gap-3.5 overflow-x-auto no-scrollbar scroll-smooth py-1"
      >
        {/* Your Instant Bubble */}
        <div className="flex flex-col items-center shrink-0 w-[68px]">
          <div
            onClick={() => {
              if (hasUserInstant) {
                handleInstantClick(userInstants[0].id);
              } else {
                openInstantCreator();
              }
            }}
            className="relative cursor-pointer group flex flex-col items-center"
          >
            <div
              className={`relative p-[2px] rounded-full transition-transform group-hover:scale-105 ${
                hasUserInstant
                  ? 'bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-md'
                  : 'border border-dashed border-[var(--glass-border-highlight)]'
              }`}
            >
              <Avatar
                src={currentUser?.avatarUrl || '/images/avatar-mujeeb.png'}
                alt={currentUser?.displayName || 'You'}
                size="md"
              />
              {!hasUserInstant && (
                <div className="absolute -bottom-0.5 -right-0.5 p-1 rounded-full bg-[var(--accent-blue)] text-white shadow ring-2 ring-[var(--bg-primary)]">
                  <Plus className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </div>

            {hasUserInstant && (
              <span className="absolute -bottom-1.5 px-1.5 py-0.2 rounded-full bg-[var(--bg-primary)] border border-[var(--glass-border)] text-[9px] font-bold text-amber-500 shadow-xs">
                {formatRemainingTime(userInstants[0].expiresAt)}
              </span>
            )}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] mt-2 truncate max-w-[66px] text-center font-medium">
            Your Instant
          </span>
        </div>

        {/* Friends' Instants */}
        {friendInstants.map((instant) => (
          <div
            key={instant.id}
            onClick={() => handleInstantClick(instant.id)}
            className="flex flex-col items-center shrink-0 w-[68px] cursor-pointer group"
          >
            <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 group-hover:scale-105 transition-transform shadow-md">
              <Avatar
                src={instant.creator.avatarUrl}
                alt={instant.creator.displayName}
                size="md"
                isVerified={instant.creator.isVerified}
              />
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-[var(--glass-modal-bg)] backdrop-blur-md border border-[var(--glass-border)] text-[9px] font-bold text-rose-500 shadow-xs whitespace-nowrap">
                {formatRemainingTime(instant.expiresAt)}
              </span>
            </div>
            <span className="text-[11px] text-[var(--text-secondary)] mt-2 truncate max-w-[66px] text-center font-medium group-hover:text-[var(--text-primary)]">
              {instant.creator.username.split('.')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

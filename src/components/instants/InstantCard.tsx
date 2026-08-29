'use client';

import React from 'react';
import Image from 'next/image';
import { InstantItem } from '@/lib/types';
import { Avatar } from '@/components/ui/Avatar';
import { formatRemainingTime, generateInstantCssFilter } from '@/lib/utils';
import { Play, Eye, Flame, Lock } from 'lucide-react';

interface InstantCardProps {
  instant: InstantItem;
  onClick: () => void;
}

export function InstantCard({ instant, onClick }: InstantCardProps) {
  const cssFilter = generateInstantCssFilter(instant.adjustments, instant.filterId, instant.filterIntensity);
  const remainingStr = formatRemainingTime(instant.expiresAt);
  const totalReactions = instant.reactions.length;

  return (
    <div
      onClick={onClick}
      className="group relative aspect-[9/16] sm:aspect-[4/5] md:aspect-[9/16] rounded-3xl overflow-hidden cursor-pointer bg-[var(--glass-card-bg)] border border-[var(--glass-border)] hover:border-[var(--glass-border-highlight)] shadow-[var(--glass-shadow)] hover:shadow-[var(--glass-shadow-lg)] transition-all duration-300 select-none hover:-translate-y-1"
    >
      {/* Media Background */}
      {instant.mediaType === 'video' ? (
        <div className="relative w-full h-full bg-black">
          <video
            src={instant.mediaUrl}
            className="w-full h-full object-cover"
            style={{ filter: cssFilter }}
            muted
            playsInline
            preload="metadata"
          />
          <div className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 backdrop-blur-md text-white">
            <Play className="w-3.5 h-3.5 fill-white" />
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full">
          <Image
            src={instant.mediaUrl}
            alt={instant.caption || 'Instant media'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            style={{ filter: cssFilter }}
            unoptimized
          />
        </div>
      )}

      {/* Glass Gradient Scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-90 group-hover:opacity-100 transition-opacity" />

      {/* Top Bar: Creator Info & Visibility */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar
            src={instant.creator.avatarUrl}
            alt={instant.creator.displayName}
            size="xs"
            isVerified={instant.creator.isVerified}
          />
          <span className="text-xs font-bold text-white drop-shadow truncate max-w-[100px]">
            {instant.creator.username}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {instant.visibility === 'Close Friends' && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/80 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
              <Lock className="w-2.5 h-2.5" />
              <span className="hidden sm:inline">Close</span>
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold shadow-xs">
            {remainingStr}
          </span>
        </div>
      </div>

      {/* Center Sticker / Text Peek */}
      {instant.textOverlays && instant.textOverlays.length > 0 && (
        <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 text-center pointer-events-none z-10">
          <p className="text-xs font-bold text-white bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-xl inline-block border border-white/10 shadow-sm truncate max-w-full">
            {instant.textOverlays[0].text}
          </p>
        </div>
      )}

      {/* Bottom Bar: Stats & Music Badge */}
      <div className="absolute bottom-3 left-3 right-3 space-y-1.5 z-10">
        {instant.attachedMusic && (
          <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-300 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 w-fit truncate max-w-full">
            <span className="animate-pulse">🎵</span>
            <span className="truncate">{instant.attachedMusic.title}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-white/90 text-xs pt-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium">
            <span className="flex items-center gap-0.5">
              <Eye className="w-3.5 h-3.5" />
              {instant.viewsCount}
            </span>
            {totalReactions > 0 && (
              <span className="flex items-center gap-0.5 text-rose-400 font-bold ml-1">
                <Flame className="w-3.5 h-3.5 fill-current" />
                {totalReactions}
              </span>
            )}
          </div>

          <span className="text-[10px] text-white/70 font-semibold group-hover:text-white transition-colors">
            Tap to view →
          </span>
        </div>
      </div>
    </div>
  );
}

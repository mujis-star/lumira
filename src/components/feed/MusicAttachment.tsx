'use client';

import React from 'react';
import { Music } from 'lucide-react';

interface MusicAttachmentProps {
  audioTrack?: {
    title: string;
    artist: string;
  };
}

export function MusicAttachment({ audioTrack }: MusicAttachmentProps) {
  if (!audioTrack || !audioTrack.title) return null;

  return (
    <div className="px-3.5 pb-2.5">
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--glass-input-bg)] border border-[var(--glass-border-subtle)] text-[11px] text-[var(--text-secondary)] font-medium max-w-full">
        <div className="w-3.5 h-3.5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 animate-spin-slow">
          <Music className="w-2 h-2" />
        </div>
        <span className="truncate">
          {audioTrack.artist} • {audioTrack.title}
        </span>
      </div>
    </div>
  );
}

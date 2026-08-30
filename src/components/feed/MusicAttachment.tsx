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
    <div className="px-3.5 pb-3">
      <div className="flex items-center justify-between p-2 rounded-2xl bg-white/5 border border-white/5 text-xs text-neutral-300">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-neutral-300 shrink-0">
            <Music className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs text-neutral-300 font-medium truncate">
            {audioTrack.title} • {audioTrack.artist}
          </p>
        </div>

        {/* Animated Purple Audio Waveform (From Reference Image) */}
        <div className="flex items-center gap-0.5 text-purple-400 shrink-0 pr-1">
          <span className="w-0.5 h-2 bg-purple-400 rounded-full animate-pulse" />
          <span className="w-0.5 h-3.5 bg-purple-400 rounded-full animate-pulse delay-75" />
          <span className="w-0.5 h-2.5 bg-purple-400 rounded-full animate-pulse delay-150" />
          <span className="w-0.5 h-4.5 bg-purple-400 rounded-full animate-pulse delay-100" />
          <span className="w-0.5 h-1.5 bg-purple-400 rounded-full animate-pulse delay-200" />
        </div>
      </div>
    </div>
  );
}


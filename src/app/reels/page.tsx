'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { usePost } from '@/context/PostContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { formatNumber } from '@/lib/utils';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Music,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
} from 'lucide-react';

export default function ReelsPage() {
  const { currentUser, toggleFollow, isFollowing } = useAuth();
  const { reels, toggleLikeReel, toggleBookmarkReel } = usePost();
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const displayReels = reels.length > 0 ? reels : [];
  const safeIndex = Math.min(activeReelIndex, Math.max(0, displayReels.length - 1));
  const currentReel = displayReels[safeIndex];

  const handleNextReel = () => {
    if (safeIndex < displayReels.length - 1) {
      setActiveReelIndex(safeIndex + 1);
    }
  };

  const handlePrevReel = () => {
    if (safeIndex > 0) {
      setActiveReelIndex(safeIndex - 1);
    }
  };

  if (!currentReel) {
    return (
      <AppShell title="Reels">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <p className="text-lg font-bold text-[var(--text-primary)]">No Reels yet</p>
          <p className="text-xs text-[var(--text-secondary)]">Create the first reel to get started!</p>
        </div>
      </AppShell>
    );
  }

  const isLiked = currentUser ? currentReel.likes.includes(currentUser.id) : false;
  const isSaved = currentUser ? currentReel.bookmarkedBy.includes(currentUser.id) : false;
  const followingAuthor = isFollowing(currentReel.authorId);

  return (
    <AppShell title="Reels">
      <div className="flex justify-center items-center py-4 sm:py-6 h-[calc(100vh-80px)] select-none">
        <div className="relative flex items-end gap-4 h-full max-h-[760px]">
          {/* Main 9:16 Video Container */}
          <div className="relative w-[340px] sm:w-[400px] h-full rounded-2xl overflow-hidden bg-black shadow-2xl flex flex-col justify-between p-4">
            {/* Background Visual / Video Player */}
            <div className="absolute inset-0 z-0 bg-black">
              <video
                key={currentReel.id}
                src={currentReel.videoUrl}
                poster={currentReel.posterUrl}
                autoPlay
                loop
                playsInline
                muted={isMuted}
                className="w-full h-full object-cover select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/85 pointer-events-none" />
            </div>

            {/* Top Bar: Audio mute toggle */}
            <div className="relative z-10 flex items-center justify-between text-white">
              <span className="text-sm font-bold tracking-tight">Reels</span>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors cursor-pointer"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Bottom Left Info: Author, Follow, Caption, Sound */}
            <div className="relative z-10 space-y-3 text-white">
              {/* Author Row */}
              <div className="flex items-center gap-2.5">
                <Link href={`/profile/${currentReel.author.username}`} className="flex items-center gap-2 group">
                  <Avatar
                    src={currentReel.author.avatarUrl}
                    alt={currentReel.author.displayName}
                    size="sm"
                    isVerified={currentReel.author.isVerified}
                  />
                  <span className="text-xs font-bold hover:underline drop-shadow">
                    {currentReel.author.username}
                  </span>
                </Link>

                {currentUser?.id !== currentReel.authorId && (
                  <>
                    <span className="text-xs text-white/60">•</span>
                    <button
                      onClick={() => toggleFollow(currentReel.authorId)}
                      className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        followingAuthor
                          ? 'bg-white/20 hover:bg-white/30 text-white'
                          : 'bg-[#0095f6] hover:bg-[#1877f2] text-white'
                      }`}
                    >
                      {followingAuthor ? 'Following' : 'Follow'}
                    </button>
                  </>
                )}
              </div>

              {/* Caption */}
              <p className="text-xs line-clamp-2 leading-relaxed drop-shadow-md">
                {currentReel.caption}
              </p>

              {/* Audio Track Marquee */}
              <div className="flex items-center gap-2 text-[11px] text-white/90">
                <Music className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                <span className="truncate">
                  {currentReel.audioTrack.title} • {currentReel.audioTrack.artist}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Icons Column */}
          <div className="flex flex-col items-center gap-5 text-white pb-2">
            {/* Like */}
            <button
              onClick={() => toggleLikeReel(currentReel.id)}
              className="flex flex-col items-center gap-1 group cursor-pointer"
            >
              <div className="p-2.5 rounded-full bg-neutral-900/60 backdrop-blur-md group-hover:bg-neutral-800 transition-colors">
                <Heart
                  className={`w-6 h-6 transition-transform group-active:scale-125 ${
                    isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'
                  }`}
                />
              </div>
              <span className="text-[11px] font-semibold">{formatNumber(currentReel.likesCount)}</span>
            </button>

            {/* Comment */}
            <button className="flex flex-col items-center gap-1 group cursor-pointer">
              <div className="p-2.5 rounded-full bg-neutral-900/60 backdrop-blur-md group-hover:bg-neutral-800 transition-colors">
                <MessageCircle className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold">{formatNumber(currentReel.commentsCount)}</span>
            </button>

            {/* Share */}
            <button className="flex flex-col items-center gap-1 group cursor-pointer">
              <div className="p-2.5 rounded-full bg-neutral-900/60 backdrop-blur-md group-hover:bg-neutral-800 transition-colors">
                <Send className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold">{formatNumber(currentReel.sharesCount)}</span>
            </button>

            {/* Bookmark / Save */}
            <button
              onClick={() => toggleBookmarkReel(currentReel.id)}
              className="flex flex-col items-center gap-1 group cursor-pointer"
            >
              <div className="p-2.5 rounded-full bg-neutral-900/60 backdrop-blur-md group-hover:bg-neutral-800 transition-colors">
                <Bookmark
                  className={`w-6 h-6 transition-transform group-active:scale-125 ${
                    isSaved ? 'fill-[var(--text-primary)] text-[var(--text-primary)]' : 'text-white'
                  }`}
                />
              </div>
            </button>

            {/* More Options */}
            <button className="p-2.5 rounded-full bg-neutral-900/60 backdrop-blur-md hover:bg-neutral-800 transition-colors cursor-pointer">
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Sound Disk Thumbnail */}
            <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white/80 animate-spin-slow">
              <Avatar src={currentReel.author.avatarUrl} alt="Audio owner" size="sm" />
            </div>
          </div>

          {/* Up & Down Scroll Nav Arrows (Desktop) */}
          <div className="hidden lg:flex flex-col gap-2 absolute -right-14 top-1/2 -translate-y-1/2">
            <button
              onClick={handlePrevReel}
              disabled={safeIndex === 0}
              className="p-2.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-lg"
              aria-label="Previous reel"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextReel}
              disabled={safeIndex === displayReels.length - 1}
              className="p-2.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-lg"
              aria-label="Next reel"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

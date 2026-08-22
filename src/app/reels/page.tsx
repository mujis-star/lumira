'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { usePost } from '@/context/PostContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { ShareModal } from '@/components/feed/ShareModal';
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
  const [isShareOpen, setIsShareOpen] = useState(false);

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
          <div className="p-4 rounded-3xl bg-[var(--glass-card-bg)] backdrop-blur-2xl border border-[var(--glass-border)] shadow-lg">
            <p className="text-base font-bold text-[var(--text-primary)]">No Reels yet</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Create the first reel to illuminate Lumira!</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const isLiked = currentUser ? currentReel.likes.includes(currentUser.id) : false;
  const isSaved = currentUser ? currentReel.bookmarkedBy.includes(currentUser.id) : false;
  const followingAuthor = isFollowing(currentReel.authorId);

  return (
    <AppShell title="Reels">
      <div className="flex justify-center items-center py-2 sm:py-4 h-[calc(100vh-100px)] select-none">
        <div className="relative flex items-end gap-4 h-full max-h-[760px]">
          {/* Main 9:16 Glass-Framed Video Container */}
          <div className="relative w-[340px] sm:w-[410px] h-full rounded-3xl overflow-hidden bg-black shadow-[var(--glass-shadow-lg)] border border-white/15 flex flex-col justify-between p-4">
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
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 pointer-events-none" />
            </div>

            {/* Top Bar: Glass Reels badge & Mute Toggle */}
            <div className="relative z-10 flex items-center justify-between text-white">
              <span className="text-xs font-black tracking-wider uppercase px-3 py-1 rounded-full bg-white/15 backdrop-blur-xl border border-white/20 shadow-sm">
                Reels
              </span>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 text-white hover:bg-black/60 transition-all active:scale-95 cursor-pointer shadow-md"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Bottom Left Info: Author, Follow, Caption, Sound */}
            <div className="relative z-10 space-y-3 text-white">
              {/* Author Row */}
              <div className="flex items-center gap-2.5">
                <Link href={`/profile/${currentReel.author.username}`} className="flex items-center gap-2 group p-1 pr-2 rounded-full bg-black/30 backdrop-blur-md border border-white/10 hover:bg-black/50 transition-colors">
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
                  <button
                    onClick={() => toggleFollow(currentReel.authorId)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
                      followingAuthor
                        ? 'bg-white/20 hover:bg-white/30 text-white border border-white/20'
                        : 'bg-[#0095f6] hover:bg-[#1877f2] text-white shadow-md'
                    }`}
                  >
                    {followingAuthor ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>

              {/* Caption */}
              <p className="text-xs line-clamp-2 leading-relaxed drop-shadow-md px-1">
                {currentReel.caption}
              </p>

              {/* Glass Audio Track Marquee Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/15 text-[11px] text-white/90 shadow-sm max-w-full">
                <Music className="w-3.5 h-3.5 shrink-0 text-[var(--accent-blue)] animate-pulse" />
                <span className="truncate font-medium">
                  {currentReel.audioTrack.title} • {currentReel.audioTrack.artist}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Icons Column: Floating Frosted Glass Buttons */}
          <div className="flex flex-col items-center gap-4 text-white pb-2">
            {/* Like */}
            <button
              onClick={() => toggleLikeReel(currentReel.id)}
              className="flex flex-col items-center gap-1 group cursor-pointer"
            >
              <div className="p-3 rounded-full bg-white/10 dark:bg-black/50 backdrop-blur-2xl border border-white/25 shadow-lg group-hover:bg-white/20 dark:group-hover:bg-black/70 group-hover:scale-110 transition-all active:scale-125">
                <Heart
                  className={`w-5 h-5 transition-transform ${
                    isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'
                  }`}
                />
              </div>
              <span className="text-[11px] font-bold drop-shadow">{formatNumber(currentReel.likesCount)}</span>
            </button>

            {/* Comment */}
            <button className="flex flex-col items-center gap-1 group cursor-pointer">
              <div className="p-3 rounded-full bg-white/10 dark:bg-black/50 backdrop-blur-2xl border border-white/25 shadow-lg group-hover:bg-white/20 dark:group-hover:bg-black/70 group-hover:scale-110 transition-all active:scale-110">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold drop-shadow">{formatNumber(currentReel.commentsCount)}</span>
            </button>

            {/* Share */}
            <button
              onClick={() => setIsShareOpen(true)}
              className="flex flex-col items-center gap-1 group cursor-pointer"
              aria-label="Share reel"
            >
              <div className="p-3 rounded-full bg-white/10 dark:bg-black/50 backdrop-blur-2xl border border-white/25 shadow-lg group-hover:bg-white/20 dark:group-hover:bg-black/70 group-hover:scale-110 transition-all active:scale-110">
                <Send className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold drop-shadow">{formatNumber(currentReel.sharesCount)}</span>
            </button>

            {/* Bookmark / Save */}
            <button
              onClick={() => toggleBookmarkReel(currentReel.id)}
              className="flex flex-col items-center gap-1 group cursor-pointer"
            >
              <div className="p-3 rounded-full bg-white/10 dark:bg-black/50 backdrop-blur-2xl border border-white/25 shadow-lg group-hover:bg-white/20 dark:group-hover:bg-black/70 group-hover:scale-110 transition-all active:scale-125">
                <Bookmark
                  className={`w-5 h-5 transition-transform ${
                    isSaved ? 'fill-current text-white' : 'text-white'
                  }`}
                />
              </div>
            </button>

            {/* More Options */}
            <button className="p-3 rounded-full bg-white/10 dark:bg-black/50 backdrop-blur-2xl border border-white/25 shadow-lg hover:bg-white/20 dark:hover:bg-black/70 transition-all cursor-pointer">
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Sound Disk Vinyl Thumbnail */}
            <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-white/80 shadow-lg animate-spin-slow">
              <Avatar src={currentReel.author.avatarUrl} alt="Audio owner" size="sm" />
            </div>
          </div>

          {/* Up & Down Scroll Nav Arrows (Desktop) */}
          <div className="hidden lg:flex flex-col gap-2.5 absolute -right-16 top-1/2 -translate-y-1/2">
            <button
              onClick={handlePrevReel}
              disabled={safeIndex === 0}
              className="p-3 rounded-full bg-[var(--glass-modal-bg)] backdrop-blur-2xl border border-[var(--glass-border-highlight)] hover:bg-[var(--glass-bg-hover)] text-[var(--text-primary)] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-xl hover:scale-110 active:scale-95"
              aria-label="Previous reel"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextReel}
              disabled={safeIndex === displayReels.length - 1}
              className="p-3 rounded-full bg-[var(--glass-modal-bg)] backdrop-blur-2xl border border-[var(--glass-border-highlight)] hover:bg-[var(--glass-bg-hover)] text-[var(--text-primary)] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-xl hover:scale-110 active:scale-95"
              aria-label="Next reel"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal for Reels */}
      <ShareModal
        reel={currentReel}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </AppShell>
  );
}

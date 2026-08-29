'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useInstants } from '@/context/InstantContext';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { Avatar } from '@/components/ui/Avatar';
import { formatRemainingTime, generateInstantCssFilter, sounds } from '@/lib/utils';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Send,
  MoreHorizontal,
  Lock,
  Volume2,
  VolumeX,
  Trash2,
  Share2,
} from 'lucide-react';

export function InstantViewerModal() {
  const {
    activeInstant,
    isViewerOpen,
    closeInstantViewer,
    nextInstant,
    prevInstant,
    reactToInstant,
    viewInstant,
    deleteInstant,
  } = useInstants();

  const { currentUser } = useAuth();
  const { sendMessage } = useChat();

  const [replyText, setReplyText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [activeReactionBurst, setActiveReactionBurst] = useState<string | null>(null);

  // Auto record view
  useEffect(() => {
    if (activeInstant && isViewerOpen) {
      viewInstant(activeInstant.id);
    }
  }, [activeInstant, isViewerOpen, viewInstant]);

  // Keyboard navigation
  useEffect(() => {
    if (!isViewerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeInstantViewer();
      if (e.key === 'ArrowRight') nextInstant();
      if (e.key === 'ArrowLeft') prevInstant();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewerOpen, closeInstantViewer, nextInstant, prevInstant]);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeInstant) return;

    sendMessage({
      receiverId: activeInstant.creatorId,
      content: `Replied to your Instant: "${replyText.trim()}"`,
    });

    sounds.playSend();
    setReplyText('');
  };

  const handleReact = (emoji: string) => {
    if (!activeInstant) return;
    reactToInstant(activeInstant.id, emoji);
    setActiveReactionBurst(emoji);
    setTimeout(() => setActiveReactionBurst(null), 1000);
  };

  if (!isViewerOpen || !activeInstant) return null;

  const isOwnInstant = activeInstant.creatorId === currentUser?.id;
  const computedFilter = generateInstantCssFilter(
    activeInstant.adjustments,
    activeInstant.filterId,
    activeInstant.filterIntensity
  );
  const remainingStr = formatRemainingTime(activeInstant.expiresAt);
  const hasLiked = currentUser && activeInstant.reactions.some((r) => r.userId === currentUser.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl select-none animate-in fade-in duration-200">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={closeInstantViewer} />

      {/* Desktop Navigation Arrows */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          prevInstant();
        }}
        className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110 z-20 cursor-pointer shadow-lg"
        aria-label="Previous Instant"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          nextInstant();
        }}
        className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110 z-20 cursor-pointer shadow-lg"
        aria-label="Next Instant"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Main Glass Media Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm sm:max-w-md h-full sm:h-[90vh] sm:max-h-[820px] rounded-none sm:rounded-3xl overflow-hidden bg-black shadow-2xl border-0 sm:border border-[var(--glass-border)] flex flex-col justify-between z-10"
      >
        {/* 1. TOP BAR */}
        <div className="shrink-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 space-y-2">
          {/* Header Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                src={activeInstant.creator.avatarUrl}
                alt={activeInstant.creator.displayName}
                size="sm"
                isVerified={activeInstant.creator.isVerified}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-white truncate">{activeInstant.creator.username}</p>
                  <span className="text-[10px] text-white/70">·</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[9px] font-bold">
                    {remainingStr} left
                  </span>
                </div>
                <p className="text-[10px] text-white/60 truncate">{activeInstant.creator.displayName}</p>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1 text-white">
              {activeInstant.visibility === 'Close Friends' && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs mr-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Close</span>
                </span>
              )}

              {activeInstant.mediaType === 'video' && (
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-full hover:bg-white/20 text-white/80 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className="p-2 rounded-full hover:bg-white/20 text-white/80 transition-colors cursor-pointer"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {isMoreMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 rounded-2xl bg-[var(--glass-modal-bg)] backdrop-blur-3xl border border-white/20 shadow-2xl p-1.5 text-xs text-white z-30">
                    {isOwnInstant && (
                      <button
                        type="button"
                        onClick={() => {
                          deleteInstant(activeInstant.id);
                          closeInstantViewer();
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer text-left"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Instant</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.href);
                        alert('Link copied to clipboard!');
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer text-left"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Copy link</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={closeInstantViewer}
                className="p-2 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer ml-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. CENTER STAGE MEDIA */}
        <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center">
          {/* Base Media */}
          {activeInstant.mediaType === 'video' ? (
            <video
              src={activeInstant.mediaUrl}
              style={{
                filter: computedFilter,
                transform: `rotate(${(activeInstant.adjustments?.rotate || 0) + (activeInstant.adjustments?.straighten || 0)}deg) scaleX(${activeInstant.adjustments?.flipH ? -1 : 1}) scaleY(${activeInstant.adjustments?.flipV ? -1 : 1})`,
              }}
              className="w-full h-full object-cover"
              autoPlay
              loop
              playsInline
              muted={isMuted}
            />
          ) : (
            <Image
              src={activeInstant.mediaUrl}
              alt={activeInstant.caption || 'Instant'}
              fill
              className="object-cover"
              style={{
                filter: computedFilter,
                transform: `rotate(${(activeInstant.adjustments?.rotate || 0) + (activeInstant.adjustments?.straighten || 0)}deg) scaleX(${activeInstant.adjustments?.flipH ? -1 : 1}) scaleY(${activeInstant.adjustments?.flipV ? -1 : 1})`,
              }}
              unoptimized
            />
          )}

          {/* Render Drawing */}
          {activeInstant.drawingDataUrl && (
            <Image
              src={activeInstant.drawingDataUrl}
              alt="Drawing"
              fill
              className="object-cover pointer-events-none z-10"
              unoptimized
            />
          )}

          {/* Render Text Overlays */}
          {activeInstant.textOverlays?.map((item) => (
            <div
              key={item.id}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: 'translate(-50%, -50%)',
                color: item.color,
                backgroundColor: item.backgroundColor,
                fontSize: `${item.fontSize}px`,
              }}
              className={`absolute z-20 px-3 py-1.5 rounded-2xl ${item.bold ? 'font-bold' : ''} ${
                item.italic ? 'italic' : ''
              } ${item.shadow ? 'drop-shadow-lg' : ''}`}
            >
              {item.text}
            </div>
          ))}

          {/* Render Stickers & Widgets */}
          {activeInstant.stickers?.map((item) => (
            <div
              key={item.id}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: `translate(-50%, -50%) scale(${item.scale || 1}) rotate(${item.rotation || 0}deg)`,
              }}
              className="absolute z-20"
            >
              {item.type === 'emoji' ? (
                <span className="text-4xl drop-shadow-md">{item.content}</span>
              ) : (
                <div className="px-3 py-1.5 rounded-2xl bg-black/75 backdrop-blur-xl border border-white/20 text-white text-xs font-bold shadow-lg">
                  {item.content}
                </div>
              )}
            </div>
          ))}

          {/* Floating Reaction Burst Animation */}
          {activeReactionBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-bounce">
              <span className="text-8xl drop-shadow-2xl">{activeReactionBurst}</span>
            </div>
          )}

          {/* Tap Areas for Mobile Navigation */}
          <div
            onClick={prevInstant}
            className="md:hidden absolute left-0 top-0 bottom-0 w-1/3 z-10"
          />
          <div
            onClick={nextInstant}
            className="md:hidden absolute right-0 top-0 bottom-0 w-1/3 z-10"
          />
        </div>

        {/* 3. BOTTOM BAR: MUSIC / REPLY / REACTIONS */}
        <div className="shrink-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20 space-y-3">
          {/* Music Track Badge if attached */}
          {activeInstant.attachedMusic && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-white text-xs w-fit">
              <span className="animate-pulse text-blue-400">🎵</span>
              <span className="font-bold">{activeInstant.attachedMusic.title}</span>
              <span className="text-white/60">· {activeInstant.attachedMusic.artist}</span>
            </div>
          )}

          {/* Quick Reaction Emojis Tray */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-1">
            {['🔥', '❤️', '😂', '😮', '👏', '🥳', '⚡'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReact(emoji)}
                className="p-2 text-xl hover:scale-130 active:scale-95 transition-transform cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Send message to @${activeInstant.creator.username}...`}
              className="flex-1 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-xs text-white placeholder-white/50 focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
            />

            {replyText.trim() ? (
              <button
                type="submit"
                className="px-4 py-2.5 rounded-full bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleReact('❤️')}
                className={`p-2.5 rounded-full transition-transform active:scale-90 cursor-pointer ${
                  hasLiked ? 'text-rose-500 fill-rose-500' : 'text-white/80 hover:text-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

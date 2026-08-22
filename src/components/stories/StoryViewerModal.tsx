'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useStory } from '@/context/StoryContext';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { Avatar } from '../ui/Avatar';
import { formatTimeAgo } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Heart,
  Send,
  Volume2,
  VolumeX,
  Plus,
  Music,
} from 'lucide-react';
import { EmojiPickerModal } from '../ui/EmojiPicker';
import { audioEngine } from '@/lib/audioEngine';

export function StoryViewerModal() {
  const {
    stories,
    activeStoryIndex,
    isViewerOpen,
    closeStoryViewer,
    nextStory,
    prevStory,
    markStorySeen,
    reactToStory,
  } = useStory();

  const { currentUser } = useAuth();
  const { sendMessage } = useChat();

  const [itemIndex, setItemIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [showHeartBursts, setShowHeartBursts] = useState(false);
  const [burstEmoji, setBurstEmoji] = useState('❤️');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const activeStory = activeStoryIndex !== null && stories[activeStoryIndex] ? stories[activeStoryIndex] : null;
  const currentItem = activeStory?.items[itemIndex] || activeStory?.items[0];

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentStoryId = activeStory?.id;
  const currentItemId = currentItem?.id;
  const currentUserId = currentUser?.id;
  const isViewed = currentItem && currentUserId ? currentItem.viewers.includes(currentUserId) : true;

  // Mark story seen once per item
  useEffect(() => {
    if (isViewerOpen && currentStoryId && currentItemId && !isViewed) {
      markStorySeen(currentStoryId, currentItemId);
    }
  }, [isViewerOpen, currentStoryId, currentItemId, isViewed, markStorySeen]);

  const handleNextItem = useCallback(() => {
    if (!activeStory) return;
    if (itemIndex < activeStory.items.length - 1) {
      setItemIndex((i) => i + 1);
      setProgress(0);
    } else {
      nextStory();
      setItemIndex(0);
      setProgress(0);
    }
  }, [activeStory, itemIndex, nextStory]);

  const handlePrevItem = useCallback(() => {
    if (!activeStory) return;
    if (itemIndex > 0) {
      setItemIndex((i) => i - 1);
      setProgress(0);
    } else {
      prevStory();
      setItemIndex(0);
      setProgress(0);
    }
  }, [activeStory, itemIndex, prevStory]);

  // Story progress timer (5 seconds per item)
  useEffect(() => {
    if (!isViewerOpen || !activeStory || isPaused) return;

    const interval = 50; // ms
    const step = (interval / 5000) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNextItem();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isViewerOpen, activeStory, isPaused, handleNextItem]);

  // Story soundtrack audio playback
  useEffect(() => {
    if (!isViewerOpen || isPaused || isMuted) {
      if (audioEngine) audioEngine.stop();
      return;
    }

    if (currentItem?.audioTrack) {
      const source = ('audioSource' in currentItem.audioTrack && currentItem.audioTrack.audioSource)
        ? currentItem.audioTrack.audioSource
        : 'synth-pulse';
      const start = ('startTime' in currentItem.audioTrack && currentItem.audioTrack.startTime) || 0;
      const dur = ('duration' in currentItem.audioTrack && currentItem.audioTrack.duration) || 15;

      if (audioEngine) {
        audioEngine.play(source, start, dur);
      }
    } else {
      if (audioEngine) audioEngine.stop();
    }

    return () => {
      if (audioEngine) audioEngine.stop();
    };
  }, [isViewerOpen, currentItem, isPaused, isMuted]);

  // Keyboard navigation listener (Escape to close, Arrow keys to navigate)
  useEffect(() => {
    if (!isViewerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeStoryViewer();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNextItem();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevItem();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewerOpen, closeStoryViewer, handleNextItem, handlePrevItem]);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeStory || !currentUser) return;

    sendMessage({
      receiverId: activeStory.userId,
      content: `Replied to your story: "${replyText}"`,
      mediaUrl: currentItem?.mediaUrl,
      mediaType: 'image',
    });

    setReplyText('');
  };

  const handleEmojiReaction = (emoji: string) => {
    reactToStory();
    setBurstEmoji(emoji);
    setShowHeartBursts(true);
    setTimeout(() => setShowHeartBursts(false), 1200);

    if (activeStory && currentUser) {
      sendMessage({
        receiverId: activeStory.userId,
        content: `Reacted ${emoji} to your story`,
        mediaUrl: currentItem?.mediaUrl,
        mediaType: 'image',
      });
    }
  };

  const handleHeartReaction = () => {
    handleEmojiReaction('❤️');
  };

  if (!isViewerOpen || !activeStory || !currentItem) {
    return null;
  }

  const isVideo =
    currentItem.type === 'video' ||
    currentItem.mediaUrl.endsWith('.mp4') ||
    currentItem.mediaUrl.startsWith('data:video');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center select-none backdrop-blur-md">
        {/* Backdrop click to close */}
        <div
          className="absolute inset-0 z-0"
          onClick={closeStoryViewer}
        />

        {/* Lumira Top Left Brand */}
        <div className="absolute top-4 left-6 z-40 flex items-center gap-4 text-white pointer-events-none">
          <span className="font-bold text-lg tracking-wider hidden md:inline">Lumira</span>
        </div>

        {/* Close Button Top Right of Screen */}
        <button
          onClick={closeStoryViewer}
          className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer z-50 shadow-lg"
          aria-label="Close story viewer (Escape)"
          title="Close (Esc)"
        >
          <X className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Previous Story Arrow (Desktop) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            prevStory();
            setItemIndex(0);
            setProgress(0);
          }}
          className="hidden md:flex absolute left-8 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer z-40"
          aria-label="Previous user story"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Next Story Arrow (Desktop) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            nextStory();
            setItemIndex(0);
            setProgress(0);
          }}
          className="hidden md:flex absolute right-8 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer z-40"
          aria-label="Next user story"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Main 9:16 Story Card */}
        <motion.div
          key={`${activeStory.id}-${itemIndex}`}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-[420px] h-[95vh] max-h-[820px] rounded-2xl overflow-hidden bg-black flex flex-col justify-between shadow-2xl z-20 border border-white/10"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {/* Background Story Media (Image or Video) */}
          <div className="absolute inset-0 z-0 bg-black">
            {isVideo ? (
              <video
                key={currentItem.id}
                src={currentItem.mediaUrl}
                autoPlay
                loop
                playsInline
                muted={isMuted}
                className="w-full h-full object-cover"
              />
            ) : (
              <Image
                src={currentItem.mediaUrl}
                alt="Story"
                fill
                className="object-cover"
                priority
                unoptimized
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
          </div>

          {/* Left & Right Tap Zones to go back / forward */}
          <div className="absolute inset-0 z-10 flex pointer-events-auto">
            <div
              className="w-1/3 h-full cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevItem();
              }}
            />
            <div
              className="w-2/3 h-full cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleNextItem();
              }}
            />
          </div>

          {/* Top Progress Bars & Header Controls */}
          <div className="relative z-20 p-3.5 space-y-2.5">
            {/* Segmented Progress Bars */}
            <div className="flex items-center gap-1 w-full">
              {activeStory.items.map((_, idx) => {
                let fillPercent = 0;
                if (idx < itemIndex) fillPercent = 100;
                else if (idx === itemIndex) fillPercent = progress;

                return (
                  <div
                    key={idx}
                    className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
                  >
                    <div
                      className="h-full bg-white transition-all ease-linear"
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Author Profile Row & Controls */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <Avatar
                  src={activeStory.user.avatarUrl}
                  alt={activeStory.user.displayName}
                  size="sm"
                  isVerified={activeStory.user.isVerified}
                />
                <div>
                  <span className="text-xs font-bold">{activeStory.user.username}</span>
                  <span className="text-[10px] text-white/70 ml-2">
                    {formatTimeAgo(currentItem.createdAt)}
                  </span>
                </div>
              </div>

              {/* Action buttons: Mute, Pause/Play, Card Close */}
              <div className="flex items-center gap-1">
                {isVideo && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted(!isMuted);
                    }}
                    className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPaused(!isPaused);
                  }}
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
                  aria-label={isPaused ? 'Resume story' : 'Pause story'}
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeStoryViewer();
                  }}
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
                  aria-label="Close story"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Floating Music Track Sticker */}
            {currentItem.audioTrack && (
              <div className="pt-0.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md text-white text-[11px] font-semibold border border-white/15 shadow-sm">
                  <Music className="w-3 h-3 text-pink-400 animate-pulse shrink-0" />
                  <span className="truncate max-w-[190px]">
                    {currentItem.audioTrack.title} • {currentItem.audioTrack.artist}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Caption Overlay */}
          {currentItem.caption && (
            <div className="relative z-20 px-4 text-center">
              <span className="inline-block px-3.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-medium shadow-md">
                {currentItem.caption}
              </span>
            </div>
          )}

          {/* Floating Emoji Bursts Reaction Animation */}
          {showHeartBursts && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-heart-burst">
              <span className="text-8xl drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] select-none">
                {burstEmoji}
              </span>
            </div>
          )}

          {/* Bottom Interactive Row (Send Reply & Quick Reactions) */}
          <div className="relative z-20 p-3.5 pt-0 space-y-2">
            {currentUser?.id !== activeStory.userId ? (
              <>
                {/* Quick Reactions Bar with + button */}
                <div className="flex items-center justify-between px-2 bg-black/50 backdrop-blur-md rounded-full py-1.5 border border-white/10">
                  {['❤️', '🔥', '👏', '😂', '😍', '😮', '🙌'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleEmojiReaction(emoji)}
                      className="text-lg hover:scale-130 active:scale-95 transition-transform cursor-pointer"
                      title={`React ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsEmojiPickerOpen(true)}
                    className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center text-white text-xs cursor-pointer hover:scale-110 transition-transform"
                    title="Every Emoji"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <form onSubmit={handleSendReply} className="flex-1 relative">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${activeStory.user.username}...`}
                      className="w-full px-4 py-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-white/70 text-xs focus:outline-none focus:bg-white/30 focus:border-white transition-all"
                    />
                    {replyText.trim() && (
                      <button
                        type="submit"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-white hover:opacity-75 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                  </form>

                  {/* Quick Heart Reaction */}
                  <button
                    type="button"
                    onClick={handleHeartReaction}
                    className="p-2.5 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white active:scale-125 transition-transform cursor-pointer"
                    aria-label="Send heart reaction"
                  >
                    <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between text-white/80 text-[11px] px-2">
                <span>{currentItem.viewsCount} views</span>
                <span className="text-white/60">Your Story</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Full Every Emoji Picker Modal */}
        <EmojiPickerModal
          isOpen={isEmojiPickerOpen}
          onClose={() => setIsEmojiPickerOpen(false)}
          onSelectEmoji={(emoji) => handleEmojiReaction(emoji)}
          title="React to Story"
        />
      </div>
    </AnimatePresence>
  );
}

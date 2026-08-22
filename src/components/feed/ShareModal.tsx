'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { Post, ReelItem } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { usePost } from '@/context/PostContext';
import { useStory } from '@/context/StoryContext';
import { Avatar } from '../ui/Avatar';
import { sounds, triggerConfetti } from '@/lib/utils';
import {
  Search,
  Check,
  Link2,
  Send,
  Sparkles,
  Share2,
  MoreHorizontal,
  X,
  MessageSquare,
  Mail,
  Download,
  CheckCircle2,
} from 'lucide-react';

export interface ShareTarget {
  id: string;
  type?: 'post' | 'reel';
  title?: string;
  author: {
    id?: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    isVerified?: boolean;
  };
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  caption?: string;
  url?: string;
}

interface ShareModalProps {
  post?: Post;
  reel?: ReelItem;
  shareData?: ShareTarget;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ post, reel, shareData, isOpen, onClose }: ShareModalProps) {
  const { allUsers, currentUser } = useAuth();
  const { sendMessage } = useChat();
  const { toggleRepost } = usePost();
  const { createStory } = useStory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Note state
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  // Secondary More Sheet state
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setSearchQuery('');
    setSelectedUserIds([]);
    setMessageText('');
    setIsAddingNote(false);
    setNoteContent('');
    setIsMoreMenuOpen(false);
    setShowSuccessBadge(false);
    onClose();
  };

  // Normalize target data
  const normalizedTarget = useMemo(() => {
    if (post) {
      return {
        id: post.id,
        type: 'post' as const,
        author: post.author,
        mediaUrl: post.media[0]?.url,
        mediaType: post.media[0]?.type || 'image',
        caption: post.caption,
        url: typeof window !== 'undefined' ? `${window.location.origin}/profile/${post.author.username}` : '',
      };
    }
    if (reel) {
      return {
        id: reel.id,
        type: 'reel' as const,
        author: reel.author,
        mediaUrl: reel.videoUrl || reel.posterUrl,
        mediaType: 'video' as const,
        caption: reel.caption,
        url: typeof window !== 'undefined' ? `${window.location.origin}/reels` : '',
      };
    }
    if (shareData) {
      return {
        id: shareData.id,
        type: shareData.type || 'post',
        author: shareData.author,
        mediaUrl: shareData.mediaUrl,
        mediaType: shareData.mediaType || 'image',
        caption: shareData.caption,
        url: shareData.url || (typeof window !== 'undefined' ? window.location.href : ''),
      };
    }
    return null;
  }, [post, reel, shareData]);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (isMoreMenuOpen) {
          setIsMoreMenuOpen(false);
        } else if (isAddingNote) {
          setIsAddingNote(false);
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (!isOpen || !normalizedTarget) return null;

  // Filtered users (excluding current user)
  const filteredUsers = allUsers.filter((u) => {
    if (u.id === currentUser?.id) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.username.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q)
    );
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const toggleSelectUser = (id: string) => {
    sounds.playPop();
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Direct Send to selected users
  const handleSendDirect = () => {
    if (selectedUserIds.length === 0 || isSending) return;
    setIsSending(true);

    const shareContent = messageText.trim()
      ? `${messageText.trim()}\nShared a ${normalizedTarget.type} from @${normalizedTarget.author.username}`
      : `Shared a ${normalizedTarget.type} from @${normalizedTarget.author.username}`;

    selectedUserIds.forEach((receiverId) => {
      sendMessage({
        receiverId,
        content: shareContent,
        mediaUrl: normalizedTarget.mediaUrl,
        mediaType: normalizedTarget.mediaType,
      });
    });

    sounds.playSend();
    triggerConfetti(0.5, 0.6);
    setShowSuccessBadge(true);

    setTimeout(() => {
      setIsSending(false);
      setSelectedUserIds([]);
      onClose();
    }, 600);
  };

  // Copy Link Action
  const handleCopyLink = async () => {
    sounds.playPop();
    try {
      const shareUrl =
        normalizedTarget.url ||
        `${window.location.origin}/profile/${normalizedTarget.author.username}`;
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard');
    } catch {
      showToast('Link copied');
    }
  };

  // Add to Story Action
  const handleAddToStory = () => {
    sounds.playPop();
    if (normalizedTarget.mediaUrl) {
      createStory({
        mediaUrl: normalizedTarget.mediaUrl,
        type: normalizedTarget.mediaType,
        caption: `Shared @${normalizedTarget.author.username}'s ${normalizedTarget.type}`,
      });
      sounds.playSend();
      triggerConfetti(0.5, 0.4);
      showToast('Added to your story!');
      setTimeout(() => {
        onClose();
      }, 500);
    }
  };

  // Native System Share Action
  const handleNativeShare = async () => {
    sounds.playPop();
    const shareUrl =
      normalizedTarget.url ||
      `${window.location.origin}/profile/${normalizedTarget.author.username}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Lumira - Post by @${normalizedTarget.author.username}`,
          text: normalizedTarget.caption || `Check out this post on Lumira!`,
          url: shareUrl,
        });
        onClose();
      } catch {
        // user cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  // WhatsApp Share Action
  const handleWhatsAppShare = () => {
    sounds.playPop();
    const shareUrl =
      normalizedTarget.url ||
      `${window.location.origin}/profile/${normalizedTarget.author.username}`;
    const text = encodeURIComponent(
      `Check out this ${normalizedTarget.type} by @${normalizedTarget.author.username} on Lumira: ${shareUrl}`
    );
    const whatsappUrl = `https://api.whatsapp.com/send?text=${text}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  // Publish Note Action
  const handlePublishNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    if (post) {
      toggleRepost(post.id, noteContent.trim());
    }

    sounds.playSend();
    showToast('Note published on post');
    setIsAddingNote(false);
    setNoteContent('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md transition-all animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-sheet-title"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-2xl border border-white/30 text-white text-xs font-bold shadow-2xl animate-in slide-in-from-top-4 fade-in duration-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Glassmorphism Sheet Panel */}
      <div
        ref={modalRef}
        className="relative w-full max-w-[490px] rounded-t-[32px] sm:rounded-[32px] bg-[#11131c]/90 backdrop-blur-3xl border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(139,92,246,0.15)] overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] text-white animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 font-sans"
      >
        {/* Ambient Neon Mesh Gradients */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-purple-600/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-blue-600/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Drag Handle (Mobile) */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/25" />
        </div>

        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 pt-2 sm:pt-4 pb-2 relative z-10">
          <div className="flex items-center gap-2.5">
            <h2 id="share-sheet-title" className="text-base font-bold text-white tracking-tight">
              Share
            </h2>
            {selectedUserIds.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#0095f6]/20 border border-[#0095f6]/40 text-[#0095f6] text-[11px] font-bold">
                {selectedUserIds.length} selected
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close share sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Glass Search Input */}
        <div className="px-5 py-1.5 relative z-10">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 focus:bg-white/15 border border-white/15 focus:border-[#0095f6]/70 text-white placeholder-neutral-400 text-xs focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 relative z-10 custom-scrollbar">
          {/* User Circular Avatar Grid */}
          <div>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-400">
                No users found for &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-y-4 gap-x-2">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleSelectUser(user.id)}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer text-center relative focus:outline-none"
                      aria-pressed={isSelected}
                    >
                      {/* Avatar with selection indicator */}
                      <div className="relative">
                        <div
                          className={`relative rounded-full p-[2.5px] transition-all duration-200 ${
                            isSelected
                              ? 'bg-gradient-to-tr from-[#0095f6] to-cyan-400 scale-105 shadow-lg shadow-blue-500/30'
                              : 'bg-white/10 group-hover:bg-white/20 group-hover:scale-105'
                          }`}
                        >
                          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-neutral-900 ring-2 ring-[#11131c]">
                            <Image
                              src={user.avatarUrl}
                              alt={user.displayName}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        </div>

                        {/* Check Indicator Badge */}
                        {isSelected && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#0095f6] text-white flex items-center justify-center ring-2 ring-[#11131c] shadow-md animate-in zoom-in-50 duration-150">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Username */}
                      <div className="w-full px-1">
                        <p className="text-[11px] font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                          {user.username}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Note Composer Box (Expanded if user taps 'Add note') */}
          {isAddingNote && (
            <form
              onSubmit={handlePublishNote}
              className="p-3.5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar src={currentUser?.avatarUrl} alt="You" size="xs" />
                  <span className="text-xs font-bold text-white">Add a note to this post</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingNote(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Share your thoughts or note..."
                maxLength={100}
                rows={2}
                autoFocus
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-blue-400 resize-none"
              />

              <div className="flex items-center justify-between text-[10px] text-neutral-400">
                <span>{100 - noteContent.length} chars remaining</span>
                <button
                  type="submit"
                  disabled={!noteContent.trim()}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Publish Note
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Selected Users Direct Send Bar (Floating Glass Footer) */}
        {selectedUserIds.length > 0 ? (
          <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-2xl space-y-2.5 relative z-10 animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-[#0095f6]"
              />

              <button
                type="button"
                onClick={handleSendDirect}
                disabled={isSending}
                className="px-5 py-2 rounded-2xl bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                {showSuccessBadge ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Sent!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send {selectedUserIds.length > 1 ? `(${selectedUserIds.length})` : ''}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Bottom Action Row (Horizontal Scrollable Glass Action Bar) */
          <div className="px-4 py-3 border-t border-white/10 bg-black/30 backdrop-blur-2xl relative z-10">
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
              {/* 1. Add Note */}
              <button
                type="button"
                onClick={() => setIsAddingNote((prev) => !prev)}
                className="flex flex-col items-center gap-1.5 min-w-[62px] group cursor-pointer focus:outline-none"
                aria-label="Add note"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-white/20 border border-white/15 backdrop-blur-xl flex items-center justify-center text-white transition-all group-hover:scale-105 active:scale-95 shadow-md">
                  <MessageSquare className="w-5 h-5 stroke-[1.75]" />
                </div>
                <span className="text-[10px] font-medium text-neutral-300 group-hover:text-white truncate">
                  Add note
                </span>
              </button>

              {/* 2. Add to Story */}
              <button
                type="button"
                onClick={handleAddToStory}
                className="flex flex-col items-center gap-1.5 min-w-[62px] group cursor-pointer focus:outline-none"
                aria-label="Add to story"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-white/20 border border-white/15 backdrop-blur-xl flex items-center justify-center text-white transition-all group-hover:scale-105 active:scale-95 shadow-md">
                  <Sparkles className="w-5 h-5 stroke-[1.75]" />
                </div>
                <span className="text-[10px] font-medium text-neutral-300 group-hover:text-white truncate">
                  Add to story
                </span>
              </button>

              {/* 3. Share */}
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex flex-col items-center gap-1.5 min-w-[62px] group cursor-pointer focus:outline-none"
                aria-label="Share"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-white/20 border border-white/15 backdrop-blur-xl flex items-center justify-center text-white transition-all group-hover:scale-105 active:scale-95 shadow-md">
                  <Share2 className="w-5 h-5 stroke-[1.75]" />
                </div>
                <span className="text-[10px] font-medium text-neutral-300 group-hover:text-white truncate">
                  Share
                </span>
              </button>

              {/* 4. Copy Link */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-1.5 min-w-[62px] group cursor-pointer focus:outline-none"
                aria-label="Copy link"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-white/20 border border-white/15 backdrop-blur-xl flex items-center justify-center text-white transition-all group-hover:scale-105 active:scale-95 shadow-md">
                  <Link2 className="w-5 h-5 stroke-[1.75]" />
                </div>
                <span className="text-[10px] font-medium text-neutral-300 group-hover:text-white truncate">
                  Copy link
                </span>
              </button>

              {/* 5. WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex flex-col items-center gap-1.5 min-w-[62px] group cursor-pointer focus:outline-none"
                aria-label="Share to WhatsApp"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500/30 border border-emerald-500/30 backdrop-blur-xl flex items-center justify-center text-emerald-400 transition-all group-hover:scale-105 active:scale-95 shadow-md">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.97.53 1.764.813 2.796.814 3.183 0 5.77-2.587 5.77-5.766.001-3.181-2.586-5.767-5.77-5.767zm3.387 8.163c-.141.396-.717.76-1.002.808-.284.05-.624.084-1.802-.401-.892-.369-1.464-1.272-1.508-1.33-.044-.06-3.606-4.819 1.139-4.819.141 0 .282.007.411.014.148.009.289.043.419.348.14.331.478 1.168.521 1.254.043.087.072.188.014.304-.058.116-.087.188-.174.289l-.261.304c-.087.087-.179.18-.077.355.101.174.453.748.971 1.21.668.595 1.232.78 1.406.866.174.087.275.072.377-.044.101-.116.434-.507.55-.681.116-.174.232-.145.391-.087.159.058 1.014.478 1.188.565.174.087.289.13.333.203.043.072.043.42-.098.816z" />
                  </svg>
                </div>
                <span className="text-[10px] font-medium text-neutral-300 group-hover:text-white truncate">
                  WhatsApp
                </span>
              </button>

              {/* 6. More */}
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(true)}
                className="flex flex-col items-center gap-1.5 min-w-[62px] group cursor-pointer focus:outline-none"
                aria-label="More options"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-white/20 border border-white/15 backdrop-blur-xl flex items-center justify-center text-white transition-all group-hover:scale-105 active:scale-95 shadow-md">
                  <MoreHorizontal className="w-5 h-5 stroke-[1.75]" />
                </div>
                <span className="text-[10px] font-medium text-neutral-300 group-hover:text-white truncate">
                  More
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Secondary "More Options" Sheet */}
        {isMoreMenuOpen && (
          <div className="absolute inset-0 z-30 bg-[#11131c]/95 backdrop-blur-3xl flex flex-col p-5 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white">More share options</h3>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {/* Share via X (Twitter) */}
              <button
                onClick={() => {
                  const shareUrl = encodeURIComponent(
                    normalizedTarget.url || `${window.location.origin}/profile/${normalizedTarget.author.username}`
                  );
                  const text = encodeURIComponent(`Check out @${normalizedTarget.author.username}'s post on Lumira:`);
                  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`, '_blank');
                  setIsMoreMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-colors text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">X (formerly Twitter)</p>
                  <p className="text-[11px] text-neutral-400">Share as a post on X</p>
                </div>
              </button>

              {/* Share via Telegram */}
              <button
                onClick={() => {
                  const shareUrl = encodeURIComponent(
                    normalizedTarget.url || `${window.location.origin}/profile/${normalizedTarget.author.username}`
                  );
                  const text = encodeURIComponent(`Post by @${normalizedTarget.author.username} on Lumira`);
                  window.open(`https://t.me/share/url?url=${shareUrl}&text=${text}`, '_blank');
                  setIsMoreMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-colors text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Telegram</p>
                  <p className="text-[11px] text-neutral-400">Send to a Telegram chat</p>
                </div>
              </button>

              {/* Share via Email */}
              <button
                onClick={() => {
                  const shareUrl = normalizedTarget.url || `${window.location.origin}/profile/${normalizedTarget.author.username}`;
                  const subject = encodeURIComponent(`Lumira post by @${normalizedTarget.author.username}`);
                  const body = encodeURIComponent(`Check out this post on Lumira:\n\n${shareUrl}`);
                  window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                  setIsMoreMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-colors text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Email</p>
                  <p className="text-[11px] text-neutral-400">Send link via email</p>
                </div>
              </button>

              {/* Download Media */}
              {normalizedTarget.mediaUrl && (
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = normalizedTarget.mediaUrl!;
                    a.download = `lumira-${normalizedTarget.id}.jpg`;
                    a.target = '_blank';
                    a.click();
                    showToast('Opening media for download');
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-colors text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Download Media</p>
                    <p className="text-[11px] text-neutral-400">Save image or video</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


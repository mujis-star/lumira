'use client';

import React from 'react';
import { Heart, MessageCircle, Repeat, Send, Bookmark } from 'lucide-react';

interface PostActionsProps {
  isLiked: boolean;
  isBookmarked: boolean;
  isReposted: boolean;
  onLike: () => void;
  onCommentClick: () => void;
  onRepostClick: () => void;
  onShareClick: () => void;
  onBookmark: () => void;
}

export function PostActions({
  isLiked,
  isBookmarked,
  isReposted,
  onLike,
  onCommentClick,
  onRepostClick,
  onShareClick,
  onBookmark,
}: PostActionsProps) {
  return (
    <div className="flex items-center justify-between px-3.5 pt-2 select-none">
      {/* Left Action Buttons: Like, Comment, Repost, Share */}
      <div className="flex items-center gap-1 -ml-1.5">
        {/* Like Button */}
        <button
          type="button"
          onClick={onLike}
          className={`p-2 rounded-xl transition-all cursor-pointer hover:bg-[var(--glass-bg-hover)] active:scale-80 ${
            isLiked ? 'text-rose-500 fill-rose-500' : 'text-[var(--text-primary)]'
          }`}
          aria-label={isLiked ? 'Unlike post' : 'Like post'}
        >
          <Heart className={`w-5 h-5 stroke-[1.75] transition-transform ${isLiked ? 'fill-rose-500 scale-110' : ''}`} />
        </button>

        {/* Comment Button */}
        <button
          type="button"
          onClick={onCommentClick}
          className="p-2 rounded-xl text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)] transition-all cursor-pointer active:scale-90"
          aria-label="Comment on post"
        >
          <MessageCircle className="w-5 h-5 stroke-[1.75]" />
        </button>

        {/* Repost Button */}
        <button
          type="button"
          onClick={onRepostClick}
          className={`p-2 rounded-xl transition-all cursor-pointer hover:bg-[var(--glass-bg-hover)] active:scale-90 ${
            isReposted ? 'text-emerald-400' : 'text-[var(--text-primary)]'
          }`}
          aria-label="Repost moment"
        >
          <Repeat className="w-5 h-5 stroke-[1.75]" />
        </button>

        {/* Direct / Share Button */}
        <button
          type="button"
          onClick={onShareClick}
          className="p-2 rounded-xl text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)] transition-all cursor-pointer active:scale-90"
          aria-label="Share post"
        >
          <Send className="w-5 h-5 stroke-[1.75]" />
        </button>
      </div>

      {/* Right Action Button: Bookmark */}
      <button
        type="button"
        onClick={onBookmark}
        className={`p-2 -mr-1.5 rounded-xl transition-all cursor-pointer hover:bg-[var(--glass-bg-hover)] active:scale-80 ${
          isBookmarked ? 'text-[var(--accent-blue)] fill-[var(--accent-blue)]' : 'text-[var(--text-primary)]'
        }`}
        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark post'}
      >
        <Bookmark className={`w-5 h-5 stroke-[1.75] transition-transform ${isBookmarked ? 'fill-current scale-110' : ''}`} />
      </button>
    </div>
  );
}

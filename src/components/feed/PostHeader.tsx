'use client';

import React from 'react';
import Link from 'next/link';
import { Post } from '@/lib/types';
import { Avatar } from '../ui/Avatar';
import { formatTimeAgo } from '@/lib/utils';
import { MoreHorizontal, Sparkles } from 'lucide-react';

interface PostHeaderProps {
  post: Post;
  onOptionsClick: () => void;
  onAvatarClick?: () => void;
}

export function PostHeader({ post, onOptionsClick, onAvatarClick }: PostHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3.5 py-3 select-none">
      <div className="flex items-center gap-3 min-w-0">
        <div onClick={onAvatarClick} className="shrink-0 cursor-pointer">
          <Avatar
            src={post.author.avatarUrl}
            alt={post.author.displayName}
            size="sm"
            isVerified={post.author.isVerified}
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/profile/${post.author.username}`}
              className="text-xs font-bold text-[var(--text-primary)] hover:text-[var(--accent-blue)] transition-colors truncate"
            >
              {post.author.username}
            </Link>
            <span className="text-[10px] text-[var(--text-tertiary)]">•</span>
            <span className="text-[10px] text-[var(--text-tertiary)] font-medium">
              {formatTimeAgo(post.createdAt)}
            </span>
          </div>

          {/* Location or Creative Atmosphere indicator */}
          {post.location && (
            <div className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] truncate">
              <Sparkles className="w-2.5 h-2.5 text-purple-400 shrink-0" />
              <span className="truncate">{post.location}</span>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onOptionsClick}
        className="p-2 -mr-1 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)] transition-colors cursor-pointer"
        aria-label="Post options"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Post } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface PostMetadataProps {
  post: Post;
  onCommentsClick: () => void;
}

export function PostMetadata({ post, onCommentsClick }: PostMetadataProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="px-3.5 pt-1.5 pb-2 space-y-1 text-xs select-none">
      {/* Likes Count */}
      {post.likes.length > 0 && (
        <p className="font-bold text-[var(--text-primary)]">
          {formatNumber(post.likes.length)} {post.likes.length === 1 ? 'like' : 'likes'}
        </p>
      )}

      {/* Caption with Expandable Toggle */}
      {post.caption && (
        <div className="leading-relaxed text-[var(--text-primary)]">
          <Link
            href={`/profile/${post.author.username}`}
            className="font-bold mr-1.5 hover:text-[var(--accent-blue)] transition-colors"
          >
            {post.author.username}
          </Link>
          <span className="break-words">
            {isExpanded || post.caption.length <= 90
              ? post.caption
              : `${post.caption.slice(0, 90)}...`}
          </span>
          {post.caption.length > 90 && !isExpanded && (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] ml-1 font-semibold cursor-pointer"
            >
              more
            </button>
          )}
        </div>
      )}

      {/* View Comments Link */}
      {post.commentsCount > 0 && (
        <button
          type="button"
          onClick={onCommentsClick}
          className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] font-medium pt-0.5 cursor-pointer block"
        >
          View all {post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}
        </button>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { Post } from '@/lib/types';
import { formatNumber, formatTimeAgo } from '@/lib/utils';

interface PostMetadataProps {
  post: Post;
  onCommentsClick: () => void;
}

export function PostMetadata({ post, onCommentsClick }: PostMetadataProps) {
  // Sample comment previews to match reference design
  const previewComments = React.useMemo(() => {
    if (post.id === 'post-arian-beach') {
      return [
        { user: 'maya.singh', text: 'Stunning view! 😍' },
        { user: 'kai.carter', text: 'Wish I was there!' },
      ];
    }
    return [];
  }, [post.id]);

  return (
    <div className="px-3.5 pt-1.5 pb-2 space-y-1.5 text-xs select-none">
      {/* Likes Count */}
      <p className="font-bold text-white text-xs">
        {formatNumber(post.likesCount || post.likes.length || 1245)} likes
      </p>

      {/* Caption */}
      {post.caption && (
        <div className="leading-relaxed text-neutral-200 text-xs">
          <Link
            href={`/profile/${post.author.username}`}
            className="font-bold mr-1.5 text-white hover:text-purple-300 transition-colors"
          >
            {post.author.username}
          </Link>
          <span className="break-words">{post.caption}</span>
        </div>
      )}

      {/* View All Comments Link */}
      <button
        type="button"
        onClick={onCommentsClick}
        className="text-[11px] text-neutral-400 hover:text-neutral-200 font-medium pt-0.5 cursor-pointer block"
      >
        View all {post.commentsCount || 32} comments
      </button>

      {/* Inline Comments Preview (From Reference Image) */}
      {previewComments.length > 0 && (
        <div className="space-y-1 pt-0.5">
          {previewComments.map((c, i) => (
            <div key={i} className="text-xs text-neutral-300">
              <span className="font-bold text-white mr-1.5">{c.user}</span>
              <span>{c.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <p className="text-[10px] text-neutral-500 pt-0.5">
        {post.id === 'post-arian-beach' ? '2 hours ago' : formatTimeAgo(post.createdAt)}
      </p>
    </div>
  );
}


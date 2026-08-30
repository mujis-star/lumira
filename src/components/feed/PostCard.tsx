'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Post } from '@/lib/types';
import { usePostInteractions } from '@/hooks/usePostInteractions';
import { useStory } from '@/context/StoryContext';
import { PostHeader } from './PostHeader';
import { PostMedia } from './PostMedia';
import { PostActions } from './PostActions';
import { PostMetadata } from './PostMetadata';
import { MusicAttachment } from './MusicAttachment';

const CommentsDrawer = dynamic(
  () => import('./CommentsDrawer').then((m) => m.CommentsDrawer),
  { ssr: false }
);
const ShareModal = dynamic(
  () => import('./ShareModal').then((m) => m.ShareModal),
  { ssr: false }
);
const PostOptionsModal = dynamic(
  () => import('./PostOptionsModal').then((m) => m.PostOptionsModal),
  { ssr: false }
);

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const {
    currentUser,
    isLiked,
    isBookmarked,
    isReposted,
    showHeartPop,
    inlineComment,
    setInlineComment,
    isSubmittingComment,
    handleDoubleTap,
    handleLike,
    handleBookmark,
    handleRepost,
    handleSubmitComment,
  } = usePostInteractions(post);

  const { stories, openStoryViewer } = useStory();

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const authorStory = stories.find((s) => s.userId === post.authorId);
  const hasAuthorStory = !!authorStory && authorStory.items.length > 0;

  const handleAvatarClick = () => {
    if (hasAuthorStory && authorStory) {
      openStoryViewer(authorStory.id);
    }
  };

  return (
    <article className="w-full rounded-3xl bg-[var(--glass-card-bg)] backdrop-blur-2xl border border-[var(--glass-border)] shadow-[var(--glass-shadow)] overflow-hidden transition-all hover:border-[var(--glass-border-highlight)]">
      {/* 1. Post Header */}
      <PostHeader
        post={post}
        onOptionsClick={() => setIsOptionsOpen(true)}
        onAvatarClick={handleAvatarClick}
      />

      {/* 2. Media Container */}
      <PostMedia
        media={post.media}
        showHeartPop={showHeartPop}
        onDoubleTap={handleDoubleTap}
      />

      {/* 3. Action Bar */}
      <PostActions
        isLiked={isLiked}
        isBookmarked={isBookmarked}
        isReposted={isReposted}
        onLike={handleLike}
        onCommentClick={() => setIsCommentsOpen(true)}
        onRepostClick={() => handleRepost()}
        onShareClick={() => setIsShareOpen(true)}
        onBookmark={handleBookmark}
      />

      {/* 4. Post Metadata & Captions */}
      <PostMetadata
        post={post}
        onCommentsClick={() => setIsCommentsOpen(true)}
      />

      {/* 5. Music Track Attachment */}
      <MusicAttachment audioTrack={post.audioTrack} />

      {/* 6. Quick Inline Comment Input (Desktop) */}
      {currentUser && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmitComment();
          }}
          className="hidden sm:flex items-center gap-2 px-3.5 py-2.5 border-t border-[var(--glass-border-subtle)] text-xs"
        >
          <input
            type="text"
            value={inlineComment}
            onChange={(e) => setInlineComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none text-xs"
          />
          {inlineComment.trim() && (
            <button
              type="submit"
              disabled={isSubmittingComment}
              className="text-[var(--accent-blue)] font-bold hover:underline cursor-pointer disabled:opacity-50"
            >
              Post
            </button>
          )}
        </form>
      )}

      {/* Modals and Drawers */}
      <CommentsDrawer
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        post={post}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        post={post}
      />

      <PostOptionsModal
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        post={post}
      />
    </article>
  );
}

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
import { Avatar } from '../ui/Avatar';

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
    <article className="w-full rounded-3xl bg-[#11121a]/85 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden transition-all hover:border-white/20">
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
        isReel={post.isReel}
        likesCount={post.likesCount}
        commentsCount={post.commentsCount}
        sharesCount={post.sharesCount}
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

      {/* 5. Inline Comment Input with Avatar (From Reference Image) */}
      <div className="px-3.5 pb-2.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmitComment();
          }}
          className="flex items-center gap-2.5 pt-1 text-xs"
        >
          <Avatar
            src={currentUser?.avatarUrl || '/images/avatar-mujeeb.png'}
            alt={currentUser?.displayName || 'User'}
            size="xs"
          />
          <input
            type="text"
            value={inlineComment}
            onChange={(e) => setInlineComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-transparent text-neutral-200 placeholder-neutral-500 focus:outline-none text-xs"
          />
          {inlineComment.trim() && (
            <button
              type="submit"
              disabled={isSubmittingComment}
              className="text-[#0095f6] font-bold hover:underline cursor-pointer disabled:opacity-50"
            >
              Post
            </button>
          )}
        </form>
      </div>

      {/* 6. Music Track Attachment */}
      <MusicAttachment audioTrack={post.audioTrack} />

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


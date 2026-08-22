'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Post } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { usePost } from '@/context/PostContext';
import { useStory } from '@/context/StoryContext';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { CommentsDrawer } from './CommentsDrawer';
import { ShareModal } from './ShareModal';
import { PostOptionsModal } from './PostOptionsModal';
import { EmojiPickerModal } from '../ui/EmojiPicker';
import { audioEngine } from '@/lib/audioEngine';
import { formatTimeAgo, formatNumber } from '@/lib/utils';
import {
  Heart,
  MessageCircle,
  Repeat,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Smile,
  Music,
  Volume2,
  VolumeX,
  Play,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { currentUser } = useAuth();
  const { toggleLikePost, toggleBookmarkPost, toggleRepost, isPostReposted, addComment } = usePost();
  const { stories, openStoryViewer, createStory } = useStory();

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isRepostModalOpen, setIsRepostModalOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [repostQuote, setRepostQuote] = useState('');
  const [showQuoteInput, setShowQuoteInput] = useState(false);
  const [inlineComment, setInlineComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const lastTapRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isLiked = currentUser ? post.likes.includes(currentUser.id) : false;
  const isBookmarked = currentUser ? post.bookmarkedBy.includes(currentUser.id) : false;
  const isReposted = isPostReposted(post.id);

  const authorStory = stories.find((s) => s.userId === post.authorId);
  const hasAuthorStory = !!authorStory && authorStory.items.length > 0;

  const currentMedia = post.media[currentMediaIndex] || post.media[0];
  const isVideo =
    currentMedia?.type === 'video' ||
    currentMedia?.url.startsWith('data:video') ||
    currentMedia?.url.endsWith('.mp4') ||
    currentMedia?.url.endsWith('.webm');

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!isLiked) {
        toggleLikePost(post.id);
      }
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 900);
    } else if (isVideo && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
    lastTapRef.current = now;
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleInlineCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    await addComment(post.id, inlineComment);
    setInlineComment('');
    setIsSubmittingComment(false);
  };

  const handleInstantRepost = () => {
    toggleRepost(post.id);
    setIsRepostModalOpen(false);
  };

  const handleQuoteRepost = (e: React.FormEvent) => {
    e.preventDefault();
    toggleRepost(post.id, repostQuote.trim());
    setRepostQuote('');
    setShowQuoteInput(false);
    setIsRepostModalOpen(false);
  };

  const handleShareToStory = () => {
    if (post.media[0]) {
      createStory({
        mediaUrl: post.media[0].url,
        type: post.media[0].type || 'image',
        caption: `Shared @${post.author.username}'s post`,
      });
    }
    setIsRepostModalOpen(false);
  };

  return (
    <article className="bg-[var(--bg-primary)] border-b border-[var(--border-color)] pb-4 max-w-[470px] mx-auto w-full select-none">
      {/* 0. Repost Attribution Banner */}
      {post.isRepost && post.repostAuthor && (
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-1 text-xs font-semibold text-[var(--text-secondary)]">
          <Repeat className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
          <span>
            <Link href={`/profile/${post.repostAuthor.username}`} className="text-[var(--text-primary)] hover:underline">
              {post.repostAuthor.username}
            </Link>{' '}
            reposted
          </span>
        </div>
      )}

      {/* Repost Note Quote if attached */}
      {post.repostNote && (
        <div className="mx-3 mb-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border-l-2 border-emerald-500 text-xs text-[var(--text-primary)]">
          <p className="font-medium">&ldquo;{post.repostNote}&rdquo;</p>
        </div>
      )}

      {/* 1. Header (Avatar, Username, Location, Time, Options Menu) */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <div
            onClick={() => {
              if (hasAuthorStory && authorStory) {
                openStoryViewer(authorStory.id);
              }
            }}
            className={hasAuthorStory ? 'cursor-pointer' : ''}
          >
            <Avatar
              src={post.author.avatarUrl}
              alt={post.author.displayName}
              size="sm"
              hasStory={hasAuthorStory}
              isStorySeen={authorStory ? !authorStory.hasUnseen : false}
              isVerified={post.author.isVerified}
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/profile/${post.author.username}`}
                className="text-xs font-bold text-[var(--text-primary)] hover:opacity-75 transition-opacity"
              >
                {post.author.username}
              </Link>
              <span className="text-xs text-[var(--text-secondary)]">•</span>
              <span className="text-xs text-[var(--text-secondary)]">
                {formatTimeAgo(post.createdAt)}
              </span>
            </div>

            {post.location && (
              <span className="text-[11px] text-[var(--text-secondary)] leading-tight">
                {post.location}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsOptionsOpen(true)}
          className="p-1 -m-1 text-[var(--text-primary)] hover:opacity-60 transition-opacity cursor-pointer"
          aria-label="Post options"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Media Area (Photo or Video Player) */}
      <div
        className="relative aspect-square w-full bg-black overflow-hidden group cursor-pointer"
        onClick={handleDoubleTap}
      >
        {isVideo ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={currentMedia.url}
              autoPlay
              loop
              playsInline
              muted={isMuted}
              className="w-full h-full object-cover"
            />
            {/* Audio Mute/Unmute Overlay */}
            <button
              onClick={toggleMute}
              className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors z-20 cursor-pointer shadow-md"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Play/Pause overlay icon when toggled */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-10">
                <div className="p-3 rounded-full bg-black/60 text-white">
                  <Play className="w-8 h-8 fill-white" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <Image
            src={currentMedia?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe'}
            alt={currentMedia?.altText || post.caption}
            fill
            className="object-cover"
            priority
            unoptimized
          />
        )}

        {/* Big White Heart Pop on Double-tap */}
        {showHeartPop && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl animate-heart-pop" />
          </div>
        )}

        {/* Carousel Navigation Arrows */}
        {post.media.length > 1 && (
          <>
            {currentMediaIndex > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMediaIndex((prev) => prev - 1);
                }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 cursor-pointer z-10"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {currentMediaIndex < post.media.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMediaIndex((prev) => prev - 1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 cursor-pointer z-10"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Pagination Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
              {post.media.map((_, idx) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    currentMediaIndex === idx
                      ? 'bg-[#0095f6] scale-125'
                      : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 3. Action Buttons Row */}
      <div className="p-3 pb-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-[var(--text-primary)]">
            {/* Like */}
            <button
              onClick={() => toggleLikePost(post.id)}
              className="p-1 -m-1 hover:opacity-60 transition-transform active:scale-125 cursor-pointer"
              aria-label={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart
                className={`w-6 h-6 stroke-[1.75] ${
                  isLiked ? 'text-[#ff3040] fill-[#ff3040] stroke-[#ff3040]' : ''
                }`}
              />
            </button>

            {/* Comment */}
            <button
              onClick={() => setIsCommentsOpen(true)}
              className="p-1 -m-1 hover:opacity-60 transition-opacity cursor-pointer"
              aria-label="Comment"
            >
              <MessageCircle className="w-6 h-6 stroke-[1.75]" />
            </button>

            {/* Repost */}
            <button
              onClick={() => setIsRepostModalOpen(true)}
              className={`p-1 -m-1 hover:opacity-60 transition-transform active:scale-125 cursor-pointer ${
                isReposted ? 'text-emerald-500' : ''
              }`}
              aria-label={isReposted ? 'Undo repost' : 'Repost'}
              title={isReposted ? 'Undo repost' : 'Repost'}
            >
              <Repeat className={`w-6 h-6 stroke-[1.75] ${isReposted ? 'stroke-[2.2]' : ''}`} />
            </button>

            {/* Share / Direct */}
            <button
              onClick={() => setIsShareOpen(true)}
              className="p-1 -m-1 hover:opacity-60 transition-opacity cursor-pointer"
              aria-label="Share post"
            >
              <Send className="w-6 h-6 stroke-[1.75]" />
            </button>
          </div>

          {/* Bookmark */}
          <button
            onClick={() => toggleBookmarkPost(post.id)}
            className="p-1 -m-1 hover:opacity-60 transition-opacity cursor-pointer text-[var(--text-primary)]"
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            <Bookmark
              className={`w-6 h-6 stroke-[1.75] ${
                isBookmarked ? 'fill-current' : ''
              }`}
            />
          </button>
        </div>

        {/* 4. Likes & Reposts Counters */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[var(--text-primary)]">
            {formatNumber(post.likesCount)} likes
          </span>

          {(post.repostsCount || 0) > 0 && (
            <>
              <span className="text-[10px] text-[var(--text-secondary)]">•</span>
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5 stroke-[2]" />
                <span>{formatNumber(post.repostsCount || 0)} reposts</span>
              </span>
            </>
          )}
        </div>

        {/* 5. Caption & Author */}
        <div className="text-xs text-[var(--text-primary)] leading-normal space-y-0.5">
          <p>
            <Link href={`/profile/${post.author.username}`} className="font-bold mr-1.5 hover:underline">
              {post.author.username}
            </Link>
            <span className="whitespace-pre-line">{post.caption}</span>
          </p>
        </div>

        {/* Instagram-Style Interactive Music Track Row */}
        {post.audioTrack && (
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] font-medium pt-1">
            <Link
              href={`/audio/${('trackId' in post.audioTrack && post.audioTrack.trackId) ? post.audioTrack.trackId : encodeURIComponent(post.audioTrack.title)}`}
              className="inline-flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors group/audio max-w-full truncate"
            >
              <Music className="w-3.5 h-3.5 text-[var(--text-primary)] group-hover/audio:scale-110 transition-transform shrink-0" />
              <span className="truncate font-semibold text-[var(--text-primary)]">
                {post.audioTrack.title}
              </span>
              <span>•</span>
              <span className="truncate">{post.audioTrack.artist}</span>
            </Link>

            {/* Quick Play/Pause background track */}
            <button
              type="button"
              onClick={() => {
                if (!post.audioTrack) return;
                const source = ('audioSource' in post.audioTrack && post.audioTrack.audioSource)
                  ? post.audioTrack.audioSource
                  : 'synth-pulse';

                if (audioEngine) {
                  if (audioEngine.getIsPlaying() && audioEngine.getCurrentTrackId() === source) {
                    audioEngine.stop();
                  } else {
                    const startTime = ('startTime' in post.audioTrack && post.audioTrack.startTime) || 0;
                    const duration = ('duration' in post.audioTrack && post.audioTrack.duration) || 30;
                    audioEngine.play(source, startTime, duration);
                  }
                }
              }}
              className="p-1 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-[10px] text-blue-500 font-bold flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
              title="Play background track"
            >
              <span className="animate-pulse">ılı</span>
            </button>
          </div>
        )}

        {/* 6. Comments Count Link */}
        {post.commentsCount > 0 && (
          <button
            onClick={() => setIsCommentsOpen(true)}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer block pt-0.5"
          >
            View all {post.commentsCount} comments
          </button>
        )}

        {/* 7. Inline Quick Comment Form */}
        {post.allowComments && (
          <form
            onSubmit={handleInlineCommentSubmit}
            className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] mt-2"
          >
            <input
              type="text"
              value={inlineComment}
              onChange={(e) => setInlineComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none"
            />
            {inlineComment.trim() && (
              <button
                type="submit"
                disabled={isSubmittingComment}
                className="text-xs font-bold text-[#0095f6] hover:text-[#1877f2] ml-2 shrink-0 cursor-pointer disabled:opacity-50"
              >
                Post
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen(true)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] ml-2 transition-colors cursor-pointer"
              title="Add emoji"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>

      {/* Full Every Emoji Picker Modal */}
      <EmojiPickerModal
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        onSelectEmoji={(emoji) => setInlineComment((prev) => prev + emoji)}
        title="Add Emoji"
      />

      {/* Repost Options Modal */}
      <Modal isOpen={isRepostModalOpen} onClose={() => { setIsRepostModalOpen(false); setShowQuoteInput(false); }} title="Repost" size="sm">
        <div className="p-4 space-y-3">
          {!showQuoteInput ? (
            <>
              {/* Instant Repost */}
              <button
                onClick={handleInstantRepost}
                className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[var(--text-primary)] transition-colors cursor-pointer text-left"
              >
                <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold">{isReposted ? 'Undo Repost' : 'Repost to Feed'}</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {isReposted ? 'Remove this post from your feed' : 'Instantly share this post with your followers'}
                  </p>
                </div>
              </button>

              {/* Quote / Repost with thoughts */}
              <button
                onClick={() => setShowQuoteInput(true)}
                className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[var(--text-primary)] transition-colors cursor-pointer text-left"
              >
                <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold">Quote Post</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">Add your own thoughts or comment before reposting</p>
                </div>
              </button>

              {/* Share to Story */}
              <button
                onClick={handleShareToStory}
                className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[var(--text-primary)] transition-colors cursor-pointer text-left"
              >
                <div className="p-2 rounded-full bg-purple-500/10 text-purple-500">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold">Add post to your story</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">Share to your 24-hour story</p>
                </div>
              </button>
            </>
          ) : (
            /* Quote input form */
            <form onSubmit={handleQuoteRepost} className="space-y-3">
              <p className="text-xs font-bold text-[var(--text-primary)]">Add your thoughts:</p>
              <textarea
                rows={3}
                autoFocus
                value={repostQuote}
                onChange={(e) => setRepostQuote(e.target.value)}
                placeholder="What do you think about this post?"
                className="w-full p-3 rounded-xl bg-[var(--input-bg)] text-xs text-[var(--text-primary)] focus:outline-none border border-[var(--border-color)] resize-none"
                maxLength={200}
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuoteInput(false)}
                  className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!repostQuote.trim()}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer shadow"
                >
                  Repost
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Comments Drawer */}
      <CommentsDrawer
        post={post}
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
      />

      {/* Share Direct Modal */}
      <ShareModal
        post={post}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      {/* Post Options Menu */}
      <PostOptionsModal
        post={post}
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
      />
    </article>
  );
}

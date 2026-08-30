'use client';

import { useState, useCallback, useRef } from 'react';
import { Post } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { usePost } from '@/context/PostContext';
import { sounds } from '@/lib/utils';

export function usePostInteractions(post: Post) {
  const { currentUser } = useAuth();
  const {
    toggleLikePost,
    toggleBookmarkPost,
    toggleRepost,
    isPostReposted,
    addComment,
  } = usePost();

  const [showHeartPop, setShowHeartPop] = useState(false);
  const [inlineComment, setInlineComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const lastTapRef = useRef<number>(0);

  const isLiked = currentUser ? post.likes.includes(currentUser.id) : false;
  const isBookmarked = currentUser ? post.bookmarkedBy.includes(currentUser.id) : false;
  const isReposted = isPostReposted(post.id);

  // Handle Double-Tap on media
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!isLiked) {
        toggleLikePost(post.id);
        sounds.playPop();
      }
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 900);
    }
    lastTapRef.current = now;
  }, [isLiked, post.id, toggleLikePost]);

  // Handle Like Action
  const handleLike = useCallback(() => {
    toggleLikePost(post.id);
    sounds.playPop();
  }, [post.id, toggleLikePost]);

  // Handle Bookmark Action
  const handleBookmark = useCallback(() => {
    toggleBookmarkPost(post.id);
    sounds.playPop();
  }, [post.id, toggleBookmarkPost]);

  // Handle Repost Action
  const handleRepost = useCallback((quote?: string) => {
    toggleRepost(post.id, quote);
    sounds.playPop();
  }, [post.id, toggleRepost]);

  // Handle Quick Inline Comment Submission
  const handleSubmitComment = useCallback(async () => {
    if (!inlineComment.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      await addComment(post.id, inlineComment.trim());
      setInlineComment('');
      sounds.playPop();
    } catch {
      // rollback or handle error
    } finally {
      setIsSubmittingComment(false);
    }
  }, [inlineComment, isSubmittingComment, post.id, addComment]);

  return {
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
  };
}

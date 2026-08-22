'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Post } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { usePost } from '@/context/PostContext';
import { Avatar } from '../ui/Avatar';
import { formatTimeAgo } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Smile, Plus } from 'lucide-react';
import { EmojiPickerModal } from '../ui/EmojiPicker';

interface CommentsDrawerProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

export function CommentsDrawer({ post, isOpen, onClose }: CommentsDrawerProps) {
  const { currentUser } = useAuth();
  const { getPostComments, addComment, toggleLikeComment } = usePost();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const comments = getPostComments(post.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    await addComment(post.id, commentText);
    setCommentText('');
    setIsSubmitting(false);
  };

  const handleEmojiClick = (emoji: string) => {
    setCommentText((prev) => prev + emoji);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/65 z-50 backdrop-blur-xs"
          />

          {/* Dialog Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-lg max-h-[85vh] bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
                <span className="w-6" />
                <h2 className="text-sm font-bold text-[var(--text-primary)]">Comments</h2>
                <button
                  onClick={onClose}
                  className="p-1 text-[var(--text-primary)] hover:opacity-70 cursor-pointer"
                  aria-label="Close comments"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Comments Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Author Caption Row */}
                <div className="flex items-start gap-3 text-xs pb-3 border-b border-[var(--border-subtle)]">
                  <Avatar src={post.author.avatarUrl} alt={post.author.displayName} size="sm" isVerified={post.author.isVerified} />
                  <div className="flex-1 min-w-0 leading-relaxed">
                    <p className="text-[var(--text-primary)]">
                      <Link href={`/profile/${post.author.username}`} className="font-bold mr-1.5 hover:underline">
                        {post.author.username}
                      </Link>
                      <span>{post.caption}</span>
                    </p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                      {formatTimeAgo(post.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Comment items */}
                {comments.length > 0 ? (
                  comments.map((comment) => {
                    const isLiked = currentUser ? comment.likes.includes(currentUser.id) : false;

                    return (
                      <div key={comment.id} className="flex items-start justify-between gap-3 text-xs group">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <Avatar
                            src={comment.user.avatarUrl}
                            alt={comment.user.displayName}
                            size="sm"
                            isVerified={comment.user.isVerified}
                          />
                          <div className="flex-1 min-w-0 leading-relaxed">
                            <p className="text-[var(--text-primary)]">
                              <Link href={`/profile/${comment.user.username}`} className="font-bold mr-1.5 hover:underline">
                                {comment.user.username}
                              </Link>
                              <span>{comment.content}</span>
                            </p>
                            <div className="flex items-center gap-3 text-[10px] text-[var(--text-secondary)] mt-1">
                              <span>{formatTimeAgo(comment.createdAt)}</span>
                              {comment.likesCount > 0 && (
                                <span className="font-semibold">{comment.likesCount} likes</span>
                              )}
                              <button
                                onClick={() => setCommentText(`@${comment.user.username} `)}
                                className="font-semibold hover:text-[var(--text-primary)] cursor-pointer"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Like comment button */}
                        <button
                          onClick={() => toggleLikeComment(post.id, comment.id)}
                          className="pt-1 text-[var(--text-secondary)] hover:text-[#ff3040] cursor-pointer"
                          aria-label="Like comment"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              isLiked ? 'text-[#ff3040] fill-[#ff3040]' : 'stroke-[1.75]'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 space-y-1">
                    <p className="text-sm font-bold text-[var(--text-primary)]">No comments yet.</p>
                    <p className="text-xs text-[var(--text-secondary)]">Start the conversation.</p>
                  </div>
                )}
              </div>

              {/* Quick Emojis Bar with + button */}
              <div className="px-4 py-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-lg">
                {['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiClick(emoji)}
                    className="hover:scale-125 transition-transform cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsEmojiPickerOpen(true)}
                  className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-[var(--text-primary)] hover:scale-110 transition-transform cursor-pointer shadow-xs"
                  title="Every Emoji"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Bottom Comment Input */}
              {post.allowComments && (
                <form
                  onSubmit={handleSubmit}
                  className="px-4 py-3 border-t border-[var(--border-color)] flex items-center gap-3 bg-[var(--bg-primary)]"
                >
                  <button
                    type="button"
                    onClick={() => setIsEmojiPickerOpen(true)}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
                    title="Open Emoji Picker"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || isSubmitting}
                    className="text-xs font-bold text-[#0095f6] hover:text-[#1877f2] transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-default shrink-0"
                  >
                    Post
                  </button>
                </form>
              )}
            </motion.div>
          </div>

          {/* Full Every Emoji Picker Modal */}
          <EmojiPickerModal
            isOpen={isEmojiPickerOpen}
            onClose={() => setIsEmojiPickerOpen(false)}
            onSelectEmoji={(emoji) => handleEmojiClick(emoji)}
            title="All Emojis"
          />
        </>
      )}
    </AnimatePresence>
  );
}

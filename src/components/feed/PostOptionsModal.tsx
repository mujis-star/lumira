'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Post } from '@/lib/types';
import { Modal } from '../ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { usePost } from '@/context/PostContext';

interface PostOptionsModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

export function PostOptionsModal({ post, isOpen, onClose }: PostOptionsModalProps) {
  const router = useRouter();
  const { currentUser, toggleFollow, isFollowing } = useAuth();
  const { deletePost, toggleBookmarkPost } = usePost();
  const [copied, setCopied] = useState(false);

  const isOwnPost = currentUser?.id === post.authorId;
  const isFollowingAuthor = isFollowing(post.authorId);
  const isSaved = currentUser ? post.bookmarkedBy.includes(currentUser.id) : false;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/profile/${post.author.username}`);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 800);
    }
  };

  const handleDelete = () => {
    deletePost(post.id);
    onClose();
  };

  const handleUnfollow = () => {
    toggleFollow(post.authorId);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="bg-[var(--modal-bg)] rounded-2xl overflow-hidden divide-y divide-[var(--border-color)] text-center text-sm font-normal select-none">
        {isOwnPost ? (
          <button
            onClick={handleDelete}
            className="w-full py-3.5 text-[#ed4956] font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Delete Post
          </button>
        ) : (
          <>
            <button
              onClick={onClose}
              className="w-full py-3.5 text-[#ed4956] font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Report
            </button>

            {isFollowingAuthor && (
              <button
                onClick={handleUnfollow}
                className="w-full py-3.5 text-[#ed4956] font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Unfollow
              </button>
            )}
          </>
        )}

        <button
          onClick={() => {
            toggleBookmarkPost(post.id);
            onClose();
          }}
          className="w-full py-3.5 text-[var(--text-primary)] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          {isSaved ? 'Remove from Saved' : 'Add to favorites'}
        </button>

        <button
          onClick={() => {
            onClose();
            router.push(`/profile/${post.author.username}`);
          }}
          className="w-full py-3.5 text-[var(--text-primary)] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          Go to post
        </button>

        <button
          onClick={handleCopyLink}
          className="w-full py-3.5 text-[var(--text-primary)] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          {copied ? 'Link Copied to Clipboard!' : 'Copy link'}
        </button>

        <button
          onClick={onClose}
          className="w-full py-3.5 text-[var(--text-primary)] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}

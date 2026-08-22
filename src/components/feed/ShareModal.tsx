'use client';

import React, { useState } from 'react';
import { Post } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { usePost } from '@/context/PostContext';
import { useStory } from '@/context/StoryContext';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { Search, Check, Link as LinkIcon, Send, Repeat, BookOpen } from 'lucide-react';

interface ShareModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ post, isOpen, onClose }: ShareModalProps) {
  const { allUsers, currentUser } = useAuth();
  const { sendMessage } = useChat();
  const { toggleRepost, isPostReposted } = usePost();
  const { createStory } = useStory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const isReposted = isPostReposted(post.id);

  const filteredUsers = allUsers.filter(
    (u) =>
      u.id !== currentUser?.id &&
      (u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSendDirect = () => {
    if (selectedUserIds.length === 0) return;
    setIsSending(true);

    selectedUserIds.forEach((receiverId) => {
      sendMessage({
        receiverId,
        content: `Shared a post from @${post.author.username}`,
        mediaUrl: post.media[0]?.url,
        mediaType: 'image',
      });
    });

    setTimeout(() => {
      setIsSending(false);
      setSelectedUserIds([]);
      onClose();
    }, 400);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/profile/${post.author.username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRepost = () => {
    toggleRepost(post.id);
    onClose();
  };

  const handleAddToStory = () => {
    if (post.media[0]) {
      createStory({
        mediaUrl: post.media[0].url,
        type: post.media[0].type || 'image',
        caption: `Shared @${post.author.username}'s post`,
      });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title="Share">
      <div className="p-4 space-y-4">
        {/* Quick Share Options (Repost, Story, Copy) */}
        <div className="grid grid-cols-3 gap-2 pb-2 border-b border-[var(--border-color)]">
          <button
            onClick={handleRepost}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer text-[var(--text-primary)]"
          >
            <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500">
              <Repeat className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold">{isReposted ? 'Undo Repost' : 'Repost'}</span>
          </button>

          <button
            onClick={handleAddToStory}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer text-[var(--text-primary)]"
          >
            <div className="p-2 rounded-full bg-purple-500/10 text-purple-500">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold">Add to story</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer text-[var(--text-primary)]"
          >
            <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
              <LinkIcon className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold">{copied ? 'Copied!' : 'Copy link'}</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search people to send to..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--input-bg)] text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none border border-[var(--border-color)]"
          />
        </div>

        {/* User list */}
        <div className="max-h-56 overflow-y-auto space-y-1 py-1">
          {filteredUsers.map((user) => {
            const isSelected = selectedUserIds.includes(user.id);

            return (
              <div
                key={user.id}
                onClick={() => toggleSelectUser(user.id)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" isVerified={user.isVerified} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                      {user.username}
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate">
                      {user.displayName}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-[#0095f6] border-[#0095f6] text-white'
                      : 'border-[var(--border-color)]'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Direct Send button */}
        <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between gap-3">
          <span className="text-xs text-[var(--text-secondary)]">
            {selectedUserIds.length > 0 ? `${selectedUserIds.length} selected` : 'Select users above'}
          </span>

          <button
            onClick={handleSendDirect}
            disabled={selectedUserIds.length === 0 || isSending}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer disabled:cursor-default shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSending ? 'Sending...' : 'Send in Direct'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

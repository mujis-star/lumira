'use client';

import React, { useState, useMemo } from 'react';
import { EMOJI_CATEGORIES } from '@/lib/emojiData';
import { Modal } from './Modal';
import { Search, Sparkles } from 'lucide-react';
import { sounds } from '@/lib/utils';

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  title?: string;
}

export function EmojiPickerModal({
  isOpen,
  onClose,
  onSelectEmoji,
  title = 'Pick an Emoji',
}: EmojiPickerProps) {
  const [activeTab, setActiveTab] = useState<string>(EMOJI_CATEGORIES[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return EMOJI_CATEGORIES;
    }
    const q = searchQuery.toLowerCase().trim();

    return EMOJI_CATEGORIES.map((cat) => ({
      ...cat,
      emojis: cat.emojis.filter((e) => {
        // match category name or direct emoji
        return cat.name.toLowerCase().includes(q) || e.includes(q);
      }),
    })).filter((cat) => cat.emojis.length > 0);
  }, [searchQuery]);

  const handleEmojiClick = (emoji: string) => {
    sounds.playPop();
    onSelectEmoji(emoji);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="p-3 sm:p-4 space-y-3 select-none">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search every emoji..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--input-bg)] text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none border border-[var(--border-color)]"
            autoFocus
          />
        </div>

        {/* Category Icons Tabs */}
        {!searchQuery && (
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 border-b border-[var(--border-subtle)] scrollbar-none">
            {EMOJI_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`p-2 rounded-lg text-lg transition-transform cursor-pointer ${
                  activeTab === cat.id
                    ? 'bg-neutral-200 dark:bg-neutral-700 scale-110'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 opacity-70 hover:opacity-100'
                }`}
                title={cat.name}
              >
                {cat.icon}
              </button>
            ))}
          </div>
        )}

        {/* Emoji Grid Container */}
        <div className="max-h-72 overflow-y-auto pr-1 space-y-4">
          {filteredCategories.map((cat) => {
            if (!searchQuery && cat.id !== activeTab) return null;

            return (
              <div key={cat.id} className="space-y-2">
                <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider sticky top-0 bg-[var(--modal-bg)] py-1 z-10">
                  {cat.name}
                </p>
                <div className="grid grid-cols-7 sm:grid-cols-8 gap-1">
                  {cat.emojis.map((emoji, idx) => (
                    <button
                      key={`${cat.id}-${idx}-${emoji}`}
                      type="button"
                      onClick={() => handleEmojiClick(emoji)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:scale-125 active:scale-95 transition-all cursor-pointer"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredCategories.length === 0 && (
            <div className="py-12 text-center text-xs text-[var(--text-secondary)] space-y-1">
              <Sparkles className="w-6 h-6 mx-auto opacity-50" />
              <p>No emojis found for &ldquo;{searchQuery}&rdquo;</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

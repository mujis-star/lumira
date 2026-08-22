'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '../ui/Avatar';
import {
  Search,
  X,
  Clock,
  Hash,
} from 'lucide-react';

interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const TRENDING_TAGS = [
  'photography',
  'architecture',
  'tokyo',
  'travel',
  'streetphotography',
  'design',
  'art',
  'reels',
];

export function SearchDrawer({ isOpen, onClose }: SearchDrawerProps) {
  const router = useRouter();
  const { allUsers } = useAuth();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ig-recent-searches');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return ['elena.vance', '#photography', 'marcus.thorne', '#tokyo'];
  });

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const clean = term.trim();
    const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
    setRecentSearches(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ig-recent-searches', JSON.stringify(updated));
    }
  };

  const removeRecentSearch = (term: string) => {
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ig-recent-searches', JSON.stringify(updated));
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ig-recent-searches');
    }
  };

  // Filtered accounts
  const matchingUsers = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().replace('@', '');
    return allUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.bio?.toLowerCase().includes(q)
    );
  }, [query, allUsers]);

  // Filtered tags
  const matchingTags = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().replace('#', '');
    return TRENDING_TAGS.filter((tag) => tag.toLowerCase().includes(q));
  }, [query]);

  const handleSelectUser = (username: string) => {
    saveRecentSearch(username);
    handleClose();
    router.push(`/profile/${username}`);
  };

  const handleSelectTag = (tag: string) => {
    saveRecentSearch(`#${tag}`);
    handleClose();
    router.push(`/search?tag=${tag}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    saveRecentSearch(query);
    handleClose();
    router.push(`/search?q=${encodeURIComponent(query)}`);
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
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Slide-out Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed top-0 left-0 bottom-0 w-full max-w-[397px] bg-[var(--bg-primary)] border-r border-[var(--border-color)] shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-[var(--border-color)] space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Search</h2>
                <button
                  onClick={handleClose}
                  className="p-1 text-[var(--text-primary)] hover:opacity-70 cursor-pointer"
                  aria-label="Close search"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full pl-10 pr-9 py-2.5 rounded-lg bg-[var(--input-bg)] text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-neutral-400 text-white hover:opacity-80 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </form>
            </div>

            {/* Results / Recent Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {query ? (
                /* Matching Results */
                <div className="space-y-1">
                  {matchingUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleSelectUser(user.username)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar src={user.avatarUrl} alt={user.displayName} size="md" isVerified={user.isVerified} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                            {user.username}
                          </p>
                          <p className="text-[11px] text-[var(--text-secondary)] truncate">
                            {user.displayName}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {matchingTags.map((tag) => (
                    <div
                      key={tag}
                      onClick={() => handleSelectTag(tag)}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)]">
                        <Hash className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        #{tag}
                      </span>
                    </div>
                  ))}

                  {matchingUsers.length === 0 && matchingTags.length === 0 && (
                    <p className="text-center py-12 text-xs text-[var(--text-secondary)]">
                      No results found.
                    </p>
                  )}
                </div>
              ) : (
                /* Recent Searches */
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-bold text-[var(--text-primary)]">Recent</span>
                    {recentSearches.length > 0 && (
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs font-bold text-[#0095f6] hover:text-[#1877f2] cursor-pointer"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {recentSearches.length > 0 ? (
                    <div className="space-y-1">
                      {recentSearches.map((term) => (
                        <div
                          key={term}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group"
                        >
                          <div
                            onClick={() => {
                              if (term.startsWith('#')) {
                                handleSelectTag(term.replace('#', ''));
                              } else {
                                handleSelectUser(term);
                              }
                            }}
                            className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                          >
                            <div className="w-9 h-9 rounded-full border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)]">
                              <Clock className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                              {term}
                            </span>
                          </div>

                          <button
                            onClick={() => removeRecentSearch(term)}
                            className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-16 text-xs text-[var(--text-secondary)]">
                      No recent searches.
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

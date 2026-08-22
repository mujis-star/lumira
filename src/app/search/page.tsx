'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { usePost } from '@/context/PostContext';
import { Avatar } from '@/components/ui/Avatar';
import { formatNumber } from '@/lib/utils';
import { Search, X, Heart, MessageCircle } from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialTag = searchParams.get('tag') || '';

  const { allUsers, toggleFollow, isFollowing, currentUser } = useAuth();
  const { posts } = usePost();

  const [rawQuery, setRawQuery] = useState<string | null>(null);

  const query = rawQuery !== null ? rawQuery : (initialQuery || (initialTag ? `#${initialTag}` : ''));
  const setQuery = (q: string) => setRawQuery(q);

  // Filtered creators
  const matchedUsers = useMemo(() => {
    if (!query.trim()) return [];
    const clean = query.toLowerCase().replace('@', '');
    return allUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(clean) ||
        u.displayName.toLowerCase().includes(clean) ||
        u.bio?.toLowerCase().includes(clean)
    );
  }, [query, allUsers]);

  // Filtered posts
  const matchedPosts = useMemo(() => {
    if (!query.trim()) return posts;
    const clean = query.toLowerCase().replace('#', '');
    return posts.filter(
      (p) =>
        p.caption.toLowerCase().includes(clean) ||
        p.tags.some((t) => t.toLowerCase().includes(clean)) ||
        p.author.displayName.toLowerCase().includes(clean) ||
        p.author.username.toLowerCase().includes(clean) ||
        p.location?.toLowerCase().includes(clean)
    );
  }, [query, posts]);

  return (
    <div className="max-w-[760px] mx-auto py-4 sm:py-8 px-4 space-y-6 select-none">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search accounts, hashtags, or locations"
          className="w-full pl-11 pr-10 py-3 rounded-xl bg-[var(--input-bg)] text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none border border-[var(--border-color)]"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Creators matching */}
      {matchedUsers.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-[var(--text-primary)]">Accounts</p>
          <div className="space-y-1">
            {matchedUsers.map((user) => {
              const following = isFollowing(user.id);
              const isSelf = currentUser?.id === user.id;

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Link href={`/profile/${user.username}`} className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar src={user.avatarUrl} alt={user.displayName} size="md" isVerified={user.isVerified} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">{user.username}</p>
                      <p className="text-[11px] text-[var(--text-secondary)] truncate">{user.displayName}</p>
                    </div>
                  </Link>

                  {!isSelf && (
                    <button
                      onClick={() => toggleFollow(user.id)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        following
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-[var(--text-primary)]'
                          : 'bg-[#0095f6] hover:bg-[#1877f2] text-white'
                      }`}
                    >
                      {following ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Posts Results */}
      <div className="space-y-3">
        <p className="text-sm font-bold text-[var(--text-primary)]">
          {query ? `Explore for "${query}"` : 'Explore Posts'}
        </p>

        {matchedPosts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 sm:gap-4">
            {matchedPosts.map((post) => (
              <Link
                key={post.id}
                href={`/profile/${post.author.username}`}
                className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-900 group"
              >
                <Image src={post.media[0]?.url} alt={post.caption} fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-xs">
                  <span className="flex items-center gap-1"><Heart className="w-4 h-4 fill-white" /> {formatNumber(post.likesCount)}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4 fill-white" /> {formatNumber(post.commentsCount)}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-xs text-[var(--text-secondary)]">
            No results found for &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <AppShell title="Search">
      <Suspense fallback={<div className="text-center py-12 text-neutral-400">Loading Search...</div>}>
        <SearchContent />
      </Suspense>
    </AppShell>
  );
}

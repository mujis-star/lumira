'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StoryBar } from '@/components/stories/StoryBar';
import { PostCard } from '@/components/feed/PostCard';
import { RightWidgetPanel } from '@/components/layout/RightWidgetPanel';
import { SkeletonPost } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePost } from '@/context/PostContext';
import { useAuth } from '@/context/AuthContext';
import {
  Sparkles,
  Users,
  Flame,
  Cloud,
  Sun,
  Moon,
  Compass,
  Palette,
  Building2,
  TreePine,
} from 'lucide-react';

type FeedTab = 'for-you' | 'following' | 'atmospheres' | 'trending';

const ATMOSPHERES = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'calm', label: 'Calm', icon: Cloud, keywords: ['calm', 'peace', 'chill', 'soft', 'sky', 'clouds'] },
  { id: 'golden-hour', label: 'Golden Hour', icon: Sun, keywords: ['sunset', 'golden', 'sun', 'warm', 'amber', 'light'] },
  { id: 'night', label: 'Night', icon: Moon, keywords: ['night', 'dark', 'midnight', 'neon', 'city', 'evening'] },
  { id: 'creative', label: 'Creative', icon: Palette, keywords: ['art', 'creative', 'studio', 'design', 'visual', 'render'] },
  { id: 'architecture', label: 'Architecture', icon: Building2, keywords: ['architecture', 'building', 'structure', 'modern', 'interior'] },
  { id: 'nature', label: 'Nature', icon: TreePine, keywords: ['nature', 'forest', 'mountains', 'ocean', 'green', 'landscape'] },
  { id: 'minimal', label: 'Minimal', icon: Compass, keywords: ['minimal', 'clean', 'simple', 'monochrome', 'abstract'] },
];

export default function HomePage() {
  const { posts } = usePost();
  const { currentUser, isLoading } = useAuth();

  const [activeFeedTab, setActiveFeedTab] = useState<FeedTab>('for-you');
  const [selectedAtmosphere, setSelectedAtmosphere] = useState('all');

  // Intelligent Feed Filtering
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Channel Filtering
    if (activeFeedTab === 'following' && currentUser) {
      const followingIds = currentUser.following || [];
      result = result.filter(
        (p) => followingIds.includes(p.authorId) || p.authorId === currentUser.id
      );
    } else if (activeFeedTab === 'trending') {
      result.sort((a, b) => b.likes.length + b.commentsCount - (a.likes.length + a.commentsCount));
    }

    // Atmosphere Filtering
    if (activeFeedTab === 'atmospheres' && selectedAtmosphere !== 'all') {
      const currentAtmo = ATMOSPHERES.find((a) => a.id === selectedAtmosphere);
      if (currentAtmo && currentAtmo.keywords) {
        result = result.filter((p) => {
          const text = `${p.caption || ''} ${p.author.displayName} ${p.author.username}`.toLowerCase();
          return currentAtmo.keywords.some((k) => text.includes(k));
        });
      }
    }

    return result;
  }, [posts, activeFeedTab, selectedAtmosphere, currentUser]);

  return (
    <AppShell title="Lumira">
      <div className="max-w-[975px] mx-auto pt-1 sm:pt-4 px-0 sm:px-4 flex justify-center gap-12 select-none">
        {/* Main Feed Column (max-w-[470px] or 630px) */}
        <div className="w-full max-w-[490px] shrink-0 space-y-4">
          {/* Stories Carousel */}
          <StoryBar />

          {/* Feed Channel Switcher (For You | Following | Atmospheres | Trending) */}
          <div className="p-1.5 rounded-2xl bg-[var(--glass-card-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-xs">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveFeedTab('for-you')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeFeedTab === 'for-you'
                    ? 'bg-[var(--glass-bg-hover)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>For You</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFeedTab('following')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeFeedTab === 'following'
                    ? 'bg-[var(--glass-bg-hover)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>Following</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFeedTab('atmospheres')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeFeedTab === 'atmospheres'
                    ? 'bg-[var(--glass-bg-hover)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Atmosphere</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFeedTab('trending')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeFeedTab === 'trending'
                    ? 'bg-[var(--glass-bg-hover)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>Trending</span>
              </button>
            </div>
          </div>

          {/* Atmosphere Mood Filter Pills Bar (When in Atmosphere or For You) */}
          {(activeFeedTab === 'atmospheres' || activeFeedTab === 'for-you') && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {ATMOSPHERES.map((atmo) => {
                const Icon = atmo.icon;
                const isSelected = selectedAtmosphere === atmo.id;
                return (
                  <button
                    key={atmo.id}
                    type="button"
                    onClick={() => {
                      if (activeFeedTab !== 'atmospheres') {
                        setActiveFeedTab('atmospheres');
                      }
                      setSelectedAtmosphere(atmo.id);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-xs scale-102'
                        : 'bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] border-[var(--glass-border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{atmo.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Posts Feed Stream / Skeletons */}
          {isLoading ? (
            <div className="space-y-4">
              <SkeletonPost />
              <SkeletonPost />
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                activeFeedTab === 'following'
                  ? 'No posts from people you follow yet'
                  : `No posts found for "${selectedAtmosphere}"`
              }
              description={
                activeFeedTab === 'following'
                  ? 'Explore trending creators or switch to "For You" to discover moments from the Lumira community.'
                  : 'Try exploring other atmospheres like Golden Hour, Creative, or Night.'
              }
              actionLabel="Explore For You"
              onAction={() => {
                setActiveFeedTab('for-you');
                setSelectedAtmosphere('all');
              }}
              suggestions={['Calm', 'Golden Hour', 'Creative', 'Architecture', 'Nature']}
              onSelectSuggestion={(s) => {
                const found = ATMOSPHERES.find((a) => a.label.toLowerCase() === s.toLowerCase());
                if (found) {
                  setActiveFeedTab('atmospheres');
                  setSelectedAtmosphere(found.id);
                }
              }}
            />
          )}

          {/* End of feed indicator */}
          {filteredPosts.length > 0 && (
            <div className="py-10 text-center text-xs text-[var(--text-secondary)]">
              <div className="w-10 h-10 rounded-full border border-[var(--glass-border)] flex items-center justify-center mx-auto mb-2 text-base text-[var(--accent-blue)]">
                ✦
              </div>
              <p className="font-bold text-xs text-[var(--text-primary)]">You&apos;re all caught up</p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Curated fresh moments from the Lumira creative community.
              </p>
            </div>
          )}
        </div>

        {/* Right Suggested Column */}
        <RightWidgetPanel />
      </div>
    </AppShell>
  );
}

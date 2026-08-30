'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Plus, X, Play, Hash } from 'lucide-react';

interface RightWidgetPanelProps {
  onCreateClick?: () => void;
}

const DEFAULT_SUGGESTIONS = [
  {
    id: 'elena',
    username: 'elena.rodriguez',
    displayName: 'Elena Rodriguez',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'james',
    username: 'james.walker',
    displayName: 'James Walker',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'olivia',
    username: 'olivia.gray',
    displayName: 'Olivia Gray',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'noah',
    username: 'noah.adams',
    displayName: 'Noah Adams',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'sophia',
    username: 'sophia.brown',
    displayName: 'Sophia Brown',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
  },
];

const TRENDING_TOPICS = [
  { tag: 'LumiraVibes', posts: '12.8k posts' },
  { tag: 'SunsetLovers', posts: '8.4k posts' },
  { tag: 'TravelDiaries', posts: '6.7k posts' },
  { tag: 'GoodVibesOnly', posts: '5.3k posts' },
];

const MUSIC_TRACKS = [
  {
    id: '1',
    title: 'Golden Hour',
    artist: 'JVKE',
    cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: '2',
    title: 'Feather',
    artist: 'Sabrina Carpenter',
    cover: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: '3',
    title: 'Calm Down',
    artist: 'Rema & Selena Gomez',
    cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: '4',
    title: 'Daylight',
    artist: 'David Kushner',
    cover: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=120&q=80',
  },
];

export function RightWidgetPanel({ onCreateClick }: RightWidgetPanelProps) {
  const { allUsers, toggleFollow, isFollowing } = useAuth();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const suggestions = React.useMemo(() => {
    if (allUsers && allUsers.length > 3) {
      return allUsers.slice(0, 5).map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
      }));
    }
    return DEFAULT_SUGGESTIONS;
  }, [allUsers]);

  const visibleSuggestions = suggestions.filter((s) => !dismissedIds.includes(s.id));

  const handleToggle = (id: string) => {
    setFollowingMap((prev) => ({ ...prev, [id]: !prev[id] }));
    toggleFollow(id);
  };

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  return (
    <aside className="w-[310px] shrink-0 hidden xl:flex flex-col gap-4 select-none text-xs">
      {/* 1. Create Card */}
      <div className="bg-[#11121a]/85 backdrop-blur-2xl border border-white/10 shadow-xl rounded-2xl p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Create</h3>
          <p className="text-xs text-neutral-400">Share a moment</p>
        </div>
        <button
          type="button"
          onClick={onCreateClick}
          className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8b5cf6] to-[#6366f1] hover:from-[#7c3aed] hover:to-[#4f46e5] text-white flex items-center justify-center shadow-lg shadow-purple-500/25 active:scale-95 transition-all cursor-pointer"
          aria-label="Create new post"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* 2. Suggested for you Card */}
      <div className="bg-[#11121a]/85 backdrop-blur-2xl border border-white/10 shadow-xl rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-neutral-300">Suggested for you</span>
          <Link href="/explore" className="text-[11px] font-semibold text-[#0095f6] hover:underline">
            See all
          </Link>
        </div>

        <div className="space-y-3">
          {visibleSuggestions.map((user) => {
            const isUserFollowing = followingMap[user.id] ?? isFollowing(user.id);

            return (
              <div key={user.id} className="flex items-center justify-between gap-2">
                <Link
                  href={`/profile/${user.username}`}
                  className="flex items-center gap-2.5 min-w-0 flex-1 group"
                >
                  <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                      {user.username}
                    </p>
                    <p className="text-[10px] text-neutral-400 truncate">{user.displayName}</p>
                  </div>
                </Link>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(user.id)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      isUserFollowing
                        ? 'bg-white/10 text-neutral-300 hover:bg-white/15'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {isUserFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDismiss(user.id)}
                    className="text-neutral-500 hover:text-neutral-300 p-0.5 cursor-pointer"
                    aria-label="Dismiss suggestion"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Trending now Card */}
      <div className="bg-[#11121a]/85 backdrop-blur-2xl border border-white/10 shadow-xl rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-neutral-300">Trending now</span>
          <Link href="/explore" className="text-[11px] font-semibold text-[#0095f6] hover:underline">
            See all
          </Link>
        </div>

        <div className="space-y-2.5">
          {TRENDING_TOPICS.map((topic) => (
            <Link
              key={topic.tag}
              href={`/search?q=${encodeURIComponent(topic.tag)}`}
              className="flex items-start gap-2.5 p-1 -mx-1 rounded-lg hover:bg-white/5 transition-colors group"
            >
              <div className="text-neutral-400 group-hover:text-white mt-0.5">
                <Hash className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                  {topic.tag}
                </p>
                <p className="text-[10px] text-neutral-400">{topic.posts}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. Music for you Card */}
      <div className="bg-[#11121a]/85 backdrop-blur-2xl border border-white/10 shadow-xl rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-neutral-300">Music for you</span>
          <Link href="/explore" className="text-[11px] font-semibold text-[#0095f6] hover:underline">
            See all
          </Link>
        </div>

        <div className="space-y-2.5">
          {MUSIC_TRACKS.map((track) => (
            <div key={track.id} className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/10">
                  <Image
                    src={track.cover}
                    alt={track.title}
                    fill
                    sizes="32px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{track.title}</p>
                  <p className="text-[10px] text-neutral-400 truncate">{track.artist}</p>
                </div>
              </div>
              <button
                type="button"
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                aria-label={`Play ${track.title}`}
              >
                <Play className="w-3 h-3 fill-current ml-0.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Small Footer Card */}
      <div className="px-2 py-1 text-[11px] text-neutral-500 space-y-1.5">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <a href="#" className="hover:underline">About</a>
          <span>•</span>
          <a href="#" className="hover:underline">Help</a>
          <span>•</span>
          <a href="#" className="hover:underline">Terms</a>
          <span>•</span>
          <a href="#" className="hover:underline">Privacy</a>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <a href="#" className="hover:underline">Community Guidelines</a>
          <span>•</span>
          <a href="#" className="hover:underline">Cookies</a>
        </div>
        <p className="pt-1 text-[10px] text-neutral-600">
          © 2026 Lumira. All rights reserved.
        </p>
      </div>
    </aside>
  );
}


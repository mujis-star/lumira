'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StoryBar } from '@/components/stories/StoryBar';
import { PostCard } from '@/components/feed/PostCard';
import { RightWidgetPanel } from '@/components/layout/RightWidgetPanel';
import { usePost } from '@/context/PostContext';

export default function HomePage() {
  const { posts } = usePost();

  return (
    <AppShell title="Lumira">
      <div className="max-w-[975px] mx-auto pt-2 sm:pt-6 px-0 sm:px-4 flex justify-center gap-16">
        {/* Main Feed Column (max-w-[470px] or 630px) */}
        <div className="w-full max-w-[470px] shrink-0">
          {/* Stories Carousel */}
          <StoryBar />

          {/* Posts Stream */}
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {/* End of feed indicator */}
          <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-[var(--border-color)] flex items-center justify-center mx-auto mb-2 text-xl">
              ✓
            </div>
            <p className="font-bold text-sm text-[var(--text-primary)]">You&apos;re all caught up</p>
            <p className="text-[11px] mt-0.5">You&apos;ve seen all new posts from the past 3 days.</p>
          </div>
        </div>

        {/* Right Suggested Column */}
        <RightWidgetPanel />
      </div>
    </AppShell>
  );
}

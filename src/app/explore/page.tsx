'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { AppShell } from '@/components/layout/AppShell';
import { usePost } from '@/context/PostContext';
import { Post } from '@/lib/types';
import { CommentsDrawer } from '@/components/feed/CommentsDrawer';
import { formatNumber } from '@/lib/utils';
import { Heart, MessageCircle, Layers, Film } from 'lucide-react';

export default function ExplorePage() {
  const { posts } = usePost();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  return (
    <AppShell title="Explore">
      <div className="max-w-[975px] mx-auto py-2 sm:py-6 px-0 sm:px-4">
        {/* Instagram Explore 3-Column Grid */}
        <div className="grid grid-cols-3 gap-1 sm:gap-6">
          {posts.map((post, idx) => {
            const isFeatured = idx % 5 === 2; // periodic tall/wide featured card
            const isCarousel = post.media.length > 1;

            return (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className={`relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-900 group cursor-pointer ${
                  isFeatured ? 'sm:col-span-2 sm:row-span-2 sm:aspect-auto' : ''
                }`}
              >
                {post.media[0]?.type === 'video' || post.media[0]?.url.endsWith('.mp4') || post.media[0]?.url.startsWith('data:video') ? (
                  <video
                    src={post.media[0]?.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <Image
                    src={post.media[0]?.url}
                    alt={post.caption}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 33vw, 300px"
                    unoptimized
                  />
                )}

                {/* Top Right Media Type Badge (Carousel / Video) */}
                <div className="absolute top-2.5 right-2.5 z-10 text-white drop-shadow-md">
                  {isCarousel ? (
                    <Layers className="w-4 h-4" />
                  ) : post.media[0]?.type === 'video' ? (
                    <Film className="w-4 h-4" />
                  ) : null}
                </div>

                {/* Hover Overlay with Likes & Comments Count */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold text-sm z-20 pointer-events-none">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-5 h-5 fill-white" />
                    <span>{formatNumber(post.likesCount)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-5 h-5 fill-white" />
                    <span>{formatNumber(post.commentsCount)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Post Detail Drawer / Modal when clicked */}
      {selectedPost && (
        <CommentsDrawer
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </AppShell>
  );
}

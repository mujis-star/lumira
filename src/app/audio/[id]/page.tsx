'use client';

import React, { useState, useEffect, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { usePost } from '@/context/PostContext';
import { MusicTrack, AttachedMusic } from '@/lib/types';
import { musicService, SEED_MUSIC_TRACKS } from '@/lib/musicLibrary';
import { audioEngine } from '@/lib/audioEngine';
import { CreatePostModal } from '@/components/create/CreatePostModal';
import {
  Play,
  Pause,
  Music,
  Bookmark,
  Film,
  Grid,
  Heart,
  MessageCircle,
} from 'lucide-react';
import { formatNumber, triggerConfetti } from '@/lib/utils';

export default function AudioDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { posts, reels } = usePost();

  const [track, setTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Fetch track details
  useEffect(() => {
    let isMounted = true;
    const fetchTrack = async () => {
      try {
        const found = await musicService.getTrackById(id);
        if (isMounted && found) {
          setTrack(found);
        } else if (isMounted) {
          const fallback = SEED_MUSIC_TRACKS.find(
            (t) => t.id === id || t.title.toLowerCase() === decodeURIComponent(id).toLowerCase()
          );
          setTrack(fallback || SEED_MUSIC_TRACKS[0]);
        }
      } catch {
        if (isMounted) setTrack(SEED_MUSIC_TRACKS[0]);
      }
    };

    fetchTrack();
    return () => {
      isMounted = false;
      if (audioEngine) audioEngine.stop();
    };
  }, [id]);

  const handleTogglePlay = () => {
    if (!track) return;

    if (isPlaying) {
      if (audioEngine) audioEngine.stop();
      setIsPlaying(false);
    } else {
      if (audioEngine) {
        audioEngine.play(
          track.audioSource,
          0,
          track.duration,
          undefined,
          () => setIsPlaying(false)
        );
      }
      setIsPlaying(true);
    }
  };

  const handleUseAudio = () => {
    triggerConfetti(0.5, 0.5);
    setIsCreateOpen(true);
  };

  // Find posts and reels using this audio
  const matchedPosts = posts.filter(
    (p) =>
      p.audioTrack &&
      ((typeof p.audioTrack === 'object' && 'trackId' in p.audioTrack && p.audioTrack.trackId === track?.id) ||
        (track && p.audioTrack.title.toLowerCase().includes(track.title.toLowerCase())))
  );

  const matchedReels = reels.filter(
    (r) =>
      r.audioTrack &&
      ((typeof r.audioTrack === 'object' && 'trackId' in r.audioTrack && r.audioTrack.trackId === track?.id) ||
        (track && r.audioTrack.title.toLowerCase().includes(track.title.toLowerCase())))
  );

  const displayPosts = matchedPosts.length > 0 ? matchedPosts : posts.slice(0, 6);
  const displayReels = matchedReels.length > 0 ? matchedReels : reels.slice(0, 4);

  if (!track) {
    return (
      <AppShell title="Audio">
        <div className="py-24 text-center text-xs text-[var(--text-secondary)] animate-pulse">
          Loading audio track...
        </div>
      </AppShell>
    );
  }

  const attachedMusicObj: AttachedMusic = {
    trackId: track.id,
    provider: track.provider,
    providerTrackId: track.providerTrackId,
    title: track.title,
    artist: track.artist,
    album: track.album,
    coverImage: track.coverImage,
    audioSource: track.audioSource,
    startTime: 0,
    duration: 15,
  };

  return (
    <AppShell title={`${track.title} • ${track.artist}`}>
      <div className="max-w-[935px] mx-auto py-4 sm:py-8 px-4 sm:px-6 space-y-6 select-none">
        {/* Frosted Glass Track Hero Header */}
        <header className="p-6 sm:p-8 rounded-3xl bg-[var(--glass-card-bg)] backdrop-blur-3xl border border-[var(--glass-border)] shadow-[var(--glass-shadow-lg)] flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10 transition-all">
          {/* Vinyl / Cover Artwork */}
          <div className="relative group">
            <div
              onClick={handleTogglePlay}
              className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl overflow-hidden shadow-2xl bg-neutral-900 border border-[var(--glass-border)] cursor-pointer"
            >
              <Image
                src={track.coverImage}
                alt={track.title}
                fill
                className={`object-cover transition-transform duration-700 ${
                  isPlaying ? 'scale-105 rotate-2' : 'group-hover:scale-105'
                }`}
                unoptimized
              />

              {/* Play / Pause Center Overlay */}
              <div className="absolute inset-0 bg-black/35 flex items-center justify-center text-white transition-opacity">
                <div className="p-4 rounded-full bg-[#0095f6] text-white shadow-xl group-hover:scale-110 active:scale-95 transition-transform">
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-white" />
                  ) : (
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Track Details & Action Buttons */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="px-3 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] text-[10px] font-bold uppercase tracking-wider border border-[var(--accent-blue)]/20">
                  {track.genre} Audio
                </span>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  {track.licensingInfo || 'Lumira Audio'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mt-1.5">
                {track.title}
              </h1>
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                {track.artist} {track.album ? `• ${track.album}` : ''}
              </p>
            </div>

            {/* Track Usage Stats */}
            <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-[var(--text-secondary)]">
              <span className="font-bold text-[var(--text-primary)]">
                {formatNumber(track.usageCount || 1240)} posts & reels
              </span>
              <span>•</span>
              <span>
                {Math.floor(track.duration / 60)}:
                {(track.duration % 60).toString().padStart(2, '0')} duration
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
              {/* Use Audio Button */}
              <button
                type="button"
                onClick={handleUseAudio}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-bold shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                <Music className="w-4 h-4" />
                <span>Use Audio</span>
              </button>

              {/* Bookmark Audio */}
              <button
                type="button"
                onClick={() => setIsSaved(!isSaved)}
                className={`p-2.5 rounded-2xl border border-[var(--glass-border)] hover:bg-[var(--glass-bg-hover)] transition-colors cursor-pointer ${
                  isSaved ? 'text-[#0095f6] bg-[var(--accent-blue)]/10' : 'text-[var(--text-primary)]'
                }`}
                aria-label="Save audio"
                title="Save audio track"
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </header>

        {/* Media Grid Tabs: Posts vs Reels */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-8 border-b border-[var(--glass-border-subtle)] text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              className={`flex items-center gap-2 py-3 border-b-2 -mb-[1px] transition-colors cursor-pointer ${
                activeTab === 'posts'
                  ? 'border-[var(--accent-blue)] text-[var(--text-primary)] font-extrabold'
                  : 'border-transparent hover:text-[var(--text-primary)]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Posts ({displayPosts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reels')}
              className={`flex items-center gap-2 py-3 border-b-2 -mb-[1px] transition-colors cursor-pointer ${
                activeTab === 'reels'
                  ? 'border-[var(--accent-blue)] text-[var(--text-primary)] font-extrabold'
                  : 'border-transparent hover:text-[var(--text-primary)]'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Reels ({displayReels.length})</span>
            </button>
          </div>

          {/* Posts Grid */}
          {activeTab === 'posts' ? (
            <div className="grid grid-cols-3 gap-1 sm:gap-4">
              {displayPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => router.push('/')}
                  className="relative aspect-square bg-neutral-200 dark:bg-neutral-800 rounded-lg overflow-hidden group cursor-pointer"
                >
                  <Image
                    src={post.media[0]?.url || ''}
                    alt={post.caption}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-xs font-bold">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4 fill-white" />
                      <span>{post.likesCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>{post.commentsCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Reels Grid */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              {displayReels.map((reel) => (
                <div
                  key={reel.id}
                  onClick={() => router.push('/reels')}
                  className="relative aspect-[9/16] bg-neutral-900 rounded-xl overflow-hidden group cursor-pointer shadow"
                >
                  <Image
                    src={reel.posterUrl}
                    alt={reel.caption}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    unoptimized
                  />
                  <div className="absolute bottom-2 left-2 right-2 text-white text-[11px] drop-shadow line-clamp-1 font-semibold">
                    {reel.caption}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Post Creator Modal triggered with pre-selected Audio */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        initialAudioTrack={attachedMusicObj}
      />
    </AppShell>
  );
}

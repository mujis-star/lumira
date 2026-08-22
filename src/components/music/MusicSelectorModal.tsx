'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { MusicTrack, AttachedMusic } from '@/lib/types';
import { musicService, SEED_MUSIC_TRACKS } from '@/lib/musicLibrary';
import { audioEngine } from '@/lib/audioEngine';
import { Modal } from '../ui/Modal';
import {
  Search,
  Play,
  Pause,
  Check,
  RotateCcw,
  Flame,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface MusicSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMusic: (music: AttachedMusic) => void;
  initialTrack?: AttachedMusic | null;
}

const GENRE_TABS = [
  { id: 'all', label: 'All' },
  { id: 'trending', label: '🔥 Trending' },
  { id: 'lofi', label: '☕ Lofi' },
  { id: 'chill', label: '🌊 Chill' },
  { id: 'pop', label: '✨ Pop' },
  { id: 'electronic', label: '⚡ Electronic' },
  { id: 'acoustic', label: '🎸 Acoustic' },
  { id: 'cinematic', label: '🎬 Cinematic' },
];

export function MusicSelectorModal({
  isOpen,
  onClose,
  onSelectMusic,
}: MusicSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('all');
  const [tracks, setTracks] = useState<MusicTrack[]>(SEED_MUSIC_TRACKS);
  const [isLoading, setIsLoading] = useState(false);

  // Trimming State
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
  const [isTrimming, setIsTrimming] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [clipDuration, setClipDuration] = useState<15 | 30 | 60>(15);

  // Preview Playback State
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  // Load tracks when genre or query changes
  useEffect(() => {
    let isMounted = true;
    const fetchTracks = async () => {
      setIsLoading(true);
      try {
        const results = await musicService.searchTracks(searchQuery, activeGenre === 'all' ? undefined : activeGenre);
        if (isMounted) {
          setTracks(results);
        }
      } catch {
        if (isMounted) setTracks(SEED_MUSIC_TRACKS);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchTracks, 150);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, activeGenre]);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioEngine) audioEngine.stop();
    };
  }, []);

  const handleClose = () => {
    if (audioEngine) audioEngine.stop();
    setPlayingTrackId(null);
    setIsTrimming(false);
    onClose();
  };

  const handleTogglePlayPreview = (track: MusicTrack, e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (playingTrackId === track.id) {
      if (audioEngine) audioEngine.stop();
      setPlayingTrackId(null);
    } else {
      if (audioEngine) {
        audioEngine.play(
          track.audioSource,
          0,
          track.duration,
          undefined,
          () => setPlayingTrackId(null)
        );
      }
      setPlayingTrackId(track.id);
    }
  };

  const handleSelectTrackForTrimming = (track: MusicTrack) => {
    setSelectedTrack(track);
    setStartTime(0);
    setIsTrimming(true);

    // Play starting from 0s for clipDuration
    if (audioEngine) {
      audioEngine.play(
        track.audioSource,
        0,
        clipDuration,
        undefined,
        () => setPlayingTrackId(null)
      );
    }
    setPlayingTrackId(track.id);
  };

  const handleStartTimeChange = (newStart: number) => {
    setStartTime(newStart);
    if (selectedTrack && audioEngine) {
      audioEngine.play(
        selectedTrack.audioSource,
        newStart,
        clipDuration,
        undefined,
        () => setPlayingTrackId(null)
      );
      setPlayingTrackId(selectedTrack.id);
    }
  };

  const handleConfirmMusic = () => {
    if (!selectedTrack) return;
    if (audioEngine) audioEngine.stop();

    const attached: AttachedMusic = {
      trackId: selectedTrack.id,
      provider: selectedTrack.provider,
      providerTrackId: selectedTrack.providerTrackId,
      title: selectedTrack.title,
      artist: selectedTrack.artist,
      album: selectedTrack.album,
      coverImage: selectedTrack.coverImage,
      audioSource: selectedTrack.audioSource,
      startTime,
      duration: clipDuration,
    };

    onSelectMusic(attached);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isTrimming ? 'Trim Audio Segment' : 'Select Music'}
      size="md"
    >
      <div className="p-4 space-y-4 select-none bg-[var(--modal-bg)] max-h-[85vh] flex flex-col">
        {!isTrimming ? (
          /* STEP 1: Search & Browse Music List */
          <>
            {/* Search Input */}
            <div className="relative shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search songs, artists, or albums..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--input-bg)] text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#0095f6]"
                autoFocus
              />
            </div>

            {/* Genre / Mood Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0">
              {GENRE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveGenre(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    activeGenre === tab.id
                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Track Results List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)] space-y-1 pr-1">
              {isLoading ? (
                <div className="py-12 text-center text-xs text-[var(--text-secondary)] animate-pulse">
                  Searching music catalog...
                </div>
              ) : tracks.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--text-secondary)] space-y-2">
                  <p>No tracks found for &ldquo;{searchQuery}&rdquo;</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">Try searching for &quot;lofi&quot;, &quot;synth&quot;, or &quot;ambient&quot;</p>
                </div>
              ) : (
                tracks.map((track) => {
                  const isPlaying = playingTrackId === track.id;

                  return (
                    <div
                      key={track.id}
                      onClick={() => handleSelectTrackForTrimming(track)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer group"
                    >
                      {/* Left: Artwork + Title + Artist */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Cover with Play Overlay */}
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-800 shrink-0 shadow-sm">
                          <Image
                            src={track.coverImage}
                            alt={track.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            unoptimized
                          />
                          {/* Play/Pause Button Overlay */}
                          <button
                            type="button"
                            onClick={(e) => handleTogglePlayPreview(track, e)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            aria-label={isPlaying ? 'Pause' : 'Play preview'}
                          >
                            {isPlaying ? (
                              <Pause className="w-5 h-5 fill-white" />
                            ) : (
                              <Play className="w-5 h-5 fill-white ml-0.5" />
                            )}
                          </button>

                          {/* Animated equalizer waves badge when playing */}
                          {isPlaying && (
                            <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/70 text-blue-400 text-[9px] font-bold animate-pulse">
                              ılı
                            </div>
                          )}
                        </div>

                        {/* Title, Artist, and Usage badge */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                              {track.title}
                            </p>
                            {track.usageCount && track.usageCount > 3000 && (
                              <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5 fill-current" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)] truncate">
                            {track.artist} {track.album ? `• ${track.album}` : ''}
                          </p>
                          <p className="text-[10px] text-[var(--text-secondary)] opacity-70">
                            {Math.floor(track.duration / 60)}:
                            {(track.duration % 60).toString().padStart(2, '0')} •{' '}
                            {formatNumber(track.usageCount || 0)} posts
                          </p>
                        </div>
                      </div>

                      {/* Right: Quick Action */}
                      <button
                        type="button"
                        onClick={() => handleSelectTrackForTrimming(track)}
                        className="px-3 py-1.5 rounded-lg bg-[#0095f6]/10 hover:bg-[#0095f6] text-[#0095f6] hover:text-white text-xs font-bold transition-colors cursor-pointer shrink-0 ml-2"
                      >
                        Select
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* STEP 2: Interactive Audio Trimmer & Timeline Scrubber */
          selectedTrack && (
            <div className="space-y-5">
              {/* Selected Track Banner */}
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-[var(--border-color)]">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow shrink-0">
                  <Image
                    src={selectedTrack.coverImage}
                    alt={selectedTrack.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => handleTogglePlayPreview(selectedTrack)}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center text-white cursor-pointer"
                  >
                    {playingTrackId === selectedTrack.id ? (
                      <Pause className="w-5 h-5 fill-white" />
                    ) : (
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    )}
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                    {selectedTrack.title}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {selectedTrack.artist}
                  </p>
                  <p className="text-[11px] text-blue-500 font-semibold mt-0.5">
                    Clip: {startTime}s – {startTime + clipDuration}s ({clipDuration}s clip)
                  </p>
                </div>
              </div>

              {/* Clip Duration Selector Tabs */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-secondary)]">Clip Length:</span>
                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                  {([15, 30, 60] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setClipDuration(d);
                        if (startTime + d > selectedTrack.duration) {
                          setStartTime(Math.max(0, selectedTrack.duration - d));
                        }
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        clipDuration === d
                          ? 'bg-[#0095f6] text-white shadow-sm'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Waveform Scrubber Visualizer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] font-semibold">
                  <span>Start: {startTime}s</span>
                  <span>Max: {selectedTrack.duration}s</span>
                </div>

                {/* Waveform Bars Representation */}
                <div className="relative h-16 rounded-xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-between px-2 overflow-hidden">
                  {Array.from({ length: 48 }).map((_, i) => {
                    const barHeight = 20 + Math.sin(i * 0.4) * 15 + Math.cos(i * 0.8) * 20;
                    const barTime = (i / 48) * selectedTrack.duration;
                    const isInsideClip =
                      barTime >= startTime && barTime <= startTime + clipDuration;

                    return (
                      <div
                        key={i}
                        style={{ height: `${Math.max(15, barHeight)}%` }}
                        className={`w-1 rounded-full transition-colors ${
                          isInsideClip
                            ? 'bg-[#0095f6]'
                            : 'bg-neutral-400 dark:bg-neutral-600 opacity-40'
                        }`}
                      />
                    );
                  })}

                  {/* Active Segment Overlay Box */}
                  <div
                    style={{
                      left: `${(startTime / selectedTrack.duration) * 100}%`,
                      width: `${(clipDuration / selectedTrack.duration) * 100}%`,
                    }}
                    className="absolute inset-y-0 border-2 border-[#0095f6] bg-blue-500/15 rounded-lg pointer-events-none"
                  />
                </div>

                {/* Range Slider for Start Position */}
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, selectedTrack.duration - clipDuration)}
                  step={1}
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(Number(e.target.value))}
                  className="w-full accent-[#0095f6] cursor-pointer"
                />
              </div>

              {/* Trimmer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setIsTrimming(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Back to List
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartTimeChange(0)}
                    className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Reset to 0:00"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmMusic}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-bold shadow transition-transform active:scale-95 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Attach Music</span>
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </Modal>
  );
}

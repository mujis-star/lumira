'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useStory } from '@/context/StoryContext';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { MusicSelectorModal } from '../music/MusicSelectorModal';
import { AttachedMusic } from '@/lib/types';
import { Upload, Type, Sparkles, Film, Palette, Play, Music, Trash2 } from 'lucide-react';

interface StoryCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORY_PRESETS = [
  {
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80',
    poster: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
    title: 'Neon Abstract',
  },
  {
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=80',
    poster: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80',
    title: 'Teal Coast',
  },
  {
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1080&q=80',
    poster: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80',
    title: 'Tokyo Cyber',
  },
  {
    type: 'video' as const,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4',
    poster: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=300&q=80',
    title: 'Sunset Video',
  },
  {
    type: 'video' as const,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
    poster: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=300&q=80',
    title: 'Ocean Video',
  },
];

const STICKER_COLORS = [
  '#ffffff',
  '#0095f6',
  '#ff3040',
  '#f59e0b',
  '#10b981',
  '#8b5cf6',
];

export function StoryCreatorModal({ isOpen, onClose }: StoryCreatorModalProps) {
  const { addStoryItem } = useStory();
  const { currentUser } = useAuth();

  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string>(STORY_PRESETS[0].url);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [captionColor, setCaptionColor] = useState('#ffffff');
  const [selectedMusic, setSelectedMusic] = useState<AttachedMusic | null>(null);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/') || !!file.name.match(/\.(mp4|webm|mov|ogg|m4v)$/i);
      setMediaType(isVideo ? 'video' : 'image');

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedMediaUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShareStory = async () => {
    if (!currentUser) return;
    setIsPublishing(true);

    try {
      await addStoryItem({
        mediaUrl: selectedMediaUrl,
        type: mediaType,
        caption: caption.trim() || undefined,
        audioTrack: selectedMusic || undefined,
      });
    } catch (err) {
      console.error('Failed to share story:', err);
    } finally {
      setIsPublishing(false);
      onClose();
      setCaption('');
      setSelectedMusic(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Create Story">
      <div className="p-4 sm:p-6 space-y-5 select-none bg-[var(--modal-bg)]">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Story 9:16 Preview Card */}
          <div className="relative w-full sm:w-64 aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-2xl mx-auto flex items-center justify-center border border-white/10">
            {mediaType === 'video' ? (
              <video
                src={selectedMediaUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <Image
                src={selectedMediaUrl}
                alt="Story Preview"
                fill
                className="object-cover"
                unoptimized
              />
            )}

            {/* Story Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

            {/* Simulated Story Top Progress */}
            <div className="absolute top-2.5 inset-x-2.5 flex items-center gap-1 z-20">
              <div className="flex-1 h-0.5 bg-white rounded-full overflow-hidden" />
            </div>

            {/* User Header in Preview */}
            {currentUser && (
              <div className="absolute top-5 left-3 flex items-center gap-2 z-20 text-white">
                <Avatar src={currentUser.avatarUrl} alt={currentUser.displayName} size="xs" />
                <span className="text-xs font-bold drop-shadow">Your story</span>
              </div>
            )}

            {/* Floating Music Sticker */}
            {selectedMusic && (
              <div className="absolute top-14 left-3 right-3 z-20 animate-fadeIn">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 dark:bg-black/75 backdrop-blur-md text-neutral-900 dark:text-white text-[11px] font-bold shadow-xl border border-white/20">
                  <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0">
                    <Image
                      src={selectedMusic.coverImage}
                      alt={selectedMusic.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <Music className="w-3 h-3 text-pink-500 shrink-0 animate-pulse" />
                  <span className="truncate max-w-[120px]">
                    {selectedMusic.title} • {selectedMusic.artist}
                  </span>
                </div>
              </div>
            )}

            {/* Caption Sticker */}
            {caption && (
              <div className="absolute bottom-10 inset-x-3 text-center z-20 animate-fadeIn">
                <span
                  style={{ color: captionColor }}
                  className="inline-block px-3 py-2 rounded-xl bg-black/65 backdrop-blur-md text-xs font-semibold max-w-[90%] shadow-lg break-words"
                >
                  {caption}
                </span>
              </div>
            )}
          </div>

          {/* Controls Panel */}
          <div className="flex-1 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Media Selection */}
              <div>
                <label className="text-xs font-bold text-[var(--text-primary)] block mb-2 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-[#0095f6]" /> Choose Preset or Upload
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="grid grid-cols-5 gap-2 mb-3">
                  {STORY_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedMediaUrl(preset.url);
                        setMediaType(preset.type);
                      }}
                      className={`relative aspect-[9/16] rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                        selectedMediaUrl === preset.url
                          ? 'border-[#0095f6] scale-105 shadow-md shadow-[#0095f6]/30'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={preset.poster}
                        alt={preset.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {preset.type === 'video' && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white">
                          <Play className="w-3 h-3 fill-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[var(--border-color)] hover:border-[#0095f6] text-xs font-semibold text-[var(--text-secondary)] hover:text-[#0095f6] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload photo or video from device</span>
                </button>
              </div>

              {/* Caption & Text Sticker */}
              <div>
                <label className="text-xs font-bold text-[var(--text-primary)] block mb-2 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-[#0095f6]" /> Story Text / Sticker
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add text to your story..."
                    maxLength={100}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#0095f6]"
                  />
                </div>

                {/* Text Color Picker */}
                <div className="flex items-center gap-2 mt-2">
                  <Palette className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <div className="flex items-center gap-1.5">
                    {STICKER_COLORS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setCaptionColor(col)}
                        style={{ backgroundColor: col }}
                        className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                          captionColor === col ? 'ring-2 ring-[#0095f6] scale-110' : 'hover:scale-105'
                        }`}
                        aria-label={`Select color ${col}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Music Soundtrack / Sticker */}
              <div>
                <label className="text-xs font-bold text-[var(--text-primary)] block mb-2 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-[#0095f6]" /> Story Music
                </label>
                {selectedMusic ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
                        <Image
                          src={selectedMusic.coverImage}
                          alt={selectedMusic.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[var(--text-primary)] truncate">
                          {selectedMusic.title}
                        </p>
                        <p className="text-[10px] text-[var(--text-secondary)] truncate">
                          {selectedMusic.artist}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedMusic(null)}
                      className="p-1 text-rose-500 hover:bg-rose-500/15 rounded-lg transition-colors cursor-pointer"
                      title="Remove music sticker"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsMusicModalOpen(true)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[var(--input-bg)] hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-[var(--border-color)] text-xs text-[var(--text-primary)] font-semibold transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Music className="w-3.5 h-3.5 text-pink-500" />
                      <span>Add Music Sticker</span>
                    </div>
                    <span className="text-[11px] text-[#0095f6] font-bold">+ Select Song</span>
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleShareStory}
                disabled={isPublishing}
                className="px-6 py-2 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-[#0095f6]/30 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isPublishing ? 'Sharing...' : 'Share to Your Story'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Music Selector Modal */}
      <MusicSelectorModal
        isOpen={isMusicModalOpen}
        onClose={() => setIsMusicModalOpen(false)}
        onSelectMusic={(m) => setSelectedMusic(m)}
        initialTrack={selectedMusic}
      />
    </Modal>
  );
}

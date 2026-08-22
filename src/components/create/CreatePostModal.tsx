'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { usePost } from '@/context/PostContext';
import { useAuth } from '@/context/AuthContext';
import { useStory } from '@/context/StoryContext';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { MusicSelectorModal } from '../music/MusicSelectorModal';
import { AttachedMusic } from '@/lib/types';
import {
  Upload,
  ArrowLeft,
  MapPin,
  Smile,
  Sliders,
  Play,
  Film,
  Music,
  Trash2,
} from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAudioTrack?: AttachedMusic | null;
}

const SAMPLE_GALLERY_ASSETS = [
  {
    type: 'video' as const,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4',
    poster: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80',
    title: 'Sunset Aerial',
  },
  {
    type: 'video' as const,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
    poster: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80',
    title: 'Ocean Waves',
  },
  {
    type: 'video' as const,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4',
    poster: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    title: 'Nature Video',
  },
  {
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    poster: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    title: 'Abstract Art',
  },
  {
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    poster: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    title: 'Architecture',
  },
  {
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    poster: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    title: 'Coastal',
  },
];

const IG_FILTERS = [
  { id: 'normal', name: 'Normal', css: 'none' },
  { id: 'clarendon', name: 'Clarendon', css: 'contrast(1.2) saturate(1.25)' },
  { id: 'gingham', name: 'Gingham', css: 'brightness(1.05) hue-rotate(-10deg)' },
  { id: 'juno', name: 'Juno', css: 'contrast(1.15) saturate(1.4) sepia(0.2)' },
  { id: 'lark', name: 'Lark', css: 'contrast(0.9) brightness(1.15) saturate(1.1)' },
  { id: 'moon', name: 'Moon', css: 'grayscale(1) contrast(1.1) brightness(1.1)' },
  { id: 'slumber', name: 'Slumber', css: 'saturate(0.66) brightness(1.05) sepia(0.35)' },
  { id: 'valencia', name: 'Valencia', css: 'contrast(1.08) brightness(1.08) sepia(0.08)' },
];

export function CreatePostModal({ isOpen, onClose, initialAudioTrack }: CreatePostModalProps) {
  const { createPost, createReel } = usePost();
  const { currentUser } = useAuth();
  const { openStoryCreator } = useStory();

  const [createType, setCreateType] = useState<'post' | 'reel'>('post');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string>(SAMPLE_GALLERY_ASSETS[0].url);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('video');
  const [aspectRatio, setAspectRatio] = useState<'portrait' | 'square' | 'wide'>('portrait');
  const [selectedFilter, setSelectedFilter] = useState<string>('normal');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [selectedMusic, setSelectedMusic] = useState<AttachedMusic | null>(initialAudioTrack || null);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
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
          setStep(2);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = async () => {
    if (!currentUser) return;
    setIsPublishing(true);

    try {
      const activeFilterObj = IG_FILTERS.find((f) => f.id === selectedFilter);

      const audioTrackPayload = selectedMusic
        ? selectedMusic
        : {
            title: 'Original Audio',
            artist: currentUser.username,
          };

      if (createType === 'reel' || mediaType === 'video') {
        await createReel({
          videoUrl: selectedMediaUrl,
          posterUrl: selectedMediaUrl,
          caption,
          audioTrack: audioTrackPayload,
        });
      } else {
        await createPost({
          media: [
            {
              id: `m-${Date.now()}`,
              url: selectedMediaUrl,
              type: mediaType,
              aspectRatio,
              filter: activeFilterObj?.css !== 'none' ? activeFilterObj?.name : undefined,
            },
          ],
          caption,
          location: location.trim() || undefined,
          audioTrack: audioTrackPayload,
          allowComments,
          isPrivate: false,
        });
      }
    } catch (err) {
      console.error('Error publishing post/reel:', err);
    } finally {
      setIsPublishing(false);
      onClose();
      setStep(1);
      setCaption('');
      setLocation('');
      setSelectedMusic(null);
    }
  };

  const activeFilterCss = IG_FILTERS.find((f) => f.id === selectedFilter)?.css || 'none';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={step === 3 ? 'xl' : 'lg'}>
      <div className="bg-[var(--modal-bg)] rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as 1 | 2)}
              className="p-1 text-[var(--text-primary)] hover:opacity-70 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <span className="w-6" />
          )}

          {step === 1 ? (
            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCreateType('post')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  createType === 'post'
                    ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Post
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreateType('reel');
                  setMediaType('video');
                  setSelectedMediaUrl(SAMPLE_GALLERY_ASSETS[0].url);
                  setAspectRatio('portrait');
                }}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  createType === 'reel'
                    ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Reel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openStoryCreator();
                }}
                className="px-3 py-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Story
              </button>
            </div>
          ) : (
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              {step === 2 && (createType === 'reel' ? 'Edit Reel' : 'Crop & Filter')}
              {step === 3 && (createType === 'reel' ? 'New Reel' : 'New Post')}
            </h2>
          )}

          {step === 1 && <span className="w-6" />}

          {step === 2 && (
            <button
              onClick={() => setStep(3)}
              className="text-xs font-bold text-[#0095f6] hover:text-[#1877f2] cursor-pointer"
            >
              Next
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="text-xs font-bold text-[#0095f6] hover:text-[#1877f2] disabled:opacity-50 cursor-pointer"
            >
              {isPublishing ? 'Sharing...' : 'Share'}
            </button>
          )}
        </div>

        {/* Step 1: Select Media / Drag & Drop */}
        {step === 1 && (
          <div className="p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-[var(--text-primary)]">
              {createType === 'reel' ? (
                <Film className="w-10 h-10 stroke-[1.5]" />
              ) : (
                <Upload className="w-10 h-10 stroke-[1.5]" />
              )}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-normal text-[var(--text-primary)]">
                {createType === 'reel' ? 'Create a vertical Reel' : 'Drag photos and videos here'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Upload MP4/WebM videos or photos from your device
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                Select from computer
              </button>
              <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] font-medium">
                <span>⚡ MP4, WebM, MOV</span>
                <span>•</span>
                <span>⏱️ Up to 90s</span>
                <span>•</span>
                <span>📦 Max 100MB</span>
              </div>
            </div>

            {/* Inspiration Preset Grid */}
            <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2">
              <p className="text-xs font-semibold text-[var(--text-secondary)]">
                Or pick a preset {createType === 'reel' ? 'video' : 'photo or video'}:
              </p>
              <div className="grid grid-cols-6 gap-2">
                {SAMPLE_GALLERY_ASSETS.map((asset, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedMediaUrl(asset.url);
                      setMediaType(asset.type);
                      setStep(2);
                    }}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 border border-[var(--border-color)] group"
                  >
                    <Image
                      src={asset.poster}
                      alt={asset.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {asset.type === 'video' && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white">
                        <Play className="w-4 h-4 fill-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Crop & Filter */}
        {step === 2 && (
          <div className="flex flex-col md:flex-row h-[500px]">
            {/* Visual Canvas Area */}
            <div className="flex-1 bg-black flex items-center justify-center p-4 relative overflow-hidden">
              <div
                className={`relative overflow-hidden transition-all duration-200 ${
                  aspectRatio === 'square'
                    ? 'w-[400px] h-[400px]'
                    : aspectRatio === 'portrait'
                    ? 'w-[320px] h-[440px]'
                    : 'w-[440px] h-[260px]'
                }`}
                style={{ filter: activeFilterCss }}
              >
                {mediaType === 'video' || selectedMediaUrl.endsWith('.mp4') || selectedMediaUrl.startsWith('data:video') ? (
                  <video
                    src={selectedMediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Image
                    src={selectedMediaUrl}
                    alt="Upload Preview"
                    fill
                    className="object-cover rounded-lg"
                    unoptimized
                  />
                )}
              </div>

              {/* Aspect Ratio Floating Switcher */}
              <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-lg border border-white/10 z-10">
                <button
                  type="button"
                  onClick={() => setAspectRatio('square')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold text-white transition-colors cursor-pointer ${
                    aspectRatio === 'square' ? 'bg-white/30' : 'hover:bg-white/10'
                  }`}
                >
                  1:1
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('portrait')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold text-white transition-colors cursor-pointer ${
                    aspectRatio === 'portrait' ? 'bg-white/30' : 'hover:bg-white/10'
                  }`}
                >
                  4:5 / 9:16
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('wide')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold text-white transition-colors cursor-pointer ${
                    aspectRatio === 'wide' ? 'bg-white/30' : 'hover:bg-white/10'
                  }`}
                >
                  16:9
                </button>
              </div>
            </div>

            {/* Filter Selector Panel */}
            <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-[var(--border-color)] p-4 overflow-y-auto bg-[var(--bg-primary)]">
              <p className="text-xs font-bold text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Filters</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {IG_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFilter(f.id)}
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                  >
                    <div
                      className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedFilter === f.id
                          ? 'border-[#0095f6] scale-105'
                          : 'border-transparent group-hover:border-[var(--border-color)]'
                      }`}
                    >
                      <Image
                        src={SAMPLE_GALLERY_ASSETS[3].poster}
                        alt={f.name}
                        fill
                        className="object-cover"
                        style={{ filter: f.css }}
                        unoptimized
                      />
                    </div>
                    <span
                      className={`text-[10px] ${
                        selectedFilter === f.id
                          ? 'font-bold text-[#0095f6]'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {f.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Details & Caption */}
        {step === 3 && (
          <div className="flex flex-col md:flex-row h-[500px]">
            {/* Visual Thumbnail */}
            <div className="w-full md:w-1/2 bg-black flex items-center justify-center p-4">
              <div
                className="relative w-full h-[380px] rounded-lg overflow-hidden"
                style={{ filter: activeFilterCss }}
              >
                {mediaType === 'video' || selectedMediaUrl.endsWith('.mp4') || selectedMediaUrl.startsWith('data:video') ? (
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
                    alt="Upload Final"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="w-full md:w-1/2 p-4 flex flex-col justify-between overflow-y-auto bg-[var(--bg-primary)]">
              <div className="space-y-4">
                {/* Author Info */}
                <div className="flex items-center gap-3">
                  <Avatar
                    src={currentUser?.avatarUrl || ''}
                    alt={currentUser?.displayName || ''}
                    size="sm"
                    isVerified={currentUser?.isVerified}
                  />
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    {currentUser?.username}
                  </span>
                </div>

                {/* Caption Textarea */}
                <div>
                  <textarea
                    rows={4}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder={createType === 'reel' ? "Write a caption for your reel, use #tags..." : "Write a caption, #hashtags, @mentions..."}
                    className="w-full text-xs text-[var(--text-primary)] bg-transparent focus:outline-none resize-none placeholder-[var(--text-secondary)]"
                    maxLength={2200}
                  />
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] pt-1 border-t border-[var(--border-subtle)]">
                    <button type="button" className="p-1 hover:text-[var(--text-primary)]">
                      <Smile className="w-4 h-4" />
                    </button>
                    <span>{caption.length} / 2,200</span>
                  </div>
                </div>

                {/* Instagram-Style Add Music Option */}
                {selectedMusic ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-sm">
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
                        <p className="text-[11px] text-[var(--text-secondary)] truncate">
                          {selectedMusic.artist}
                        </p>
                        <p className="text-[10px] text-blue-500 font-semibold">
                          {selectedMusic.startTime}s - {selectedMusic.startTime + selectedMusic.duration}s ({selectedMusic.duration}s clip)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => setIsMusicModalOpen(true)}
                        className="p-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
                        title="Adjust trim"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMusic(null)}
                        className="p-1.5 rounded-lg bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 transition-colors cursor-pointer"
                        title="Remove music"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsMusicModalOpen(true)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--input-bg)] hover:bg-neutral-100 dark:hover:bg-neutral-800/80 border border-[var(--border-color)] text-xs text-[var(--text-primary)] font-semibold transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-gradient-to-tr from-purple-500 to-pink-500 text-white">
                        <Music className="w-3.5 h-3.5" />
                      </div>
                      <span>Add Music</span>
                    </div>
                    <span className="text-[11px] text-[#0095f6] font-bold">+ Select Song</span>
                  </button>
                )}

                {/* Location Input */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)]">
                  <MapPin className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Add location"
                    className="w-full bg-transparent text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                {/* Allow Comments Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-primary)]">
                  <span>Allow comments</span>
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                    className="w-4 h-4 accent-[#0095f6] rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Music Selector Modal */}
      <MusicSelectorModal
        isOpen={isMusicModalOpen}
        onClose={() => setIsMusicModalOpen(false)}
        onSelectMusic={(music) => setSelectedMusic(music)}
        initialTrack={selectedMusic}
      />
    </Modal>
  );
}

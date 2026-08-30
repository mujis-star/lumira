'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { PostMedia as MediaItem } from '@/lib/types';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Heart, MessageCircle, Send, Play } from 'lucide-react';

interface PostMediaProps {
  media: MediaItem[];
  showHeartPop: boolean;
  onDoubleTap: () => void;
  isReel?: boolean;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
}

export function PostMedia({
  media,
  showHeartPop,
  onDoubleTap,
  isReel,
  likesCount = 8765,
  commentsCount = 106,
  sharesCount = 32,
}: PostMediaProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentMedia = media[currentIndex] || media[0];
  const isVideo =
    isReel ||
    currentMedia?.type === 'video' ||
    currentMedia?.url.startsWith('data:video') ||
    currentMedia?.url.endsWith('.mp4') ||
    currentMedia?.url.endsWith('.webm');

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => Math.min(media.length - 1, prev + 1));
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <div
      onClick={onDoubleTap}
      className="relative w-full aspect-[4/5] sm:aspect-[4/3] md:aspect-[16/10] bg-black overflow-hidden select-none cursor-pointer flex items-center justify-center"
    >
      {/* Media Element: Video or Image */}
      {isVideo ? (
        <video
          ref={videoRef}
          src={currentMedia.url}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <Image
          src={currentMedia.url}
          alt="Post content"
          fill
          sizes="(max-width: 640px) 100vw, 600px"
          className="object-cover"
          priority={false}
          unoptimized
        />
      )}

      {/* Double-Tap Heart Pop Overlay */}
      {showHeartPop && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="animate-heart-pop drop-shadow-2xl">
            <Heart className="w-24 h-24 text-rose-500 fill-rose-500" />
          </div>
        </div>
      )}

      {/* Carousel Index Badge (e.g. 1/3 from reference image) */}
      {media.length > 1 && (
        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold shadow-md">
          {currentIndex + 1}/{media.length}
        </div>
      )}

      {/* Multi-image Carousel Arrows */}
      {media.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all shadow-md cursor-pointer z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {currentIndex < media.length - 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all shadow-md cursor-pointer z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 px-2 py-1 rounded-full bg-black/40 backdrop-blur-xs">
            {media.map((_, i) => (
              <span
                key={i}
                className={`rounded-full transition-all ${
                  i === currentIndex
                    ? 'w-2 h-2 bg-white'
                    : 'w-1.5 h-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Reel Specific Overlays (From Reference Image) */}
      {isReel && (
        <>
          {/* Bottom Left: "Watch full reel" pill */}
          <div className="absolute bottom-3 left-3 z-10">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold transition-colors">
              <Play className="w-3 h-3 fill-current" />
              <span>Watch full reel</span>
            </div>
          </div>

          {/* Right Side Overlay Actions (Heart, Comment, Share, Volume) */}
          <div className="absolute bottom-3 right-3 z-10 flex flex-col items-center gap-3">
            <div className="flex flex-col items-center">
              <div className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:text-rose-500 transition-colors">
                <Heart className="w-4 h-4 fill-white" />
              </div>
              <span className="text-[10px] font-bold text-white drop-shadow-md">
                {likesCount > 1000 ? `${(likesCount / 1000).toFixed(1)}k` : likesCount}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <div className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-white drop-shadow-md">
                {commentsCount}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <div className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white">
                <Send className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-white drop-shadow-md">
                {sharesCount}
              </span>
            </div>

            <button
              type="button"
              onClick={toggleMute}
              className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white cursor-pointer hover:bg-black/60"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </>
      )}

      {/* Standard Video Audio Control if not reel */}
      {!isReel && isVideo && (
        <button
          type="button"
          onClick={toggleMute}
          className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all shadow-md cursor-pointer z-10"
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

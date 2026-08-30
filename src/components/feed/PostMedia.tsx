'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { PostMedia as MediaItem } from '@/lib/types';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Heart } from 'lucide-react';

interface PostMediaProps {
  media: MediaItem[];
  showHeartPop: boolean;
  onDoubleTap: () => void;
}

export function PostMedia({ media, showHeartPop, onDoubleTap }: PostMediaProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentMedia = media[currentIndex] || media[0];
  const isVideo =
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
      className="relative w-full aspect-[4/5] sm:aspect-square bg-black overflow-hidden select-none cursor-pointer flex items-center justify-center"
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

      {/* Multi-image Carousel Navigation */}
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
                    ? 'w-2 h-2 bg-[var(--accent-blue)]'
                    : 'w-1.5 h-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Video Audio Control */}
      {isVideo && (
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

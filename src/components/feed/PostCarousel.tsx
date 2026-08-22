'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { PostMedia } from '@/lib/types';
import { ChevronLeft, ChevronRight, Heart, Volume2, VolumeX, Play } from 'lucide-react';
import { FILTER_PRESETS } from '@/lib/utils';

interface PostCarouselProps {
  media: PostMedia[];
  onDoubleTapLike?: () => void;
}

export function PostCarousel({ media, onDoubleTapLike }: PostCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const lastTapRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentMedia = media[currentIndex] || media[0];
  const isVideo =
    currentMedia.type === 'video' ||
    currentMedia.url.startsWith('data:video') ||
    currentMedia.url.endsWith('.mp4') ||
    currentMedia.url.endsWith('.webm');

  const handleTouchOrClick = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Trigger double tap like
      setShowHeartBurst(true);
      if (onDoubleTapLike) onDoubleTapLike();
      setTimeout(() => setShowHeartBurst(false), 900);
    } else if (isVideo && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
    lastTapRef.current = now;
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : prev));
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  // Find filter CSS
  const filterPreset = FILTER_PRESETS.find((f) => f.id === currentMedia.filter);
  const filterStyle = filterPreset ? filterPreset.cssFilter : 'none';

  const aspectClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[4/5]',
    wide: 'aspect-[16/9]',
  };

  const currentAspect = currentMedia.aspectRatio || 'portrait';

  return (
    <div
      onClick={handleTouchOrClick}
      className={`relative w-full ${aspectClasses[currentAspect]} max-h-[640px] bg-black overflow-hidden select-none group cursor-pointer flex items-center justify-center`}
    >
      {/* Media: Video or Image */}
      {isVideo ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            src={currentMedia.url}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-cover"
            style={{ filter: filterStyle }}
          />

          {/* Video Controls Overlay */}
          <button
            type="button"
            onClick={toggleMute}
            className="absolute bottom-3 right-3 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all z-20 cursor-pointer"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-10">
              <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center text-white">
                <Play className="w-6 h-6 fill-white ml-0.5" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <Image
          src={currentMedia.url}
          alt={currentMedia.altText || 'Post media'}
          fill
          sizes="(max-width: 768px) 100vw, 640px"
          className="object-cover transition-all duration-300"
          style={{ filter: filterStyle }}
          priority={currentIndex === 0}
          unoptimized
        />
      )}

      {/* Double tap heart burst overlay */}
      {showHeartBurst && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-heart-burst">
          <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-[0_0_25px_rgba(244,63,94,0.9)]" />
        </div>
      )}

      {/* Prev / Next Arrows */}
      {media.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 z-20 cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {currentIndex < media.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 z-20 cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Dots Pagination Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md z-20">
            {media.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'w-4 bg-[#0095f6]'
                    : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>

          {/* Slide counter badge top right */}
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-white/90 z-20">
            {currentIndex + 1}/{media.length}
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import Image from 'next/image';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  hasStory?: boolean;
  isStorySeen?: boolean;
  storySeen?: boolean;
  isVerified?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Avatar({
  src,
  alt = 'User Avatar',
  size = 'md',
  hasStory = false,
  isStorySeen = false,
  storySeen = false,
  isVerified = false,
  className = '',
  onClick,
}: AvatarProps) {
  const seen = isStorySeen || storySeen;

  const sizeMap = {
    xs: { outer: 'w-6 h-6', inner: 'w-5 h-5', text: 'text-[10px]' },
    sm: { outer: 'w-8 h-8', inner: 'w-7 h-7', text: 'text-xs' },
    md: { outer: 'w-10 h-10', inner: 'w-9 h-9', text: 'text-sm' },
    lg: { outer: 'w-16 h-16', inner: 'w-[58px] h-[58px]', text: 'text-lg' },
    xl: { outer: 'w-20 h-20', inner: 'w-[74px] h-[74px]', text: 'text-xl' },
    '2xl': { outer: 'w-36 h-36', inner: 'w-[136px] h-[136px]', text: 'text-4xl' },
  };

  const currentSize = sizeMap[size];

  const ringStyle = hasStory
    ? seen
      ? 'ig-story-seen p-[2px]'
      : 'ig-story-gradient p-[2.5px]'
    : '';

  return (
    <div
      onClick={onClick}
      className={`relative inline-block select-none shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div
        className={`rounded-full flex items-center justify-center transition-all ${currentSize.outer} ${ringStyle}`}
      >
        <div
          className={`relative rounded-full overflow-hidden bg-[var(--bg-primary)] p-[2px] flex items-center justify-center ${
            hasStory ? currentSize.inner : currentSize.outer
          }`}
        >
          <div className="relative w-full h-full rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
            {src ? (
              <Image
                src={src}
                alt={alt}
                fill
                sizes="(max-width: 768px) 100vw, 150px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className={`font-bold text-neutral-500 ${currentSize.text}`}>
                {alt ? alt.charAt(0).toUpperCase() : 'U'}
              </span>
            )}
          </div>
        </div>
      </div>

      {isVerified && (
        <span
          className="absolute -bottom-0.5 -right-0.5 bg-[#0095f6] text-white rounded-full flex items-center justify-center p-[2px] ring-2 ring-[var(--bg-primary)]"
          title="Verified"
        >
          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" viewBox="0 0 20 20">
            <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
          </svg>
        </span>
      )}
    </div>
  );
}

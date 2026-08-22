'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useStory } from '@/context/StoryContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface StoryBarProps {
  onCreateStory?: () => void;
}

export function StoryBar({ onCreateStory }: StoryBarProps) {
  const { stories, openStoryViewer, openStoryCreator } = useStory();
  const { currentUser } = useAuth();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollStart, setScrollStart] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  const userStory = currentUser ? stories.find((s) => s.userId === currentUser.id) : undefined;
  const otherStories = stories.filter((s) => s.userId !== currentUser?.id);

  // Check scroll boundary to show/hide left and right arrow buttons
  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll, stories]);

  // Enable mouse wheel scrolling horizontally when hovering over the story bar
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;

      // Translate vertical wheel or horizontal wheel movement to horizontal scroll
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta !== 0) {
        e.preventDefault();
        el.scrollLeft += delta * 1.2;
        checkScroll();
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [checkScroll]);

  // Click arrow buttons to scroll smoothly
  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const offset = direction === 'left' ? -260 : 260;
    el.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(checkScroll, 300);
  };

  // Mouse Drag to scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setIsDragging(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollStart(el.scrollLeft);
    setHasMoved(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 4) {
      setHasMoved(true);
    }
    el.scrollLeft = scrollStart - walk;
    checkScroll();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCreate = () => {
    if (hasMoved) return;
    if (onCreateStory) {
      onCreateStory();
    } else {
      openStoryCreator();
    }
  };

  const handleStoryClick = (storyId: string) => {
    if (hasMoved) return;
    openStoryViewer(storyId);
  };

  return (
    <div className="relative group/storybar w-full bg-[var(--bg-primary)] py-4 mb-4 border-b border-[var(--border-color)] md:border md:rounded-2xl md:mb-6 select-none overflow-hidden">
      {/* Left Navigation Arrow Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 dark:bg-neutral-800/90 hover:bg-white dark:hover:bg-neutral-700 text-[var(--text-primary)] shadow-md flex items-center justify-center transition-all opacity-0 group-hover/storybar:opacity-100 cursor-pointer z-20 hover:scale-110"
          aria-label="Scroll stories left"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        </button>
      )}

      {/* Right Navigation Arrow Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 dark:bg-neutral-800/90 hover:bg-white dark:hover:bg-neutral-700 text-[var(--text-primary)] shadow-md flex items-center justify-center transition-all opacity-0 group-hover/storybar:opacity-100 cursor-pointer z-20 hover:scale-110"
          aria-label="Scroll stories right"
        >
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      )}

      {/* Stories Scroll Track */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex items-center gap-4 overflow-x-auto px-4 no-scrollbar scroll-smooth ${
          isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
        }`}
      >
        {/* Current User Story Item / Add Story */}
        {currentUser && (
          <div className="flex flex-col items-center gap-1.5 shrink-0 w-[72px]">
            <div className="relative cursor-pointer group">
              <div
                onClick={() => {
                  if (hasMoved) return;
                  if (userStory && userStory.items.length > 0) {
                    openStoryViewer(userStory.id);
                  } else {
                    handleCreate();
                  }
                }}
              >
                <Avatar
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  size="lg"
                  hasStory={!!userStory && userStory.items.length > 0}
                  isStorySeen={userStory ? !userStory.hasUnseen : false}
                />
              </div>

              {/* Add Story Plus Badge */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreate();
                }}
                className="absolute bottom-0 right-0 p-1 bg-[#0095f6] hover:bg-[#1877f2] text-white rounded-full ring-2 ring-[var(--bg-primary)] shadow transition-transform hover:scale-110 cursor-pointer z-10"
                aria-label="Add new story"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
              </button>
            </div>
            <span className="text-[11px] font-normal text-[var(--text-primary)] truncate max-w-[68px] text-center">
              Your story
            </span>
          </div>
        )}

        {/* Other Users' Stories */}
        {otherStories.map((story) => (
          <div
            key={story.id}
            onClick={() => handleStoryClick(story.id)}
            className="flex flex-col items-center gap-1.5 shrink-0 w-[72px] cursor-pointer group"
          >
            <Avatar
              src={story.user.avatarUrl}
              alt={story.user.displayName}
              size="lg"
              hasStory={true}
              isStorySeen={!story.hasUnseen}
            />
            <span className="text-[11px] font-normal text-[var(--text-primary)] truncate max-w-[68px] text-center group-hover:opacity-80">
              {story.user.username}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

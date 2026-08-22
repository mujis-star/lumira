'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Story, StoryItem, AttachedMusic } from '@/lib/types';
import { SEED_STORIES } from '@/lib/seedData';
import { useAuth } from './AuthContext';
import { sounds, triggerConfetti } from '@/lib/utils';

interface CreateStoryInput {
  mediaUrl: string;
  type: 'image' | 'video';
  caption?: string;
  audioTrack?: AttachedMusic;
}

interface StoryContextType {
  stories: Story[];
  activeStoryIndex: number | null;
  isViewerOpen: boolean;
  isCreatorOpen: boolean;
  openStoryViewer: (storyIdOrIndex: string | number) => void;
  closeStoryViewer: () => void;
  openStoryCreator: () => void;
  closeStoryCreator: () => void;
  nextStory: () => void;
  prevStory: () => void;
  createStory: (input: CreateStoryInput) => void;
  addStoryItem: (input: CreateStoryInput) => void;
  viewStoryItem: (storyId: string, itemId: string) => void;
  markStorySeen: (storyId: string, itemId: string) => void;
  reactToStory: (storyId?: string, itemId?: string, emoji?: string) => void;
  deleteStoryItem: (storyId: string, itemId: string) => void;
  userStory: Story | undefined;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

const STORIES_STORAGE_KEY = 'lumira-v2-stories';

export function StoryProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();

  // Initialize with seed data for 100% server-client hydration consistency
  const [stories, setStories] = useState<Story[]>(SEED_STORIES);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  // Hydrate from localStorage asynchronously after initial hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setTimeout(() => {
          setStories(parsed);
        }, 0);
      }
    } catch {
      // fallback
    }
  }, []);

  const isViewerOpen = activeStoryIndex !== null;

  const openStoryViewer = useCallback((storyIdOrIndex: string | number) => {
    if (typeof storyIdOrIndex === 'number') {
      setActiveStoryIndex(storyIdOrIndex);
    } else {
      setStories((currStories) => {
        const index = currStories.findIndex((s) => s.id === storyIdOrIndex || s.userId === storyIdOrIndex);
        setActiveStoryIndex(index >= 0 ? index : 0);
        return currStories;
      });
    }
  }, []);

  const closeStoryViewer = useCallback(() => {
    setActiveStoryIndex(null);
  }, []);

  const openStoryCreator = useCallback(() => {
    setIsCreatorOpen(true);
  }, []);

  const closeStoryCreator = useCallback(() => {
    setIsCreatorOpen(false);
  }, []);

  const nextStory = useCallback(() => {
    setActiveStoryIndex((curr) => {
      if (curr === null) return null;
      if (curr >= stories.length - 1) {
        return null;
      }
      return curr + 1;
    });
  }, [stories.length]);

  const prevStory = useCallback(() => {
    setActiveStoryIndex((curr) => {
      if (curr === null || curr <= 0) return 0;
      return curr - 1;
    });
  }, []);

  const createStory = useCallback((input: CreateStoryInput) => {
    if (!currentUser) return;

    const newItem: StoryItem = {
      id: `si-${Date.now()}`,
      mediaUrl: input.mediaUrl,
      type: input.type,
      caption: input.caption,
      audioTrack: input.audioTrack,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      viewsCount: 0,
      viewers: [],
    };

    setStories((prevStories) => {
      const existingStoryIndex = prevStories.findIndex((s) => s.userId === currentUser.id);
      let updatedStories: Story[];

      if (existingStoryIndex >= 0) {
        const existingStory = prevStories[existingStoryIndex];
        const updatedStory: Story = {
          ...existingStory,
          hasUnseen: true,
          lastUpdated: new Date().toISOString(),
          items: [...existingStory.items, newItem],
        };
        updatedStories = [
          updatedStory,
          ...prevStories.filter((_, i) => i !== existingStoryIndex),
        ];
      } else {
        const newStory: Story = {
          id: `story-${currentUser.id}`,
          userId: currentUser.id,
          user: {
            id: currentUser.id,
            username: currentUser.username,
            displayName: currentUser.displayName,
            avatarUrl: currentUser.avatarUrl,
            isVerified: currentUser.isVerified,
          },
          hasUnseen: true,
          lastUpdated: new Date().toISOString(),
          items: [newItem],
        };
        updatedStories = [newStory, ...prevStories];
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(updatedStories));
      }
      return updatedStories;
    });

    sounds.playSend();
    triggerConfetti();
  }, [currentUser]);

  const viewStoryItem = useCallback((storyId: string, itemId: string) => {
    if (!currentUser) return;

    setStories((prevStories) => {
      const story = prevStories.find((s) => s.id === storyId);
      if (!story) return prevStories;

      const targetItem = story.items.find((it) => it.id === itemId);
      // If already viewed by current user, return unchanged reference to prevent infinite render loops!
      if (!targetItem || targetItem.viewers.includes(currentUser.id)) {
        return prevStories;
      }

      const updated = prevStories.map((s) => {
        if (s.id === storyId) {
          const updatedItems = s.items.map((item) => {
            if (item.id === itemId && !item.viewers.includes(currentUser.id)) {
              return {
                ...item,
                viewsCount: item.viewsCount + 1,
                viewers: [...item.viewers, currentUser.id],
              };
            }
            return item;
          });

          const allViewed = updatedItems.every((item) =>
            item.viewers.includes(currentUser.id)
          );

          return {
            ...s,
            hasUnseen: !allViewed,
            items: updatedItems,
          };
        }
        return s;
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, [currentUser]);

  const markStorySeen = viewStoryItem;

  const reactToStory = useCallback(() => {
    sounds.playHeartBurst();
    triggerConfetti(0.5, 0.5);
  }, []);

  const deleteStoryItem = useCallback((storyId: string, itemId: string) => {
    if (!currentUser) return;

    setStories((prevStories) => {
      const updated = prevStories
        .map((s) => {
          if (s.id === storyId && s.userId === currentUser.id) {
            const filteredItems = s.items.filter((item) => item.id !== itemId);
            return {
              ...s,
              items: filteredItems,
            };
          }
          return s;
        })
        .filter((s) => s.items.length > 0);

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, [currentUser]);

  const userStory = currentUser ? stories.find((s) => s.userId === currentUser.id) : undefined;

  return (
    <StoryContext.Provider
      value={{
        stories,
        activeStoryIndex,
        isViewerOpen,
        isCreatorOpen,
        openStoryViewer,
        closeStoryViewer,
        openStoryCreator,
        closeStoryCreator,
        nextStory,
        prevStory,
        createStory,
        addStoryItem: createStory,
        viewStoryItem,
        markStorySeen,
        reactToStory,
        deleteStoryItem,
        userStory,
      }}
    >
      {children}
    </StoryContext.Provider>
  );
}

export function useStory() {
  const context = useContext(StoryContext);
  if (!context) {
    throw new Error('useStory must be used within a StoryProvider');
  }
  return context;
}

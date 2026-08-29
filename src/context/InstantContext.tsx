'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { InstantItem, InstantVisibility, InstantAdjustments, InstantOverlayText, InstantOverlaySticker, AttachedMusic } from '@/lib/types';
import { SEED_INSTANTS } from '@/lib/seedData';
import { useAuth } from './AuthContext';
import { sounds, triggerConfetti } from '@/lib/utils';

export interface CreateInstantInput {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  filterId?: string;
  filterIntensity?: number;
  adjustments?: Partial<InstantAdjustments>;
  textOverlays?: InstantOverlayText[];
  stickers?: InstantOverlaySticker[];
  drawingDataUrl?: string;
  attachedMusic?: AttachedMusic;
  musicVolume?: number;
  videoVolume?: number;
  videoTrim?: { start: number; end: number };
  videoSpeed?: number;
  caption?: string;
  visibility: InstantVisibility;
  allowedViewerIds?: string[];
}

interface InstantContextType {
  instants: InstantItem[];
  activeInstants: InstantItem[];
  todayInstants: InstantItem[];
  thisWeekInstants: InstantItem[];
  userInstants: InstantItem[];
  isViewerOpen: boolean;
  activeInstantIndex: number | null;
  activeInstant: InstantItem | null;
  isCreatorOpen: boolean;
  openInstantViewer: (instantIdOrIndex: string | number) => void;
  closeInstantViewer: () => void;
  nextInstant: () => void;
  prevInstant: () => void;
  openInstantCreator: () => void;
  closeInstantCreator: () => void;
  createInstant: (input: CreateInstantInput) => InstantItem | null;
  reactToInstant: (instantId: string, emoji: string) => void;
  viewInstant: (instantId: string) => void;
  deleteInstant: (instantId: string) => void;
}

const InstantContext = createContext<InstantContextType | undefined>(undefined);

const INSTANTS_STORAGE_KEY = 'lumira-v2-instants';

export function InstantProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();

  // Initialize with seed data
  const [instants, setInstants] = useState<InstantItem[]>(SEED_INSTANTS);
  const [activeInstantIndex, setActiveInstantIndex] = useState<number | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  // Update time every minute for timer expiration
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(INSTANTS_STORAGE_KEY);
      if (saved) {
        const parsed: InstantItem[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTimeout(() => {
            setInstants(parsed);
          }, 0);
        }
      }
    } catch {
      // fallback to seed
    }
  }, []);

  const persistInstants = (updated: InstantItem[]) => {
    setInstants(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(INSTANTS_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage error for instants:', err);
      }
    }
  };

  // 24-hour expiration filter
  const activeInstants = useMemo(() => {
    if (!currentTime) return instants;
    return instants.filter((item) => {
      const expiryTime = new Date(item.expiresAt).getTime();
      return expiryTime > currentTime;
    });
  }, [instants, currentTime]);

  // Grouped for Dashboard
  const todayInstants = useMemo(() => {
    if (!currentTime) return activeInstants;
    return activeInstants.filter((item) => {
      const createdTime = new Date(item.createdAt).getTime();
      // Created within last 24h
      return currentTime - createdTime <= 24 * 60 * 60 * 1000;
    });
  }, [activeInstants, currentTime]);

  const thisWeekInstants = useMemo(() => {
    if (!currentTime) return [];
    return instants.filter((item) => {
      const createdTime = new Date(item.createdAt).getTime();
      const diff = currentTime - createdTime;
      // Created between 24h ago and 7 days ago
      return diff > 24 * 60 * 60 * 1000 && diff <= 7 * 24 * 60 * 60 * 1000;
    });
  }, [instants, currentTime]);

  const userInstants = useMemo(() => {
    if (!currentUser) return [];
    return activeInstants.filter((item) => item.creatorId === currentUser.id);
  }, [activeInstants, currentUser]);

  const isViewerOpen = activeInstantIndex !== null;

  const activeInstant = useMemo(() => {
    if (activeInstantIndex === null || activeInstantIndex < 0 || activeInstantIndex >= activeInstants.length) {
      return null;
    }
    return activeInstants[activeInstantIndex];
  }, [activeInstantIndex, activeInstants]);

  const openInstantViewer = useCallback((instantIdOrIndex: string | number) => {
    if (typeof instantIdOrIndex === 'number') {
      setActiveInstantIndex(instantIdOrIndex);
    } else {
      const index = activeInstants.findIndex((item) => item.id === instantIdOrIndex);
      setActiveInstantIndex(index >= 0 ? index : 0);
    }
  }, [activeInstants]);

  const closeInstantViewer = useCallback(() => {
    setActiveInstantIndex(null);
  }, []);

  const nextInstant = useCallback(() => {
    setActiveInstantIndex((curr) => {
      if (curr === null) return null;
      if (curr >= activeInstants.length - 1) {
        return null; // Close at end
      }
      return curr + 1;
    });
  }, [activeInstants.length]);

  const prevInstant = useCallback(() => {
    setActiveInstantIndex((curr) => {
      if (curr === null || curr <= 0) return 0;
      return curr - 1;
    });
  }, []);

  const openInstantCreator = useCallback(() => {
    setIsCreatorOpen(true);
  }, []);

  const closeInstantCreator = useCallback(() => {
    setIsCreatorOpen(false);
  }, []);

  const createInstant = useCallback((input: CreateInstantInput): InstantItem | null => {
    if (!currentUser) return null;

    const newInstant: InstantItem = {
      id: `instant-${Date.now()}`,
      creatorId: currentUser.id,
      creator: {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatarUrl: currentUser.avatarUrl,
        isVerified: currentUser.isVerified,
      },
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
      filterId: input.filterId,
      filterIntensity: input.filterIntensity ?? 100,
      adjustments: input.adjustments,
      textOverlays: input.textOverlays,
      stickers: input.stickers,
      drawingDataUrl: input.drawingDataUrl,
      attachedMusic: input.attachedMusic,
      musicVolume: input.musicVolume ?? 1,
      videoVolume: input.videoVolume ?? 1,
      videoTrim: input.videoTrim,
      videoSpeed: input.videoSpeed ?? 1,
      caption: input.caption,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      visibility: input.visibility,
      allowedViewerIds: input.allowedViewerIds,
      reactions: [],
      viewers: [],
      viewsCount: 0,
    };

    const updated = [newInstant, ...instants];
    persistInstants(updated);

    sounds.playSend();
    triggerConfetti(0.5, 0.5);

    return newInstant;
  }, [currentUser, instants]);

  const reactToInstant = useCallback((instantId: string, emoji: string) => {
    if (!currentUser) return;

    sounds.playHeartBurst();
    triggerConfetti(0.5, 0.5);

    setInstants((prev) => {
      const updated = prev.map((item) => {
        if (item.id === instantId) {
          const existingIdx = item.reactions.findIndex((r) => r.userId === currentUser.id && r.emoji === emoji);
          const newReactions = [...item.reactions];
          if (existingIdx >= 0) {
            // Remove reaction if already reacted with same emoji
            newReactions.splice(existingIdx, 1);
          } else {
            // Add new reaction
            newReactions.push({
              userId: currentUser.id,
              emoji,
              createdAt: new Date().toISOString(),
            });
          }
          return {
            ...item,
            reactions: newReactions,
          };
        }
        return item;
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem(INSTANTS_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, [currentUser]);

  const viewInstant = useCallback((instantId: string) => {
    if (!currentUser) return;

    setInstants((prev) => {
      const target = prev.find((it) => it.id === instantId);
      if (!target || target.viewers.includes(currentUser.id)) {
        return prev;
      }

      const updated = prev.map((item) => {
        if (item.id === instantId && !item.viewers.includes(currentUser.id)) {
          return {
            ...item,
            viewsCount: item.viewsCount + 1,
            viewers: [...item.viewers, currentUser.id],
          };
        }
        return item;
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem(INSTANTS_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, [currentUser]);

  const deleteInstant = useCallback((instantId: string) => {
    if (!currentUser) return;

    setInstants((prev) => {
      const updated = prev.filter((item) => item.id !== instantId || item.creatorId !== currentUser.id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(INSTANTS_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    sounds.playPop();
  }, [currentUser]);

  return (
    <InstantContext.Provider
      value={{
        instants,
        activeInstants,
        todayInstants,
        thisWeekInstants,
        userInstants,
        isViewerOpen,
        activeInstantIndex,
        activeInstant,
        isCreatorOpen,
        openInstantViewer,
        closeInstantViewer,
        nextInstant,
        prevInstant,
        openInstantCreator,
        closeInstantCreator,
        createInstant,
        reactToInstant,
        viewInstant,
        deleteInstant,
      }}
    >
      {children}
    </InstantContext.Provider>
  );
}

export function useInstants() {
  const context = useContext(InstantContext);
  if (!context) {
    throw new Error('useInstants must be used within an InstantProvider');
  }
  return context;
}

'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { AppNotification } from '@/lib/types';
import { SEED_NOTIFICATIONS } from '@/lib/seedData';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: AppNotification[];
  filter: 'all' | 'likes' | 'comments' | 'follows' | 'mentions';
  setFilter: (f: 'all' | 'likes' | 'comments' | 'follows' | 'mentions') => void;
  filteredNotifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'lumira-v2-notifications';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();

  // Initialize with seed data to guarantee 100% server-client hydration match
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'likes' | 'comments' | 'follows' | 'mentions'>('all');

  // Hydrate asynchronously after initial client hydration completes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setTimeout(() => {
          setNotifications(parsed);
        }, 0);
      }
    } catch {
      // fallback
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setNotifications(parsed);
        } catch {}
      }
    };

    // Live cross-client sync polling every 2 seconds
    const notifInterval = setInterval(() => {
      fetch('/api/sync')
        .then((res) => res.json())
        .then((data) => {
          if (data?.notifications && Array.isArray(data.notifications)) {
            setNotifications((prev) => {
              const currentIds = new Set(prev.map((n) => n.id));
              const newNotifs = data.notifications.filter((n: AppNotification) => !currentIds.has(n.id));
              if (newNotifs.length > 0) {
                const merged = [...newNotifs, ...prev];
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch {}
                return merged;
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }, 2000);

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(notifInterval);
    };
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (!target || target.isRead) return prev;
      const updated = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const hasUnread = prev.some((n) => !n.isRead);
      if (!hasUnread) return prev;
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotif: AppNotification = {
      ...n,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setNotifications((prev) => {
      const updated = [newNotif, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const userNotifications = useMemo(() => {
    if (!currentUser) return notifications;
    return notifications.filter(
      (n) =>
        n.userId === currentUser.id ||
        n.userId === currentUser.username ||
        n.userId === 'user-mujeeb' && currentUser.username === 'mujee00012' ||
        n.userId === 'user-hisham' && currentUser.username === 'mhudhishamp'
    );
  }, [notifications, currentUser]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'likes') {
      return userNotifications.filter((n) => n.type === 'like_post' || n.type === 'like_comment');
    }
    if (filter === 'comments') {
      return userNotifications.filter((n) => n.type === 'comment' || n.type === 'story_reply');
    }
    if (filter === 'follows') {
      return userNotifications.filter((n) => n.type === 'follow' || n.type === 'follow_request');
    }
    if (filter === 'mentions') {
      return userNotifications.filter((n) => n.type === 'mention');
    }
    return userNotifications;
  }, [userNotifications, filter]);

  const unreadCount = useMemo(() => {
    return userNotifications.filter((n) => !n.isRead).length;
  }, [userNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications: userNotifications,
        filter,
        setFilter,
        filteredNotifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

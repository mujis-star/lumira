'use client';

import React from 'react';
import Link from 'next/link';
import { InstagramLogo } from '../brand/InstagramLogo';
import { useNotification } from '@/context/NotificationContext';
import { useChat } from '@/context/ChatContext';
import { useIsMounted } from '@/lib/useIsMounted';
import { Heart, Send } from 'lucide-react';

interface HeaderProps {
  title?: string;
}

export function Header({}: HeaderProps = {}) {
  const { unreadCount } = useNotification();
  const { totalUnreadCount } = useChat();
  const mounted = useIsMounted();

  return (
    <header className="md:hidden sticky top-0 z-30 w-full bg-[var(--bg-primary)] border-b border-[var(--border-color)] px-4 py-2.5 flex items-center justify-between">
      {/* Instagram Wordmark */}
      <div className="flex items-center gap-2">
        <InstagramLogo size="sm" />
      </div>

      {/* Right Mobile Actions: Notifications & Direct */}
      <div className="flex items-center gap-4">
        {/* Activity / Notifications */}
        <Link
          href="/notifications"
          className="relative p-1 text-[var(--text-primary)] hover:opacity-75 transition-opacity"
          aria-label="Notifications"
        >
          <Heart className="w-6 h-6 stroke-[1.75]" />
          {mounted && unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ff3040]" />
          )}
        </Link>

        {/* Direct Messages */}
        <Link
          href="/direct"
          className="relative p-1 text-[var(--text-primary)] hover:opacity-75 transition-opacity"
          aria-label="Direct Messages"
        >
          <Send className="w-6 h-6 stroke-[1.75]" />
          {mounted && totalUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[#ff3040] text-white flex items-center justify-center min-w-[16px] h-4">
              {totalUnreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

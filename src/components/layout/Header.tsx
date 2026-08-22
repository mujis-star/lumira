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
    <header className="md:hidden sticky top-0 z-30 w-full bg-[var(--glass-bg)] backdrop-blur-2xl border-b border-[var(--glass-border)] shadow-sm px-4 py-2.5 flex items-center justify-between transition-colors">
      {/* Lumira Wordmark */}
      <div className="flex items-center gap-2">
        <InstagramLogo size="sm" />
      </div>

      {/* Right Mobile Actions: Notifications & Direct */}
      <div className="flex items-center gap-3">
        {/* Activity / Notifications */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-xl text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)] transition-colors active:scale-95"
          aria-label="Notifications"
        >
          <Heart className="w-5 h-5 stroke-[1.75]" />
          {mounted && unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ff3040] ring-2 ring-[var(--bg-primary)]" />
          )}
        </Link>

        {/* Direct Messages */}
        <Link
          href="/direct"
          className="relative p-2 rounded-xl text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)] transition-colors active:scale-95"
          aria-label="Direct Messages"
        >
          <Send className="w-5 h-5 stroke-[1.75]" />
          {mounted && totalUnreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-[#ff3040] text-white flex items-center justify-center min-w-[15px] h-3.5 shadow-sm">
              {totalUnreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

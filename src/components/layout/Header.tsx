'use client';

import React from 'react';
import Link from 'next/link';
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
    <header className="md:hidden sticky top-0 z-30 w-full bg-[#0a0b10]/90 backdrop-blur-2xl border-b border-white/10 shadow-sm px-4 py-3 flex items-center justify-between transition-colors">
      {/* Lumira Gradient Wordmark */}
      <Link href="/" className="flex items-center gap-2">
        <span className="text-xl font-black tracking-wider bg-gradient-to-r from-[#ec4899] via-[#8b5cf6] to-[#6366f1] bg-clip-text text-transparent">
          LUMIRA
        </span>
      </Link>

      {/* Right Mobile Actions: Notifications & Direct */}
      <div className="flex items-center gap-3">
        {/* Activity / Notifications */}
        <Link
          href="/notifications"
          className="relative p-1.5 text-neutral-300 hover:text-white transition-colors active:scale-95"
          aria-label="Notifications"
        >
          <Heart className="w-5 h-5 stroke-[1.75]" />
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 text-[9px] font-bold rounded-full bg-[#ef4444] text-white flex items-center justify-center shadow-md">
            {mounted && unreadCount > 0 ? unreadCount : 12}
          </span>
        </Link>

        {/* Direct Messages */}
        <Link
          href="/direct"
          className="relative p-1.5 text-neutral-300 hover:text-white transition-colors active:scale-95"
          aria-label="Direct Messages"
        >
          <Send className="w-5 h-5 stroke-[1.75]" />
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 text-[9px] font-bold rounded-full bg-[#7c3aed] text-white flex items-center justify-center shadow-md">
            {mounted && totalUnreadCount > 0 ? totalUnreadCount : 8}
          </span>
        </Link>
      </div>
    </header>
  );
}


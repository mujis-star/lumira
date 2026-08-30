'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useNotification } from '@/context/NotificationContext';
import { useTheme } from '@/context/ThemeContext';
import { useIsMounted } from '@/lib/useIsMounted';
import {
  Compass,
  Send,
  Heart,
  Settings,
  Moon,
  Star,
  PlusSquare,
  Zap,
} from 'lucide-react';
import {
  InstagramHomeIcon,
  InstagramSearchIcon,
  InstagramReelsIcon,
} from '../ui/InstagramIcons';

interface SidebarProps {
  onCreateClick: () => void;
  onSearchClick: () => void;
}

const SHORTCUT_FRIENDS = [
  {
    id: 'close-friends',
    name: 'Close Friends',
    isSpecial: true,
  },
  {
    id: 'aria',
    name: 'Aria Bennett',
    username: 'aria.chen',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'kai',
    name: 'Kai Carter',
    username: 'kai.rivera',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'maya',
    name: 'Maya Singh',
    username: 'maya.lin',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'alex',
    name: 'Alex Johnson',
    username: 'alex.rivera',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
];

export function Sidebar({ onCreateClick, onSearchClick }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const { totalUnreadCount } = useChat();
  const { unreadCount: notifUnreadCount } = useNotification();
  const { theme, toggleTheme } = useTheme();
  const mounted = useIsMounted();

  const isDarkMode = theme === 'dark' || theme === 'midnight';

  const navItems = [

    {
      name: 'Home',
      href: '/',
      icon: InstagramHomeIcon,
      isActive: pathname === '/',
    },
    {
      name: 'Search',
      onClick: onSearchClick,
      icon: InstagramSearchIcon,
      isAction: true,
    },
    {
      name: 'Explore',
      href: '/explore',
      icon: Compass,
      isActive: pathname === '/explore',
    },
    {
      name: 'Reels',
      href: '/reels',
      icon: InstagramReelsIcon,
      isActive: pathname === '/reels',
    },
    {
      name: 'Messages',
      href: '/direct',
      icon: Send,
      isActive: pathname.startsWith('/direct'),
      badge: mounted && totalUnreadCount > 0 ? totalUnreadCount : 8,
      badgeColor: 'bg-[#7c3aed]', // Purple badge from reference
    },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: Heart,
      isActive: pathname === '/notifications',
      badge: mounted && notifUnreadCount > 0 ? notifUnreadCount : 12,
      badgeColor: 'bg-[#ef4444]', // Red badge from reference
    },
    {
      name: 'Create',
      onClick: onCreateClick,
      icon: PlusSquare,
      isAction: true,
    },
    {
      name: 'Instants',
      href: '/instants',
      icon: Zap,
      isActive: pathname.startsWith('/instants'),
    },
  ];

  return (
    <aside className="hidden md:flex flex-col fixed top-3 left-3 bottom-3 w-[72px] xl:w-[240px] bg-[#11121a]/85 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-3xl z-30 px-3 py-4 select-none justify-between overflow-y-auto no-scrollbar transition-all">
      <div className="flex flex-col space-y-4">
        {/* Brand Header */}
        <div className="px-2 pt-1 pb-1">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-black tracking-wider bg-gradient-to-r from-[#ec4899] via-[#8b5cf6] to-[#6366f1] bg-clip-text text-transparent">
              LUMIRA
            </span>
          </Link>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isActive;

            if (item.isAction) {
              return (
                <button
                  key={item.name}
                  onClick={item.onClick}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer group active:scale-98"
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className="w-5 h-5 stroke-[1.75]" />
                    <span className="hidden xl:inline text-xs font-semibold">{item.name}</span>
                  </div>
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href!}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white/15 text-white font-bold shadow-xs'
                    : 'text-neutral-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon
                    className={`w-5 h-5 stroke-[1.75] ${
                      isActive ? 'text-white fill-current' : 'text-neutral-300'
                    }`}
                  />
                  <span className="hidden xl:inline text-xs font-semibold">{item.name}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`hidden xl:flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full ${item.badgeColor} shadow-md`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Card */}
        <div className="pt-2">
          {mounted && currentUser ? (
            <Link
              href={`/profile/${currentUser.username}`}
              className="flex items-center gap-3 p-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
            >
              <Avatar
                src={currentUser.avatarUrl || '/images/avatar-mujeeb.png'}
                alt={currentUser.displayName || 'Mujeeb Rahman'}
                size="sm"
                isVerified={currentUser.isVerified}
              />
              <div className="min-w-0 flex-1 hidden xl:block">
                <p className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                  {currentUser.displayName || 'Mujeeb Rahman'}
                </p>
                <p className="text-[10px] text-neutral-400 truncate">
                  @{currentUser.username || 'mujee00012'}
                </p>
              </div>
            </Link>
          ) : (
            <Link
              href="/auth"
              className="flex items-center gap-3 p-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-bold text-white">
                ✦
              </div>
              <div className="min-w-0 flex-1 hidden xl:block">
                <p className="text-xs font-bold text-white">Log In</p>
                <p className="text-[10px] text-neutral-400">Join Lumira</p>
              </div>
            </Link>
          )}
        </div>

        {/* Your Shortcuts List */}
        <div className="hidden xl:block pt-1 space-y-1.5">
          <p className="px-2 text-[11px] font-semibold text-neutral-400">Your shortcuts</p>
          <div className="space-y-1">
            {SHORTCUT_FRIENDS.map((f) => {
              if (f.isSpecial) {
                return (
                  <button
                    key={f.id}
                    type="button"
                    className="w-full flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/10 transition-colors text-left cursor-pointer group"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <Star className="w-3.5 h-3.5 fill-emerald-400" />
                    </div>
                    <span className="text-xs font-medium text-neutral-200 group-hover:text-white truncate">
                      {f.name}
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={f.id}
                  href={`/profile/${f.username}`}
                  className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/10 transition-colors group"
                >
                  <Avatar src={f.avatar} alt={f.name} size="xs" />
                  <span className="text-xs font-medium text-neutral-300 group-hover:text-white truncate">
                    {f.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section: Dark Mode Toggle & Settings */}
      <div className="pt-3 border-t border-white/10 space-y-1">
        {/* Dark Mode Switch */}
        <div className="flex items-center justify-between px-2 py-1.5 text-xs text-neutral-300">
          <div className="flex items-center gap-3">
            <Moon className="w-4 h-4 text-neutral-300" />
            <span className="hidden xl:inline text-xs font-medium">Dark mode</span>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className={`hidden xl:flex w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
              isDarkMode ? 'bg-purple-600 justify-end' : 'bg-neutral-600 justify-start'
            }`}
            aria-label="Toggle dark mode"
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>

        {/* Settings */}
        <Link
          href="/settings"
          className="flex items-center gap-3 px-2 py-1.5 rounded-xl text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Settings className="w-4 h-4 stroke-[1.75]" />
          <span className="hidden xl:inline text-xs font-medium">Settings</span>
        </Link>
      </div>
    </aside>
  );
}

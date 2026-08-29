'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { InstagramLogo } from '../brand/InstagramLogo';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useNotification } from '@/context/NotificationContext';
import { useTheme } from '@/context/ThemeContext';
import { useIsMounted } from '@/lib/useIsMounted';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Send,
  Heart,
  Settings,
  Sun,
  Moon,
  Menu,
  Bookmark,
  Users,
  LogOut,
  Check,
  Plus,
  Zap,
} from 'lucide-react';
import { useInstants } from '@/context/InstantContext';
import {
  InstagramHomeIcon,
  InstagramSearchIcon,
  InstagramCreateIcon,
  InstagramReelsIcon,
} from '../ui/InstagramIcons';

interface SidebarProps {
  onCreateClick: () => void;
  onSearchClick: () => void;
}

export function Sidebar({ onCreateClick, onSearchClick }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, savedAccounts, switchPersona, logout } = useAuth();
  const { totalUnreadCount } = useChat();
  const { unreadCount: notifUnreadCount } = useNotification();
  const { todayInstants } = useInstants();
  const { theme, toggleTheme } = useTheme();
  const mounted = useIsMounted();

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isSwitchAccountOpen, setIsSwitchAccountOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
        setIsSwitchAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsMoreMenuOpen(false);
    await logout();
    router.push('/auth');
  };

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
      name: 'Instants',
      href: '/instants',
      icon: Zap,
      isActive: pathname.startsWith('/instants'),
      badge: mounted && todayInstants.length > 0 ? todayInstants.length : undefined,
    },
    {
      name: 'Messages',
      href: '/direct',
      icon: Send,
      isActive: pathname.startsWith('/direct'),
      badge: mounted && totalUnreadCount > 0 ? totalUnreadCount : undefined,
    },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: Heart,
      isActive: pathname === '/notifications',
      badge: mounted && notifUnreadCount > 0 ? notifUnreadCount : undefined,
    },
    {
      name: 'Create',
      onClick: onCreateClick,
      icon: InstagramCreateIcon,
      isAction: true,
    },
    {
      name: 'Profile',
      href: currentUser ? `/profile/${currentUser.username}` : '/auth',
      isProfile: true,
      isActive: currentUser ? pathname === `/profile/${currentUser.username}` : false,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col fixed top-3 left-3 bottom-3 w-[72px] xl:w-[244px] bg-[var(--glass-bg)] backdrop-blur-2xl border border-[var(--glass-border)] shadow-[var(--glass-shadow-lg)] rounded-3xl z-30 px-3 py-5 select-none transition-all justify-between">
      {/* Top Section: Brand & Nav Links */}
      <div className="flex-col flex flex-1">
        {/* Lumira Brand Wordmark / Icon */}
        <div className="px-3 pt-1 pb-5 mb-2 border-b border-[var(--glass-border-subtle)]">
          <div className="hidden xl:block">
            <InstagramLogo size="md" />
          </div>
          <div className="block xl:hidden text-center">
            <InstagramLogo size="md" iconOnly={true} />
          </div>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 space-y-1.5 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.isAction) {
              return (
                <button
                  key={item.name}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-4 px-3 py-3 rounded-2xl text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)] border border-transparent hover:border-[var(--glass-border-subtle)] transition-all cursor-pointer group active:scale-98"
                  aria-label={item.name}
                >
                  <div className="relative shrink-0 group-hover:scale-110 transition-transform text-[var(--text-primary)]">
                    {Icon && <Icon className="w-6 h-6 stroke-[1.75]" />}
                  </div>
                  <span className="hidden xl:inline text-[15px]">{item.name}</span>
                </button>
              );
            }

            if (item.isProfile) {
              return (
                <Link
                  key={item.name}
                  href={item.href!}
                  className={`flex items-center gap-4 px-3 py-3 rounded-2xl text-sm transition-all border ${
                    item.isActive
                      ? 'bg-[var(--glass-bg-hover)] border-[var(--glass-border-highlight)] font-bold text-[var(--text-primary)] shadow-sm'
                      : 'border-transparent text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)] hover:border-[var(--glass-border-subtle)]'
                  } active:scale-98`}
                  aria-label="Profile"
                >
                  <div className="shrink-0">
                    {mounted && currentUser ? (
                      <div
                        className={`rounded-full p-[2px] transition-transform ${
                          item.isActive ? 'ring-2 ring-[var(--accent-blue)]' : ''
                        }`}
                      >
                        <Avatar src={currentUser.avatarUrl} alt={currentUser.displayName} size="xs" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                    )}
                  </div>
                  <span className="hidden xl:inline text-[15px] truncate">
                    {mounted && currentUser ? 'Profile' : 'Log In'}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href!}
                className={`flex items-center justify-between px-3 py-3 rounded-2xl text-sm transition-all border ${
                  item.isActive
                    ? 'bg-[var(--glass-bg-hover)] border-[var(--glass-border-highlight)] font-bold text-[var(--text-primary)] shadow-sm'
                    : 'border-transparent text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)] hover:border-[var(--glass-border-subtle)]'
                } active:scale-98`}
                aria-label={item.name}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative shrink-0 group-hover:scale-110 transition-transform">
                    {Icon && (
                      <Icon
                        className={`w-6 h-6 stroke-[1.75] ${
                          item.isActive ? 'fill-current text-[var(--accent-blue)]' : 'text-[var(--text-primary)]'
                        }`}
                      />
                    )}
                    {item.badge !== undefined && (
                      <span className="absolute -top-1 -right-1.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[#ff3040] text-white flex items-center justify-center min-w-[16px] h-4 shadow-md">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="hidden xl:inline text-[15px] truncate">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom "More" Menu with Settings & Dark Mode */}
      <div className="relative pt-2 border-t border-[var(--glass-border-subtle)]" ref={moreMenuRef}>
        <AnimatePresence>
          {isMoreMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="absolute bottom-full left-0 mb-3 w-64 bg-[var(--glass-modal-bg)] backdrop-blur-3xl border border-[var(--glass-border-highlight)] shadow-[var(--glass-shadow-lg)] rounded-2xl p-2 z-50 overflow-hidden"
            >
              {isSwitchAccountOpen ? (
                /* Switch Account Persona Sub-menu */
                <div className="space-y-1">
                  <div className="px-3 py-2 border-b border-[var(--glass-border-subtle)] flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      Switch Accounts
                    </span>
                    <button
                      onClick={() => setIsSwitchAccountOpen(false)}
                      className="text-xs text-[var(--accent-blue)] font-semibold cursor-pointer"
                    >
                      Back
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto py-1 space-y-1">
                    {savedAccounts.map((user) => {
                      const isSelected = user.id === currentUser?.id;
                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            switchPersona(user.id);
                            setIsMoreMenuOpen(false);
                            setIsSwitchAccountOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[var(--accent-blue)]/15 border border-[var(--accent-blue)]/30'
                              : 'hover:bg-[var(--glass-bg-hover)]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar src={user.avatarUrl} alt={user.displayName} size="xs" isVerified={user.isVerified} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                                  {user.username}
                                </p>
                                {user.isAdmin && (
                                  <span className="px-1 py-0.2 rounded bg-[#0095f6]/10 text-[#0095f6] text-[9px] font-bold">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[var(--text-secondary)] truncate">
                                {user.displayName}
                              </p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#0095f6] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="p-1 border-t border-[var(--glass-border-subtle)]">
                    <Link
                      href="/auth"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        setIsSwitchAccountOpen(false);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-[#0095f6] hover:bg-[var(--glass-bg-hover)] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log into an Existing Account</span>
                    </Link>
                  </div>
                </div>
              ) : (
                /* Main More Dropdown */
                <div className="space-y-0.5 text-sm">
                  <Link
                    href="/settings"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--glass-bg-hover)] text-[var(--text-primary)] transition-colors"
                  >
                    <Settings className="w-4 h-4 stroke-[1.75]" />
                    <span className="text-[14px]">Settings</span>
                  </Link>

                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[var(--glass-bg-hover)] text-[var(--text-primary)] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? (
                        <Sun className="w-4 h-4 stroke-[1.75]" />
                      ) : (
                        <Moon className="w-4 h-4 stroke-[1.75]" />
                      )}
                      <span className="text-[14px]">Switch appearance</span>
                    </div>
                    <span className="text-xs text-[var(--text-secondary)] capitalize">{theme}</span>
                  </button>

                  <Link
                    href={currentUser ? `/profile/${currentUser.username}?tab=saved` : '/auth'}
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--glass-bg-hover)] text-[var(--text-primary)] transition-colors"
                  >
                    <Bookmark className="w-4 h-4 stroke-[1.75]" />
                    <span className="text-[14px]">Saved</span>
                  </Link>

                  <button
                    onClick={() => setIsSwitchAccountOpen(true)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--glass-bg-hover)] text-[var(--text-primary)] transition-colors cursor-pointer text-left"
                  >
                    <Users className="w-4 h-4 stroke-[1.75]" />
                    <span className="text-[14px]">Switch accounts</span>
                  </button>

                  <div className="my-1 border-t border-[var(--glass-border-subtle)]" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-500/15 text-rose-500 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4 stroke-[1.75]" />
                    <span className="text-[14px] font-semibold">Log out</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
          className={`w-full flex items-center gap-4 px-3 py-3 rounded-2xl text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)] border border-transparent hover:border-[var(--glass-border-subtle)] transition-all cursor-pointer active:scale-98 ${
            isMoreMenuOpen ? 'bg-[var(--glass-bg-hover)] border-[var(--glass-border-highlight)] font-bold' : ''
          }`}
          aria-label="More options"
        >
          <Menu className="w-6 h-6 stroke-[1.75] shrink-0" />
          <span className="hidden xl:inline text-[15px]">More</span>
        </button>
      </div>
    </aside>
  );
}

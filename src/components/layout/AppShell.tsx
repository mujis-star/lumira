'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Header } from './Header';
import { OfflineBanner } from '../ui/OfflineBanner';
import { useStory } from '@/context/StoryContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

const StoryViewerModal = dynamic(
  () => import('../stories/StoryViewerModal').then((m) => m.StoryViewerModal),
  { ssr: false }
);
const StoryCreatorModal = dynamic(
  () => import('../stories/StoryCreatorModal').then((m) => m.StoryCreatorModal),
  { ssr: false }
);
const CreatePostModal = dynamic(
  () => import('../create/CreatePostModal').then((m) => m.CreatePostModal),
  { ssr: false }
);
const SearchDrawer = dynamic(
  () => import('../search/SearchDrawer').then((m) => m.SearchDrawer),
  { ssr: false }
);

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

export function AppShell({ children, title }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, isLoading } = useAuth();
  const { isCreatorOpen, closeStoryCreator } = useStory();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Redirect unauthenticated visitors directly to /auth login page
  useEffect(() => {
    if (!isLoading && !currentUser && pathname !== '/auth') {
      router.replace('/auth');
    }
  }, [isLoading, currentUser, pathname, router]);

  // Global Ctrl+K listener for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Quick non-blocking splash during initial load or while redirecting unauthenticated users to /auth
  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-[#07070b] text-white flex flex-col items-center justify-center select-none relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center gap-3 animate-pulse">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-purple-500/40">
            <Image
              src="/lumira-logo.png"
              alt="Lumira Logo"
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>
          <p className="text-xs font-bold text-neutral-400 tracking-wider">
            Loading Lumira ✦
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-x-hidden flex selection:bg-[var(--accent-blue)]/25">
      {/* Offline Connectivity Status Banner */}
      <OfflineBanner />

      {/* Dynamic Ambient Background Gradient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Orb 1: Top-Left Ambient */}
        <div
          className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full blur-[110px] opacity-35 dark:opacity-30 animate-float-orb-1"
          style={{ background: 'radial-gradient(circle, var(--orb-1) 0%, transparent 70%)' }}
        />
        {/* Orb 2: Top-Right Ambient */}
        <div
          className="absolute top-1/4 -right-32 w-[600px] h-[600px] rounded-full blur-[120px] opacity-30 dark:opacity-25 animate-float-orb-2"
          style={{ background: 'radial-gradient(circle, var(--orb-2) 0%, transparent 70%)' }}
        />
        {/* Orb 3: Bottom-Left Ambient */}
        <div
          className="absolute -bottom-40 left-1/4 w-[650px] h-[650px] rounded-full blur-[130px] opacity-25 dark:opacity-20 animate-float-orb-3"
          style={{ background: 'radial-gradient(circle, var(--orb-3) 0%, transparent 70%)' }}
        />
        {/* Orb 4: Center-Right Subtle Accent */}
        <div
          className="absolute top-2/3 -right-20 w-[450px] h-[450px] rounded-full blur-[100px] opacity-25 dark:opacity-20 animate-float-orb-1"
          style={{ background: 'radial-gradient(circle, var(--orb-4) 0%, transparent 70%)' }}
        />
      </div>

      {/* Desktop Left Floating Glass Sidebar (72px md, 244px xl) */}
      <div className="relative z-40">
        <Sidebar
          onCreateClick={() => setIsCreatePostOpen(true)}
          onSearchClick={() => setIsSearchOpen(true)}
        />
      </div>

      {/* Main Content Viewport */}
      <div className="flex-1 md:pl-[84px] xl:pl-[260px] flex flex-col min-h-screen pb-20 md:pb-6 relative z-10">
        {/* Mobile Top Glass Header */}
        <Header title={title} />

        {/* Page Content */}
        <main className="flex-1 w-full mx-auto px-2 sm:px-4 py-2 sm:py-4">
          {children}
        </main>

        {/* Mobile Bottom Glass Navigation */}
        <MobileNav onCreateClick={() => setIsCreatePostOpen(true)} />
      </div>

      {/* Global Slide-Out Search Drawer */}
      <SearchDrawer
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Fullscreen Story Viewer Modal */}
      <StoryViewerModal />

      {/* Global Story Creator Studio Modal */}
      <StoryCreatorModal
        isOpen={isCreatorOpen}
        onClose={closeStoryCreator}
      />

      {/* Create New Post Modal */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
      />
    </div>
  );
}

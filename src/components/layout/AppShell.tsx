'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Header } from './Header';
import { StoryViewerModal } from '../stories/StoryViewerModal';
import { StoryCreatorModal } from '../stories/StoryCreatorModal';
import { CreatePostModal } from '../create/CreatePostModal';
import { SearchDrawer } from '../search/SearchDrawer';
import { useStory } from '@/context/StoryContext';
import { useAuth } from '@/context/AuthContext';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

export function AppShell({ children, title }: AppShellProps) {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();
  const { isCreatorOpen, closeStoryCreator } = useStory();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Security Route Guard: redirect unauthenticated users to /auth
  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace('/auth');
    }
  }, [currentUser, isLoading, router]);

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

  // Secure Loading State
  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-[#07070b] text-white flex flex-col items-center justify-center select-none relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/30 ring-2 ring-purple-500/40 animate-pulse">
            <Image
              src="/lumira-logo.png"
              alt="Lumira Logo"
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-lg font-black tracking-wider bg-gradient-to-r from-blue-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
              LUMIRA
            </h2>
            <p className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase">
              Verifying Secure Session...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-x-hidden flex selection:bg-[var(--accent-blue)]/25">
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

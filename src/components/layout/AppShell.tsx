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
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center select-none">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
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
            <p className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase">
              Verifying Secure Session...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex">
      {/* Desktop Left Sidebar (72px md, 244px xl) */}
      <Sidebar
        onCreateClick={() => setIsCreatePostOpen(true)}
        onSearchClick={() => setIsSearchOpen(true)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 md:pl-[72px] xl:pl-[244px] flex flex-col min-h-screen pb-16 md:pb-0">
        {/* Mobile Top Header */}
        <Header title={title} />

        {/* Page Content */}
        <main className="flex-1 w-full mx-auto">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
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

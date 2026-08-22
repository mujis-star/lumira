'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Header } from './Header';
import { StoryViewerModal } from '../stories/StoryViewerModal';
import { StoryCreatorModal } from '../stories/StoryCreatorModal';
import { CreatePostModal } from '../create/CreatePostModal';
import { SearchDrawer } from '../search/SearchDrawer';
import { useStory } from '@/context/StoryContext';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

export function AppShell({ children, title }: AppShellProps) {
  const { isCreatorOpen, closeStoryCreator } = useStory();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

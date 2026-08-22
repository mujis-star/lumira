'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UserNote } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { SEED_NOTES } from '@/lib/seedData';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { ShareNoteModal } from './ShareNoteModal';
import { Search, Plus } from 'lucide-react';
import { sounds } from '@/lib/utils';

const NOTES_STORAGE_KEY = 'lumira-v2-notes';

interface NotesTrayProps {
  onSearchChange?: (query: string) => void;
  onFilterTabChange?: (tab: 'primary' | 'general' | 'channels' | 'requests') => void;
  showFilters?: boolean;
}

export function NotesTray({ onSearchChange, onFilterTabChange, showFilters = true }: NotesTrayProps) {
  const { currentUser } = useAuth();
  const { sendMessage } = useChat();

  const [notes, setNotes] = useState<UserNote[]>(SEED_NOTES);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeNoteForReply, setActiveNoteForReply] = useState<UserNote | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<'primary' | 'general' | 'channels' | 'requests'>('primary');

  const scrollRef = useRef<HTMLDivElement>(null);
  const filterScrollRef = useRef<HTMLDivElement>(null);

  // Drag-to-scroll state for notes
  const [isDraggingNotes, setIsDraggingNotes] = useState(false);
  const [notesStartX, setNotesStartX] = useState(0);
  const [notesScrollLeft, setNotesScrollLeft] = useState(0);

  // Drag-to-scroll state for filters
  const [isDraggingFilters, setIsDraggingFilters] = useState(false);
  const [filtersStartX, setFiltersStartX] = useState(0);
  const [filtersScrollLeft, setFiltersScrollLeft] = useState(0);

  // Hydrate notes from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NOTES_STORAGE_KEY);
      if (saved) {
        setTimeout(() => {
          try {
            setNotes(JSON.parse(saved));
          } catch {}
        }, 0);
      }
    } catch {}
  }, []);

  const persistNotes = (updated: UserNote[]) => {
    setNotes(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Storage limit for notes:', err);
      }
    }
  };

  const userNote = currentUser ? notes.find((n) => n.userId === currentUser.id) : undefined;
  const friendNotes = notes.filter((n) => n.userId !== currentUser?.id);

  const handleSaveUserNote = (data: { text?: string; song?: { title: string; artist: string; coverUrl?: string; audioUrl?: string } }) => {
    if (!currentUser) return;

    const newNote: UserNote = {
      id: `note-${currentUser.id}`,
      userId: currentUser.id,
      user: {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatarUrl: currentUser.avatarUrl,
        isVerified: currentUser.isVerified,
      },
      text: data.text,
      song: data.song,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const remaining = notes.filter((n) => n.userId !== currentUser.id);
    persistNotes([newNote, ...remaining]);
  };

  const handleDeleteUserNote = () => {
    if (!currentUser) return;
    const remaining = notes.filter((n) => n.userId !== currentUser.id);
    persistNotes(remaining);
  };

  const handleSendNoteReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNoteForReply || !replyMessage.trim()) return;

    sendMessage({
      receiverId: activeNoteForReply.userId,
      content: `Replied to your note: "${replyMessage.trim()}"`,
    });

    sounds.playSend();
    setReplyMessage('');
    setActiveNoteForReply(null);
  };

  // Horizontal mouse wheel scrolling for notes tray
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta !== 0) {
        e.preventDefault();
        el.scrollLeft += delta * 1.2;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Horizontal mouse wheel scrolling for filter tabs bar
  useEffect(() => {
    const el = filterScrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta !== 0) {
        e.preventDefault();
        el.scrollLeft += delta * 1.2;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Notes Drag Handlers
  const handleNotesMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDraggingNotes(true);
    setNotesStartX(e.pageX - scrollRef.current.offsetLeft);
    setNotesScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleNotesMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingNotes || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - notesStartX) * 1.5;
    scrollRef.current.scrollLeft = notesScrollLeft - walk;
  };

  const handleNotesMouseUp = () => {
    setIsDraggingNotes(false);
  };

  // Filter Tabs Drag Handlers
  const handleFiltersMouseDown = (e: React.MouseEvent) => {
    if (!filterScrollRef.current) return;
    setIsDraggingFilters(true);
    setFiltersStartX(e.pageX - filterScrollRef.current.offsetLeft);
    setFiltersScrollLeft(filterScrollRef.current.scrollLeft);
  };

  const handleFiltersMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingFilters || !filterScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - filterScrollRef.current.offsetLeft;
    const walk = (x - filtersStartX) * 1.5;
    filterScrollRef.current.scrollLeft = filtersScrollLeft - walk;
  };

  const handleFiltersMouseUp = () => {
    setIsDraggingFilters(false);
  };

  const handleTabClick = (tab: 'primary' | 'general' | 'channels' | 'requests', e?: React.MouseEvent) => {
    setActiveFilterTab(tab);
    onFilterTabChange?.(tab);

    if (e?.currentTarget) {
      (e.currentTarget as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  };

  return (
    <div className="w-full space-y-3 select-none bg-transparent px-3 sm:px-4 pt-3 pb-2 border-b border-[var(--glass-border-subtle)]">
      {/* 1. Glass Search Bar */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearchChange?.(e.target.value);
            }}
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-[var(--glass-input-bg)] backdrop-blur-md border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
          />
        </div>
      </div>

      {/* 2. Horizontal Notes Tray with Wheel & Drag-to-Scroll */}
      <div
        ref={scrollRef}
        onMouseDown={handleNotesMouseDown}
        onMouseMove={handleNotesMouseMove}
        onMouseUp={handleNotesMouseUp}
        onMouseLeave={handleNotesMouseUp}
        className={`flex items-start gap-4 overflow-x-auto no-scrollbar scroll-smooth pt-2 pb-1 ${
          isDraggingNotes ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Your Note Bubble & Avatar */}
        {currentUser && (
          <div className="flex flex-col items-center shrink-0 w-[78px]">
            <div
              onClick={() => setIsShareModalOpen(true)}
              className="relative cursor-pointer group flex flex-col items-center"
            >
              {/* Frosted Glass Note Speech Bubble */}
              <div className="relative mb-2 px-2.5 py-1.5 rounded-2xl bg-[var(--glass-modal-bg)] backdrop-blur-xl text-[var(--text-primary)] border border-[var(--glass-border-highlight)] shadow-md text-center max-w-[80px] group-hover:scale-105 transition-transform">
                {userNote?.song && (
                  <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-[var(--accent-blue)] truncate">
                    <span className="animate-pulse">ılı</span>
                    <span className="truncate">{userNote.song.title}</span>
                  </div>
                )}
                <p className="text-[11px] font-medium leading-tight truncate">
                  {userNote?.text || (userNote?.song ? userNote.song.artist : 'Note...')}
                </p>
                {/* Bubble Tail */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--glass-modal-bg)] border-r border-b border-[var(--glass-border-highlight)] rotate-45" />
              </div>

              {/* Avatar */}
              <div className="relative">
                <Avatar src={currentUser.avatarUrl} alt={currentUser.displayName} size="md" />
                {!userNote && (
                  <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-[#0095f6] text-white shadow ring-2 ring-[var(--bg-primary)]">
                    <Plus className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </div>
            </div>
            <span className="text-[11px] text-[var(--text-secondary)] mt-1 truncate max-w-[76px] text-center font-medium">
              Your note
            </span>
          </div>
        )}

        {/* Friend Notes */}
        {friendNotes.map((note) => (
          <div
            key={note.id}
            onClick={() => setActiveNoteForReply(note)}
            className="flex flex-col items-center shrink-0 w-[78px] cursor-pointer group"
          >
            {/* Frosted Glass Speech Bubble */}
            <div className="relative mb-2 px-2.5 py-1.5 rounded-2xl bg-[var(--glass-modal-bg)] backdrop-blur-xl text-[var(--text-primary)] border border-[var(--glass-border-highlight)] shadow-md text-center max-w-[82px] group-hover:scale-105 transition-transform">
              {note.song && (
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-[var(--accent-blue)] truncate">
                  <span className="animate-pulse">ılı</span>
                  <span className="truncate">{note.song.title}</span>
                </div>
              )}
              {note.text && (
                <p className="text-[11px] font-medium leading-tight truncate">
                  {note.text}
                </p>
              )}
              {/* Bubble Tail */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--glass-modal-bg)] border-r border-b border-[var(--glass-border-highlight)] rotate-45" />
            </div>

            {/* Avatar */}
            <Avatar src={note.user.avatarUrl} alt={note.user.displayName} size="md" />

            <span className="text-[11px] text-[var(--text-secondary)] mt-1 truncate max-w-[76px] text-center font-medium group-hover:text-[var(--text-primary)]">
              {note.user.displayName.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>

      {/* 3. Fully Moveable Filter Tabs with Glass Styling */}
      {showFilters && (
        <div className="relative group/filters pt-1">
          <div
            ref={filterScrollRef}
            onMouseDown={handleFiltersMouseDown}
            onMouseMove={handleFiltersMouseMove}
            onMouseUp={handleFiltersMouseUp}
            onMouseLeave={handleFiltersMouseUp}
            className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5 ${
              isDraggingFilters ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            <button
              type="button"
              onClick={(e) => handleTabClick('primary', e)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeFilterTab === 'primary'
                  ? 'bg-[var(--glass-bg-hover)] border border-[var(--glass-border-highlight)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#0095f6]" />
              <span>Primary</span>
              <span className="opacity-70 text-[10px]">6</span>
            </button>

            <button
              type="button"
              onClick={(e) => handleTabClick('general', e)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeFilterTab === 'general'
                  ? 'bg-[var(--glass-bg-hover)] border border-[var(--glass-border-highlight)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)]'
              }`}
            >
              General
            </button>

            <button
              type="button"
              onClick={(e) => handleTabClick('channels', e)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeFilterTab === 'channels'
                  ? 'bg-[var(--glass-bg-hover)] border border-[var(--glass-border-highlight)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)]'
              }`}
            >
              Channels
            </button>

            <button
              type="button"
              onClick={(e) => handleTabClick('requests', e)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeFilterTab === 'requests'
                  ? 'bg-[var(--glass-bg-hover)] border border-[var(--glass-border-highlight)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)]'
              }`}
            >
              Requests
            </button>
          </div>
        </div>
      )}

      {/* Share / Edit Your Note Modal */}
      <ShareNoteModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        currentNote={userNote}
        onSaveNote={handleSaveUserNote}
        onDeleteNote={handleDeleteUserNote}
      />

      {/* Reply to Note Modal */}
      {activeNoteForReply && (
        <Modal
          isOpen={!!activeNoteForReply}
          onClose={() => setActiveNoteForReply(null)}
          title={`Reply to ${activeNoteForReply.user.displayName}`}
          size="sm"
        >
          <form onSubmit={handleSendNoteReply} className="p-4 space-y-4 select-none bg-[var(--modal-bg)]">
            <div className="flex items-center gap-3 p-3 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl">
              <Avatar src={activeNoteForReply.user.avatarUrl} alt={activeNoteForReply.user.displayName} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[var(--text-primary)]">{activeNoteForReply.user.username}</p>
                {activeNoteForReply.song && (
                  <p className="text-[11px] text-blue-500 font-semibold truncate">
                    🎵 {activeNoteForReply.song.title} • {activeNoteForReply.song.artist}
                  </p>
                )}
                {activeNoteForReply.text && (
                  <p className="text-xs text-[var(--text-primary)] italic">&ldquo;{activeNoteForReply.text}&rdquo;</p>
                )}
              </div>
            </div>

            <div>
              <input
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder={`Send a message to ${activeNoteForReply.user.username}...`}
                className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] text-xs text-[var(--text-primary)] border border-[var(--border-color)] focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveNoteForReply(null)}
                className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!replyMessage.trim()}
                className="px-4 py-2 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-40 text-white text-xs font-bold transition-all shadow cursor-pointer"
              >
                Send Message
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

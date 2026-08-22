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
  showFilters?: boolean;
}

export function NotesTray({ onSearchChange, showFilters = true }: NotesTrayProps) {
  const { currentUser } = useAuth();
  const { sendMessage } = useChat();

  const [notes, setNotes] = useState<UserNote[]>(SEED_NOTES);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeNoteForReply, setActiveNoteForReply] = useState<UserNote | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<'primary' | 'general' | 'channels' | 'requests'>('primary');
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Horizontal mouse wheel scrolling for notes
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

  return (
    <div className="w-full space-y-3.5 select-none bg-[var(--bg-primary)] px-4 pt-3 pb-2 border-b border-[var(--border-color)]">
      {/* 1. Search Bar with Filter Option */}
      <div className="flex items-center gap-3">
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
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--border-color)]"
          />
        </div>
        <button
          type="button"
          className="text-xs font-bold text-[#0095f6] hover:text-[#1877f2] cursor-pointer"
        >
          Filter
        </button>
      </div>

      {/* 2. Horizontal Notes Tray */}
      <div
        ref={scrollRef}
        className="flex items-start gap-4 overflow-x-auto no-scrollbar scroll-smooth pt-3 pb-1"
      >
        {/* Your Note Bubble & Avatar */}
        {currentUser && (
          <div className="flex flex-col items-center shrink-0 w-[78px]">
            <div
              onClick={() => setIsShareModalOpen(true)}
              className="relative cursor-pointer group flex flex-col items-center"
            >
              {/* Note Speech Bubble */}
              <div className="relative mb-2 px-2.5 py-1.5 rounded-2xl bg-white dark:bg-neutral-800 text-[var(--text-primary)] border border-[var(--border-color)] shadow-md text-center max-w-[80px] group-hover:scale-105 transition-transform">
                {userNote?.song && (
                  <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-blue-500 truncate">
                    <span className="animate-pulse">ılı</span>
                    <span className="truncate">{userNote.song.title}</span>
                  </div>
                )}
                <p className="text-[11px] font-medium leading-tight truncate">
                  {userNote?.text || (userNote?.song ? userNote.song.artist : 'Note...')}
                </p>
                {/* Bubble Tail */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-neutral-800 border-r border-b border-[var(--border-color)] rotate-45" />
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
            {/* Speech Bubble */}
            <div className="relative mb-2 px-2.5 py-1.5 rounded-2xl bg-white dark:bg-neutral-800 text-[var(--text-primary)] border border-[var(--border-color)] shadow-md text-center max-w-[82px] group-hover:scale-105 transition-transform">
              {note.song && (
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-blue-500 truncate">
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
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-neutral-800 border-r border-b border-[var(--border-color)] rotate-45" />
            </div>

            {/* Avatar */}
            <Avatar src={note.user.avatarUrl} alt={note.user.displayName} size="md" />

            <span className="text-[11px] text-[var(--text-secondary)] mt-1 truncate max-w-[76px] text-center font-medium group-hover:text-[var(--text-primary)]">
              {note.user.displayName.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>

      {/* 3. Filter Tabs (Primary 6, General, Channels, Requests 1) */}
      {showFilters && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <button
            type="button"
            onClick={() => setActiveFilterTab('primary')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeFilterTab === 'primary'
                ? 'bg-neutral-200 dark:bg-neutral-800 text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#0095f6]" />
            <span>Primary</span>
            <span className="opacity-70">6</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilterTab('general')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeFilterTab === 'general'
                ? 'bg-neutral-200 dark:bg-neutral-800 text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            General
          </button>

          <button
            type="button"
            onClick={() => setActiveFilterTab('channels')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeFilterTab === 'channels'
                ? 'bg-blue-500/15 text-[#0095f6]'
                : 'text-[#0095f6] hover:opacity-80'
            }`}
          >
            Channels
          </button>

          <button
            type="button"
            onClick={() => setActiveFilterTab('requests')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeFilterTab === 'requests'
                ? 'bg-neutral-200 dark:bg-neutral-800 text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#0095f6]" />
            <span>Requests</span>
            <span className="opacity-70">1</span>
          </button>
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

      {/* Reply to Friend's Note Modal */}
      {activeNoteForReply && (
        <Modal
          isOpen={!!activeNoteForReply}
          onClose={() => setActiveNoteForReply(null)}
          title={`@${activeNoteForReply.user.username}'s Note`}
          size="sm"
        >
          <div className="p-4 space-y-4 select-none bg-[var(--modal-bg)]">
            {/* Note Display Bubble */}
            <div className="flex flex-col items-center text-center gap-2 pt-2">
              <div className="px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-[var(--border-color)] shadow-md max-w-[260px] space-y-1">
                {activeNoteForReply.song && (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-500">
                    <span className="animate-pulse">ılı</span>
                    <span>{activeNoteForReply.song.title} • {activeNoteForReply.song.artist}</span>
                  </div>
                )}
                {activeNoteForReply.text && (
                  <p className="text-xs text-[var(--text-primary)] font-semibold break-words">
                    &ldquo;{activeNoteForReply.text}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1">
                <Avatar src={activeNoteForReply.user.avatarUrl} alt={activeNoteForReply.user.displayName} size="sm" />
                <span className="text-xs font-bold text-[var(--text-primary)]">{activeNoteForReply.user.displayName}</span>
              </div>
            </div>

            {/* Direct Message Reply Form */}
            <form onSubmit={handleSendNoteReply} className="pt-2 border-t border-[var(--border-color)] flex items-center gap-2">
              <input
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder={`Send message to ${activeNoteForReply.user.username}...`}
                className="flex-1 px-3.5 py-2 rounded-xl bg-[var(--input-bg)] text-xs text-[var(--text-primary)] border border-[var(--border-color)] focus:outline-none placeholder-[var(--text-secondary)]"
                autoFocus
              />
              <button
                type="submit"
                disabled={!replyMessage.trim()}
                className="px-4 py-2 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer disabled:cursor-default"
              >
                Send
              </button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}

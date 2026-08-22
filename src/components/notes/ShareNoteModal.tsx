'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { UserNote } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { POPULAR_SONGS } from '@/lib/seedData';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { EmojiPickerModal } from '../ui/EmojiPicker';
import { Music, Smile, Trash2, Search } from 'lucide-react';
import { sounds, triggerConfetti } from '@/lib/utils';

interface ShareNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNote?: UserNote;
  onSaveNote: (noteData: { text?: string; song?: { title: string; artist: string; coverUrl?: string; audioUrl?: string } }) => void;
  onDeleteNote: () => void;
}

export function ShareNoteModal({
  isOpen,
  onClose,
  currentNote,
  onSaveNote,
  onDeleteNote,
}: ShareNoteModalProps) {
  const { currentUser } = useAuth();
  const [noteText, setNoteText] = useState(currentNote?.text || '');
  const [selectedSong, setSelectedSong] = useState(currentNote?.song || null);
  const [isMusicPickerOpen, setIsMusicPickerOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [customSongTitle, setCustomSongTitle] = useState('');
  const [customSongArtist, setCustomSongArtist] = useState('');

  const filteredSongs = POPULAR_SONGS.filter(
    (s) =>
      s.title.toLowerCase().includes(songSearchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(songSearchQuery.toLowerCase())
  );

  const handleShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() && !selectedSong) return;

    onSaveNote({
      text: noteText.trim() || undefined,
      song: selectedSong || undefined,
    });

    sounds.playSend();
    triggerConfetti(0.5, 0.5);
    onClose();
  };

  const handleSelectSong = (song: typeof POPULAR_SONGS[0]) => {
    setSelectedSong(song);
    setIsMusicPickerOpen(false);
  };

  const handleAddCustomSong = () => {
    if (!customSongTitle.trim()) return;
    setSelectedSong({
      title: customSongTitle.trim(),
      artist: customSongArtist.trim() || 'Unknown Artist',
    });
    setCustomSongTitle('');
    setCustomSongArtist('');
    setIsMusicPickerOpen(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title="New note">
      <div className="p-4 space-y-5 select-none bg-[var(--modal-bg)]">
        {/* Floating Bubble Preview over Avatar */}
        <div className="flex flex-col items-center justify-center pt-2">
          {/* Note Speech Bubble */}
          <div className="relative mb-3 max-w-[220px] px-3.5 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-[var(--border-color)] shadow-md text-center text-xs text-[var(--text-primary)] animate-fadeIn">
            {selectedSong && (
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-blue-500 mb-0.5 truncate">
                <span className="animate-pulse">ılı</span>
                <span className="truncate">{selectedSong.title}</span>
              </div>
            )}
            <p className="font-medium break-words">
              {noteText || <span className="text-[var(--text-secondary)] italic">Share a thought...</span>}
            </p>
            {/* Bubble Tail Point */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-neutral-100 dark:bg-neutral-800 border-r border-b border-[var(--border-color)] rotate-45" />
          </div>

          {/* User Avatar */}
          {currentUser && (
            <Avatar src={currentUser.avatarUrl} alt={currentUser.displayName} size="lg" />
          )}
        </div>

        {/* Thought Input Box */}
        <div className="space-y-1">
          <div className="relative">
            <textarea
              rows={2}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Share what's on your mind..."
              maxLength={60}
              className="w-full p-3 pr-10 rounded-xl bg-[var(--input-bg)] text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] border border-[var(--border-color)] focus:outline-none resize-none"
            />
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen(true)}
              className="absolute right-3 top-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] px-1">
            <span>Visible to followers you follow back for 24h</span>
            <span>{noteText.length}/60</span>
          </div>
        </div>

        {/* Music Track Attached Pill */}
        {selectedSong ? (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-full bg-blue-500 text-white shrink-0">
                <Music className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[var(--text-primary)] truncate">{selectedSong.title}</p>
                <p className="text-[10px] text-[var(--text-secondary)] truncate">{selectedSong.artist}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSong(null)}
              className="text-xs text-rose-500 font-semibold hover:underline ml-2 shrink-0 cursor-pointer"
            >
              Remove
            </button>
          </div>
        ) : (
          /* Add Song Button */
          <button
            type="button"
            onClick={() => setIsMusicPickerOpen(true)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-[var(--text-primary)] text-xs font-semibold cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white">
                <Music className="w-3.5 h-3.5" />
              </div>
              <span>Add music or song</span>
            </div>
            <span className="text-[11px] text-[#0095f6] font-bold">+ Add song</span>
          </button>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
          {currentNote ? (
            <button
              type="button"
              onClick={() => {
                onDeleteNote();
                onClose();
              }}
              className="flex items-center gap-1.5 text-xs text-rose-500 hover:opacity-75 font-semibold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete note</span>
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleShare}
              disabled={!noteText.trim() && !selectedSong}
              className="px-4 py-2 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-40 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:cursor-default"
            >
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Music Selector Sub-Modal */}
      <Modal isOpen={isMusicPickerOpen} onClose={() => setIsMusicPickerOpen(false)} title="Select Music" size="sm">
        <div className="p-4 space-y-3 select-none">
          {/* Search Track */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              value={songSearchQuery}
              onChange={(e) => setSongSearchQuery(e.target.value)}
              placeholder="Search songs or artists..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--input-bg)] text-xs text-[var(--text-primary)] border border-[var(--border-color)] focus:outline-none"
            />
          </div>

          {/* Popular Tracks List */}
          <div className="max-h-56 overflow-y-auto space-y-1">
            {filteredSongs.map((song, i) => (
              <div
                key={i}
                onClick={() => handleSelectSong(song)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-800 shrink-0">
                    <Image src={song.coverUrl} alt={song.title} fill className="object-cover" unoptimized />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{song.title}</p>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate">{song.artist}</p>
                  </div>
                </div>
                <span className="text-xs text-[#0095f6] font-bold">Select</span>
              </div>
            ))}
          </div>

          {/* Or type custom song */}
          <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
            <p className="text-[11px] font-bold text-[var(--text-secondary)]">Or Enter Custom Track:</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={customSongTitle}
                onChange={(e) => setCustomSongTitle(e.target.value)}
                placeholder="Song title"
                className="px-3 py-1.5 rounded-lg bg-[var(--input-bg)] text-xs border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none"
              />
              <input
                type="text"
                value={customSongArtist}
                onChange={(e) => setCustomSongArtist(e.target.value)}
                placeholder="Artist name"
                className="px-3 py-1.5 rounded-lg bg-[var(--input-bg)] text-xs border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none"
              />
            </div>
            {customSongTitle.trim() && (
              <button
                type="button"
                onClick={handleAddCustomSong}
                className="w-full py-1.5 rounded-lg bg-[#0095f6] text-white text-xs font-bold cursor-pointer"
              >
                Use this track
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Emoji Picker */}
      <EmojiPickerModal
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        onSelectEmoji={(emoji) => setNoteText((prev) => prev + emoji)}
        title="Add Emoji"
      />
    </Modal>
  );
}

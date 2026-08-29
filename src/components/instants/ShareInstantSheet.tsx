'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  InstantAdjustments,
  InstantOverlayText,
  InstantOverlaySticker,
  AttachedMusic,
  UserProfile,
  InstantVisibility,
} from '@/lib/types';
import { generateInstantCssFilter } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import {
  Globe,
  Lock,
  Users,
  Check,
  ArrowLeft,
  Sparkles,
  Search,
} from 'lucide-react';

interface ShareInstantSheetProps {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  filterId: string;
  filterIntensity: number;
  adjustments: InstantAdjustments;
  textOverlays: InstantOverlayText[];
  stickers: InstantOverlaySticker[];
  drawingDataUrl?: string;
  attachedMusic?: AttachedMusic;
  musicVolume: number;
  videoVolume: number;
  videoTrim?: { start: number; end: number };
  videoSpeed: number;
  allUsers: UserProfile[];
  onBack: () => void;
  onShare: (payload: {
    visibility: InstantVisibility;
    allowedViewerIds?: string[];
    caption?: string;
  }) => void;
}

export function ShareInstantSheet({
  mediaUrl,
  mediaType,
  filterId,
  filterIntensity,
  adjustments,
  textOverlays,
  stickers,
  drawingDataUrl,
  attachedMusic,
  allUsers,
  onBack,
  onShare,
}: ShareInstantSheetProps) {
  const [visibility, setVisibility] = useState<InstantVisibility>('Everyone');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [caption, setCaption] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const computedFilter = generateInstantCssFilter(adjustments, filterId, filterIntensity);

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleShareClick = () => {
    setIsSharing(true);
    setTimeout(() => {
      onShare({
        visibility,
        allowedViewerIds: visibility === 'Selected Friends' ? selectedUserIds : undefined,
        caption: caption.trim() || undefined,
      });
    }, 400);
  };

  const filteredUsers = allUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#07070b] select-none overflow-y-auto p-4 sm:p-6">
      {/* Top Header */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Edit</span>
        </button>

        <span className="text-sm font-bold text-white">Share Instant</span>

        <div className="w-12" />
      </div>

      <div className="max-w-xl w-full mx-auto py-6 space-y-6 flex-1">
        {/* 1. Final High-Fidelity Preview Box */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-3xl bg-[var(--glass-card-bg)] backdrop-blur-2xl border border-[var(--glass-border)] shadow-xl">
          <div
            style={{
              transform: `scale(${adjustments.zoom}) translate(${adjustments.panX}px, ${adjustments.panY}px) rotate(${adjustments.rotate + adjustments.straighten}deg) scaleX(${adjustments.flipH ? -1 : 1}) scaleY(${adjustments.flipV ? -1 : 1})`,
            }}
            className="relative w-36 h-48 rounded-2xl overflow-hidden shadow-lg border border-white/20 shrink-0 bg-black"
          >
            {mediaType === 'video' ? (
              <video src={mediaUrl} className="w-full h-full object-cover" style={{ filter: computedFilter }} muted autoPlay loop playsInline />
            ) : (
              <Image src={mediaUrl} alt="Preview" fill className="object-cover" style={{ filter: computedFilter }} unoptimized />
            )}

            {/* Drawing preview */}
            {drawingDataUrl && (
              <Image src={drawingDataUrl} alt="Drawing" fill className="object-cover pointer-events-none z-10" unoptimized />
            )}

            {/* Text preview */}
            {textOverlays.map((t) => (
              <div
                key={t.id}
                style={{
                  left: `${t.x}%`,
                  top: `${t.y}%`,
                  transform: 'translate(-50%, -50%) scale(0.6)',
                  color: t.color,
                  backgroundColor: t.backgroundColor,
                }}
                className="absolute z-20 px-2 py-0.5 rounded-lg text-[10px] font-bold truncate max-w-full"
              >
                {t.text}
              </div>
            ))}

            {/* Stickers preview */}
            {stickers.map((s) => (
              <div
                key={s.id}
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  transform: 'translate(-50%, -50%) scale(0.6)',
                }}
                className="absolute z-20 text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded-md truncate max-w-full"
              >
                {s.content}
              </div>
            ))}
          </div>

          <div className="flex-1 min-w-0 space-y-2 text-white">
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Expires automatically in 24 hours</span>
            </div>
            <p className="text-xs text-white/70">
              {attachedMusic ? `🎵 Soundtrack: ${attachedMusic.title} (${attachedMusic.artist})` : 'No background music'}
            </p>

            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a quick note or caption (optional)..."
              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-white/50 focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
            />
          </div>
        </div>

        {/* 2. Audience Selection Options */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-white uppercase tracking-wider block">
            Who can view this Instant?
          </label>

          <div className="space-y-2">
            {/* Everyone */}
            <div
              onClick={() => setVisibility('Everyone')}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                visibility === 'Everyone'
                  ? 'bg-[var(--accent-blue)]/20 border-[var(--accent-blue)] text-white shadow-md'
                  : 'bg-[var(--glass-bg)] border-[var(--glass-border-subtle)] text-white/80 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/20 text-[#0095f6]">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold">Your Instants (Everyone)</p>
                  <p className="text-[11px] text-white/60">Visible to all Lumira community members</p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  visibility === 'Everyone' ? 'bg-[#0095f6] border-[#0095f6] text-white' : 'border-white/30'
                }`}
              >
                {visibility === 'Everyone' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* Close Friends */}
            <div
              onClick={() => setVisibility('Close Friends')}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                visibility === 'Close Friends'
                  ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                  : 'bg-[var(--glass-bg)] border-[var(--glass-border-subtle)] text-white/80 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-400">Close Friends</p>
                  <p className="text-[11px] text-white/60">Only people in your Close Friends list</p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  visibility === 'Close Friends' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/30'
                }`}
              >
                {visibility === 'Close Friends' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* Selected Friends */}
            <div
              onClick={() => setVisibility('Selected Friends')}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                visibility === 'Selected Friends'
                  ? 'bg-purple-500/20 border-purple-500 text-white shadow-md'
                  : 'bg-[var(--glass-bg)] border-[var(--glass-border-subtle)] text-white/80 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-400">Selected Friends</p>
                  <p className="text-[11px] text-white/60">
                    {selectedUserIds.length === 0
                      ? 'Choose specific friends below'
                      : `${selectedUserIds.length} friend(s) selected`}
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  visibility === 'Selected Friends' ? 'bg-purple-500 border-purple-500 text-white' : 'border-white/30'
                }`}
              >
                {visibility === 'Selected Friends' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Friends Multi-select Picker */}
        {visibility === 'Selected Friends' && (
          <div className="space-y-3 p-4 rounded-3xl bg-white/5 border border-white/10 animate-in fade-in">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friends..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/10 text-xs text-white placeholder-white/50 focus:outline-none border border-white/15"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredUsers.map((user) => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer text-white"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" isVerified={user.isVerified} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{user.displayName}</p>
                        <p className="text-[11px] text-white/60 truncate">@{user.username}</p>
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'bg-purple-500 border-purple-500 text-white' : 'border-white/30'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Share Action Button */}
        <div className="pt-4">
          <button
            type="button"
            onClick={handleShareClick}
            disabled={isSharing || (visibility === 'Selected Friends' && selectedUserIds.length === 0)}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#0095f6] to-[#7857ff] hover:from-[#1877f2] hover:to-[#6842ff] text-white text-sm font-bold shadow-xl transition-all active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSharing ? 'Publishing Instant...' : 'Share Instant'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

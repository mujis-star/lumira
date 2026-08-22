'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { useIsMounted } from '@/lib/useIsMounted';
import { Check, Plus } from 'lucide-react';

export function RightWidgetPanel() {
  const router = useRouter();
  const { currentUser, allUsers, savedAccounts, toggleFollow, isFollowing, switchPersona } = useAuth();
  const mounted = useIsMounted();
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);

  const suggestedUsers = allUsers
    .filter((u) => u.id !== currentUser?.id)
    .slice(0, 5);

  return (
    <aside className="w-[320px] shrink-0 hidden lg:block select-none text-xs text-[var(--text-secondary)]">
      {/* Frosted Glass Suggested Card Container */}
      <div className="bg-[var(--glass-card-bg)] backdrop-blur-2xl border border-[var(--glass-border)] shadow-[var(--glass-shadow)] rounded-3xl p-5 mb-5 transition-all hover:border-[var(--glass-border-highlight)]">
        {/* Current User Row */}
        {mounted && currentUser && (
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--glass-border-subtle)]">
            <Link
              href={`/profile/${currentUser.username}`}
              className="flex items-center gap-3 min-w-0 group flex-1"
            >
              <Avatar src={currentUser.avatarUrl} alt={currentUser.displayName} size="md" isVerified={currentUser.isVerified} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-blue)] transition-colors">
                  {currentUser.username}
                </p>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  {currentUser.displayName}
                </p>
              </div>
            </Link>

            <button
              onClick={() => setIsSwitchModalOpen(true)}
              className="text-xs font-bold text-[var(--accent-blue)] hover:text-[var(--accent-blue-hover)] cursor-pointer shrink-0 ml-2 px-2.5 py-1 rounded-xl bg-[var(--accent-blue)]/10 hover:bg-[var(--accent-blue)]/20 transition-colors active:scale-95"
            >
              Switch
            </button>
          </div>
        )}

        {/* Suggested For You Header */}
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Suggested for you
          </span>
          <Link
            href="/explore"
            className="text-xs font-bold text-[var(--accent-blue)] hover:underline transition-opacity"
          >
            See All
          </Link>
        </div>

        {/* Suggested Users List */}
        <div className="space-y-3">
          {suggestedUsers.map((user) => {
            const following = isFollowing(user.id);

            return (
              <div key={user.id} className="flex items-center justify-between group/user">
                <Link
                  href={`/profile/${user.username}`}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" isVerified={user.isVerified} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate group-hover/user:text-[var(--accent-blue)] transition-colors">
                      {user.username}
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate">
                      Suggested for you
                    </p>
                  </div>
                </Link>

                <button
                  onClick={() => toggleFollow(user.id)}
                  className={`text-xs font-bold cursor-pointer shrink-0 ml-2 px-2.5 py-1 rounded-xl transition-all active:scale-95 ${
                    following
                      ? 'bg-[var(--glass-bg-hover)] text-[var(--text-primary)] border border-[var(--glass-border-subtle)]'
                      : 'bg-[var(--accent-blue)] text-white hover:bg-[var(--accent-blue-hover)] shadow-xs'
                  }`}
                >
                  {following ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lumira Footer Links */}
      <div className="px-3 space-y-2 text-[11px] text-[var(--text-tertiary)] leading-relaxed">
        <nav className="flex flex-wrap gap-x-1.5 gap-y-1">
          <Link href="/explore" className="hover:underline">About</Link> •
          <Link href="/explore" className="hover:underline">Help</Link> •
          <Link href="/explore" className="hover:underline">Press</Link> •
          <Link href="/explore" className="hover:underline">API</Link> •
          <Link href="/explore" className="hover:underline">Jobs</Link> •
          <Link href="/explore" className="hover:underline">Privacy</Link> •
          <Link href="/explore" className="hover:underline">Terms</Link> •
          <Link href="/explore" className="hover:underline">Locations</Link> •
          <Link href="/explore" className="hover:underline">Language</Link>
        </nav>
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-tertiary)]">
          © 2026 LUMIRA — WHERE MOMENTS ILLUMINATE
        </p>
      </div>

      {/* Switch Accounts Modal */}
      <Modal
        isOpen={isSwitchModalOpen}
        onClose={() => setIsSwitchModalOpen(false)}
        title="Switch accounts"
        size="sm"
      >
        <div className="p-3 divide-y divide-[var(--glass-border-subtle)]">
          <div className="max-h-64 overflow-y-auto py-1 space-y-1">
            {savedAccounts.map((user) => {
              const isSelected = user.id === currentUser?.id;

              return (
                <div
                  key={user.id}
                  onClick={() => {
                    switchPersona(user.id);
                    setIsSwitchModalOpen(false);
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-2xl transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--accent-blue)]/15 border border-[var(--accent-blue)]/30'
                      : 'hover:bg-[var(--glass-bg-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" isVerified={user.isVerified} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">{user.username}</p>
                        {user.isAdmin && (
                          <span className="px-1.5 py-0.2 rounded-md bg-[#0095f6]/15 text-[#0095f6] text-[9px] font-bold">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] truncate">{user.displayName}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#0095f6] flex items-center justify-center text-white shrink-0 shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2.5">
            <button
              type="button"
              onClick={() => {
                setIsSwitchModalOpen(false);
                router.push('/auth');
              }}
              className="w-full py-2.5 px-3 rounded-2xl hover:bg-[var(--glass-bg-hover)] text-xs font-bold text-[#0095f6] flex items-center justify-center gap-2 transition-colors cursor-pointer border border-[var(--glass-border-subtle)]"
            >
              <Plus className="w-4 h-4" />
              <span>Log into an Existing Account</span>
            </button>
          </div>
        </div>
      </Modal>
    </aside>
  );
}

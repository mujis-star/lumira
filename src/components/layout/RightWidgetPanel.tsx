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
    <div className="w-[320px] shrink-0 pt-4 hidden lg:block select-none text-xs text-[var(--text-secondary)]">
      {/* Current User Row */}
      {mounted && currentUser && (
        <div className="flex items-center justify-between py-2 mb-4">
          <Link
            href={`/profile/${currentUser.username}`}
            className="flex items-center gap-3 min-w-0 group"
          >
            <Avatar src={currentUser.avatarUrl} alt={currentUser.displayName} size="md" isVerified={currentUser.isVerified} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:opacity-80">
                {currentUser.username}
              </p>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                {currentUser.displayName}
              </p>
            </div>
          </Link>

          <button
            onClick={() => setIsSwitchModalOpen(true)}
            className="text-xs font-semibold text-[var(--accent-blue)] hover:text-[var(--accent-blue-hover)] cursor-pointer shrink-0 ml-2"
          >
            Switch
          </button>
        </div>
      )}

      {/* Suggested For You Header */}
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-sm font-semibold text-[var(--text-secondary)]">
          Suggested for you
        </span>
        <Link
          href="/explore"
          className="text-xs font-semibold text-[var(--text-primary)] hover:opacity-75 transition-opacity"
        >
          See All
        </Link>
      </div>

      {/* Suggested Users List */}
      <div className="space-y-3 mb-6">
        {suggestedUsers.map((user) => {
          const following = isFollowing(user.id);

          return (
            <div key={user.id} className="flex items-center justify-between">
              <Link
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 min-w-0 group flex-1"
              >
                <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" isVerified={user.isVerified} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate group-hover:opacity-80">
                    {user.username}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] truncate">
                    Suggested for you
                  </p>
                </div>
              </Link>

              <button
                onClick={() => toggleFollow(user.id)}
                className={`text-xs font-semibold cursor-pointer shrink-0 ml-2 transition-colors ${
                  following
                    ? 'text-[var(--text-primary)] hover:opacity-70'
                    : 'text-[var(--accent-blue)] hover:text-[var(--accent-blue-hover)]'
                }`}
              >
                {following ? 'Following' : 'Follow'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Instagram Footer Links */}
      <div className="space-y-3 text-[11px] text-[var(--text-tertiary)] leading-relaxed">
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
        <p className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">
          © 2026 LUMIRA
        </p>
      </div>

      {/* Switch Accounts Modal */}
      <Modal
        isOpen={isSwitchModalOpen}
        onClose={() => setIsSwitchModalOpen(false)}
        title="Switch accounts"
        size="sm"
      >
        <div className="p-2 divide-y divide-[var(--border-subtle)]">
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
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" isVerified={user.isVerified} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{user.username}</p>
                        {user.isAdmin && (
                          <span className="px-1 py-0.2 rounded bg-[#0095f6]/10 text-[#0095f6] text-[9px] font-bold">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] truncate">{user.displayName}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#0095f6] flex items-center justify-center text-white shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSwitchModalOpen(false);
                router.push('/auth');
              }}
              className="w-full py-2.5 px-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold text-[#0095f6] flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log into an Existing Account</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

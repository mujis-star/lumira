'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AppShell } from '@/components/layout/AppShell';
import { useNotification } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { formatTimeAgo } from '@/lib/utils';
import { Heart } from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, filteredNotifications, filter, setFilter, markAllAsRead } = useNotification();
  const { toggleFollow, isFollowing } = useAuth();

  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const todayNotifs = filteredNotifications.slice(0, 4);
  const earlierNotifs = filteredNotifications.slice(4);

  return (
    <AppShell title="Notifications">
      <div className="max-w-[640px] mx-auto py-4 sm:py-8 px-4 space-y-6 select-none">
        {/* Header & Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Notifications</h1>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-[var(--glass-input-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl">
            {(['all', 'follows', 'likes', 'comments'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize ${
                  filter === f
                    ? 'bg-[var(--accent-blue)] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Frosted Glass Container */}
        <div className="bg-[var(--glass-card-bg)] backdrop-blur-3xl border border-[var(--glass-border)] shadow-[var(--glass-shadow-lg)] rounded-3xl p-4 sm:p-6 transition-all">
          {filteredNotifications.length > 0 ? (
            <div className="space-y-6">
              {/* Today Section */}
              {todayNotifs.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Today</p>
                  <div className="space-y-1 divide-y divide-[var(--glass-border-subtle)]">
                    {todayNotifs.map((notif) => {
                      const following = isFollowing(notif.actorId);

                      return (
                        <div
                          key={notif.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl hover:bg-[var(--glass-bg-hover)] transition-colors group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <Link href={`/profile/${notif.actor.username}`}>
                              <Avatar src={notif.actor.avatarUrl} alt={notif.actor.displayName} size="md" isVerified={notif.actor.isVerified} />
                            </Link>

                            <div className="text-xs text-[var(--text-primary)] min-w-0 flex-1 leading-relaxed">
                              <p>
                                <Link href={`/profile/${notif.actor.username}`} className="font-bold hover:text-[var(--accent-blue)] transition-colors">
                                  {notif.actor.username}
                                </Link>{' '}
                                {notif.type === 'like_post' && 'liked your post.'}
                                {notif.type === 'comment' && `commented: "${notif.commentText}"`}
                                {notif.type === 'follow' && 'started following you.'}
                                <span className="text-[var(--text-secondary)] opacity-75 ml-1 text-[11px]">
                                  {formatTimeAgo(notif.createdAt)}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Action or Post Thumbnail */}
                          {notif.type === 'follow' ? (
                            <button
                              type="button"
                              onClick={() => toggleFollow(notif.actorId)}
                              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95 ${
                                following
                                  ? 'bg-[var(--glass-bg-hover)] text-[var(--text-primary)] border border-[var(--glass-border)]'
                                  : 'bg-[var(--accent-blue)] text-white hover:bg-[var(--accent-blue-hover)] shadow-xs'
                              }`}
                            >
                              {following ? 'Following' : 'Follow Back'}
                            </button>
                          ) : notif.postThumbnail ? (
                            <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-[var(--glass-border)] shadow-xs">
                              <Image src={notif.postThumbnail} alt="Post" fill className="object-cover" unoptimized />
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Earlier Section */}
              {earlierNotifs.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Earlier</p>
                  <div className="space-y-1 divide-y divide-[var(--glass-border-subtle)]">
                    {earlierNotifs.map((notif) => {
                      const following = isFollowing(notif.actorId);

                      return (
                        <div
                          key={notif.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl hover:bg-[var(--glass-bg-hover)] transition-colors group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <Link href={`/profile/${notif.actor.username}`}>
                              <Avatar src={notif.actor.avatarUrl} alt={notif.actor.displayName} size="md" isVerified={notif.actor.isVerified} />
                            </Link>

                            <div className="text-xs text-[var(--text-primary)] min-w-0 flex-1 leading-relaxed">
                              <p>
                                <Link href={`/profile/${notif.actor.username}`} className="font-bold hover:text-[var(--accent-blue)] transition-colors">
                                  {notif.actor.username}
                                </Link>{' '}
                                {notif.type === 'like_post' && 'liked your post.'}
                                {notif.type === 'comment' && `commented: "${notif.commentText}"`}
                                {notif.type === 'follow' && 'started following you.'}
                                <span className="text-[var(--text-secondary)] opacity-75 ml-1 text-[11px]">
                                  {formatTimeAgo(notif.createdAt)}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Action or Post Thumbnail */}
                          {notif.type === 'follow' ? (
                            <button
                              type="button"
                              onClick={() => toggleFollow(notif.actorId)}
                              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95 ${
                                following
                                  ? 'bg-[var(--glass-bg-hover)] text-[var(--text-primary)] border border-[var(--glass-border)]'
                                  : 'bg-[var(--accent-blue)] text-white hover:bg-[var(--accent-blue-hover)] shadow-xs'
                              }`}
                            >
                              {following ? 'Following' : 'Follow Back'}
                            </button>
                          ) : notif.postThumbnail ? (
                            <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-[var(--glass-border)] shadow-xs">
                              <Image src={notif.postThumbnail} alt="Post" fill className="object-cover" unoptimized />
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 sm:py-20 space-y-3">
              <div className="w-16 h-16 rounded-full bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] flex items-center justify-center mx-auto text-[var(--accent-blue)] shadow-md">
                <Heart className="w-7 h-7 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-[var(--text-primary)]">Activity On Your Account</p>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
                  When someone follows you, likes or comments on your posts, you&apos;ll see real-time updates here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

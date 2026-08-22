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
  const { notifications, markAllAsRead } = useNotification();
  const { toggleFollow, isFollowing } = useAuth();

  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const todayNotifs = notifications.slice(0, 2);
  const earlierNotifs = notifications.slice(2);

  return (
    <AppShell title="Notifications">
      <div className="max-w-[600px] mx-auto py-4 sm:py-8 px-4 space-y-6 select-none">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Notifications</h1>

        {notifications.length > 0 ? (
          <div className="space-y-6">
            {/* Today */}
            {todayNotifs.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-[var(--text-primary)]">Today</p>
                <div className="space-y-1">
                  {todayNotifs.map((notif) => {
                    const following = isFollowing(notif.actorId);

                    return (
                      <div
                        key={notif.id}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Link href={`/profile/${notif.actor.username}`}>
                            <Avatar src={notif.actor.avatarUrl} alt={notif.actor.displayName} size="md" isVerified={notif.actor.isVerified} />
                          </Link>

                          <div className="text-xs text-[var(--text-primary)] min-w-0 flex-1 leading-snug">
                            <p>
                              <Link href={`/profile/${notif.actor.username}`} className="font-bold hover:underline">
                                {notif.actor.username}
                              </Link>{' '}
                              {notif.type === 'like_post' && 'liked your post.'}
                              {notif.type === 'comment' && `commented: "${notif.commentText}"`}
                              {notif.type === 'follow' && 'started following you.'}
                              <span className="text-[var(--text-secondary)] ml-1">
                                {formatTimeAgo(notif.createdAt)}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Action or Post Thumbnail */}
                        {notif.type === 'follow' ? (
                          <button
                            onClick={() => toggleFollow(notif.actorId)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                              following
                                ? 'bg-neutral-100 dark:bg-neutral-800 text-[var(--text-primary)]'
                                : 'bg-[#0095f6] hover:bg-[#1877f2] text-white'
                            }`}
                          >
                            {following ? 'Following' : 'Follow'}
                          </button>
                        ) : notif.postThumbnail ? (
                          <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-[var(--border-color)]">
                            <Image src={notif.postThumbnail} alt="Post" fill className="object-cover" unoptimized />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Earlier */}
            {earlierNotifs.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-[var(--text-primary)]">Earlier</p>
                <div className="space-y-1">
                  {earlierNotifs.map((notif) => {
                    const following = isFollowing(notif.actorId);

                    return (
                      <div
                        key={notif.id}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Link href={`/profile/${notif.actor.username}`}>
                            <Avatar src={notif.actor.avatarUrl} alt={notif.actor.displayName} size="md" isVerified={notif.actor.isVerified} />
                          </Link>

                          <div className="text-xs text-[var(--text-primary)] min-w-0 flex-1 leading-snug">
                            <p>
                              <Link href={`/profile/${notif.actor.username}`} className="font-bold hover:underline">
                                {notif.actor.username}
                              </Link>{' '}
                              {notif.type === 'like_post' && 'liked your post.'}
                              {notif.type === 'comment' && `commented: "${notif.commentText}"`}
                              {notif.type === 'follow' && 'started following you.'}
                              <span className="text-[var(--text-secondary)] ml-1">
                                {formatTimeAgo(notif.createdAt)}
                              </span>
                            </p>
                          </div>
                        </div>

                        {notif.type === 'follow' ? (
                          <button
                            onClick={() => toggleFollow(notif.actorId)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                              following
                                ? 'bg-neutral-100 dark:bg-neutral-800 text-[var(--text-primary)]'
                                : 'bg-[#0095f6] hover:bg-[#1877f2] text-white'
                            }`}
                          >
                            {following ? 'Following' : 'Follow'}
                          </button>
                        ) : notif.postThumbnail ? (
                          <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-[var(--border-color)]">
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
          <div className="text-center py-20 space-y-2">
            <Heart className="w-12 h-12 text-[var(--text-secondary)] mx-auto" />
            <p className="text-base font-bold text-[var(--text-primary)]">Activity On Your Posts</p>
            <p className="text-xs text-[var(--text-secondary)]">When someone likes or comments on one of your posts, you&apos;ll see it here.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

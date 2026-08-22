'use client';

import React, { useState, useRef, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { usePost } from '@/context/PostContext';
import { useStory } from '@/context/StoryContext';
import { useChat } from '@/context/ChatContext';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { CommentsDrawer } from '@/components/feed/CommentsDrawer';
import { CreatePostModal } from '@/components/create/CreatePostModal';
import { Post } from '@/lib/types';
import { formatNumber, sounds, triggerConfetti } from '@/lib/utils';
import {
  Grid,
  Bookmark,
  Tag,
  Settings,
  Link as LinkIcon,
  Heart,
  MessageCircle,
  Layers,
  Film,
  Play,
  Plus,
  Upload,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
];

const HIGHLIGHT_COVER_PRESETS = [
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=300&q=80',
];

interface HighlightItem {
  id: string;
  title: string;
  cover: string;
}

const DEFAULT_HIGHLIGHTS: HighlightItem[] = [
  { id: 'hl-1', title: 'Tokyo', cover: HIGHLIGHT_COVER_PRESETS[0] },
  { id: 'hl-2', title: 'Exhibits', cover: HIGHLIGHT_COVER_PRESETS[1] },
  { id: 'hl-3', title: 'Studio', cover: HIGHLIGHT_COVER_PRESETS[2] },
  { id: 'hl-4', title: 'Design', cover: HIGHLIGHT_COVER_PRESETS[3] },
];

export default function ProfilePage({ params }: ProfilePageProps) {
  const router = useRouter();
  const { username } = use(params);
  const {
    currentUser,
    allUsers,
    getUserByUsername,
    toggleFollow,
    isFollowing,
    updateProfile,
  } = useAuth();

  const { getUserPosts, getUserReels, getBookmarkedPosts, getTaggedPosts } = usePost();
  const { startDirectMessage } = useChat();
  const { stories, openStoryViewer, openStoryCreator } = useStory();

  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'saved' | 'tagged'>('posts');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const [followerSearch, setFollowerSearch] = useState('');
  const [followingSearch, setFollowingSearch] = useState('');

  // Edit form state
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Highlights state
  const [highlights, setHighlights] = useState<HighlightItem[]>(DEFAULT_HIGHLIGHTS);
  const [isNewHighlightOpen, setIsNewHighlightOpen] = useState(false);
  const [newHighlightTitle, setNewHighlightTitle] = useState('');
  const [newHighlightCover, setNewHighlightCover] = useState(HIGHLIGHT_COVER_PRESETS[0]);
  const [editingHighlight, setEditingHighlight] = useState<HighlightItem | null>(null);
  const [editHlTitle, setEditHlTitle] = useState('');
  const [editHlCover, setEditHlCover] = useState(HIGHLIGHT_COVER_PRESETS[0]);
  const [isEditHighlightOpen, setIsEditHighlightOpen] = useState(false);

  const highlightFileRef = useRef<HTMLInputElement>(null);
  const editHighlightFileRef = useRef<HTMLInputElement>(null);
  const highlightsContainerRef = useRef<HTMLDivElement>(null);

  const profileUser = getUserByUsername(username);

  const sanitizeHighlights = (items: HighlightItem[]): HighlightItem[] => {
    return items.map((item) => {
      const lower = item.title.toLowerCase();
      if (lower.includes('kill') || lower.includes('die') || lower.includes('suicide') || lower.includes('hate')) {
        return { ...item, title: 'Memories' };
      }
      return item;
    });
  };

  // Enable mouse wheel horizontal scrolling on highlights tray
  useEffect(() => {
    const el = highlightsContainerRef.current;
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
  }, [highlights]);

  useEffect(() => {
    if (profileUser) {
      try {
        const saved = localStorage.getItem(`lumira-v2-hl-${profileUser.id}`);
        setTimeout(() => {
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              const cleaned = sanitizeHighlights(Array.isArray(parsed) ? parsed : DEFAULT_HIGHLIGHTS);
              setHighlights(cleaned);
              localStorage.setItem(`lumira-v2-hl-${profileUser.id}`, JSON.stringify(cleaned));
            } catch {
              setHighlights(DEFAULT_HIGHLIGHTS);
            }
          } else {
            setHighlights(DEFAULT_HIGHLIGHTS);
          }
        }, 0);
      } catch {
        // fallback
      }
    }
  }, [profileUser]);

  if (!profileUser) {
    return (
      <AppShell title="Profile Not Found">
        <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Sorry, this page isn&apos;t available.</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            The link you followed may be broken, or the page may have been removed.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 rounded-lg bg-[#0095f6] text-white text-xs font-semibold hover:bg-[#1877f2]"
          >
            Go back to Lumira
          </Link>
        </div>
      </AppShell>
    );
  }

  const isSelf = !!(
    currentUser &&
    profileUser &&
    (currentUser.id === profileUser.id ||
      currentUser.username.toLowerCase() === profileUser.username.toLowerCase())
  );
  const activeUser = isSelf && currentUser ? currentUser : profileUser;
  const followingThisUser = profileUser ? isFollowing(profileUser.id) : false;
  const userPosts = profileUser ? getUserPosts(profileUser.id) : [];
  const userReels = profileUser ? getUserReels(profileUser.id) : [];
  const userSavedPosts = isSelf && profileUser ? getBookmarkedPosts(profileUser.id) : [];
  const userTaggedPosts = profileUser ? getTaggedPosts(profileUser.username) : [];

  const livePostsCount = isSelf ? userPosts.length : (activeUser?.postsCount ?? userPosts.length);
  const liveFollowersCount = activeUser?.followers ? activeUser.followers.length : (activeUser?.followersCount ?? 0);
  const liveFollowingCount = activeUser?.following ? activeUser.following.length : (activeUser?.followingCount ?? 0);

  const userStory = profileUser ? stories.find((s) => s.userId === profileUser.id) : undefined;
  const hasStory = !!userStory && userStory.items.length > 0;

  const handleOpenEdit = () => {
    if (!activeUser) return;
    setEditDisplayName(activeUser.displayName);
    setEditUsername(activeUser.username);
    setEditBio(activeUser.bio || '');
    setEditWebsite(activeUser.website || '');
    setEditAvatarUrl(activeUser.avatarUrl);
    setIsEditProfileOpen(true);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditAvatarUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHighlightCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewHighlightCover(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateHighlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHighlightTitle.trim()) return;

    const newHl: HighlightItem = {
      id: `hl-${Date.now()}`,
      title: newHighlightTitle.trim(),
      cover: newHighlightCover,
    };

    const updated = [...highlights, newHl];
    setHighlights(updated);
    if (typeof window !== 'undefined' && activeUser) {
      localStorage.setItem(`lumira-v2-hl-${activeUser.id}`, JSON.stringify(updated));
    }

    setIsNewHighlightOpen(false);
    setNewHighlightTitle('');
    sounds.playSend();
    triggerConfetti(0.5, 0.5);
  };

  const handleOpenEditHighlight = (hl: HighlightItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingHighlight(hl);
    setEditHlTitle(hl.title);
    setEditHlCover(hl.cover);
    setIsEditHighlightOpen(true);
  };

  const handleEditHighlightCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditHlCover(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateHighlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHighlight || !editHlTitle.trim()) return;

    const updated = highlights.map((h) =>
      h.id === editingHighlight.id
        ? { ...h, title: editHlTitle.trim(), cover: editHlCover }
        : h
    );

    setHighlights(updated);
    if (typeof window !== 'undefined' && activeUser) {
      localStorage.setItem(`lumira-v2-hl-${activeUser.id}`, JSON.stringify(updated));
    }

    setIsEditHighlightOpen(false);
    setEditingHighlight(null);
    sounds.playSend();
  };

  const handleDeleteHighlight = (id: string) => {
    const updated = highlights.filter((h) => h.id !== id);
    setHighlights(updated);
    if (typeof window !== 'undefined' && activeUser) {
      localStorage.setItem(`lumira-v2-hl-${activeUser.id}`, JSON.stringify(updated));
    }
    setIsEditHighlightOpen(false);
    setEditingHighlight(null);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUsername.trim() || !editDisplayName.trim()) return;

    updateProfile({
      username: editUsername.trim().toLowerCase().replace(/[^a-z0-9_.]/g, ''),
      displayName: editDisplayName.trim(),
      bio: editBio.trim(),
      website: editWebsite.trim(),
      avatarUrl: editAvatarUrl || activeUser.avatarUrl,
    });

    setIsEditProfileOpen(false);
    sounds.playSend();
  };

  const handleStartChat = () => {
    if (!activeUser) return;
    startDirectMessage(activeUser.id);
    router.push('/direct');
  };

  return (
    <AppShell title={activeUser.username}>
      <div className="max-w-[935px] mx-auto py-4 sm:py-8 px-4 sm:px-6 space-y-6 select-none">
        {/* Frosted Glass Profile Header Card */}
        <header className="p-6 sm:p-8 rounded-3xl bg-[var(--glass-card-bg)] backdrop-blur-3xl border border-[var(--glass-border)] shadow-[var(--glass-shadow-lg)] flex flex-col md:flex-row items-center md:items-start gap-8 transition-all">
          {/* Avatar with Story Ring & Plus Badge */}
          <div className="relative group shrink-0">
            <div
              onClick={() => {
                if (hasStory && userStory) {
                  openStoryViewer(userStory.id);
                } else if (isSelf) {
                  openStoryCreator();
                }
              }}
              className="cursor-pointer transition-transform group-hover:scale-105"
            >
              <Avatar
                src={activeUser.avatarUrl}
                alt={activeUser.displayName}
                size="2xl"
                hasStory={hasStory}
                isStorySeen={userStory ? !userStory.hasUnseen : false}
                isVerified={activeUser.isVerified}
              />
            </div>

            {isSelf && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openStoryCreator();
                }}
                className="absolute bottom-1 right-1 p-2 bg-[#0095f6] hover:bg-[#1877f2] text-white rounded-full ring-4 ring-[var(--bg-primary)] shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer z-10"
                title="Add to story"
                aria-label="Add to story"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            )}
          </div>

          {/* User Details & Stats */}
          <div className="flex-1 space-y-4 w-full text-center md:text-left">
            {/* Row 1: Username & Actions */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                {activeUser.username}
              </h1>

              {isSelf ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenEdit}
                    className="px-4 py-2 rounded-2xl bg-[var(--glass-bg-hover)] hover:bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    Edit profile
                  </button>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 rounded-2xl bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Create</span>
                  </button>
                  <Link
                    href="/settings"
                    className="p-2 rounded-2xl bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] hover:bg-[var(--glass-bg)] text-[var(--text-primary)] transition-colors shadow-xs"
                    aria-label="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFollow(activeUser.id)}
                    className={`px-5 py-2 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                      followingThisUser
                        ? 'bg-[var(--glass-bg-hover)] text-[var(--text-primary)] border border-[var(--glass-border)]'
                        : 'bg-[#0095f6] hover:bg-[#1877f2] text-white'
                    }`}
                  >
                    {followingThisUser ? 'Following' : 'Follow'}
                  </button>
                  <button
                    onClick={handleStartChat}
                    className="px-4 py-2 rounded-2xl bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] text-xs font-bold text-[var(--text-primary)] transition-colors cursor-pointer shadow-xs"
                  >
                    Message
                  </button>
                </div>
              )}
            </div>

            {/* Row 2: Stats (Posts, Followers, Following) */}
            <div className="flex items-center justify-center md:justify-start gap-8 text-sm">
              <div>
                <span className="font-bold text-[var(--text-primary)]">{livePostsCount}</span>{' '}
                <span className="text-[var(--text-secondary)] text-xs">posts</span>
              </div>

              <button
                onClick={() => setIsFollowersModalOpen(true)}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <span className="font-bold text-[var(--text-primary)]">{formatNumber(liveFollowersCount)}</span>{' '}
                <span className="text-[var(--text-secondary)] text-xs">followers</span>
              </button>

              <button
                onClick={() => setIsFollowingModalOpen(true)}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <span className="font-bold text-[var(--text-primary)]">{formatNumber(liveFollowingCount)}</span>{' '}
                <span className="text-[var(--text-secondary)] text-xs">following</span>
              </button>
            </div>

            {/* Row 3: Bio & Website */}
            <div className="text-xs text-[var(--text-primary)] space-y-1">
              <p className="font-bold">{activeUser.displayName}</p>
              <p className="whitespace-pre-line leading-relaxed">{activeUser.bio}</p>
              {activeUser.website && (
                <a
                  href={activeUser.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[var(--accent-blue)] hover:underline"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>{activeUser.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Story Highlights Tray */}
        <div ref={highlightsContainerRef} className="flex items-center gap-6 overflow-x-auto py-2 no-scrollbar scroll-smooth">
          {highlights.map((hl) => (
            <div
              key={hl.id}
              onClick={(e) => {
                if (isSelf) {
                  handleOpenEditHighlight(hl, e);
                } else {
                  if (hasStory) {
                    openStoryViewer(userStory.id);
                  } else {
                    openStoryViewer(0);
                  }
                }
              }}
              onContextMenu={(e) => {
                if (isSelf) {
                  e.preventDefault();
                  handleOpenEditHighlight(hl, e);
                }
              }}
              className="relative flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
              title={isSelf ? 'Click to edit or delete highlight' : hl.title}
            >
              <div className="relative w-16 h-16 rounded-full p-[2px] border border-[var(--border-color)] flex items-center justify-center bg-[var(--bg-primary)] group-hover:border-[var(--text-secondary)] transition-colors">
                <div className="relative w-full h-full rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                  <Image src={hl.cover} alt={hl.title} fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
                </div>

                {isSelf && (
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                    Edit
                  </div>
                )}
              </div>
              <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate max-w-[68px]">
                {hl.title}
              </span>
            </div>
          ))}

          {/* + New Highlight Button */}
          {isSelf && (
            <div
              onClick={() => setIsNewHighlightOpen(true)}
              className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full border border-dashed border-[var(--border-color)] group-hover:border-[#0095f6] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[#0095f6] transition-colors bg-[var(--bg-primary)]">
                <Plus className="w-6 h-6 stroke-[1.5]" />
              </div>
              <span className="text-[11px] font-semibold text-[var(--text-primary)]">New</span>
            </div>
          )}
        </div>

        {/* Tab Bar - Responsive to fit all devices perfectly */}
        <div className="border-t border-[var(--border-color)]">
          <div className="flex items-center justify-around sm:justify-center gap-1 sm:gap-12 text-[11px] sm:text-xs font-bold tracking-wider uppercase text-[var(--text-secondary)] px-1 sm:px-0">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex items-center gap-1.5 py-4 border-t-2 -mt-[1px] cursor-pointer transition-colors ${
                activeTab === 'posts'
                  ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                  : 'border-transparent hover:text-[var(--text-primary)]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Posts</span>
            </button>

            <button
              onClick={() => setActiveTab('reels')}
              className={`flex items-center gap-1.5 py-4 border-t-2 -mt-[1px] cursor-pointer transition-colors ${
                activeTab === 'reels'
                  ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                  : 'border-transparent hover:text-[var(--text-primary)]'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Reels</span>
            </button>

            {isSelf && (
              <button
                onClick={() => setActiveTab('saved')}
                className={`flex items-center gap-1.5 py-4 border-t-2 -mt-[1px] cursor-pointer transition-colors ${
                  activeTab === 'saved'
                    ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                    : 'border-transparent hover:text-[var(--text-primary)]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Saved</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('tagged')}
              className={`flex items-center gap-1.5 py-4 border-t-2 -mt-[1px] cursor-pointer transition-colors ${
                activeTab === 'tagged'
                  ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                  : 'border-transparent hover:text-[var(--text-primary)]'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Tagged</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div>
          {/* Posts Tab Grid */}
          {activeTab === 'posts' && (
            userPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 sm:gap-6">
                {userPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-900 group cursor-pointer"
                  >
                    {post.media[0]?.type === 'video' || post.media[0]?.url.endsWith('.mp4') || post.media[0]?.url.startsWith('data:video') ? (
                      <video
                        src={post.media[0]?.url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src={post.media[0]?.url}
                        alt={post.caption}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}

                    <div className="absolute top-2 right-2 text-white drop-shadow z-10">
                      {post.media.length > 1 ? (
                        <Layers className="w-4 h-4" />
                      ) : post.media[0]?.type === 'video' || post.media[0]?.url.endsWith('.mp4') ? (
                        <Film className="w-4 h-4" />
                      ) : null}
                    </div>

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold text-sm z-20">
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-5 h-5 fill-white" />
                        <span>{formatNumber(post.likesCount)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="w-5 h-5 fill-white" />
                        <span>{formatNumber(post.commentsCount)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 space-y-2">
                <Grid className="w-12 h-12 text-[var(--text-secondary)] mx-auto" />
                <p className="text-base font-bold text-[var(--text-primary)]">No posts yet</p>
              </div>
            )
          )}

          {/* Reels Tab (9:16 Vertical Cards) */}
          {activeTab === 'reels' && (
            userReels.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 sm:gap-4">
                {userReels.map((reel) => (
                  <Link
                    key={reel.id}
                    href="/reels"
                    className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black group cursor-pointer shadow"
                  >
                    <video
                      src={reel.videoUrl}
                      muted
                      loop
                      playsInline
                      autoPlay
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs font-bold drop-shadow">
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{formatNumber(reel.likesCount * 3 + 120)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 space-y-4">
                <div className="w-16 h-16 rounded-full border-2 border-[var(--text-primary)] flex items-center justify-center mx-auto text-[var(--text-primary)]">
                  <Film className="w-8 h-8 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-[var(--text-primary)]">Capture and share moments</p>
                  <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                    Share short vertical videos, clips and creative ideas with music.
                  </p>
                </div>
                {isSelf && (
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-bold transition-colors cursor-pointer shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Reel</span>
                  </button>
                )}
              </div>
            )
          )}

          {/* Saved Tab */}
          {activeTab === 'saved' && (
            userSavedPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 sm:gap-6">
                {userSavedPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-900 group cursor-pointer"
                  >
                    {post.media[0]?.type === 'video' || post.media[0]?.url.endsWith('.mp4') || post.media[0]?.url.startsWith('data:video') ? (
                      <video
                        src={post.media[0]?.url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image src={post.media[0]?.url} alt={post.caption} fill className="object-cover" unoptimized />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold text-sm z-20">
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-5 h-5 fill-white" />
                        <span>{formatNumber(post.likesCount)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="w-5 h-5 fill-white" />
                        <span>{formatNumber(post.commentsCount)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 space-y-2">
                <Bookmark className="w-12 h-12 text-[var(--text-secondary)] mx-auto" />
                <p className="text-base font-bold text-[var(--text-primary)]">Save posts you want to see again</p>
                <p className="text-xs text-[var(--text-secondary)]">Only you can see what you&apos;ve saved.</p>
              </div>
            )
          )}

          {/* Tagged Tab */}
          {activeTab === 'tagged' && (
            userTaggedPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 sm:gap-6">
                {userTaggedPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-900 group cursor-pointer"
                  >
                    <Image src={post.media[0]?.url} alt={post.caption} fill className="object-cover" unoptimized />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 space-y-2">
                <Tag className="w-12 h-12 text-[var(--text-secondary)] mx-auto" />
                <p className="text-base font-bold text-[var(--text-primary)]">No photos of you yet</p>
                <p className="text-xs text-[var(--text-secondary)]">When people tag you in photos, they&apos;ll appear here.</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Create Post / Reel Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} title="Edit profile" size="md">
        <form onSubmit={handleSaveProfile} className="p-4 space-y-4">
          {/* Avatar Edit Section */}
          <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar src={editAvatarUrl || profileUser.avatarUrl} alt={profileUser.displayName} size="md" />
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">{profileUser.username}</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-[#0095f6] hover:text-[#1877f2] font-semibold cursor-pointer text-left block"
                  >
                    Change profile photo
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl border border-[var(--border-color)] hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[var(--text-primary)] transition-colors cursor-pointer"
                title="Upload Photo"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Preset Avatars */}
            <div className="pt-2 border-t border-[var(--border-subtle)]">
              <p className="text-[10px] text-[var(--text-secondary)] font-semibold mb-1.5">Or choose a preset avatar:</p>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {AVATAR_PRESETS.map((presetUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setEditAvatarUrl(presetUrl)}
                    className={`relative w-8 h-8 rounded-full overflow-hidden shrink-0 cursor-pointer border-2 transition-all ${
                      editAvatarUrl === presetUrl ? 'border-[#0095f6] scale-110' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <Image src={presetUrl} alt="Preset avatar" fill className="object-cover" unoptimized />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Username field */}
          <div>
            <label className="text-xs font-bold text-[var(--text-primary)] block mb-1">Username</label>
            <div className="flex items-center px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)]">
              <span className="text-xs text-[var(--text-secondary)] mr-1">@</span>
              <input
                type="text"
                required
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="username"
                className="w-full bg-transparent text-xs text-[var(--text-primary)] focus:outline-none"
              />
            </div>
          </div>

          {/* Display Name field */}
          <div>
            <label className="text-xs font-bold text-[var(--text-primary)] block mb-1">Name</label>
            <input
              type="text"
              required
              value={editDisplayName}
              onChange={(e) => setEditDisplayName(e.target.value)}
              placeholder="Your full name"
              className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] text-xs text-[var(--text-primary)] focus:outline-none border border-[var(--border-color)]"
            />
          </div>

          {/* Bio field */}
          <div>
            <label className="text-xs font-bold text-[var(--text-primary)] block mb-1">Bio</label>
            <textarea
              rows={3}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Write something about yourself..."
              className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] text-xs text-[var(--text-primary)] focus:outline-none border border-[var(--border-color)] resize-none"
              maxLength={150}
            />
            <p className="text-[10px] text-[var(--text-secondary)] text-right mt-0.5">{editBio.length} / 150</p>
          </div>

          {/* Website field */}
          <div>
            <label className="text-xs font-bold text-[var(--text-primary)] block mb-1">Website</label>
            <input
              type="text"
              value={editWebsite}
              onChange={(e) => setEditWebsite(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] text-xs text-[var(--text-primary)] focus:outline-none border border-[var(--border-color)]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-bold transition-colors cursor-pointer shadow"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* New Highlight Modal */}
      <Modal isOpen={isNewHighlightOpen} onClose={() => setIsNewHighlightOpen(false)} title="New highlight" size="sm">
        <form onSubmit={handleCreateHighlight} className="p-4 space-y-4">
          {/* Highlight Cover Preview */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--border-color)] bg-neutral-200 dark:bg-neutral-800 shadow-md">
              <Image src={newHighlightCover} alt="Highlight Cover" fill className="object-cover" unoptimized />
            </div>

            <input
              ref={highlightFileRef}
              type="file"
              accept="image/*"
              onChange={handleHighlightCoverUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => highlightFileRef.current?.click()}
              className="text-xs font-semibold text-[#0095f6] hover:text-[#1877f2] cursor-pointer"
            >
              Edit cover photo
            </button>
          </div>

          {/* Cover Presets */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-[var(--text-secondary)]">Or pick a preset cover:</p>
            <div className="grid grid-cols-6 gap-1.5">
              {HIGHLIGHT_COVER_PRESETS.map((coverUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNewHighlightCover(coverUrl)}
                  className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                    newHighlightCover === coverUrl ? 'border-[#0095f6] scale-105' : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <Image src={coverUrl} alt="Preset cover" fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="text-xs font-bold text-[var(--text-primary)] block mb-1">Highlight name</label>
            <input
              type="text"
              required
              autoFocus
              value={newHighlightTitle}
              onChange={(e) => setNewHighlightTitle(e.target.value)}
              placeholder="e.g. Highlights, Travel, Memories"
              maxLength={20}
              className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] text-xs text-[var(--text-primary)] focus:outline-none border border-[var(--border-color)]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!newHighlightTitle.trim()}
              className="w-full py-2.5 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer shadow flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Add Highlight</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit / Delete Highlight Modal */}
      <Modal
        isOpen={isEditHighlightOpen && !!editingHighlight}
        onClose={() => {
          setIsEditHighlightOpen(false);
          setEditingHighlight(null);
        }}
        title="Edit Highlight"
        size="sm"
      >
        {editingHighlight && (
          <form onSubmit={handleUpdateHighlight} className="p-4 space-y-4">
            {/* Cover Preview & Change */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--border-color)] bg-neutral-200 dark:bg-neutral-800 shadow-md">
                <Image src={editHlCover} alt={editHlTitle} fill className="object-cover" unoptimized />
              </div>

              <input
                ref={editHighlightFileRef}
                type="file"
                accept="image/*"
                onChange={handleEditHighlightCoverUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => editHighlightFileRef.current?.click()}
                className="text-xs font-semibold text-[#0095f6] hover:text-[#1877f2] cursor-pointer"
              >
                Change cover photo
              </button>
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-[var(--text-secondary)]">Or pick preset cover:</p>
              <div className="grid grid-cols-6 gap-1.5">
                {HIGHLIGHT_COVER_PRESETS.map((coverUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setEditHlCover(coverUrl)}
                    className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                      editHlCover === coverUrl ? 'border-[#0095f6] scale-105' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <Image src={coverUrl} alt="Preset cover" fill className="object-cover" unoptimized />
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div>
              <label className="text-xs font-bold text-[var(--text-primary)] block mb-1">Highlight name</label>
              <input
                type="text"
                required
                value={editHlTitle}
                onChange={(e) => setEditHlTitle(e.target.value)}
                placeholder="Highlight name"
                maxLength={20}
                className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] text-xs text-[var(--text-primary)] focus:outline-none border border-[var(--border-color)]"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="submit"
                disabled={!editHlTitle.trim()}
                className="w-full py-2.5 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer shadow"
              >
                Save Changes
              </button>

              <button
                type="button"
                onClick={() => handleDeleteHighlight(editingHighlight.id)}
                className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Highlight</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Followers Modal */}
      <Modal
        isOpen={isFollowersModalOpen}
        onClose={() => {
          setIsFollowersModalOpen(false);
          setFollowerSearch('');
        }}
        title={`Followers (${liveFollowersCount})`}
        size="md"
      >
        <div className="p-4 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={followerSearch}
              onChange={(e) => setFollowerSearch(e.target.value)}
              placeholder="Search followers..."
              className="w-full px-3.5 py-2 rounded-2xl bg-[var(--glass-input-bg)] backdrop-blur-md border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
            />
          </div>

          {/* User List */}
          <div className="max-h-80 overflow-y-auto space-y-1 divide-y divide-[var(--glass-border-subtle)] pr-1">
            {allUsers
              .filter((u) => {
                if (!activeUser || !activeUser.followers) return false;
                const matches =
                  activeUser.followers.includes(u.id) ||
                  activeUser.followers.includes(u.username.toLowerCase());
                if (!matches) return false;
                if (!followerSearch.trim()) return true;
                const q = followerSearch.toLowerCase().trim();
                return (
                  u.username.toLowerCase().includes(q) ||
                  u.displayName.toLowerCase().includes(q)
                );
              })
              .map((user) => {
                const following = isFollowing(user.id);
                const isTargetSelf =
                  currentUser &&
                  (currentUser.id === user.id ||
                    currentUser.username.toLowerCase() === user.username.toLowerCase());

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[var(--glass-bg-hover)] transition-colors group"
                  >
                    <Link
                      href={`/profile/${user.username}`}
                      onClick={() => setIsFollowersModalOpen(false)}
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <Avatar
                        src={user.avatarUrl}
                        alt={user.displayName}
                        size="md"
                        isVerified={user.isVerified}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-blue)] transition-colors">
                          {user.username}
                        </p>
                        <p className="text-[11px] text-[var(--text-secondary)] truncate">
                          {user.displayName}
                        </p>
                      </div>
                    </Link>

                    {!isTargetSelf && currentUser && (
                      <button
                        type="button"
                        onClick={() => toggleFollow(user.id)}
                        className={`text-xs font-bold cursor-pointer shrink-0 ml-3 px-3.5 py-1.5 rounded-xl transition-all active:scale-95 ${
                          following
                            ? 'bg-[var(--glass-bg-hover)] text-[var(--text-primary)] border border-[var(--glass-border)] hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30'
                            : 'bg-[var(--accent-blue)] text-white hover:bg-[var(--accent-blue-hover)] shadow-xs'
                        }`}
                      >
                        {following ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                );
              })}

            {allUsers.filter((u) => {
              if (!activeUser || !activeUser.followers) return false;
              return (
                activeUser.followers.includes(u.id) ||
                activeUser.followers.includes(u.username.toLowerCase())
              );
            }).length === 0 && (
              <div className="text-center py-8 space-y-1">
                <p className="text-xs font-bold text-[var(--text-primary)]">No followers yet</p>
                <p className="text-[11px] text-[var(--text-secondary)]">When people follow this profile, you&apos;ll see them here.</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Following Modal */}
      <Modal
        isOpen={isFollowingModalOpen}
        onClose={() => {
          setIsFollowingModalOpen(false);
          setFollowingSearch('');
        }}
        title={`Following (${liveFollowingCount})`}
        size="md"
      >
        <div className="p-4 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={followingSearch}
              onChange={(e) => setFollowingSearch(e.target.value)}
              placeholder="Search following..."
              className="w-full px-3.5 py-2 rounded-2xl bg-[var(--glass-input-bg)] backdrop-blur-md border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
            />
          </div>

          {/* User List */}
          <div className="max-h-80 overflow-y-auto space-y-1 divide-y divide-[var(--glass-border-subtle)] pr-1">
            {allUsers
              .filter((u) => {
                if (!activeUser || !activeUser.following) return false;
                // Never show self in following list
                if (u.id === activeUser.id || u.username.toLowerCase() === activeUser.username.toLowerCase()) {
                  return false;
                }
                const matches =
                  activeUser.following.includes(u.id) ||
                  activeUser.following.includes(u.username.toLowerCase());
                if (!matches) return false;
                if (!followingSearch.trim()) return true;
                const q = followingSearch.toLowerCase().trim();
                return (
                  u.username.toLowerCase().includes(q) ||
                  u.displayName.toLowerCase().includes(q)
                );
              })
              .map((user) => {
                const following = isFollowing(user.id);
                const isTargetSelf =
                  currentUser &&
                  (currentUser.id === user.id ||
                    currentUser.username.toLowerCase() === user.username.toLowerCase());

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[var(--glass-bg-hover)] transition-colors group"
                  >
                    <Link
                      href={`/profile/${user.username}`}
                      onClick={() => setIsFollowingModalOpen(false)}
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <Avatar
                        src={user.avatarUrl}
                        alt={user.displayName}
                        size="md"
                        isVerified={user.isVerified}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-blue)] transition-colors">
                          {user.username}
                        </p>
                        <p className="text-[11px] text-[var(--text-secondary)] truncate">
                          {user.displayName}
                        </p>
                      </div>
                    </Link>

                    {!isTargetSelf && currentUser && (
                      <button
                        type="button"
                        onClick={() => toggleFollow(user.id)}
                        className={`text-xs font-bold cursor-pointer shrink-0 ml-3 px-3.5 py-1.5 rounded-xl transition-all active:scale-95 ${
                          following
                            ? 'bg-[var(--glass-bg-hover)] text-[var(--text-primary)] border border-[var(--glass-border)] hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30'
                            : 'bg-[var(--accent-blue)] text-white hover:bg-[var(--accent-blue-hover)] shadow-xs'
                        }`}
                      >
                        {following ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                );
              })}

            {allUsers.filter((u) => {
              if (!activeUser || !activeUser.following) return false;
              if (u.id === activeUser.id || u.username.toLowerCase() === activeUser.username.toLowerCase()) return false;
              return (
                activeUser.following.includes(u.id) ||
                activeUser.following.includes(u.username.toLowerCase())
              );
            }).length === 0 && (
              <div className="text-center py-8 space-y-1">
                <p className="text-xs font-bold text-[var(--text-primary)]">Not following anyone yet</p>
                <p className="text-[11px] text-[var(--text-secondary)]">Profiles followed will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Post Detail Drawer / Modal */}
      {selectedPost && (
        <CommentsDrawer
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </AppShell>
  );
}

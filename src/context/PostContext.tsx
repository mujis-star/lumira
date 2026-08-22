'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Post, Comment, PostMedia, ReelItem } from '@/lib/types';
import { SEED_POSTS, SEED_COMMENTS, SEED_REELS } from '@/lib/seedData';
import { useAuth } from './AuthContext';
import { sounds, triggerConfetti, extractTagsAndMentions } from '@/lib/utils';

interface CreatePostInput {
  media: PostMedia[];
  caption: string;
  location?: string;
  audioTrack?: { title: string; artist: string };
  isPrivate?: boolean;
  allowComments?: boolean;
}

interface CreateReelInput {
  videoUrl: string;
  posterUrl?: string;
  caption: string;
  audioTrack?: { title: string; artist: string };
  tags?: string[];
}

interface PostContextType {
  posts: Post[];
  reels: ReelItem[];
  comments: Record<string, Comment[]>;
  feedTab: 'foryou' | 'following';
  setFeedTab: (tab: 'foryou' | 'following') => void;
  filteredPosts: Post[];
  createPost: (input: CreatePostInput) => Promise<Post>;
  createReel: (input: CreateReelInput) => Promise<ReelItem>;
  deletePost: (postId: string) => void;
  toggleLikePost: (postId: string) => void;
  isPostLiked: (postId: string) => boolean;
  toggleBookmark: (postId: string) => void;
  toggleBookmarkPost: (postId: string) => void;
  isPostBookmarked: (postId: string) => boolean;
  toggleRepost: (postId: string, note?: string) => void;
  isPostReposted: (postId: string) => boolean;
  toggleLikeReel: (reelId: string) => void;
  toggleBookmarkReel: (reelId: string) => void;
  addComment: (postId: string, content: string, replyToId?: string) => void;
  toggleLikeComment: (postId: string, commentId: string) => void;
  getPostComments: (postId: string) => Comment[];
  getPostById: (postId: string) => Post | undefined;
  getUserPosts: (userId: string) => Post[];
  getUserReels: (userId: string) => ReelItem[];
  getBookmarkedPosts: (userId: string) => Post[];
  getTaggedPosts: (username: string) => Post[];
  searchPosts: (query: string) => Post[];
}

const PostContext = createContext<PostContextType | undefined>(undefined);

const POSTS_STORAGE_KEY = 'lumira-v2-posts';
const REELS_STORAGE_KEY = 'lumira-v2-reels';
const COMMENTS_STORAGE_KEY = 'lumira-v2-comments';

export function PostProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, updateProfile } = useAuth();
  
  // Initialize with seed data for 100% server-client hydration consistency
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS);
  const [reels, setReels] = useState<ReelItem[]>(SEED_REELS);
  const [comments, setComments] = useState<Record<string, Comment[]>>(SEED_COMMENTS);
  const [feedTab, setFeedTab] = useState<'foryou' | 'following'>('foryou');

  // Hydrate from localStorage asynchronously after initial hydration
  useEffect(() => {
    try {
      const savedPosts = localStorage.getItem(POSTS_STORAGE_KEY);
      const savedReels = localStorage.getItem(REELS_STORAGE_KEY);
      const savedComments = localStorage.getItem(COMMENTS_STORAGE_KEY);
      if (savedPosts || savedReels || savedComments) {
        setTimeout(() => {
          if (savedPosts) {
            try { setPosts(JSON.parse(savedPosts)); } catch {}
          }
          if (savedReels) {
            try { setReels(JSON.parse(savedReels)); } catch {}
          }
          if (savedComments) {
            try { setComments(JSON.parse(savedComments)); } catch {}
          }
        }, 0);
      }
    } catch {
      // fallback
    }
  }, []);

  const persistPosts = (updated: Post[]) => {
    setPosts(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage limit for posts:', err);
      }
    }
  };

  const persistReels = (updated: ReelItem[]) => {
    setReels(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(REELS_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage limit for reels:', err);
      }
    }
  };

  const isPostLiked = useCallback((postId: string): boolean => {
    if (!currentUser) return false;
    const post = posts.find((p) => p.id === postId);
    return post ? post.likes.includes(currentUser.id) : false;
  }, [currentUser, posts]);

  const toggleLikePost = useCallback((postId: string) => {
    if (!currentUser) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const alreadyLiked = post.likes.includes(currentUser.id);
    let updatedLikes: string[];
    let newLikesCount: number;

    if (alreadyLiked) {
      updatedLikes = post.likes.filter((id) => id !== currentUser.id);
      newLikesCount = Math.max(0, post.likesCount - 1);
    } else {
      updatedLikes = [...post.likes, currentUser.id];
      newLikesCount = post.likesCount + 1;
      sounds.playHeartBurst();
      triggerConfetti(0.5, 0.5);
    }

    const updatedPosts = posts.map((p) =>
      p.id === postId
        ? {
            ...p,
            likes: updatedLikes,
            likesCount: newLikesCount,
          }
        : p
    );

    persistPosts(updatedPosts);

    // Broadcast like notification to server
    if (!alreadyLiked && post.authorId !== currentUser.id) {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'like_post',
          payload: {
            postId: post.id,
            postAuthorId: post.authorId,
            actor: currentUser,
            postThumbnail: post.media[0]?.url,
          },
        }),
      }).catch(() => {});
    }
  }, [currentUser, posts]);

  const isPostBookmarked = useCallback((postId: string): boolean => {
    if (!currentUser) return false;
    const post = posts.find((p) => p.id === postId);
    return post ? post.bookmarkedBy.includes(currentUser.id) : false;
  }, [currentUser, posts]);

  const toggleBookmark = useCallback((postId: string) => {
    if (!currentUser) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const alreadySaved = post.bookmarkedBy.includes(currentUser.id);
    let updatedBookmarkedBy: string[];
    let newBookmarksCount: number;

    if (alreadySaved) {
      updatedBookmarkedBy = post.bookmarkedBy.filter((id) => id !== currentUser.id);
      newBookmarksCount = Math.max(0, post.bookmarksCount - 1);
    } else {
      updatedBookmarkedBy = [...post.bookmarkedBy, currentUser.id];
      newBookmarksCount = post.bookmarksCount + 1;
      sounds.playPop();
    }

    const updatedPosts = posts.map((p) =>
      p.id === postId
        ? {
            ...p,
            bookmarkedBy: updatedBookmarkedBy,
            bookmarksCount: newBookmarksCount,
          }
        : p
    );

    persistPosts(updatedPosts);
  }, [currentUser, posts]);

  const isPostReposted = useCallback((postId: string): boolean => {
    if (!currentUser) return false;
    const post = posts.find((p) => p.id === postId || p.originalPostId === postId);
    if (!post) return false;
    const target = post.originalPostId ? posts.find((p) => p.id === post.originalPostId) || post : post;
    return !!target.repostedBy?.includes(currentUser.id);
  }, [currentUser, posts]);

  const toggleRepost = useCallback((postId: string, note?: string) => {
    if (!currentUser) return;
    const originalPost = posts.find((p) => p.id === postId || p.originalPostId === postId);
    if (!originalPost) return;

    const basePostId = originalPost.originalPostId || originalPost.id;
    const basePost = posts.find((p) => p.id === basePostId) || originalPost;
    const isAlreadyReposted = (basePost.repostedBy || []).includes(currentUser.id);

    if (isAlreadyReposted) {
      // Remove repost
      const updated = posts
        .filter((p) => !(p.isRepost && p.originalPostId === basePost.id && p.authorId === currentUser.id))
        .map((p) => {
          if (p.id === basePost.id) {
            const updatedRepostedBy = (p.repostedBy || []).filter((id) => id !== currentUser.id);
            return {
              ...p,
              repostedBy: updatedRepostedBy,
              repostsCount: Math.max(0, (p.repostsCount || 1) - 1),
            };
          }
          return p;
        });

      persistPosts(updated);
      sounds.playPop();
    } else {
      // Create repost
      const updatedRepostedBy = [...(basePost.repostedBy || []), currentUser.id];
      const updatedBasePost: Post = {
        ...basePost,
        repostedBy: updatedRepostedBy,
        repostsCount: (basePost.repostsCount || 0) + 1,
      };

      const repostPost: Post = {
        id: `repost-${Date.now()}`,
        authorId: currentUser.id,
        author: {
          id: currentUser.id,
          username: currentUser.username,
          displayName: currentUser.displayName,
          avatarUrl: currentUser.avatarUrl,
          isVerified: currentUser.isVerified,
        },
        repostAuthor: {
          id: currentUser.id,
          username: currentUser.username,
          displayName: currentUser.displayName,
          avatarUrl: currentUser.avatarUrl,
        },
        isRepost: true,
        originalPostId: basePost.id,
        repostNote: note?.trim() || undefined,
        media: basePost.media,
        caption: basePost.caption,
        tags: basePost.tags,
        mentions: basePost.mentions,
        location: basePost.location,
        audioTrack: basePost.audioTrack,
        likesCount: 0,
        likes: [],
        commentsCount: 0,
        sharesCount: 0,
        bookmarksCount: 0,
        bookmarkedBy: [],
        repostsCount: 0,
        repostedBy: [],
        allowComments: true,
        isPrivate: false,
        createdAt: new Date().toISOString(),
      };

      const updated = [
        repostPost,
        ...posts.map((p) => (p.id === basePost.id ? updatedBasePost : p)),
      ];

      persistPosts(updated);
      sounds.playSend();
      triggerConfetti(0.5, 0.5);
    }
  }, [currentUser, posts]);

  const createPost = async (input: CreatePostInput): Promise<Post> => {
    if (!currentUser) throw new Error('Must be logged in to create a post');

    const { tags, mentions } = extractTagsAndMentions(input.caption);

    const newPost: Post = {
      id: `post-${Date.now()}`,
      authorId: currentUser.id,
      author: {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatarUrl: currentUser.avatarUrl,
        isVerified: currentUser.isVerified,
      },
      media: input.media,
      caption: input.caption,
      tags,
      mentions,
      location: input.location,
      audioTrack: input.audioTrack,
      likesCount: 0,
      likes: [],
      commentsCount: 0,
      sharesCount: 0,
      bookmarksCount: 0,
      bookmarkedBy: [],
      repostsCount: 0,
      repostedBy: [],
      allowComments: input.allowComments ?? true,
      isPrivate: input.isPrivate ?? false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newPost, ...posts];
    persistPosts(updated);

    // If post contains video, also sync as a Reel
    const videoMedia = input.media.find((m) => m.type === 'video' || m.url.endsWith('.mp4'));
    if (videoMedia) {
      const newReel: ReelItem = {
        id: `reel-${Date.now()}`,
        authorId: currentUser.id,
        author: newPost.author,
        videoUrl: videoMedia.url,
        posterUrl: videoMedia.url,
        caption: input.caption,
        tags,
        audioTrack: input.audioTrack || {
          title: 'Original Audio',
          artist: currentUser.username,
        },
        likesCount: 0,
        likes: [],
        commentsCount: 0,
        sharesCount: 0,
        bookmarkedBy: [],
        createdAt: new Date().toISOString(),
      };
      persistReels([newReel, ...reels]);
    }

    // Increment user's post count
    updateProfile({ postsCount: currentUser.postsCount + 1 });

    sounds.playSend();
    triggerConfetti();

    return newPost;
  };

  const createReel = async (input: CreateReelInput): Promise<ReelItem> => {
    if (!currentUser) throw new Error('Must be logged in to create a reel');

    const { tags } = extractTagsAndMentions(input.caption);

    const newReel: ReelItem = {
      id: `reel-${Date.now()}`,
      authorId: currentUser.id,
      author: {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatarUrl: currentUser.avatarUrl,
        isVerified: currentUser.isVerified,
      },
      videoUrl: input.videoUrl,
      posterUrl: input.posterUrl || input.videoUrl,
      caption: input.caption,
      tags: input.tags || tags,
      audioTrack: input.audioTrack || {
        title: 'Original Audio',
        artist: currentUser.username,
      },
      likesCount: 0,
      likes: [],
      commentsCount: 0,
      sharesCount: 0,
      bookmarkedBy: [],
      createdAt: new Date().toISOString(),
    };

    const updatedReels = [newReel, ...reels];
    persistReels(updatedReels);

    // Also register as a video post in feed
    const newPost: Post = {
      id: `post-${Date.now()}`,
      authorId: currentUser.id,
      author: newReel.author,
      media: [
        {
          id: `m-${Date.now()}`,
          url: input.videoUrl,
          type: 'video',
          aspectRatio: 'portrait',
        },
      ],
      caption: input.caption,
      tags,
      mentions: [],
      audioTrack: newReel.audioTrack,
      likesCount: 0,
      likes: [],
      commentsCount: 0,
      sharesCount: 0,
      bookmarksCount: 0,
      bookmarkedBy: [],
      repostsCount: 0,
      repostedBy: [],
      allowComments: true,
      isPrivate: false,
      createdAt: new Date().toISOString(),
    };
    persistPosts([newPost, ...posts]);

    updateProfile({ postsCount: currentUser.postsCount + 1 });
    sounds.playSend();
    triggerConfetti();

    return newReel;
  };

  const deletePost = useCallback((postId: string) => {
    const updated = posts.filter((p) => p.id !== postId);
    persistPosts(updated);
  }, [posts]);

  const toggleLikeReel = useCallback((reelId: string) => {
    if (!currentUser) return;
    const updated = reels.map((r) => {
      if (r.id === reelId) {
        const isLiked = r.likes.includes(currentUser.id);
        const updatedLikes = isLiked
          ? r.likes.filter((id) => id !== currentUser.id)
          : [...r.likes, currentUser.id];
        return {
          ...r,
          likes: updatedLikes,
          likesCount: isLiked ? Math.max(0, r.likesCount - 1) : r.likesCount + 1,
        };
      }
      return r;
    });
    persistReels(updated);
  }, [currentUser, reels]);

  const toggleBookmarkReel = useCallback((reelId: string) => {
    if (!currentUser) return;
    const updated = reels.map((r) => {
      if (r.id === reelId) {
        const isSaved = r.bookmarkedBy.includes(currentUser.id);
        const updatedBookmarked = isSaved
          ? r.bookmarkedBy.filter((id) => id !== currentUser.id)
          : [...r.bookmarkedBy, currentUser.id];
        return {
          ...r,
          bookmarkedBy: updatedBookmarked,
        };
      }
      return r;
    });
    persistReels(updated);
  }, [currentUser, reels]);

  const addComment = useCallback((postId: string, content: string, replyToId?: string) => {
    if (!currentUser || !content.trim()) return;

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      postId,
      userId: currentUser.id,
      user: {
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatarUrl: currentUser.avatarUrl,
        isVerified: currentUser.isVerified,
      },
      content: content.trim(),
      createdAt: new Date().toISOString(),
      likesCount: 0,
      likes: [],
      replyToId,
    };

    setComments((prevComments) => {
      const currentPostComments = prevComments[postId] || [];
      let updatedPostComments: Comment[];

      if (replyToId) {
        updatedPostComments = currentPostComments.map((c) => {
          if (c.id === replyToId) {
            return {
              ...c,
              replies: [...(c.replies || []), newComment],
            };
          }
          return c;
        });
      } else {
        updatedPostComments = [...currentPostComments, newComment];
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify({
            ...prevComments,
            [postId]: updatedPostComments,
          }));
        } catch (err) {
          console.warn('LocalStorage limit for comments:', err);
        }
      }

      return {
        ...prevComments,
        [postId]: updatedPostComments,
      };
    });

    // Update post comments count
    setPosts((prevPosts) => {
      const updatedPosts = prevPosts.map((p) =>
        p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
      );
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updatedPosts));
        } catch (err) {
          console.warn('LocalStorage limit for posts:', err);
        }
      }
      return updatedPosts;
    });

    sounds.playPop();

    // Broadcast comment notification to server
    const targetPost = posts.find((p) => p.id === postId);
    if (targetPost && targetPost.authorId !== currentUser.id) {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'comment_post',
          payload: {
            postId,
            postAuthorId: targetPost.authorId,
            actor: currentUser,
            commentText: content.trim(),
            postThumbnail: targetPost.media[0]?.url,
          },
        }),
      }).catch(() => {});
    }
  }, [currentUser, posts]);

  const toggleLikeComment = useCallback((postId: string, commentId: string) => {
    if (!currentUser) return;

    setComments((prevComments) => {
      const postComments = prevComments[postId] || [];
      const updated = postComments.map((c) => {
        if (c.id === commentId) {
          const isLiked = c.likes.includes(currentUser.id);
          const updatedLikes = isLiked
            ? c.likes.filter((id) => id !== currentUser.id)
            : [...c.likes, currentUser.id];
          return {
            ...c,
            likes: updatedLikes,
            likesCount: isLiked ? Math.max(0, c.likesCount - 1) : c.likesCount + 1,
          };
        }
        return c;
      });

      const updatedAll = {
        ...prevComments,
        [postId]: updated,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(updatedAll));
      }
      return updatedAll;
    });
  }, [currentUser]);

  const getPostComments = useCallback((postId: string) => {
    return comments[postId] || [];
  }, [comments]);

  const getPostById = useCallback((postId: string) => {
    return posts.find((p) => p.id === postId);
  }, [posts]);

  const getUserPosts = useCallback((userId: string) => {
    return posts.filter((p) => p.authorId === userId);
  }, [posts]);

  const getUserReels = useCallback((userId: string) => {
    const userSpecificReels = reels.filter((r) => r.authorId === userId);
    // Also include video posts as reels if not already in userSpecificReels
    const userVideoPosts = posts
      .filter((p) => p.authorId === userId && p.media.some((m) => m.type === 'video' || m.url.endsWith('.mp4')))
      .map((p) => {
        const vid = p.media.find((m) => m.type === 'video' || m.url.endsWith('.mp4'))!;
        return {
          id: `reel-${p.id}`,
          authorId: p.authorId,
          author: p.author,
          videoUrl: vid.url,
          posterUrl: vid.url,
          caption: p.caption,
          tags: p.tags,
          audioTrack: p.audioTrack || { title: 'Original Audio', artist: p.author.username },
          likesCount: p.likesCount,
          likes: p.likes,
          commentsCount: p.commentsCount,
          sharesCount: p.sharesCount,
          bookmarkedBy: p.bookmarkedBy,
          createdAt: p.createdAt,
        };
      });

    // Merge without duplicates by videoUrl
    const seenUrls = new Set<string>();
    const result: ReelItem[] = [];
    for (const r of [...userSpecificReels, ...userVideoPosts]) {
      if (!seenUrls.has(r.videoUrl)) {
        seenUrls.add(r.videoUrl);
        result.push(r);
      }
    }
    return result;
  }, [reels, posts]);

  const getBookmarkedPosts = useCallback((userId: string) => {
    return posts.filter((p) => p.bookmarkedBy.includes(userId));
  }, [posts]);

  const getTaggedPosts = useCallback((username: string) => {
    return posts.filter((p) => p.mentions.includes(username));
  }, [posts]);

  const searchPosts = useCallback((query: string) => {
    const q = query.toLowerCase().trim();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        p.caption.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.author.username.toLowerCase().includes(q) ||
        p.author.displayName.toLowerCase().includes(q)
    );
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (feedTab === 'following') {
      if (!currentUser) return [];
      return posts.filter((p) => currentUser.following.includes(p.authorId) || p.authorId === currentUser.id);
    }
    return posts;
  }, [posts, feedTab, currentUser]);

  return (
    <PostContext.Provider
      value={{
        posts,
        reels,
        comments,
        feedTab,
        setFeedTab,
        filteredPosts,
        createPost,
        createReel,
        deletePost,
        toggleLikePost,
        isPostLiked,
        toggleBookmark,
        toggleBookmarkPost: toggleBookmark,
        isPostBookmarked,
        toggleRepost,
        isPostReposted,
        toggleLikeReel,
        toggleBookmarkReel,
        addComment,
        toggleLikeComment,
        getPostComments,
        getPostById,
        getUserPosts,
        getUserReels,
        getBookmarkedPosts,
        getTaggedPosts,
        searchPosts,
      }}
    >
      {children}
    </PostContext.Provider>
  );
}

export function usePost() {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePost must be used within a PostProvider');
  }
  return context;
}

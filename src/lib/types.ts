export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl: string;
  bannerUrl?: string;
  bio: string;
  website?: string;
  location?: string;
  pronouns?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  role?: 'admin' | 'user';
  isPrivate?: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  sparksCount?: number;
  followers: string[]; // User IDs
  following: string[]; // User IDs
  createdAt: string;
  themePreference?: 'dark' | 'light' | 'midnight';
}

export interface PostMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  aspectRatio: 'square' | 'portrait' | 'wide'; // 1:1, 4:5, 16:9
  filter?: string;
  altText?: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user: {
    username: string;
    displayName: string;
    avatarUrl: string;
    isVerified?: boolean;
  };
  content: string;
  createdAt: string;
  likesCount: number;
  likes: string[]; // User IDs
  replyToId?: string;
  replies?: Comment[];
}

export type MusicGenre =
  | 'trending'
  | 'popular'
  | 'lofi'
  | 'chill'
  | 'pop'
  | 'acoustic'
  | 'cinematic'
  | 'electronic';

export interface MusicTrack {
  id: string;
  provider: 'licensed' | 'demo';
  providerTrackId: string;
  title: string;
  artist: string;
  album?: string;
  coverImage: string;
  duration: number; // in seconds
  genre: MusicGenre | string;
  audioSource: string; // URL or Web Audio synthetic sound generator ID
  previewUrl?: string;
  isLicensed?: boolean;
  licensingInfo?: string;
  usageCount?: number;
  tags?: string[];
  bpm?: number;
}

export interface AttachedMusic {
  trackId: string;
  provider: 'licensed' | 'demo';
  providerTrackId: string;
  title: string;
  artist: string;
  album?: string;
  coverImage: string;
  audioSource: string;
  startTime: number; // in seconds, e.g. 0
  duration: number; // clip duration in seconds, e.g. 15, 30, 60
}

export interface Post {
  id: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    isVerified?: boolean;
  };
  media: PostMedia[];
  caption: string;
  tags: string[]; // Hashtags without '#'
  mentions: string[]; // Usernames without '@'
  location?: string;
  audioTrack?: AttachedMusic | {
    title: string;
    artist: string;
    coverImage?: string;
    audioSource?: string;
    trackId?: string;
  };
  likesCount: number;
  likes: string[]; // User IDs who liked
  commentsCount: number;
  sharesCount: number;
  bookmarksCount: number;
  bookmarkedBy: string[]; // User IDs who saved
  repostsCount?: number;
  repostedBy?: string[]; // User IDs who reposted
  repostAuthor?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  };
  repostNote?: string;
  isRepost?: boolean;
  originalPostId?: string;
  allowComments: boolean;
  isPrivate: boolean;
  createdAt: string;
  pinned?: boolean;
}

export interface ReelItem {
  id: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    isVerified?: boolean;
  };
  videoUrl: string;
  posterUrl: string;
  caption: string;
  tags: string[];
  audioTrack: AttachedMusic | {
    title: string;
    artist: string;
    coverImage?: string;
    audioSource?: string;
    trackId?: string;
  };
  likesCount: number;
  likes: string[];
  commentsCount: number;
  sharesCount: number;
  bookmarkedBy: string[];
  createdAt: string;
}

export interface StoryItem {
  id: string;
  mediaUrl: string;
  type: 'image' | 'video';
  caption?: string;
  link?: string;
  audioTrack?: AttachedMusic;
  stickers?: Array<{
    type: 'location' | 'mention' | 'tag' | 'poll' | 'music';
    text: string;
    x: number;
    y: number;
    musicData?: AttachedMusic;
  }>;
  createdAt: string;
  expiresAt: string; // 24h from creation
  viewsCount: number;
  viewers: string[]; // User IDs
}

export interface Story {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    isVerified?: boolean;
  };
  hasUnseen: boolean;
  lastUpdated: string;
  items: StoryItem[];
}

export interface MessageReaction {
  userId: string;
  emoji: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  isAudioVoiceNote?: boolean;
  audioDuration?: number; // seconds
  reactions?: MessageReaction[];
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  isGroup?: boolean;
  groupName?: string;
  groupAvatarUrl?: string;
  adminIds?: string[];
  participantIds: string[];
  participants: UserProfile[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
  isTyping?: boolean;
}

export type NotificationType =
  | 'like_post'
  | 'like_comment'
  | 'comment'
  | 'follow'
  | 'follow_request'
  | 'mention'
  | 'story_reply';

export interface AppNotification {
  id: string;
  userId: string; // Receiver
  actorId: string; // Triggered by
  actor: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    isVerified?: boolean;
  };
  type: NotificationType;
  postId?: string;
  postThumbnail?: string;
  commentId?: string;
  commentText?: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
}

export interface BookmarkCollection {
  id: string;
  name: string;
  coverUrl?: string;
  postIds: string[];
  isPrivate: boolean;
  createdAt: string;
}

export interface UserNote {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    isVerified?: boolean;
  };
  text?: string;
  song?: {
    title: string;
    artist: string;
    coverUrl?: string;
    audioUrl?: string;
  };
  createdAt: string;
  expiresAt: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  cssFilter: string;
  thumbnailClass: string;
}

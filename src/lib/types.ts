export type UserMode = 'demo' | 'guest' | 'authenticated';

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
  userMode?: UserMode;
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

export type InstantVisibility = 'Everyone' | 'Friends' | 'Close Friends' | 'Selected Friends';

export interface InstantOverlayText {
  id: string;
  text: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  shadow?: boolean;
  outline?: boolean;
  opacity?: number;
  letterSpacing?: number;
  rotation?: number;
  scale?: number;
}

export type InstantStickerType = 'emoji' | 'mention' | 'location' | 'hashtag' | 'date' | 'time' | 'music';

export interface InstantOverlaySticker {
  id: string;
  type: InstantStickerType;
  content: string; // emoji character or text (e.g. '@elena.vance', '#art', 'Tokyo', 'AUG 29', '12:30 PM')
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  scale?: number;
  rotation?: number;
  extraData?: {
    userId?: string;
    username?: string;
    locationName?: string;
    tag?: string;
    dateStr?: string;
    timeStr?: string;
    musicTrack?: AttachedMusic;
  };
}

export interface InstantAdjustments {
  brightness: number; // 0 to 200, default 100
  contrast: number; // 0 to 200, default 100
  exposure: number; // -100 to 100, default 0
  saturation: number; // 0 to 200, default 100
  temperature: number; // -100 to 100, default 0
  tint: number; // -100 to 100, default 0
  highlights: number; // -100 to 100, default 0
  shadows: number; // -100 to 100, default 0
  sharpness: number; // 0 to 100, default 0
  clarity: number; // 0 to 100, default 0
  fade: number; // 0 to 100, default 0
  vignette: number; // 0 to 100, default 0
  grain: number; // 0 to 100, default 0
  blur: number; // 0 to 20, default 0
  zoom: number; // 1 to 3, default 1
  panX: number; // -100 to 100, default 0
  panY: number; // -100 to 100, default 0
  rotate: number; // 0, 90, 180, 270 or continuous
  flipH: boolean;
  flipV: boolean;
  straighten: number; // -45 to 45, default 0
  aspectRatio: 'free' | '1:1' | '4:5' | '9:16' | '16:9';
}

export interface InstantReaction {
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface InstantItem {
  id: string;
  creatorId: string;
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    isVerified?: boolean;
  };
  mediaUrl: string;
  mediaType: 'image' | 'video';
  filterId?: string;
  filterIntensity?: number; // 0 to 100
  adjustments?: Partial<InstantAdjustments>;
  textOverlays?: InstantOverlayText[];
  stickers?: InstantOverlaySticker[];
  drawingDataUrl?: string;
  attachedMusic?: AttachedMusic;
  musicVolume?: number; // 0 to 1
  videoVolume?: number; // 0 to 1
  videoTrim?: { start: number; end: number };
  videoSpeed?: number;
  caption?: string;
  createdAt: string;
  expiresAt: string; // 24 hours from creation
  visibility: InstantVisibility;
  allowedViewerIds?: string[];
  reactions: InstantReaction[];
  viewers: string[]; // User IDs
  viewsCount: number;
}

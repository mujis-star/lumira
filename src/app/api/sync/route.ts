import { NextResponse } from 'next/server';
import { SEED_USERS, SEED_CONVERSATIONS, SEED_MESSAGES, SEED_POSTS, SEED_NOTIFICATIONS } from '@/lib/seedData';
import { UserProfile, Conversation, Message, Post, AppNotification } from '@/lib/types';

// In-memory persistent server store for real-time synchronization
const usersMap = new Map<string, UserProfile>();
const conversationsMap = new Map<string, Conversation>();
const messagesMap = new Map<string, Message[]>();
let postsList: Post[] = [...SEED_POSTS];
let notificationsList: AppNotification[] = [...SEED_NOTIFICATIONS];

// Initialize with seed data
SEED_USERS.forEach((u) => {
  usersMap.set(u.id, u);
  usersMap.set(u.username.toLowerCase(), u);
});

SEED_CONVERSATIONS.forEach((c) => {
  conversationsMap.set(c.id, c);
});

Object.entries(SEED_MESSAGES).forEach(([convId, msgs]) => {
  messagesMap.set(convId, [...msgs]);
});

function getUniqueUsers(): UserProfile[] {
  const list: UserProfile[] = [];
  const seen = new Set<string>();
  for (const user of usersMap.values()) {
    if (!seen.has(user.id)) {
      seen.add(user.id);
      list.push(user);
    }
  }
  return list;
}

function getUniqueConversations(): Conversation[] {
  const list: Conversation[] = [];
  const seen = new Set<string>();
  for (const conv of conversationsMap.values()) {
    if (!seen.has(conv.id)) {
      seen.add(conv.id);
      list.push(conv);
    }
  }
  return list;
}

function getMessagesRecord(): Record<string, Message[]> {
  const rec: Record<string, Message[]> = {};
  for (const [id, msgs] of messagesMap.entries()) {
    rec[id] = msgs;
  }
  return rec;
}

export async function GET() {
  return NextResponse.json({
    users: getUniqueUsers(),
    conversations: getUniqueConversations(),
    messages: getMessagesRecord(),
    posts: postsList,
    notifications: notificationsList,
    timestamp: Date.now(),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body || {};

    if (action === 'register_user' && payload) {
      const u: UserProfile = payload;
      usersMap.set(u.id, u);
      usersMap.set(u.username.toLowerCase(), u);
    }

    if (action === 'send_message' && payload) {
      const { convId, message, receiverId, sender } = payload;
      if (convId && message) {
        const existing = messagesMap.get(convId) || [];
        messagesMap.set(convId, [...existing, message]);

        // Update or create conversation
        let conv = conversationsMap.get(convId);
        if (!conv && receiverId && sender) {
          const receiver = usersMap.get(receiverId);
          conv = {
            id: convId,
            isGroup: false,
            participantIds: [sender.id, receiverId],
            participants: [sender, receiver || sender],
            unreadCount: 0,
            updatedAt: new Date().toISOString(),
          };
        }
        if (conv) {
          conv.lastMessage = message;
          conv.updatedAt = new Date().toISOString();
          conversationsMap.set(convId, conv);
        }
      }
    }

    if (action === 'toggle_follow' && payload) {
      const { currentUserId, targetUserId } = payload;
      const cur = usersMap.get(currentUserId);
      const tar = usersMap.get(targetUserId);

      if (cur && tar) {
        const wasFollowing = cur.following.includes(targetUserId);
        cur.following = wasFollowing
          ? cur.following.filter((id) => id !== targetUserId)
          : [...cur.following, targetUserId];
        cur.followingCount = cur.following.length;

        tar.followers = wasFollowing
          ? tar.followers.filter((id) => id !== currentUserId)
          : [...tar.followers, currentUserId];
        tar.followersCount = tar.followers.length;

        usersMap.set(cur.id, cur);
        usersMap.set(cur.username.toLowerCase(), cur);
        usersMap.set(tar.id, tar);
        usersMap.set(tar.username.toLowerCase(), tar);

        // If newly followed, create a real-time Notification for the target user
        if (!wasFollowing) {
          const followNotif: AppNotification = {
            id: 'notif-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            userId: tar.id,
            type: 'follow',
            actorId: cur.id,
            actor: {
              id: cur.id,
              username: cur.username,
              displayName: cur.displayName,
              avatarUrl: cur.avatarUrl,
              isVerified: cur.isVerified,
            },
            createdAt: new Date().toISOString(),
            isRead: false,
          };
          notificationsList = [followNotif, ...notificationsList];
        }
      }
    }

    if (action === 'like_post' && payload) {
      const { postId, postAuthorId, actor, postThumbnail } = payload;
      if (postAuthorId && actor && postAuthorId !== actor.id) {
        const likeNotif: AppNotification = {
          id: 'notif-like-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          userId: postAuthorId,
          type: 'like_post',
          actorId: actor.id,
          actor: {
            id: actor.id,
            username: actor.username,
            displayName: actor.displayName,
            avatarUrl: actor.avatarUrl,
            isVerified: actor.isVerified,
          },
          postId,
          postThumbnail,
          createdAt: new Date().toISOString(),
          isRead: false,
        };
        notificationsList = [likeNotif, ...notificationsList];
      }
    }

    if (action === 'comment_post' && payload) {
      const { postId, postAuthorId, actor, commentText, postThumbnail } = payload;
      if (postAuthorId && actor && postAuthorId !== actor.id) {
        const commentNotif: AppNotification = {
          id: 'notif-comm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          userId: postAuthorId,
          type: 'comment',
          actorId: actor.id,
          actor: {
            id: actor.id,
            username: actor.username,
            displayName: actor.displayName,
            avatarUrl: actor.avatarUrl,
            isVerified: actor.isVerified,
          },
          postId,
          commentText,
          postThumbnail,
          createdAt: new Date().toISOString(),
          isRead: false,
        };
        notificationsList = [commentNotif, ...notificationsList];
      }
    }

    if (action === 'create_post' && payload) {
      const p: Post = payload;
      postsList = [p, ...postsList.filter((existing) => existing.id !== p.id)];
    }

    return NextResponse.json({
      success: true,
      users: getUniqueUsers(),
      conversations: getUniqueConversations(),
      messages: getMessagesRecord(),
      posts: postsList,
      notifications: notificationsList,
      timestamp: Date.now(),
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

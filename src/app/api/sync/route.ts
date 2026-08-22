import { NextResponse } from 'next/server';
import { SEED_USERS, SEED_CONVERSATIONS, SEED_MESSAGES, SEED_POSTS } from '@/lib/seedData';
import { UserProfile, Conversation, Message, Post } from '@/lib/types';

// In-memory persistent server store for real-time synchronization
const usersMap = new Map<string, UserProfile>();
const conversationsMap = new Map<string, Conversation>();
const messagesMap = new Map<string, Message[]>();
let postsList: Post[] = [...SEED_POSTS];

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
        const isFollowing = cur.following.includes(targetUserId);
        cur.following = isFollowing
          ? cur.following.filter((id) => id !== targetUserId)
          : [...cur.following, targetUserId];
        cur.followingCount = cur.following.length;

        tar.followers = isFollowing
          ? tar.followers.filter((id) => id !== currentUserId)
          : [...tar.followers, currentUserId];
        tar.followersCount = tar.followers.length;

        usersMap.set(cur.id, cur);
        usersMap.set(cur.username.toLowerCase(), cur);
        usersMap.set(tar.id, tar);
        usersMap.set(tar.username.toLowerCase(), tar);
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
      timestamp: Date.now(),
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

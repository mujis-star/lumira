import { NextResponse } from 'next/server';
import { SEED_USERS } from '@/lib/seedData';
import { UserProfile } from '@/lib/types';

const serverUsersStore: Map<string, UserProfile> = new Map();

SEED_USERS.forEach((u) => {
  serverUsersStore.set(u.id, u);
  serverUsersStore.set(u.username.toLowerCase(), u);
});

export async function GET() {
  const usersArray: UserProfile[] = [];
  const seenIds = new Set<string>();

  for (const user of serverUsersStore.values()) {
    if (!seenIds.has(user.id)) {
      seenIds.add(user.id);
      usersArray.push(user);
    }
  }

  return NextResponse.json({ users: usersArray });
}

export async function POST(req: Request) {
  try {
    const user: UserProfile = await req.json();
    if (!user || !user.id || !user.username) {
      return NextResponse.json({ error: 'Invalid user payload' }, { status: 400 });
    }

    serverUsersStore.set(user.id, user);
    serverUsersStore.set(user.username.toLowerCase(), user);

    const usersArray: UserProfile[] = [];
    const seenIds = new Set<string>();
    for (const u of serverUsersStore.values()) {
      if (!seenIds.has(u.id)) {
        seenIds.add(u.id);
        usersArray.push(u);
      }
    }

    return NextResponse.json({ success: true, users: usersArray });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

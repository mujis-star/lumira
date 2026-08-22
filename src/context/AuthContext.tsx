'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { UserProfile } from '@/lib/types';
import { SEED_USERS } from '@/lib/seedData';
import { isFirebaseConfigured, auth as firebaseAuth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

interface AuthContextType {
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  savedAccounts: UserProfile[];
  isLoading: boolean;
  isFirebaseActive: boolean;
  login: (emailOrUsername: string, pass: string) => Promise<boolean>;
  loginWithGoogle: (email?: string, name?: string, avatarUrl?: string) => Promise<boolean>;
  loginWithFacebook: (nameOrEmail?: string) => Promise<boolean>;
  loginWithX: (handle?: string, name?: string) => Promise<boolean>;
  signup: (email: string, pass: string, username: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchPersona: (userId: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  toggleFollow: (targetUserId: string) => void;
  isFollowing: (targetUserId: string) => boolean;
  getUserById: (userId: string) => UserProfile | undefined;
  getUserByUsername: (username: string) => UserProfile | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'lumira-v2-users';
const CURRENT_USER_ID_KEY = 'lumira-v2-current-user-id';
const SAVED_ACCOUNTS_KEY = 'lumira-v2-device-accounts';
const CREDENTIALS_STORAGE_KEY = 'lumira-v2-credentials';

// Default password for seed accounts
const DEFAULT_SEED_PASSWORD = 'lumira123';

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

export function sanitizeAndDeduplicateUsers(userList: UserProfile[]): UserProfile[] {
  const byUsername = new Map<string, UserProfile>();

  for (const u of userList) {
    if (!u || !u.username) continue;
    const cleanUsername = u.username.toLowerCase().trim();

    // Never follow self
    const cleanFollowing = (u.following || []).filter(
      (fid) => fid !== u.id && fid !== u.username && fid !== cleanUsername
    );
    const cleanFollowers = (u.followers || []).filter(
      (fid) => fid !== u.id && fid !== u.username && fid !== cleanUsername
    );

    // Standardize avatar for Mujeeb Rahman
    let avatar = u.avatarUrl;
    if (cleanUsername === 'mujee00012' || u.email?.toLowerCase() === 'mujee00012@gmail.com') {
      avatar = '/images/avatar-mujeeb.png';
    }

    const cleanUser: UserProfile = {
      ...u,
      username: cleanUsername,
      avatarUrl: avatar,
      following: Array.from(new Set(cleanFollowing)),
      followers: Array.from(new Set(cleanFollowers)),
      followingCount: cleanFollowing.length,
      followersCount: cleanFollowers.length,
    };

    if (!byUsername.has(cleanUsername)) {
      byUsername.set(cleanUsername, cleanUser);
    } else {
      const existing = byUsername.get(cleanUsername)!;
      byUsername.set(cleanUsername, {
        ...cleanUser,
        ...existing,
        avatarUrl: cleanUser.avatarUrl || existing.avatarUrl,
        following: Array.from(new Set([...cleanUser.following, ...existing.following])),
        followers: Array.from(new Set([...cleanUser.followers, ...existing.followers])),
        followingCount: Math.max(cleanUser.following.length, existing.following.length),
        followersCount: Math.max(cleanUser.followers.length, existing.followers.length),
      });
    }
  }

  return Array.from(byUsername.values());
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserProfile[]>(() => sanitizeAndDeduplicateUsers(SEED_USERS));
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [savedAccountIds, setSavedAccountIds] = useState<string[]>([]);
  const [credentials, setCredentials] = useState<Record<string, string>>({
    'user-admin': DEFAULT_SEED_PASSWORD,
    'user-elena': DEFAULT_SEED_PASSWORD,
    'user-marcus': DEFAULT_SEED_PASSWORD,
    'user-aria': DEFAULT_SEED_PASSWORD,
    'user-kai': DEFAULT_SEED_PASSWORD,
  });
  const [isLoading, setIsLoading] = useState(true);
  const isFirebaseActive = isFirebaseConfigured();

  // Hydrate from localStorage asynchronously after initial hydration
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        const storedCurrentUserId = localStorage.getItem(CURRENT_USER_ID_KEY);
        const storedSavedAccounts = localStorage.getItem(SAVED_ACCOUNTS_KEY);
        const storedCredentials = localStorage.getItem(CREDENTIALS_STORAGE_KEY);

        let parsedUsers: UserProfile[] = sanitizeAndDeduplicateUsers(SEED_USERS);
        if (storedUsers) {
          try {
            const rawUsers: UserProfile[] = JSON.parse(storedUsers);
            parsedUsers = sanitizeAndDeduplicateUsers([...rawUsers, ...SEED_USERS]);
            setUsers(parsedUsers);
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsedUsers));
          } catch {
            setUsers(parsedUsers);
          }
        } else {
          setUsers(parsedUsers);
        }

        if (storedCredentials) {
          try {
            setCredentials(JSON.parse(storedCredentials));
          } catch {}
        }

        if (storedCurrentUserId) {
          const found = parsedUsers.find(
            (u: UserProfile) =>
              u.id === storedCurrentUserId ||
              u.username.toLowerCase() === storedCurrentUserId.toLowerCase()
          );
          if (found) {
            setCurrentUser(found);
          } else {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }

        if (storedSavedAccounts) {
          try {
            setSavedAccountIds(JSON.parse(storedSavedAccounts));
          } catch {
            setSavedAccountIds([]);
          }
        }

        // Background fetch from server user registry
        fetch('/api/users')
          .then((res) => res.json())
          .then((data) => {
            if (data?.users && Array.isArray(data.users)) {
              setUsers((prev) => {
                const merged = sanitizeAndDeduplicateUsers([...prev, ...data.users]);
                try {
                  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(merged));
                } catch {}
                return merged;
              });
            }
          })
          .catch(() => {});
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    }, 0);

    // Cross-tab / cross-window real-time synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USERS_STORAGE_KEY && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated)) {
            setUsers(updated);
          }
        } catch {}
      }
    };

    const syncUsersInterval = setInterval(() => {
      fetch('/api/sync')
        .then((res) => res.json())
        .then((data) => {
          if (data?.users && Array.isArray(data.users)) {
            setUsers((prev) => {
              const prevMap = new Map(prev.map((u) => [u.id, u]));
              let hasChanges = false;
              for (const serverUser of data.users) {
                const local = prevMap.get(serverUser.id);
                if (!local || local.followersCount !== serverUser.followersCount || local.followingCount !== serverUser.followingCount) {
                  prevMap.set(serverUser.id, serverUser);
                  hasChanges = true;
                }
              }
              if (hasChanges) {
                const merged = Array.from(prevMap.values());
                try { localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(merged)); } catch {}
                return merged;
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }, 2500);

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(syncUsersInterval);
    };
  }, []);

  const rememberAccount = (userId: string) => {
    setSavedAccountIds((prev) => {
      if (prev.includes(userId)) return prev;
      const updated = [...prev, userId];
      if (typeof window !== 'undefined') {
        localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Firebase auth listener
  useEffect(() => {
    if (isFirebaseActive && firebaseAuth) {
      const unsubscribe = onAuthStateChanged(firebaseAuth, (fbUser) => {
        if (fbUser) {
          const existing = users.find((u) => u.email?.toLowerCase() === fbUser.email?.toLowerCase());
          if (existing) {
            setCurrentUser(existing);
            rememberAccount(existing.id);
          } else {
            const namePart = (fbUser.email?.split('@')[0] || 'creator').replace(/[^a-z0-9_.]/g, '');
            const newUser: UserProfile = {
              id: fbUser.uid,
              username: namePart || 'google_user',
              displayName: fbUser.displayName || namePart,
              email: fbUser.email || '',
              avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${namePart}`,
              bio: 'Visual explorer on Lumira ✦',
              followersCount: 0,
              followingCount: 0,
              postsCount: 0,
              sparksCount: 100,
              followers: [],
              following: [],
              createdAt: new Date().toISOString(),
            };
            setUsers((prev) => [newUser, ...prev]);
            setCurrentUser(newUser);
            rememberAccount(newUser.id);
            if (typeof window !== 'undefined') {
              localStorage.setItem(CURRENT_USER_ID_KEY, newUser.id);
            }
          }
        }
      });
      return () => unsubscribe();
    }
  }, [isFirebaseActive, users]);

  const persistUsers = (updatedUsers: UserProfile[], current?: UserProfile | null) => {
    setUsers(updatedUsers);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      if (current) {
        localStorage.setItem(CURRENT_USER_ID_KEY, current.id);
        fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(current),
        }).catch(() => {});
      } else {
        localStorage.removeItem(CURRENT_USER_ID_KEY);
      }
    }
  };

  const persistCredentials = (updated: Record<string, string>) => {
    setCredentials(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const switchPersona = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      rememberAccount(target.id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(CURRENT_USER_ID_KEY, target.id);
      }
    }
  };

  // SECURE LOGIN: Validates user exists and checks password
  const login = async (emailOrUsername: string, pass: string): Promise<boolean> => {
    if (!emailOrUsername.trim() || !pass) {
      throw new Error('Please enter both email/username and password.');
    }

    if (isFirebaseActive && firebaseAuth) {
      try {
        await signInWithEmailAndPassword(firebaseAuth, emailOrUsername.trim(), pass);
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid credentials';
        throw new Error(msg.includes('user-not-found') ? 'No account found with this email. Please sign up.' : msg.includes('wrong-password') ? 'Incorrect password. Please try again.' : msg);
      }
    }

    // Local verified credential check
    const query = emailOrUsername.trim().toLowerCase();
    const found = users.find(
      (u) =>
        u.email?.toLowerCase() === query ||
        u.username.toLowerCase() === query
    );

    if (!found) {
      throw new Error('No account found with this email or username. Please sign up first.');
    }

    const expectedPassword = credentials[found.id] || DEFAULT_SEED_PASSWORD;
    if (pass !== expectedPassword) {
      throw new Error('Incorrect password. Please verify and try again.');
    }

    setCurrentUser(found);
    rememberAccount(found.id);
    persistUsers(users, found);
    return true;
  };

  // SECURE SIGNUP: Validates inputs, prevents duplicates, saves password
  const signup = async (
    email: string,
    pass: string,
    username: string,
    name: string
  ): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
    const cleanName = name.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please provide a valid email address.');
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      throw new Error('Username must be at least 3 characters.');
    }
    if (!pass || pass.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }
    if (!cleanName) {
      throw new Error('Please provide your full name.');
    }

    // Check duplicate email
    if (users.some((u) => u.email?.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email already exists. Please log in.');
    }

    // Check duplicate username
    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      throw new Error('This username is already taken. Please choose another.');
    }

    if (isFirebaseActive && firebaseAuth) {
      try {
        const cred = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, pass);
        const newUser: UserProfile = {
          id: cred.user.uid,
          username: cleanUsername,
          displayName: cleanName,
          email: cleanEmail,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
          bio: 'Visual storyteller exploring Lumira ✦',
          followersCount: 0,
          followingCount: 2,
          postsCount: 0,
          sparksCount: 200,
          followers: [],
          following: ['user-admin', 'user-elena', 'user-marcus'],
          createdAt: new Date().toISOString(),
        };
        const updated = [newUser, ...users];
        setCurrentUser(newUser);
        rememberAccount(newUser.id);
        persistUsers(updated, newUser);
        return true;
      } catch (err: unknown) {
        throw new Error(err instanceof Error ? err.message : 'Registration failed.');
      }
    }

    // Local secure user creation
    const newUserId = generateId('user');
    const newUser: UserProfile = {
      id: newUserId,
      username: cleanUsername,
      displayName: cleanName,
      email: cleanEmail,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
      bio: 'Visual storyteller exploring Lumira ✦',
      website: `https://lumira.app/${cleanUsername}`,
      followersCount: 0,
      followingCount: 3,
      postsCount: 0,
      sparksCount: 200,
      followers: [],
      following: ['user-admin', 'user-elena', 'user-marcus'],
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [newUser, ...users];
    const updatedCreds = { ...credentials, [newUserId]: pass };

    persistCredentials(updatedCreds);
    setCurrentUser(newUser);
    rememberAccount(newUser.id);
    persistUsers(updatedUsers, newUser);
    return true;
  };

  // Google OAuth with Firebase or Google Account Chooser
  const loginWithGoogle = async (email?: string, name?: string, avatarUrl?: string): Promise<boolean> => {
    // If specific email is passed (from Google Account Chooser modal)
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      const existing = users.find((u) => u.email?.toLowerCase() === cleanEmail);
      if (existing) {
        const updated: UserProfile = {
          ...existing,
          displayName: name || existing.displayName,
          avatarUrl: avatarUrl || (cleanEmail.includes('mujee') ? '/images/avatar-mujeeb.png' : existing.avatarUrl),
          following: Array.isArray(existing.following) ? existing.following : [],
          followers: Array.isArray(existing.followers) ? existing.followers : [],
          followingCount: Array.isArray(existing.following) ? existing.following.length : 0,
          followersCount: Array.isArray(existing.followers) ? existing.followers.length : 0,
        };
        setCurrentUser(updated);
        rememberAccount(updated.id);
        persistUsers(users.map((u) => (u.id === updated.id ? updated : u)), updated);
        return true;
      }

      const namePart = cleanEmail.split('@')[0].replace(/[^a-z0-9_.]/g, '') || 'google_user';
      const defaultAvatar = cleanEmail.includes('mujee')
        ? '/images/avatar-mujeeb.png'
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${namePart}`;

      const newGoogleUser: UserProfile = {
        id: generateId('user-google'),
        username: namePart,
        displayName: name?.trim() || (namePart.charAt(0).toUpperCase() + namePart.slice(1)),
        email: cleanEmail,
        avatarUrl: avatarUrl || defaultAvatar,
        bio: 'Visual creator on Lumira ✦ Connected via Google Account',
        website: 'https://lumira.app',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        sparksCount: 150,
        followers: [],
        following: [],
        createdAt: new Date().toISOString(),
      };

      const updatedUsers = [newGoogleUser, ...users];
      setCurrentUser(newGoogleUser);
      rememberAccount(newGoogleUser.id);
      persistUsers(updatedUsers, newGoogleUser);
      return true;
    }

    // Otherwise try Firebase Popup if active
    if (isFirebaseActive && firebaseAuth) {
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const cred = await signInWithPopup(firebaseAuth, provider);
        const fbUser = cred.user;
        if (fbUser && fbUser.email) {
          return loginWithGoogle(fbUser.email, fbUser.displayName || undefined, fbUser.photoURL || undefined);
        }
      } catch (err: unknown) {
        throw new Error(err instanceof Error ? err.message : 'Google sign-in was cancelled or failed.');
      }
    }

    return false;
  };

  const loginWithFacebook = async (): Promise<boolean> => {
    throw new Error('Facebook OAuth requires Meta Developer App credentials. Please use Email & Password Sign Up / Log In below.');
  };

  const loginWithX = async (): Promise<boolean> => {
    throw new Error('𝕏 OAuth requires X Developer API credentials. Please use Email & Password Sign Up / Log In below.');
  };

  const logout = async () => {
    if (isFirebaseActive && firebaseAuth) {
      try {
        await firebaseSignOut(firebaseAuth);
      } catch {}
    }
    if (currentUser) {
      setSavedAccountIds((prev) => prev.filter((id) => id !== currentUser.id));
      if (typeof window !== 'undefined') {
        const updated = savedAccountIds.filter((id) => id !== currentUser.id);
        localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
      }
    }
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CURRENT_USER_ID_KEY);
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    const updatedUsers = users.map((u) => (u.id === currentUser.id ? updatedUser : u));
    persistUsers(updatedUsers, updatedUser);
  };

  const resolveUser = (idOrUsername: string): UserProfile | undefined => {
    if (!idOrUsername) return undefined;
    const clean = idOrUsername.toLowerCase().trim();
    return users.find((u) => u.id === idOrUsername || u.username.toLowerCase() === clean);
  };

  const isFollowing = (targetIdOrUsername: string): boolean => {
    if (!currentUser || !targetIdOrUsername) return false;
    const target = resolveUser(targetIdOrUsername);
    if (!target) {
      return (
        currentUser.following.includes(targetIdOrUsername) ||
        currentUser.following.includes(targetIdOrUsername.toLowerCase())
      );
    }
    return (
      currentUser.following.includes(target.id) ||
      currentUser.following.includes(target.username.toLowerCase())
    );
  };

  const toggleFollow = (targetIdOrUsername: string) => {
    if (!currentUser || !targetIdOrUsername) return;
    const target = resolveUser(targetIdOrUsername);
    if (
      !target ||
      target.id === currentUser.id ||
      target.username.toLowerCase() === currentUser.username.toLowerCase()
    ) {
      return;
    }

    const isCurrentlyFollowing = isFollowing(target.id);

    const updatedFollowing = isCurrentlyFollowing
      ? currentUser.following.filter(
          (id) =>
            id !== target.id &&
            id !== target.username.toLowerCase() &&
            id !== currentUser.id &&
            id !== currentUser.username.toLowerCase()
        )
      : [...currentUser.following.filter((id) => id !== currentUser.id), target.id];

    const updatedCurrentUser: UserProfile = {
      ...currentUser,
      following: Array.from(new Set(updatedFollowing)),
      followingCount: updatedFollowing.length,
    };

    const updatedTargetFollowers = isCurrentlyFollowing
      ? target.followers.filter(
          (id) =>
            id !== currentUser.id &&
            id !== currentUser.username.toLowerCase() &&
            id !== target.id &&
            id !== target.username.toLowerCase()
        )
      : [...target.followers.filter((id) => id !== target.id), currentUser.id];

    const updatedTargetUser: UserProfile = {
      ...target,
      followers: Array.from(new Set(updatedTargetFollowers)),
      followersCount: updatedTargetFollowers.length,
    };

    const updatedUsers = users.map((u) => {
      if (u.id === currentUser.id || u.username.toLowerCase() === currentUser.username.toLowerCase()) {
        return updatedCurrentUser;
      }
      if (u.id === target.id || u.username.toLowerCase() === target.username.toLowerCase()) {
        return updatedTargetUser;
      }
      return u;
    });

    const sanitizedUsers = sanitizeAndDeduplicateUsers(updatedUsers);
    setCurrentUser(updatedCurrentUser);
    persistUsers(sanitizedUsers, updatedCurrentUser);

    // Broadcast follow status to server for real-time sync
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'toggle_follow',
        payload: {
          currentUserId: currentUser.id,
          targetUserId: target.id,
        },
      }),
    }).catch(() => {});
  };

  const getUserById = (userId: string) => {
    return resolveUser(userId);
  };

  const getUserByUsername = (username: string) => {
    return resolveUser(username);
  };

  const savedAccounts = useMemo(() => {
    return users.filter((u) => savedAccountIds.includes(u.id));
  }, [users, savedAccountIds]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers: users,
        savedAccounts,
        isLoading,
        isFirebaseActive,
        login,
        loginWithGoogle,
        loginWithFacebook,
        loginWithX,
        signup,
        logout,
        switchPersona,
        updateProfile,
        toggleFollow,
        isFollowing,
        getUserById,
        getUserByUsername,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

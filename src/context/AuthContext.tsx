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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserProfile[]>(SEED_USERS);
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

        let parsedUsers: UserProfile[] = SEED_USERS;
        if (storedUsers) {
          try {
            const rawUsers: UserProfile[] = JSON.parse(storedUsers);
            const existingIds = new Set(rawUsers.map((u) => u.id));
            const existingUsernames = new Set(rawUsers.map((u) => u.username.toLowerCase()));
            const missingSeeds = SEED_USERS.filter(
              (s) => !existingIds.has(s.id) && !existingUsernames.has(s.username.toLowerCase())
            );
            parsedUsers = [...rawUsers, ...missingSeeds];
            setUsers(parsedUsers);
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsedUsers));
          } catch {
            setUsers(SEED_USERS);
          }
        } else {
          setUsers(SEED_USERS);
        }

        if (storedCredentials) {
          try {
            setCredentials(JSON.parse(storedCredentials));
          } catch {}
        }

        if (storedCurrentUserId) {
          const found = parsedUsers.find((u: UserProfile) => u.id === storedCurrentUserId);
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
                const currentIds = new Set(prev.map((u) => u.id));
                const newServerUsers = data.users.filter((u: UserProfile) => !currentIds.has(u.id));
                if (newServerUsers.length > 0) {
                  const merged = [...prev, ...newServerUsers];
                  try {
                    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(merged));
                  } catch {}
                  return merged;
                }
                return prev;
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

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handleStorageChange);
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

  const toggleFollow = (targetUserId: string) => {
    if (!currentUser || currentUser.id === targetUserId) return;

    const isCurrentlyFollowing = currentUser.following.includes(targetUserId);

    const updatedFollowing = isCurrentlyFollowing
      ? currentUser.following.filter((id) => id !== targetUserId)
      : [...currentUser.following, targetUserId];

    const updatedCurrentUser: UserProfile = {
      ...currentUser,
      following: updatedFollowing,
      followingCount: updatedFollowing.length,
    };

    const targetUser = users.find((u) => u.id === targetUserId);
    if (!targetUser) return;

    const updatedTargetFollowers = isCurrentlyFollowing
      ? targetUser.followers.filter((id) => id !== currentUser.id)
      : [...targetUser.followers, currentUser.id];

    const updatedTargetUser: UserProfile = {
      ...targetUser,
      followers: updatedTargetFollowers,
      followersCount: updatedTargetFollowers.length,
    };

    const updatedUsers = users.map((u) => {
      if (u.id === currentUser.id) return updatedCurrentUser;
      if (u.id === targetUserId) return updatedTargetUser;
      return u;
    });

    setCurrentUser(updatedCurrentUser);
    persistUsers(updatedUsers, updatedCurrentUser);
  };

  const isFollowing = (targetUserId: string) => {
    return !!currentUser?.following.includes(targetUserId);
  };

  const getUserById = (userId: string) => {
    return users.find((u) => u.id === userId);
  };

  const getUserByUsername = (username: string) => {
    return users.find((u) => u.username.toLowerCase() === username.toLowerCase());
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

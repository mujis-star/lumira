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
} from 'firebase/auth';

interface AuthContextType {
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  savedAccounts: UserProfile[];
  isLoading: boolean;
  isFirebaseActive: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  loginWithGoogle: (email?: string, name?: string) => Promise<boolean>;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize with seed data to guarantee 100% server-client hydration match
  const [users, setUsers] = useState<UserProfile[]>(SEED_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(SEED_USERS[0]);
  const [savedAccountIds, setSavedAccountIds] = useState<string[]>([SEED_USERS[0].id]);
  const [isLoading] = useState(false);
  const isFirebaseActive = isFirebaseConfigured();

  // Hydrate from localStorage asynchronously after initial hydration
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      const storedCurrentUserId = localStorage.getItem(CURRENT_USER_ID_KEY);
      const storedSavedAccounts = localStorage.getItem(SAVED_ACCOUNTS_KEY);

      if (storedUsers || storedCurrentUserId || storedSavedAccounts) {
        setTimeout(() => {
          let parsedUsers: UserProfile[] = SEED_USERS;
          if (storedUsers) {
            try {
              parsedUsers = JSON.parse(storedUsers);
              setUsers(parsedUsers);
            } catch {
              // fallback
            }
          }

          let activeUser: UserProfile = parsedUsers[0];
          if (storedCurrentUserId) {
            const found = parsedUsers.find((u: UserProfile) => u.id === storedCurrentUserId);
            if (found) {
              activeUser = found;
              setCurrentUser(found);
            }
          }

          if (storedSavedAccounts) {
            try {
              setSavedAccountIds(JSON.parse(storedSavedAccounts));
            } catch {
              setSavedAccountIds([activeUser.id]);
            }
          } else {
            setSavedAccountIds([activeUser.id]);
          }
        }, 0);
      }
    } catch {
      // fallback
    }
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
          const existing = users.find((u) => u.email === fbUser.email);
          if (existing) {
            setCurrentUser(existing);
            rememberAccount(existing.id);
          } else {
            const newUser: UserProfile = {
              id: fbUser.uid,
              username: fbUser.email?.split('@')[0] || 'lumira_user',
              displayName: fbUser.displayName || 'Lumira Creator',
              email: fbUser.email || '',
              avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${fbUser.uid}`,
              bio: 'New explorer on Lumira ✦',
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
      }
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

  const login = async (email: string, pass: string): Promise<boolean> => {
    if (isFirebaseActive && firebaseAuth) {
      try {
        await signInWithEmailAndPassword(firebaseAuth, email, pass);
        return true;
      } catch (err) {
        console.error('Firebase sign in error:', err);
        return false;
      }
    } else {
      const found = users.find(
        (u) =>
          u.email?.toLowerCase() === email.toLowerCase() ||
          u.username.toLowerCase() === email.toLowerCase()
      );
      if (found) {
        setCurrentUser(found);
        rememberAccount(found.id);
        persistUsers(users, found);
        return true;
      } else {
        const namePart = email.split('@')[0];
        const newDemoUser: UserProfile = {
          id: `user-${Date.now()}`,
          username: namePart.toLowerCase().replace(/[^a-z0-9_.]/g, ''),
          displayName: namePart.charAt(0).toUpperCase() + namePart.slice(1),
          email,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${namePart}`,
          bio: 'Visual enthusiast on Lumira ✦',
          followersCount: 0,
          followingCount: 3,
          postsCount: 0,
          sparksCount: 150,
          followers: [],
          following: ['user-admin', 'user-elena', 'user-marcus'],
          createdAt: new Date().toISOString(),
        };
        const updated = [newDemoUser, ...users];
        setCurrentUser(newDemoUser);
        rememberAccount(newDemoUser.id);
        persistUsers(updated, newDemoUser);
        return true;
      }
    }
  };

  const loginWithGoogle = async (email?: string, name?: string): Promise<boolean> => {
    const targetEmail = (email?.trim() || 'alex.rivera@gmail.com').toLowerCase();
    const existing = users.find((u) => u.email?.toLowerCase() === targetEmail);
    if (existing) {
      setCurrentUser(existing);
      rememberAccount(existing.id);
      persistUsers(users, existing);
      return true;
    }

    const namePart = targetEmail.split('@')[0];
    const username = namePart.replace(/[^a-z0-9_.]/g, '') || 'google_creator';
    const newGoogleUser: UserProfile = {
      id: `user-google-${Date.now()}`,
      username,
      displayName: name?.trim() || namePart.charAt(0).toUpperCase() + namePart.slice(1),
      email: targetEmail,
      avatarUrl:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      bio: 'Visual creator & photographer ✦ Connected via Google (Gmail)',
      website: 'https://lumira.app',
      followersCount: 145,
      followingCount: 68,
      postsCount: 0,
      sparksCount: 250,
      followers: ['user-elena', 'user-aria'],
      following: ['user-admin', 'user-elena', 'user-marcus'],
      createdAt: new Date().toISOString(),
    };

    const updated = [newGoogleUser, ...users];
    setCurrentUser(newGoogleUser);
    rememberAccount(newGoogleUser.id);
    persistUsers(updated, newGoogleUser);
    return true;
  };

  const loginWithFacebook = async (nameOrEmail?: string): Promise<boolean> => {
    const raw = (nameOrEmail?.trim() || 'sarah.jenkins').toLowerCase();
    const cleanName = raw.includes('@') ? raw.split('@')[0] : raw;
    const username = cleanName.replace(/[^a-z0-9_.]/g, '') || 'facebook_creator';
    const email = raw.includes('@') ? raw : `${username}@facebook.com`;

    const existing = users.find((u) => u.username === username || u.email?.toLowerCase() === email);
    if (existing) {
      setCurrentUser(existing);
      rememberAccount(existing.id);
      persistUsers(users, existing);
      return true;
    }

    const newFacebookUser: UserProfile = {
      id: `user-fb-${Date.now()}`,
      username,
      displayName: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
      email,
      avatarUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      bio: 'Explorer & artist ✦ Connected via Facebook',
      website: 'https://lumira.app',
      followersCount: 310,
      followingCount: 140,
      postsCount: 0,
      sparksCount: 300,
      followers: ['user-elena', 'user-marcus'],
      following: ['user-admin', 'user-elena', 'user-aria'],
      createdAt: new Date().toISOString(),
    };

    const updated = [newFacebookUser, ...users];
    setCurrentUser(newFacebookUser);
    rememberAccount(newFacebookUser.id);
    persistUsers(updated, newFacebookUser);
    return true;
  };

  const loginWithX = async (handle?: string, name?: string): Promise<boolean> => {
    const rawHandle = (handle?.trim() || 'neo_luminary').replace(/^@/, '').toLowerCase();
    const username = rawHandle.replace(/[^a-z0-9_.]/g, '') || 'x_creator';
    const email = `${username}@x.com`;

    const existing = users.find((u) => u.username === username || u.email?.toLowerCase() === email);
    if (existing) {
      setCurrentUser(existing);
      rememberAccount(existing.id);
      persistUsers(users, existing);
      return true;
    }

    const newXUser: UserProfile = {
      id: `user-x-${Date.now()}`,
      username,
      displayName: name?.trim() || username.charAt(0).toUpperCase() + username.slice(1),
      email,
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      bio: 'Digital nomad & story builder ✦ Connected via 𝕏',
      website: `https://x.com/${username}`,
      followersCount: 520,
      followingCount: 210,
      postsCount: 0,
      sparksCount: 400,
      followers: ['user-admin', 'user-elena'],
      following: ['user-admin', 'user-elena', 'user-kai'],
      createdAt: new Date().toISOString(),
    };

    const updated = [newXUser, ...users];
    setCurrentUser(newXUser);
    rememberAccount(newXUser.id);
    persistUsers(updated, newXUser);
    return true;
  };

  const signup = async (
    email: string,
    pass: string,
    username: string,
    name: string
  ): Promise<boolean> => {
    if (isFirebaseActive && firebaseAuth) {
      try {
        const cred = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
        const newUser: UserProfile = {
          id: cred.user.uid,
          username: username.toLowerCase().replace(/[^a-z0-9_.]/g, ''),
          displayName: name,
          email,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
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
      } catch (err) {
        console.error('Firebase sign up error:', err);
        return false;
      }
    } else {
      const newUser: UserProfile = {
        id: `user-${Date.now()}`,
        username: username.toLowerCase().replace(/[^a-z0-9_.]/g, ''),
        displayName: name,
        email,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
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
    }
  };

  const logout = async () => {
    if (isFirebaseActive && firebaseAuth) {
      await firebaseSignOut(firebaseAuth);
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

    const isFollowingTarget = currentUser.following.includes(targetUserId);
    let updatedFollowing: string[];
    let updatedTargetFollowers: string[];

    const targetUser = users.find((u) => u.id === targetUserId);
    if (!targetUser) return;

    if (isFollowingTarget) {
      updatedFollowing = currentUser.following.filter((id) => id !== targetUserId);
      updatedTargetFollowers = targetUser.followers.filter((id) => id !== currentUser.id);
    } else {
      updatedFollowing = [...currentUser.following, targetUserId];
      updatedTargetFollowers = [...targetUser.followers, currentUser.id];
    }

    const updatedCurrent: UserProfile = {
      ...currentUser,
      following: updatedFollowing,
      followingCount: updatedFollowing.length,
    };

    const updatedTarget: UserProfile = {
      ...targetUser,
      followers: updatedTargetFollowers,
      followersCount: updatedTargetFollowers.length,
    };

    setCurrentUser(updatedCurrent);
    const updatedUsers = users.map((u) => {
      if (u.id === currentUser.id) return updatedCurrent;
      if (u.id === targetUserId) return updatedTarget;
      return u;
    });

    persistUsers(updatedUsers, updatedCurrent);
  };

  const isFollowing = (targetUserId: string): boolean => {
    if (!currentUser) return false;
    return currentUser.following.includes(targetUserId);
  };

  const getUserById = (userId: string) => users.find((u) => u.id === userId);
  const getUserByUsername = (username: string) =>
    users.find((u) => u.username.toLowerCase() === username.toLowerCase().replace('@', ''));

  const savedAccounts = useMemo(() => {
    const matched = users.filter((u) => savedAccountIds.includes(u.id));
    if (currentUser && !matched.some((u) => u.id === currentUser.id)) {
      return [currentUser, ...matched];
    }
    return matched.length > 0 ? matched : currentUser ? [currentUser] : [];
  }, [users, savedAccountIds, currentUser]);

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

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
  const [users, setUsers] = useState<UserProfile[]>(SEED_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [savedAccountIds, setSavedAccountIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isFirebaseActive = isFirebaseConfigured();

  // Hydrate from localStorage asynchronously after initial hydration
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        const storedCurrentUserId = localStorage.getItem(CURRENT_USER_ID_KEY);
        const storedSavedAccounts = localStorage.getItem(SAVED_ACCOUNTS_KEY);

        let parsedUsers: UserProfile[] = SEED_USERS;
        if (storedUsers) {
          try {
            parsedUsers = JSON.parse(storedUsers);
            setUsers(parsedUsers);
          } catch {
            // fallback
          }
        }

        if (storedCurrentUserId) {
          const found = parsedUsers.find((u: UserProfile) => u.id === storedCurrentUserId);
          if (found) {
            setCurrentUser(found);
          } else {
            setCurrentUser(null);
          }
        } else {
          // Unauthenticated visitor
          setCurrentUser(null);
        }

        if (storedSavedAccounts) {
          try {
            setSavedAccountIds(JSON.parse(storedSavedAccounts));
          } catch {
            setSavedAccountIds([]);
          }
        }
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    }, 0);

    return () => clearTimeout(timer);
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
      } else {
        localStorage.removeItem(CURRENT_USER_ID_KEY);
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
    // 1. Try Firebase Google Popup if Firebase is initialized
    if (isFirebaseActive && firebaseAuth) {
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const cred = await signInWithPopup(firebaseAuth, provider);
        const fbUser = cred.user;
        if (fbUser) {
          const existing = users.find((u) => u.email?.toLowerCase() === fbUser.email?.toLowerCase());
          if (existing) {
            const updated = {
              ...existing,
              displayName: fbUser.displayName || existing.displayName,
              avatarUrl: fbUser.photoURL || existing.avatarUrl,
            };
            setCurrentUser(updated);
            rememberAccount(updated.id);
            persistUsers(users.map((u) => (u.id === updated.id ? updated : u)), updated);
            return true;
          } else {
            const namePart = (fbUser.email?.split('@')[0] || 'creator').replace(/[^a-z0-9_.]/g, '');
            const newGoogleUser: UserProfile = {
              id: fbUser.uid,
              username: namePart || 'google_user',
              displayName: fbUser.displayName || namePart,
              email: fbUser.email || '',
              avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${namePart}`,
              bio: 'Visual creator on Lumira ✦ Connected via Google',
              followersCount: 0,
              followingCount: 2,
              postsCount: 0,
              sparksCount: 150,
              followers: [],
              following: ['user-elena', 'user-marcus'],
              createdAt: new Date().toISOString(),
            };
            const updatedUsers = [newGoogleUser, ...users];
            setCurrentUser(newGoogleUser);
            rememberAccount(newGoogleUser.id);
            persistUsers(updatedUsers, newGoogleUser);
            return true;
          }
        }
      } catch (err: unknown) {
        console.warn('Firebase Google popup sign in failed or closed:', err);
        if (!email) {
          return false;
        }
      }
    }

    // 2. Direct / Custom Google Sign-In with user's genuine email
    if (!email) return false;

    const targetEmail = email.trim().toLowerCase();
    const existing = users.find((u) => u.email?.toLowerCase() === targetEmail);
    if (existing) {
      setCurrentUser(existing);
      rememberAccount(existing.id);
      persistUsers(users, existing);
      return true;
    }

    const namePart = targetEmail.split('@')[0].replace(/[^a-z0-9_.]/g, '') || 'google_user';
    const newGoogleUser: UserProfile = {
      id: `user-google-${Date.now()}`,
      username: namePart,
      displayName: name?.trim() || namePart.charAt(0).toUpperCase() + namePart.slice(1),
      email: targetEmail,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${namePart}`,
      bio: 'Visual creator on Lumira ✦ Connected via Google (Gmail)',
      website: 'https://lumira.app',
      followersCount: 0,
      followingCount: 3,
      postsCount: 0,
      sparksCount: 150,
      followers: [],
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
    if (!nameOrEmail) return false;

    const raw = nameOrEmail.trim().toLowerCase();
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
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      bio: 'Explorer & artist ✦ Connected via Facebook',
      website: 'https://lumira.app',
      followersCount: 0,
      followingCount: 3,
      postsCount: 0,
      sparksCount: 150,
      followers: [],
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
    if (!handle) return false;

    const rawHandle = handle.trim().replace(/^@/, '').toLowerCase();
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
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      bio: 'Digital nomad & story builder ✦ Connected via 𝕏',
      website: `https://x.com/${username}`,
      followersCount: 0,
      followingCount: 3,
      postsCount: 0,
      sparksCount: 150,
      followers: [],
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

    // Update currentUser
    const updatedFollowing = isCurrentlyFollowing
      ? currentUser.following.filter((id) => id !== targetUserId)
      : [...currentUser.following, targetUserId];

    const updatedCurrentUser: UserProfile = {
      ...currentUser,
      following: updatedFollowing,
      followingCount: updatedFollowing.length,
    };

    // Update targetUser
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

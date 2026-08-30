'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Avatar } from '@/components/ui/Avatar';
import { isFirebaseConfigured } from '@/lib/firebase';
import {
  Sun,
  Moon,
  LogOut,
  Users,
  Check,
  Plus,
  Camera,
  Flame,
  User,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { currentUser, savedAccounts, switchPersona, logout, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
  const [photoUpdatedSuccess, setPhotoUpdatedSuccess] = useState(false);

  const firebaseConnected = isFirebaseConfigured();

  const handleLogout = async () => {
    await logout();
    router.push('/auth');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUpdatingPhoto(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && currentUser) {
          const avatarData = event.target.result as string;
          updateProfile({ avatarUrl: avatarData });
          setIsUpdatingPhoto(false);
          setPhotoUpdatedSuccess(true);
          setTimeout(() => setPhotoUpdatedSuccess(false), 3500);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AppShell title="Settings">
      <div className="max-w-[640px] mx-auto py-4 sm:py-8 px-4 space-y-6 select-none">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Settings</h1>

        {/* Current User Card with Avatar Upload */}
        {currentUser && (
          <div className="p-5 rounded-3xl bg-[var(--glass-card-bg)] backdrop-blur-2xl border border-[var(--glass-border)] shadow-[var(--glass-shadow)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  size="xl"
                  isVerified={currentUser.isVerified}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer shadow-md"
                  aria-label="Change profile photo"
                >
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px] font-bold">Change</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-[var(--text-primary)]">{currentUser.username}</p>
                  {currentUser.isAdmin && (
                    <span className="px-1.5 py-0.5 rounded-md bg-[#0095f6]/10 text-[#0095f6] text-[10px] font-bold">
                      Super Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{currentUser.displayName}</p>
                {isUpdatingPhoto ? (
                  <p className="text-[11px] font-bold text-blue-400 mt-1 flex items-center gap-1">
                    <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    Uploading & Syncing...
                  </p>
                ) : photoUpdatedSuccess ? (
                  <p className="text-[11px] font-bold text-emerald-400 mt-1 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Profile image updated & synced!
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-bold text-[var(--accent-blue)] hover:underline mt-1 cursor-pointer inline-flex items-center gap-1"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Upload new photo</span>
                  </button>
                )}
              </div>
            </div>

            <Link
              href={`/profile/${currentUser.username}`}
              className="px-4 py-2 rounded-xl bg-[var(--glass-input-bg)] hover:bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] text-xs font-bold text-[var(--text-primary)] transition-all flex items-center gap-1.5 shadow-xs"
            >
              <User className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
              <span>Edit Profile Details</span>
            </Link>
          </div>
        )}

        {/* Cloud & Firebase Sync Posture */}
        <div className="p-4 rounded-2xl bg-[var(--glass-card-bg)] backdrop-blur-xl border border-[var(--glass-border)] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className={`w-4 h-4 ${firebaseConnected ? 'text-amber-500' : 'text-neutral-400'}`} />
              <span className="text-xs font-bold text-[var(--text-primary)]">Firebase Cloud Synchronization</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${
              firebaseConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {firebaseConnected ? 'Connected & Active' : 'Offline Storage Mode'}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)]">
            User profile state, security credentials, and creative moments are continuously synchronized with Firebase Firestore (`lumira-563d9`).
          </p>
        </div>

        {/* Appearance Mode */}
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-[var(--border-color)] space-y-3">
          <p className="text-sm font-bold text-[var(--text-primary)]">Appearance</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              <span className="text-xs text-[var(--text-primary)]">Dark Mode</span>
            </div>
            <button
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer ${
                theme === 'dark' ? 'bg-[#0095f6] justify-end' : 'bg-neutral-300 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow" />
            </button>
          </div>
        </div>

        {/* Switch Account (Device Logged In Accounts) */}
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-[var(--border-color)] space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--text-secondary)]" />
            <p className="text-sm font-bold text-[var(--text-primary)]">Switch Account</p>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {savedAccounts.map((user) => {
              const isSelected = user.id === currentUser?.id;

              return (
                <div
                  key={user.id}
                  onClick={() => switchPersona(user.id)}
                  className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" isVerified={user.isVerified} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-[var(--text-primary)]">{user.username}</p>
                        {user.isAdmin && (
                          <span className="px-1.5 py-0.2 rounded bg-[#0095f6]/10 text-[#0095f6] text-[9px] font-bold">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)]">{user.displayName}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#0095f6]" />}
                </div>
              );
            })}
          </div>

          <div className="pt-1">
            <button
              onClick={() => router.push('/auth')}
              className="w-full py-2 px-3 rounded-xl border border-[var(--border-color)] text-[#0095f6] text-xs font-semibold hover:bg-[#0095f6]/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log into an Existing Account</span>
            </button>
          </div>
        </div>

        {/* Log Out Button */}
        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-xl border border-[var(--border-color)] text-[#ed4956] text-xs font-bold hover:bg-[#ed4956]/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </AppShell>
  );
}

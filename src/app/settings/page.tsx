'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Avatar } from '@/components/ui/Avatar';
import {
  Sun,
  Moon,
  LogOut,
  Users,
  Check,
  Plus,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { currentUser, savedAccounts, switchPersona, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    router.push('/auth');
  };

  return (
    <AppShell title="Settings">
      <div className="max-w-[640px] mx-auto py-4 sm:py-8 px-4 space-y-6 select-none">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Settings</h1>

        {/* Current User Card */}
        {currentUser && (
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={currentUser.avatarUrl} alt={currentUser.displayName} size="lg" isVerified={currentUser.isVerified} />
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
              </div>
            </div>
          </div>
        )}

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

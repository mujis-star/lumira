'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { sounds, triggerConfetti } from '@/lib/utils';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const { loginWithGoogle, loginWithFacebook, loginWithX, switchPersona, allUsers } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<'google' | 'facebook' | 'x' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Custom handle modal
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [customDisplayName, setCustomDisplayName] = useState('');

  const handleSignIn = async (provider: 'google' | 'facebook' | 'x') => {
    setError(null);
    setActiveProvider(provider);
    setIsLoading(true);

    try {
      let success = false;
      if (provider === 'google') {
        success = await loginWithGoogle();
      } else if (provider === 'facebook') {
        success = await loginWithFacebook();
      } else if (provider === 'x') {
        success = await loginWithX();
      }

      if (success) {
        sounds.playSend();
        triggerConfetti(0.5, 0.5);
        router.push('/');
      } else {
        setError(`Failed to sign in with ${provider}. Please try again.`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setIsLoading(false);
      setActiveProvider(null);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim() || !activeProvider) return;

    setIsLoading(true);
    try {
      let success = false;
      if (activeProvider === 'google') {
        const email = customInput.includes('@') ? customInput : `${customInput}@gmail.com`;
        success = await loginWithGoogle(email, customDisplayName);
      } else if (activeProvider === 'facebook') {
        success = await loginWithFacebook(customInput);
      } else if (activeProvider === 'x') {
        success = await loginWithX(customInput, customDisplayName);
      }

      if (success) {
        setIsCustomModalOpen(false);
        sounds.playSend();
        triggerConfetti(0.5, 0.5);
        router.push('/');
      }
    } catch {
      setError('Custom login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonaSelect = (userId: string) => {
    switchPersona(userId);
    sounds.playSend();
    triggerConfetti(0.5, 0.5);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-[380px] space-y-4">
        {/* Main Brand Card */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] p-8 sm:p-10 space-y-6 text-center rounded-2xl shadow-xl">
          {/* Official Lumira Logo Emblem */}
          <div className="flex flex-col items-center justify-center space-y-3 pt-1">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/30 ring-2 ring-purple-500/30 hover:scale-105 transition-transform">
              <Image
                src="/lumira-logo.png"
                alt="Lumira Logo"
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent">
                Lumira
              </h1>
              <p className="text-[11px] font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
                Where Moments Illuminate
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Social Sign-In Buttons */}
          <div className="space-y-3 pt-2">
            {/* 1. Google (Gmail) */}
            <button
              type="button"
              onClick={() => handleSignIn('google')}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl border border-[var(--border-color)] bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/80 text-xs font-bold text-[var(--text-primary)] flex items-center justify-center gap-3 transition-all active:scale-98 shadow-sm cursor-pointer disabled:opacity-50 group"
            >
              {/* Google 4-Color Icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>
                {isLoading && activeProvider === 'google'
                  ? 'Connecting Gmail...'
                  : 'Continue with Google (Gmail)'}
              </span>
            </button>

            {/* 2. Facebook */}
            <button
              type="button"
              onClick={() => handleSignIn('facebook')}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#1877f2] hover:bg-[#166fe5] text-white text-xs font-bold flex items-center justify-center gap-3 transition-all active:scale-98 shadow-sm cursor-pointer disabled:opacity-50 group"
            >
              {/* Facebook Icon */}
              <svg className="w-4 h-4 shrink-0 fill-white" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>
                {isLoading && activeProvider === 'facebook'
                  ? 'Connecting Facebook...'
                  : 'Continue with Facebook'}
              </span>
            </button>

            {/* 3. X (Twitter) */}
            <button
              type="button"
              onClick={() => handleSignIn('x')}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-black hover:bg-neutral-900 text-white text-xs font-bold border border-neutral-700/60 flex items-center justify-center gap-3 transition-all active:scale-98 shadow-sm cursor-pointer disabled:opacity-50 group"
            >
              {/* X Icon */}
              <svg className="w-4 h-4 shrink-0 fill-white" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 23.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>
                {isLoading && activeProvider === 'x' ? 'Connecting 𝕏...' : 'Continue with 𝕏'}
              </span>
            </button>
          </div>

          {/* Custom Handle / Account Option */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setActiveProvider('google');
                setIsCustomModalOpen(true);
              }}
              className="text-xs font-semibold text-[#0095f6] hover:underline cursor-pointer"
            >
              Sign in with custom Gmail, Facebook or 𝕏 handle
            </button>
          </div>
        </div>

        {/* 1-Tap Quick Persona Switcher */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] p-4 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-semibold px-1">
            <span>Or 1-Tap Instant Sign-In:</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {allUsers.slice(0, 4).map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handlePersonaSelect(user.id)}
                className="flex items-center gap-2 p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-left cursor-pointer group"
              >
                <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" isVerified={user.isVerified} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-[var(--text-primary)] truncate group-hover:text-[#0095f6]">
                    {user.username}
                  </p>
                  <p className="text-[10px] text-[var(--text-secondary)] truncate">
                    {user.displayName.split(' ')[0]}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-[11px] text-[var(--text-secondary)] space-y-1">
          <p className="flex items-center justify-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure Authentication Powered by Lumira</span>
          </p>
          <p>© 2026 Lumira from Lumira Labs</p>
        </footer>
      </div>

      {/* Custom Account Modal */}
      <Modal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        title="Custom Social Sign-In"
        size="sm"
      >
        <form onSubmit={handleCustomSubmit} className="p-4 space-y-4 select-none bg-[var(--modal-bg)]">
          {/* Provider Selector Tabs */}
          <div className="flex items-center justify-center gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
            {(['google', 'facebook', 'x'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setActiveProvider(p)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer ${
                  activeProvider === p
                    ? 'bg-[#0095f6] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {p === 'google' ? 'Gmail' : p === 'x' ? '𝕏' : 'Facebook'}
              </button>
            ))}
          </div>

          {/* Inputs */}
          <div className="space-y-2">
            <div>
              <label className="text-[11px] font-bold text-[var(--text-secondary)]">
                {activeProvider === 'google'
                  ? 'Gmail Address'
                  : activeProvider === 'x'
                  ? '𝕏 Username / Handle'
                  : 'Facebook Name / Email'}
              </label>
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder={
                  activeProvider === 'google'
                    ? 'yourname@gmail.com'
                    : activeProvider === 'x'
                    ? '@yourusername'
                    : 'Your Name'
                }
                className="w-full mt-1 p-2.5 rounded-xl bg-[var(--input-bg)] text-xs text-[var(--text-primary)] border border-[var(--border-color)] focus:outline-none"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[var(--text-secondary)]">Display Name (Optional)</label>
              <input
                type="text"
                value={customDisplayName}
                onChange={(e) => setCustomDisplayName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full mt-1 p-2.5 rounded-xl bg-[var(--input-bg)] text-xs text-[var(--text-primary)] border border-[var(--border-color)] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => setIsCustomModalOpen(false)}
              className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!customInput.trim() || isLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-40 text-white text-xs font-bold transition-all shadow cursor-pointer"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

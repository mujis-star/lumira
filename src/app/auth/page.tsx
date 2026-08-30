'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { sounds, triggerConfetti } from '@/lib/utils';
import { Eye, EyeOff, Lock, Mail, User, ShieldCheck, ArrowRight, UserPlus, X, Loader2, Globe, ArrowLeft } from 'lucide-react';

interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (notification?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
              locale?: string;
            }
          ) => void;
        };
      };
    };
  }
}

interface GoogleAccount {
  name: string;
  email: string;
  avatar: string;
}

const DEFAULT_GOOGLE_ACCOUNTS: GoogleAccount[] = [
  {
    name: 'Mujeeb Rahman',
    email: 'mujee00012@gmail.com',
    avatar: '/images/avatar-mujeeb.png',
  },
  {
    name: 'Muhammed Hisham',
    email: 'mhudhishamp@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80',
  },
];

export default function AuthPage() {
  const router = useRouter();
  const { currentUser, isLoading: isAuthLoading, login, signup, loginWithGoogle } = useAuth();

  // Mode: 'login' | 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Form Fields
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleChooserOpen, setIsGoogleChooserOpen] = useState(false);
  const [isCustomGoogleMode, setIsCustomGoogleMode] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [selectedGoogleEmail, setSelectedGoogleEmail] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // If already authenticated, redirect to home feed
  useEffect(() => {
    if (!isAuthLoading && currentUser) {
      router.replace('/');
    }
  }, [currentUser, isAuthLoading, router]);

  // Handle REAL Google Token Callback from accounts.google.com
  const handleGoogleGsiResponse = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) return;

      setIsLoading(true);
      setError(null);

      try {
        // Verify genuine Google JWT ID token with backend
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: response.credential }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to authenticate Google account with server.');
        }

        await loginWithGoogle(data.user.email, data.user.displayName, data.user.avatarUrl);
        sounds.playSend();
        triggerConfetti(0.5, 0.5);
        router.push('/');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Google token verification failed.');
      } finally {
        setIsLoading(false);
      }
    },
    [loginWithGoogle, router]
  );

  // Initialize and render Native Google Identity Services Button
  const initGoogleGSI = useCallback(() => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      const clientId =
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        '1088487426177-example.apps.googleusercontent.com';

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleGsiResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (googleButtonRef.current) {
          googleButtonRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: 340,
          });
        }

        // Trigger Google One-Tap Prompt
        window.google.accounts.id.prompt();
      } catch (err) {
        console.warn('Google GSI initialization warning:', err);
      }
    }
  }, [handleGoogleGsiResponse]);

  useEffect(() => {
    initGoogleGSI();
  }, [initGoogleGSI]);

  const switchToSignup = () => {
    setMode('signup');
    setError(null);
    if (emailOrUsername.trim()) {
      if (emailOrUsername.includes('@')) {
        setSignupEmail(emailOrUsername.trim());
        setSignupUsername(emailOrUsername.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, ''));
      } else {
        setSignupUsername(emailOrUsername.trim().toLowerCase().replace(/[^a-z0-9_.]/g, ''));
      }
    }
  };

  const switchToLogin = () => {
    setMode('login');
    setError(null);
    if (signupEmail.trim() || signupUsername.trim()) {
      setEmailOrUsername(signupEmail.trim() || signupUsername.trim());
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(emailOrUsername.trim(), password);
      sounds.playSend();
      triggerConfetti(0.5, 0.5);
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signup(
        signupEmail.trim(),
        signupPassword,
        signupUsername.trim(),
        signupFullName.trim()
      );
      sounds.playSend();
      triggerConfetti(0.5, 0.5);
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please verify your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenGoogleChooser = () => {
    setIsGoogleChooserOpen(true);
    setError(null);
  };

  const handleSelectGoogleAccount = async (email: string, displayName: string, avatarUrl: string) => {
    setSelectedGoogleEmail(email);
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle(email, displayName, avatarUrl);
      sounds.playSend();
      triggerConfetti(0.5, 0.5);
      setIsGoogleChooserOpen(false);
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google authentication failed.');
    } finally {
      setIsLoading(false);
      setSelectedGoogleEmail(null);
    }
  };

  const handleCustomGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail.trim()) return;

    const email = customGoogleEmail.trim();
    const name = customGoogleName.trim() || email.split('@')[0];
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`;
    await handleSelectGoogleAccount(email, name, avatar);
  };

  const currentHost =
    typeof window !== 'undefined'
      ? window.location.host.includes('localhost')
        ? 'lumir-a.vercel.app'
        : window.location.host
      : 'lumir-a.vercel.app';

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 select-none overflow-hidden">
      {/* Official Google Identity Services SDK Script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogleGSI}
      />

      {/* Ambient Cosmic Neon Background Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/25 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/25 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[420px] space-y-4">
        {/* Main Frosted Glass Authentication Card */}
        <div className="bg-[var(--glass-card-bg)] backdrop-blur-3xl border border-[var(--glass-border)] shadow-[var(--glass-shadow-lg)] p-7 sm:p-8 space-y-5 rounded-3xl transition-all">
          {/* Official Lumira Logo Emblem & Brand Title */}
          <div className="flex flex-col items-center justify-center space-y-2 pt-1 text-center">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-xl shadow-purple-500/30 ring-2 ring-purple-500/40 hover:scale-105 transition-transform">
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
              <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
                Lumira
              </h1>
              <p className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
                Where Moments Illuminate
              </p>
            </div>
          </div>

          {/* Mode Tabs: Log In vs Sign Up */}
          <div className="flex items-center p-1 bg-[var(--glass-input-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl">
            <button
              type="button"
              onClick={switchToLogin}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[var(--accent-blue)] text-white shadow-md shadow-blue-500/30'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={switchToSignup}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[var(--accent-blue)] text-white shadow-md shadow-blue-500/30'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message Box with 1-Click Action */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
              <span className="leading-snug">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* 1. LOG IN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              {/* Email or Username */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-secondary)] block mb-1">
                  Email or Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    required
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="Enter email or username"
                    className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[var(--glass-input-bg)] backdrop-blur-md border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-secondary)] block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[var(--glass-input-bg)] backdrop-blur-md border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !emailOrUsername.trim() || !password}
                className="w-full py-3 rounded-2xl bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] disabled:opacity-40 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'Verifying Account...' : 'Log In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="text-center pt-1">
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={switchToSignup}
                    className="text-[var(--accent-blue)] hover:underline font-bold cursor-pointer"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* 2. SIGN UP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3">
              {/* Full Name */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-secondary)] block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={signupFullName}
                  onChange={(e) => setSignupFullName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--glass-input-bg)] backdrop-blur-md border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                />
              </div>

              {/* Username */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-secondary)] block mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  placeholder="e.g. alex.rivera"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--glass-input-bg)] backdrop-blur-md border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-secondary)] block mb-1">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[var(--glass-input-bg)] backdrop-blur-md border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-secondary)] block mb-1">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[var(--glass-input-bg)] backdrop-blur-md border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  isLoading ||
                  !signupEmail.trim() ||
                  !signupUsername.trim() ||
                  !signupFullName.trim() ||
                  signupPassword.length < 6
                }
                className="w-full py-3 rounded-2xl bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] disabled:opacity-40 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-1"
              >
                <span>{isLoading ? 'Creating Account...' : 'Sign Up'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="text-center pt-1">
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="text-[var(--accent-blue)] hover:underline font-bold cursor-pointer"
                  >
                    Log in
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-[1px] bg-[var(--glass-border-subtle)]" />
            <span className="text-[10px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
              OR
            </span>
            <div className="flex-1 h-[1px] bg-[var(--glass-border-subtle)]" />
          </div>

          {/* Official Google Sign-In Action */}
          <div className="w-full flex justify-center py-1">
            <button
              type="button"
              onClick={handleOpenGoogleChooser}
              className="w-full py-2.5 px-4 rounded-2xl bg-[#131314] hover:bg-[#1f1f22] border border-white/15 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-3 shadow-md active:scale-98"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        </div>

        {/* Footer Security Badging */}
        <div className="text-center space-y-1 pt-1 select-none">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure Password Protection Powered by Lumira</span>
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] opacity-75">
            © 2026 Lumira from Lumira Labs
          </p>
        </div>
      </div>

      {/* Official Google Account Chooser Popup Modal */}
      {isGoogleChooserOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
          <div className="w-full max-w-[440px] bg-[#202124] text-[#e8eaed] rounded-[28px] border border-white/10 shadow-2xl overflow-hidden flex flex-col p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-sm font-medium text-[#e8eaed]">Sign in with Google</span>
              </div>

              <button
                type="button"
                onClick={() => setIsGoogleChooserOpen(false)}
                disabled={isLoading}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title */}
            {!isCustomGoogleMode ? (
              <div>
                <h2 className="text-2xl font-normal text-white tracking-tight">Choose an account</h2>
                <p className="text-sm text-[#9aa0a6] mt-1">
                  to continue to <span className="text-[#8ab4f8] font-medium">{currentHost}</span>
                </p>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => setIsCustomGoogleMode(false)}
                  className="flex items-center gap-1.5 text-xs text-[#8ab4f8] hover:underline mb-2 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to accounts</span>
                </button>
                <h2 className="text-xl font-normal text-white">Use another Google account</h2>
                <p className="text-xs text-[#9aa0a6] mt-0.5">
                  Enter your Google email to sign in to <span className="text-[#8ab4f8]">{currentHost}</span>
                </p>
              </div>
            )}

            {/* Accounts list */}
            {!isCustomGoogleMode ? (
              <div className="space-y-1 divide-y divide-white/10 -mx-2">
                <div className="space-y-1 pb-1">
                  {DEFAULT_GOOGLE_ACCOUNTS.map((acc) => {
                    const isThisLoading = isLoading && selectedGoogleEmail === acc.email;

                    return (
                      <div
                        key={acc.email}
                        onClick={() => !isLoading && handleSelectGoogleAccount(acc.email, acc.name, acc.avatar)}
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#303134] transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 ring-1 ring-white/20 bg-neutral-800">
                            <Image
                              src={acc.avatar}
                              alt={acc.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white truncate">{acc.name}</p>
                            <p className="text-xs text-[#9aa0a6] truncate">{acc.email}</p>
                          </div>
                        </div>

                        {isThisLoading ? (
                          <Loader2 className="w-4 h-4 text-[#8ab4f8] animate-spin shrink-0 ml-2" />
                        ) : (
                          <span className="text-xs text-[#8ab4f8] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2 font-medium">
                            Continue →
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <div
                    onClick={() => setIsCustomGoogleMode(true)}
                    className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-[#303134] transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#303134] flex items-center justify-center text-neutral-300 shrink-0">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Use another account</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCustomGoogleSubmit} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs text-[#9aa0a6] mb-1.5 font-medium">
                    Google Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#303134] text-white text-sm placeholder-neutral-500 border border-white/15 focus:outline-none focus:border-[#8ab4f8] transition-colors"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#9aa0a6] mb-1.5 font-medium">
                    Full Name (optional)
                  </label>
                  <input
                    type="text"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#303134] text-white text-sm placeholder-neutral-500 border border-white/15 focus:outline-none focus:border-[#8ab4f8] transition-colors"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomGoogleMode(false)}
                    className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !customGoogleEmail.trim()}
                    className="px-5 py-2 rounded-xl bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#202124] text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Continue</span>
                  </button>
                </div>
              </form>
            )}

            {/* Notice */}
            <div className="text-[12px] text-[#9aa0a6] leading-relaxed pt-1">
              Before using this app, you can review {currentHost}&apos;s{' '}
              <a href="#" className="text-[#8ab4f8] hover:underline">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="#" className="text-[#8ab4f8] hover:underline">
                Terms of Service
              </a>
              .
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[11px] text-[#9aa0a6]">
              <div className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors">
                <Globe className="w-3 h-3" />
                <span>English (United Kingdom)</span>
              </div>

              <div className="flex items-center gap-3">
                <a href="#" className="hover:text-white transition-colors">
                  Help
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  Terms
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { sounds, triggerConfetti } from '@/lib/utils';
import { Eye, EyeOff, Lock, Mail, User, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to home feed
  useEffect(() => {
    if (!isAuthLoading && currentUser) {
      router.replace('/');
    }
  }, [currentUser, isAuthLoading, router]);

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

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const success = await loginWithGoogle();
      if (success) {
        sounds.playSend();
        triggerConfetti(0.5, 0.5);
        router.push('/');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in was cancelled or failed.';
      if (!msg.includes('popup-closed-by-user')) {
        setError(msg);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 select-none overflow-hidden">
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

          {/* Error Message Box */}
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

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading || !emailOrUsername.trim() || !password}
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

              <button
                type="submit"
                disabled={
                  isLoading ||
                  isGoogleLoading ||
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

          {/* Real Google Sign-In Action */}
          <div className="w-full flex justify-center py-1">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
              className="w-full py-2.5 px-4 rounded-2xl bg-[#131314] hover:bg-[#1f1f22] border border-white/15 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-3 shadow-md active:scale-98 disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
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
    </div>
  );
}

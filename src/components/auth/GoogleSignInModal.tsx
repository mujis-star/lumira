'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (email: string, displayName: string, avatarUrl?: string) => void;
  savedAccounts: UserProfile[];
}

export function GoogleSignInModal({
  isOpen,
  onClose,
  onSelectAccount,
  savedAccounts,
}: GoogleSignInModalProps) {
  // Step: 'choose' | 'email' | 'password'
  const [step, setStep] = useState<'choose' | 'email' | 'password'>('choose');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleAccountClick = (email: string, displayName: string, avatarUrl?: string) => {
    setIsVerifying(true);
    setTimeout(() => {
      onSelectAccount(email, displayName, avatarUrl);
      setIsVerifying(false);
      onClose();
    }, 600);
  };

  const handleEmailNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setError(null);
    setStep('password');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput || passwordInput.length < 6) {
      setError('Wrong password. Try again or click Forgot password to reset it.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    setTimeout(() => {
      const email = emailInput.includes('@') ? emailInput.trim() : `${emailInput.trim()}@gmail.com`;
      const displayName = nameInput.trim() || email.split('@')[0];
      onSelectAccount(email, displayName);
      setIsVerifying(false);
      onClose();
    }, 700);
  };

  const resetToChoose = () => {
    setStep('choose');
    setError(null);
    setPasswordInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
      {/* Modal Container mimicking Google Chrome Popup */}
      <div className="relative w-full max-w-[440px] bg-[#1f1f1f] text-[#e3e3e3] rounded-3xl border border-[#3c4043] shadow-2xl overflow-hidden font-sans">
        {/* Google Window Top Bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          {/* Google Logo & "Sign in with Google" */}
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span className="text-sm font-medium text-[#e3e3e3]">Sign in with Google</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Loading Progress Bar */}
        {isVerifying && (
          <div className="w-full h-1 bg-[#282a2d] overflow-hidden">
            <div className="w-full h-full bg-[#8ab4f8] animate-pulse" />
          </div>
        )}

        {/* Main Body */}
        <div className="px-8 pt-4 pb-6 space-y-6 min-h-[380px]">
          {/* STEP 1: CHOOSE AN ACCOUNT */}
          {step === 'choose' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-normal text-[#e3e3e3] tracking-tight">
                  Choose an account
                </h2>
                <p className="text-xs text-[#c4c7c5] mt-1">
                  to continue to <span className="text-[#8ab4f8] font-medium">lumir-a.vercel.app</span>
                </p>
              </div>

              {/* Accounts List Container */}
              <div className="border-t border-b border-[#3c4043] divide-y divide-[#3c4043]">
                {/* Default Featured Account: Mujeeb Rahman */}
                <button
                  type="button"
                  onClick={() =>
                    handleAccountClick('mujee00012@gmail.com', 'Mujeeb Rahman', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80')
                  }
                  className="w-full flex items-center gap-3.5 py-3.5 px-2 hover:bg-[#282a2d] rounded-xl transition-colors text-left cursor-pointer group"
                >
                  <div className="relative w-9 h-9 rounded-full overflow-hidden bg-purple-700 ring-1 ring-white/10 shrink-0">
                    <Image
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80"
                      alt="Mujeeb Rahman"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#e3e3e3] group-hover:text-white truncate">
                      Mujeeb Rahman
                    </p>
                    <p className="text-[11px] text-[#9aa0a6] truncate">mujee00012@gmail.com</p>
                  </div>
                </button>

                {/* Other Saved Accounts */}
                {savedAccounts
                  .filter((acc): acc is UserProfile & { email: string } => !!acc.email && acc.email !== 'mujee00012@gmail.com')
                  .slice(0, 3)
                  .map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleAccountClick(acc.email, acc.displayName, acc.avatarUrl)}
                      className="w-full flex items-center gap-3.5 py-3.5 px-2 hover:bg-[#282a2d] rounded-xl transition-colors text-left cursor-pointer group"
                    >
                      <div className="relative w-9 h-9 rounded-full overflow-hidden bg-neutral-700 ring-1 ring-white/10 shrink-0 flex items-center justify-center text-xs font-bold">
                        {acc.avatarUrl ? (
                          <Image src={acc.avatarUrl} alt={acc.displayName} fill className="object-cover" unoptimized />
                        ) : (
                          <span>{acc.displayName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-[#e3e3e3] group-hover:text-white truncate">
                          {acc.displayName}
                        </p>
                        <p className="text-[11px] text-[#9aa0a6] truncate">{acc.email}</p>
                      </div>
                    </button>
                  ))}

                {/* "Use another account" */}
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full flex items-center gap-3.5 py-3.5 px-2 hover:bg-[#282a2d] rounded-xl transition-colors text-left cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-full bg-[#282a2d] group-hover:bg-[#3c4043] flex items-center justify-center text-[#c4c7c5] shrink-0">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#e3e3e3] group-hover:text-white">
                      Use another account
                    </p>
                  </div>
                </button>
              </div>

              {/* Privacy Disclaimer */}
              <p className="text-[11px] text-[#9aa0a6] leading-relaxed">
                Before using this app, you can review lumir-a.vercel.app&apos;s{' '}
                <span className="text-[#8ab4f8] hover:underline cursor-pointer">Privacy Policy</span> and{' '}
                <span className="text-[#8ab4f8] hover:underline cursor-pointer">Terms of Service</span>.
              </p>
            </div>
          )}

          {/* STEP 2: ENTER EMAIL / PHONE */}
          {step === 'email' && (
            <form onSubmit={handleEmailNext} className="space-y-6">
              <div>
                <button
                  type="button"
                  onClick={resetToChoose}
                  className="flex items-center gap-1 text-xs text-[#8ab4f8] hover:underline mb-3 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to accounts</span>
                </button>
                <h2 className="text-2xl font-normal text-[#e3e3e3] tracking-tight">Sign in</h2>
                <p className="text-xs text-[#c4c7c5] mt-1">
                  to continue to <span className="text-[#8ab4f8] font-medium">lumir-a.vercel.app</span>
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#9aa0a6] block">
                    Email or phone
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter your Gmail address"
                    className="w-full px-4 py-3 rounded-lg bg-transparent border border-[#8ab4f8] text-xs text-[#e3e3e3] focus:outline-none focus:ring-1 focus:ring-[#8ab4f8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#9aa0a6] block">
                    Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Your Google profile name"
                    className="w-full px-4 py-2.5 rounded-lg bg-transparent border border-[#3c4043] text-xs text-[#e3e3e3] focus:outline-none focus:border-[#8ab4f8]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={resetToChoose}
                  className="text-xs text-[#8ab4f8] hover:underline font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!emailInput.trim()}
                  className="px-6 py-2 rounded-full bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#041e49] text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer shadow"
                >
                  Next
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: ENTER PASSWORD */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="flex items-center gap-1 text-xs text-[#8ab4f8] hover:underline mb-3 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change account</span>
                </button>
                <h2 className="text-2xl font-normal text-[#e3e3e3] tracking-tight">Welcome</h2>
                <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full border border-[#3c4043] w-fit bg-[#282a2d]">
                  <div className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-bold">
                    {emailInput.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-[#e3e3e3]">{emailInput}</span>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/40 text-red-300 text-xs">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#9aa0a6] block">
                    Enter your password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Password"
                      className="w-full px-4 py-3 rounded-lg bg-transparent border border-[#8ab4f8] text-xs text-[#e3e3e3] focus:outline-none focus:ring-1 focus:ring-[#8ab4f8]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-[#c4c7c5] cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="rounded border-[#3c4043] text-[#8ab4f8] focus:ring-0"
                  />
                  <span>Show password</span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-xs text-[#8ab4f8] hover:underline font-medium cursor-pointer"
                >
                  Forgot password?
                </button>
                <button
                  type="submit"
                  disabled={!passwordInput}
                  className="px-6 py-2 rounded-full bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#041e49] text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer shadow"
                >
                  {isVerifying ? 'Verifying...' : 'Next'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Google Footer */}
        <div className="flex items-center justify-between px-8 py-3.5 bg-[#181818] border-t border-[#3c4043] text-[11px] text-[#9aa0a6]">
          <span className="hover:text-white cursor-pointer">English (United Kingdom)</span>
          <div className="flex items-center gap-4">
            <span className="hover:text-white cursor-pointer">Help</span>
            <span className="hover:text-white cursor-pointer">Privacy</span>
            <span className="hover:text-white cursor-pointer">Terms</span>
          </div>
        </div>
      </div>
    </div>
  );
}

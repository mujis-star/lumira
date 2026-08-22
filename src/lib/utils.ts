import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import confetti from 'canvas-confetti';
import { FilterPreset } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(dateInput: string | Date | number): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 30) return 'just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

// Web Audio API Synthesizers for UI feedback without external MP3 dependencies
class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playPop() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Ignore audio failure if restricted by browser policy
    }
  }

  playHeartBurst() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(640, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Ignore audio failure
    }
  }

  playSend() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1040, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Ignore
    }
  }

  playCamera() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.setValueAtTime(240, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Ignore
    }
  }
}

export const sounds = new SoundSynthesizer();

export function triggerConfetti(originX = 0.5, originY = 0.6) {
  try {
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { x: originX, y: originY },
      colors: ['#8B5CF6', '#06B6D4', '#F43F5E', '#10B981', '#F59E0B'],
      ticks: 200,
    });
  } catch {
    // Ignore confetti errors
  }
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'normal',
    name: 'Original',
    cssFilter: 'none',
    thumbnailClass: 'filter-none',
  },
  {
    id: 'aurora',
    name: 'Aurora Glow',
    cssFilter: 'contrast(1.15) saturate(1.35) hue-rotate(-10deg) brightness(1.05)',
    thumbnailClass: 'contrast-115 saturate-135',
  },
  {
    id: 'cyber',
    name: 'Cyberpunk',
    cssFilter: 'contrast(1.25) saturate(1.4) hue-rotate(15deg) brightness(0.95)',
    thumbnailClass: 'contrast-125 saturate-140',
  },
  {
    id: 'velvet',
    name: 'Velvet Film',
    cssFilter: 'sepia(0.2) contrast(1.05) brightness(1.05) saturate(0.9)',
    thumbnailClass: 'sepia-20 contrast-105',
  },
  {
    id: 'golden',
    name: 'Sol Sunset',
    cssFilter: 'sepia(0.35) saturate(1.4) contrast(1.1) brightness(1.08)',
    thumbnailClass: 'sepia-35 saturate-140',
  },
  {
    id: 'noir',
    name: 'Noir Luxe',
    cssFilter: 'grayscale(1) contrast(1.35) brightness(0.95)',
    thumbnailClass: 'grayscale contrast-135',
  },
  {
    id: 'crisp',
    name: 'Prism Crisp',
    cssFilter: 'contrast(1.3) saturate(1.2) brightness(1.1)',
    thumbnailClass: 'contrast-130 brightness-110',
  },
];

export function extractTagsAndMentions(text: string): { tags: string[]; mentions: string[] } {
  const tagMatches = text.match(/#([\w\u0590-\u05ff]+)/g) || [];
  const mentionMatches = text.match(/@([\w.]+)/g) || [];

  return {
    tags: tagMatches.map((t) => t.slice(1).toLowerCase()),
    mentions: mentionMatches.map((m) => m.slice(1).toLowerCase()),
  };
}

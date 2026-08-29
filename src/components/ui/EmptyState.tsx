'use client';

import React from 'react';
import { Sparkles, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  suggestions?: string[];
  onSelectSuggestion?: (s: string) => void;
}

export function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  actionLabel,
  onAction,
  suggestions,
  onSelectSuggestion,
}: EmptyStateProps) {
  return (
    <div className="w-full max-w-md mx-auto py-12 px-6 rounded-3xl bg-[var(--glass-card-bg)] backdrop-blur-2xl border border-[var(--glass-border)] text-center space-y-4 select-none shadow-[var(--glass-shadow)] animate-in fade-in">
      {/* Icon Emblem */}
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-blue-500/20 border border-[var(--glass-border)] text-[var(--accent-blue)] flex items-center justify-center mx-auto shadow-inner">
        <Icon className="w-7 h-7 stroke-[1.75]" />
      </div>

      {/* Typography */}
      <div className="space-y-1">
        <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {/* Action Button */}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white text-xs font-bold shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}

      {/* Suggestions Pills if applicable */}
      {suggestions && suggestions.length > 0 && onSelectSuggestion && (
        <div className="pt-2 border-t border-[var(--glass-border-subtle)] space-y-2">
          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
            Popular Suggestions
          </span>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSelectSuggestion(s)}
                className="px-3 py-1 rounded-full bg-[var(--glass-input-bg)] hover:bg-[var(--glass-bg-hover)] border border-[var(--glass-border-subtle)] text-[11px] text-[var(--text-primary)] font-medium transition-colors cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

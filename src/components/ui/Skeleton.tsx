'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-[var(--glass-border-subtle)] ${className}`}
    />
  );
}

export function SkeletonPost() {
  return (
    <div className="w-full rounded-3xl bg-[var(--glass-card-bg)] backdrop-blur-2xl border border-[var(--glass-border)] shadow-[var(--glass-shadow)] p-4 space-y-3.5 select-none">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="w-24 h-3.5" />
            <Skeleton className="w-16 h-2.5" />
          </div>
        </div>
        <Skeleton className="w-6 h-6 rounded-lg" />
      </div>

      {/* Media Skeleton (4:5 / 1:1) */}
      <Skeleton className="w-full aspect-[4/5] rounded-2xl" />

      {/* Action Buttons Skeleton */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="w-6 h-6 rounded-full" />
        </div>
        <Skeleton className="w-6 h-6 rounded-lg" />
      </div>

      {/* Likes & Caption Skeleton */}
      <div className="space-y-2 pt-1">
        <Skeleton className="w-20 h-3" />
        <Skeleton className="w-3/4 h-3" />
        <Skeleton className="w-1/2 h-2.5" />
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="w-full space-y-6 select-none max-w-4xl mx-auto py-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-3xl bg-[var(--glass-card-bg)] border border-[var(--glass-border)]">
        <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-full shrink-0" />
        <div className="flex-1 space-y-3 w-full text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Skeleton className="w-32 h-5" />
            <Skeleton className="w-24 h-8 rounded-xl" />
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-6">
            <Skeleton className="w-16 h-4" />
            <Skeleton className="w-16 h-4" />
            <Skeleton className="w-16 h-4" />
          </div>
          <Skeleton className="w-48 h-3.5" />
          <Skeleton className="w-64 h-3" />
        </div>
      </div>

      {/* 3x3 Grid Skeleton */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonNotification() {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border-subtle)]">
      <div className="flex items-center gap-3 min-w-0">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="space-y-1.5 min-w-0 flex-1">
          <Skeleton className="w-36 h-3" />
          <Skeleton className="w-20 h-2.5" />
        </div>
      </div>
      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
    </div>
  );
}

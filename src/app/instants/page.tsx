'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { useInstants } from '@/context/InstantContext';
import { InstantCard } from '@/components/instants/InstantCard';

const CreateInstantModal = dynamic(
  () => import('@/components/instants/CreateInstantModal').then((m) => m.CreateInstantModal),
  { ssr: false }
);
const InstantViewerModal = dynamic(
  () => import('@/components/instants/InstantViewerModal').then((m) => m.InstantViewerModal),
  { ssr: false }
);
import {
  ArrowLeft,
  Plus,
  Zap,
  Sparkles,
  Calendar,
} from 'lucide-react';

export default function InstantsPage() {
  const router = useRouter();
  const {
    todayInstants,
    thisWeekInstants,
    openInstantViewer,
    isCreatorOpen,
    openInstantCreator,
    closeInstantCreator,
  } = useInstants();

  return (
    <AppShell title="Instants">
      <div className="max-w-4xl mx-auto py-2 sm:py-6 px-3 sm:px-6 space-y-8 select-none">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 rounded-3xl bg-[var(--glass-card-bg)] backdrop-blur-3xl border border-[var(--glass-border)] shadow-[var(--glass-shadow)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 rounded-2xl bg-[var(--glass-bg-hover)] text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)]/80 transition-colors cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-md">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[var(--text-primary)] leading-tight">
                  Lumira Instants
                </h1>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  24-Hour Ephemeral Moments & Media
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openInstantCreator}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#0095f6] to-[#7857ff] hover:from-[#1877f2] hover:to-[#6842ff] text-white text-xs font-bold shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Create Instant</span>
            </button>
          </div>
        </div>

        {/* SECTION 1: TODAY (3-Column Responsive Grid) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Today ({todayInstants.length})
              </h2>
            </div>
            <span className="text-xs text-[var(--text-secondary)]">
              Active within 24 hours
            </span>
          </div>

          {todayInstants.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {todayInstants.map((instant) => (
                <InstantCard
                  key={instant.id}
                  instant={instant}
                  onClick={() => openInstantViewer(instant.id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 px-4 rounded-3xl bg-[var(--glass-card-bg)] border border-[var(--glass-border)] text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 fill-current" />
              </div>
              <p className="text-sm font-bold text-[var(--text-primary)]">
                No active Instants for today
              </p>
              <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
                Be the first to share an ephemeral 24-hour instant photo or video!
              </p>
              <button
                type="button"
                onClick={openInstantCreator}
                className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Create Instant
              </button>
            </div>
          )}
        </div>

        {/* SECTION 2: THIS WEEK (Previous History) */}
        <div className="space-y-4 pt-4 border-t border-[var(--glass-border-subtle)]">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                This Week ({thisWeekInstants.length})
              </h2>
            </div>
            <span className="text-xs text-[var(--text-secondary)]">
              Previous moments grouped by day
            </span>
          </div>

          {thisWeekInstants.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {thisWeekInstants.map((instant) => (
                <InstantCard
                  key={instant.id}
                  instant={instant}
                  onClick={() => openInstantViewer(instant.id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-8 px-4 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border-subtle)] text-center text-xs text-[var(--text-secondary)]">
              No previous Instants from earlier this week.
            </div>
          )}
        </div>
      </div>

      {/* Instant Creator Modal */}
      <CreateInstantModal
        isOpen={isCreatorOpen}
        onClose={closeInstantCreator}
      />

      {/* Instant Viewer Modal */}
      <InstantViewerModal />
    </AppShell>
  );
}

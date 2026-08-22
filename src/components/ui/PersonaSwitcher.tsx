'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useIsMounted } from '@/lib/useIsMounted';
import { Avatar } from './Avatar';
import { Users, ChevronDown, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PersonaSwitcher() {
  const { currentUser, allUsers, switchPersona } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const mounted = useIsMounted();

  if (!mounted || !currentUser) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-button text-xs text-neutral-400 opacity-60">
        <span className="w-4 h-4 rounded-full bg-violet-600/40 animate-pulse" />
        <span>Demo</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl glass-button text-xs font-medium text-neutral-300 hover:text-white transition-all cursor-pointer group"
        title="Switch demo creator persona"
      >
        <div className="flex items-center gap-1.5">
          <Avatar src={currentUser.avatarUrl} alt={currentUser.displayName} size="xs" />
          <span className="font-semibold text-white truncate max-w-[100px]">
            {currentUser.displayName.replace('✦', '').trim()}
          </span>
        </div>
        <span className="px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-300 text-[10px] font-mono border border-violet-500/30">
          Demo
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-72 rounded-2xl glass-panel shadow-2xl border border-white/15 p-2 z-50 overflow-hidden"
            >
              <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  Switch Creator Persona
                </div>
                <span className="text-[10px] text-violet-400 flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3" /> Live
                </span>
              </div>

              <div className="py-1 max-h-64 overflow-y-auto space-y-1">
                {allUsers.map((user) => {
                  const isSelected = user.id === currentUser.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        switchPersona(user.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-violet-600/20 border border-violet-500/30 text-white'
                          : 'hover:bg-white/5 text-neutral-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          src={user.avatarUrl}
                          alt={user.displayName}
                          size="sm"
                          isVerified={user.isVerified}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white truncate">
                            {user.displayName}
                          </p>
                          <p className="text-[11px] text-neutral-400 truncate">
                            @{user.username}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-violet-400 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

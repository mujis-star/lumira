'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!isOffline && !showReconnected) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-in fade-in duration-200">
      {isOffline ? (
        <div className="px-4 py-2 rounded-2xl bg-rose-500/90 text-white backdrop-blur-xl border border-rose-400/40 shadow-xl flex items-center gap-2 text-xs font-bold">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>You appear offline. Some features may be unavailable.</span>
        </div>
      ) : showReconnected ? (
        <div className="px-4 py-2 rounded-2xl bg-emerald-500/90 text-white backdrop-blur-xl border border-emerald-400/40 shadow-xl flex items-center gap-2 text-xs font-bold">
          <Wifi className="w-4 h-4 shrink-0" />
          <span>Internet connection restored.</span>
        </div>
      ) : null}
    </div>
  );
}

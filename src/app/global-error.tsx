'use client';

import React from 'react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#07070b] text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="w-full max-w-md bg-neutral-900/80 border border-white/10 shadow-2xl rounded-3xl p-8 space-y-4">
          <h2 className="text-xl font-bold text-white">Application Notice</h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Lumira encountered a critical runtime error. Click below to refresh.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="px-6 py-2.5 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-transform active:scale-95 cursor-pointer"
          >
            Reload Lumira
          </button>
        </div>
      </body>
    </html>
  );
}

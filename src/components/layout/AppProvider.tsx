'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const hydrateStore = useAppStore(state => state.hydrateStore);
  const hydrated = useAppStore(state => state.hydrated);

  useEffect(() => {
    hydrateStore();
  }, [hydrateStore]);

  if (!hydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent dark:border-indigo-400"></div>
          <p className="text-sm font-medium tracking-wide">Hydrating storage...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

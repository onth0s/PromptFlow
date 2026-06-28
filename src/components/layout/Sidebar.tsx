'use client';

import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  activeTab: 'filter' | 'tree';
  onChangeTab: (tab: 'filter' | 'tree') => void;
  children: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  activeTab,
  onChangeTab,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <aside className="w-80 border-r border-zinc-200 bg-white flex flex-col h-[calc(100vh-3.5rem)] dark:border-zinc-800 dark:bg-zinc-900 select-none">
      {/* Sidebar Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => onChangeTab('filter')}
          className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider text-center border-b-2 cursor-pointer transition-colors ${
            activeTab === 'filter'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Filters & Sorting
        </button>
        <button
          onClick={() => onChangeTab('tree')}
          className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider text-center border-b-2 cursor-pointer transition-colors ${
            activeTab === 'tree'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Lineage Tree
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </aside>
  );
};

'use client';

import React, { useState } from 'react';
import { Button, Input } from '../ui';

interface EmptyWorkspaceStateProps {
  onCreateWorkspace: (name: string) => void;
}

export const EmptyWorkspaceState: React.FC<EmptyWorkspaceStateProps> = ({
  onCreateWorkspace,
}) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateWorkspace(name.trim());
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950 text-center">
      <div className="max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12h1.5m16.5 0h1.5m-18 0a9 9 0 1118 0 9 9 0 01-18 0z"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">Welcome to PromptFlow</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          To get started tracking your multimodal prompt variations and versions, please create your first workspace.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-2">
          <Input
            type="text"
            placeholder="e.g. Anime Generation, Copywriting"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            aria-label="New Workspace Name"
          />
          <Button variant="primary" type="submit" className="w-full">
            Create Workspace
          </Button>
        </form>
      </div>
    </div>
  );
};

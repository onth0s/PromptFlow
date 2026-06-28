'use client';

import React from 'react';
import { Button } from '../ui';

interface EmptyNodeStateProps {
  workspaceName: string;
  onCreateFirstNode: () => void;
}

export const EmptyNodeState: React.FC<EmptyNodeStateProps> = ({
  workspaceName,
  onCreateFirstNode,
}) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-zinc-950">
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
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">Empty Workspace</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Welcome to <span className="font-semibold text-zinc-800 dark:text-zinc-200">{workspaceName}</span>! There are no prompt nodes in this workspace yet.
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Create your first node to begin versioning and running generation trials.
        </p>

        <div className="mt-6">
          <Button variant="primary" onClick={onCreateFirstNode} className="w-full">
            Create First Prompt Node
          </Button>
        </div>
      </div>
    </div>
  );
};

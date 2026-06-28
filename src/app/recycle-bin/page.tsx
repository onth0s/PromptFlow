'use client';

import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../../components/ui';
import { RetentionDays, RETENTION_DAYS_OPTIONS } from '../../lib/constants';
import Link from 'next/link';

export default function RecycleBinPage() {
  const workspaces = useAppStore((state) => state.workspaces);
  const promptNodes = useAppStore((state) => state.promptNodes);
  const generations = useAppStore((state) => state.generations);
  
  const recycleBinRetentionDays = useAppStore((state) => state.recycleBinRetentionDays);
  const setRetentionDays = useAppStore((state) => state.setRetentionDays);
  const restorePromptNode = useAppStore((state) => state.restorePromptNode);
  const restoreGeneration = useAppStore((state) => state.restoreGeneration);
  const emptyRecycleBin = useAppStore((state) => state.emptyRecycleBin);

  // Filter soft-deleted items
  const deletedNodes = Object.values(promptNodes).filter((n) => n.deletedAt);
  const deletedGenerations = Object.values(generations).filter((g) => g.deletedAt);

  const handleRestoreNode = async (id: string) => {
    await restorePromptNode(id);
  };

  const handleRestoreGen = async (id: string) => {
    await restoreGeneration(id);
  };

  const calculateDaysRemaining = (deletedAtStr: string) => {
    const deletedAt = new Date(deletedAtStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - deletedAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const remaining = recycleBinRetentionDays - diffDays;
    return remaining < 0 ? 0 : remaining;
  };

  const handleEmptyBin = async () => {
    if (confirm('Are you sure you want to permanently delete all items in the Recycle Bin? This action is irreversible.')) {
      await emptyRecycleBin();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 flex flex-col">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              ← Back to Workspace
            </Link>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
            Recycle Bin
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Restore soft-deleted items or permanently purge them.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Retention Settings Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500">Retention:</span>
            <select
              value={recycleBinRetentionDays}
              onChange={(e) => setRetentionDays(parseInt(e.target.value) as RetentionDays)}
              className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {RETENTION_DAYS_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  {days} Days
                </option>
              ))}
            </select>
          </div>

          {(deletedNodes.length > 0 || deletedGenerations.length > 0) && (
            <Button variant="danger" size="sm" onClick={handleEmptyBin}>
              Empty Bin
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-6 space-y-8 max-w-4xl w-full mx-auto">
        {deletedNodes.length === 0 && deletedGenerations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
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
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25m-2.25-2.25l-2.25 2.25m2.25-2.25l2.25-2.25M3.75 5.25h16.5m-18 0a1.5 1.5 0 0 1 1.5-1.5h13.5a1.5 1.5 0 0 1 1.5 1.5m-18 0v1.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-1.5"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Recycle Bin is empty</h2>
            <p className="mt-1 text-xs text-zinc-500">Deleted workspaces, nodes, and generations will appear here.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Deleted Nodes Section */}
            {deletedNodes.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Deleted Prompt Nodes ({deletedNodes.length})
                </h2>
                <div className="space-y-3">
                  {deletedNodes.map((node) => {
                    const daysLeft = calculateDaysRemaining(node.deletedAt || '');
                    const nodeWorkspace = workspaces[node.workspaceId];
                    return (
                      <div
                        key={node.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 shadow-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                              {node.versionTag}
                            </span>
                            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                              {node.name}
                            </span>
                            {nodeWorkspace && (
                              <span className="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                Workspace: {nodeWorkspace.name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 italic max-w-lg line-clamp-1">
                            &ldquo;{node.commitMessage}&rdquo;
                          </p>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-2 py-1 rounded-md">
                            {daysLeft === 0 ? 'Purges soon' : `${daysLeft} days left`}
                          </span>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRestoreNode(node.id)}
                            className="py-1 px-3 text-xs"
                          >
                            Restore
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Deleted Generations Section */}
            {deletedGenerations.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Deleted Generations ({deletedGenerations.length})
                </h2>
                <div className="space-y-3">
                  {deletedGenerations.map((gen) => {
                    const daysLeft = calculateDaysRemaining(gen.deletedAt || '');
                    const node = promptNodes[gen.promptNodeId];
                    return (
                      <div
                        key={gen.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 shadow-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                              Generation Output run
                            </span>
                            {node && (
                              <span className="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                Prompt: {node.versionTag}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 max-w-lg line-clamp-1">
                            {gen.output.status === 'Completed' ? gen.output.text : `Status: ${gen.output.status}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-2 py-1 rounded-md">
                            {daysLeft === 0 ? 'Purges soon' : `${daysLeft} days left`}
                          </span>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRestoreGen(gen.id)}
                            className="py-1 px-3 text-xs"
                          >
                            Restore
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

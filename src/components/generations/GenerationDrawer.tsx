'use client';

import React from 'react';
import { Generation, PromptNode } from '../../types';
import { Badge, Button } from '../ui';
import { LocalImage } from '../ui/LocalImage';

interface GenerationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  node: PromptNode;
  generations: Generation[];
  onAddGeneration: () => void;
  onDeleteGeneration: (id: string) => void;
  onRetryGeneration: (gen: Generation) => void;
}

export const GenerationDrawer: React.FC<GenerationDrawerProps> = ({
  isOpen,
  onClose,
  node,
  generations,
  onAddGeneration,
  onDeleteGeneration,
  onRetryGeneration,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />

      {/* Drawer */}
      <div className="relative z-10 w-full max-w-lg border-l border-zinc-200 bg-white flex flex-col h-full shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {node.versionTag}
              </span>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]">
                {node.name}
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">Generations history list</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-pointer"
            aria-label="Close panel"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl p-3 border border-indigo-100/50 dark:border-indigo-900/30">
            <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
              Have a new generation output to log?
            </span>
            <Button variant="primary" size="sm" onClick={onAddGeneration} className="text-xs">
              Log Generation
            </Button>
          </div>

          {generations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">No generations logged</p>
              <p className="text-xs text-zinc-400 mt-0.5">Click the button above to record your first run output.</p>
            </div>
          ) : (
            generations.map((gen) => {
              const genDate = new Date(gen.createdAt).toLocaleString(undefined, {
                dateStyle: 'short',
                timeStyle: 'short',
              });

              return (
                <div
                  key={gen.id}
                  className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/50 shadow-xs space-y-3"
                >
                  {/* Status, Provider & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {gen.output.status === 'Completed' && <Badge variant="success">Completed</Badge>}
                      {gen.output.status === 'Failed' && <Badge variant="danger">Failed</Badge>}
                      {gen.output.status === 'Queued' && <Badge variant="primary">Queued</Badge>}

                      {(gen.provider || gen.model) && (
                        <span className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold truncate max-w-[180px]">
                          {gen.provider ? `${gen.provider}: ` : ''}{gen.model || ''}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {gen.output.status === 'Failed' && (
                        <button
                          onClick={() => onRetryGeneration(gen)}
                          className="p-1 rounded-md text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30 transition-colors text-xs font-semibold cursor-pointer"
                          title="Retry Generation"
                        >
                          Retry
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteGeneration(gen.id)}
                        className="p-1 rounded-md text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:text-zinc-600 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                        aria-label="Delete Generation"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="h-4 w-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Timing metadata */}
                  <div className="flex justify-between items-center text-[10px] text-zinc-400">
                    <span>{genDate}</span>
                    {gen.duration !== undefined && (
                      <span>{gen.duration}ms</span>
                    )}
                  </div>

                  {/* Output content depending on status */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-sm">
                    {gen.output.status === 'Completed' && (
                      <div className="space-y-3">
                        {gen.output.text && (
                          <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">
                            {gen.output.text}
                          </p>
                        )}
                        {gen.output.imageId && (
                          <div className="max-w-xs mt-2 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                            <LocalImage imageId={gen.output.imageId} alt="Generation Output" className="w-full h-auto object-cover max-h-48" />
                          </div>
                        )}
                      </div>
                    )}

                    {gen.output.status === 'Failed' && (
                      <p className="text-rose-600 dark:text-rose-400 font-mono text-xs bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg border border-rose-100 dark:border-rose-950/30">
                        {gen.output.error}
                      </p>
                    )}

                    {gen.output.status === 'Queued' && (
                      <p className="text-zinc-500 dark:text-zinc-500 italic text-xs">
                        Output queued. Perform run manually or record output details here.
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { PromptNodeWithChildren, Generation } from '../../types';
import { Badge, Button } from '../ui';
import { LocalImage } from '../ui/LocalImage';

interface PromptNodeCardProps {
  node: PromptNodeWithChildren;
  generations: Generation[];
  isSelected: boolean;
  onSelect: () => void;
  onViewGenerations: () => void;
  onEditMeta: () => void;
  onDeleteNode: () => void;
  onCreateNewVersion: () => void;
  onForkNode: () => void;
  onToggleFavorite: () => void;
}

export const PromptNodeCard: React.FC<PromptNodeCardProps> = ({
  node,
  generations,
  isSelected,
  onSelect,
  onViewGenerations,
  onEditMeta,
  onDeleteNode,
  onCreateNewVersion,
  onForkNode,
  onToggleFavorite,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.promptText) {
      try {
        await navigator.clipboard.writeText(node.promptText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1500);
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

  const formattedDate = new Date(node.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const formattedUpdatedDate = new Date(node.updatedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const hasBeenUpdated = node.updatedAt !== node.createdAt;

  // Count active generations
  const activeGenerations = generations.filter(g => !g.deletedAt);
  const genCount = activeGenerations.length;

  const displayPrompt = node.promptText || '';
  const isLongPrompt = displayPrompt.length > 180;
  const truncatedPrompt = isLongPrompt ? `${displayPrompt.slice(0, 180)}...` : displayPrompt;

  return (
    <article
      id={`node-card-${node.id}`}
      onClick={onSelect}
      className={`group relative flex flex-col rounded-xl border bg-white p-5 shadow-xs transition-all hover:shadow-md dark:bg-zinc-900 ${
        isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500/20'
          : 'border-zinc-200 dark:border-zinc-800'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {node.versionTag}
            </span>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[120px]">
              {node.name}
            </span>
          </div>
          <span
            className="text-[10px] text-zinc-500 cursor-help"
            title={hasBeenUpdated ? `Updated at ${formattedUpdatedDate}` : undefined}
          >
            {formattedDate} {hasBeenUpdated && '*'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Favorite Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${
              node.isFavorite ? 'text-amber-500' : 'text-zinc-400 dark:text-zinc-600'
            }`}
            aria-label={node.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={node.isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499c.172-.436.745-.436.917 0a2.024 2.024 0 0 1 1.258 1.258c.271.693.84 1.212 1.53 1.39l2.428.625c.475.122.664.717.321 1.08l-1.84 1.948a2.022 2.022 0 0 1-.504 1.57l.534 2.401c.105.474-.415.864-.827.608L12.98 13.24a2.023 2.023 0 0 1-1.96 0l-2.32 1.442c-.412.256-.932-.134-.827-.608l.534-2.401a2.023 2.023 0 0 1-.504-1.57l-1.84-1.948c-.343-.363-.154-.958.321-1.08l2.428-.625a2.024 2.024 0 0 1 1.53-1.39l1.258-1.259z"
              />
            </svg>
          </button>

          {/* Quick Copy Prompt Button */}
          {node.promptText && (
            <button
              onClick={handleCopy}
              className={`p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${
                isCopied ? 'text-emerald-500' : 'text-zinc-400 dark:text-zinc-600'
              }`}
              title={isCopied ? "Copied!" : "Copy Prompt Text"}
              aria-label="Copy prompt content to clipboard"
            >
              {isCopied ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.875c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                  />
                </svg>
              )}
            </button>
          )}

          {/* Context Options menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditMeta();
              }}
              className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-600 transition-colors cursor-pointer"
              aria-label="Edit node details"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 20.013a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Body: Modality badges */}
      <div className="flex gap-1.5 mt-3 select-none">
        <Badge variant="neutral">In: {node.inputModality}</Badge>
        <Badge variant="neutral">Out: {node.outputModality}</Badge>
      </div>

      {/* Body: Prompt Content */}
      <div className="mt-3.5 flex-1">
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 break-words font-sans whitespace-pre-wrap">
          {isExpanded ? displayPrompt : truncatedPrompt}
        </p>
        {isLongPrompt && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="mt-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer transition-colors"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
        {node.promptImageId && (
          <div className="mt-3.5 max-w-[150px] overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
            <LocalImage imageId={node.promptImageId} alt="Prompt input thumbnail" className="w-full h-auto object-cover max-h-32" />
          </div>
        )}
      </div>

      {/* Commit message & metadata */}
      <div className="mt-4 border-l-2 border-zinc-200 pl-3 dark:border-zinc-800">
        <p className="text-xs italic text-zinc-500 line-clamp-2">
          &ldquo;{node.commitMessage}&rdquo;
        </p>
      </div>

      {/* Tags */}
      {node.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1">
          {node.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="px-1.5 py-0">
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewGenerations();
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
        >
          <span>{genCount} {genCount === 1 ? 'generation' : 'generations'}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <div className="flex gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onForkNode();
            }}
            className="text-[11px] py-1 px-2.5"
          >
            Fork
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onCreateNewVersion();
            }}
            className="text-[11px] py-1 px-2.5"
          >
            New Version
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNode();
            }}
            className="text-[11px] py-1 px-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
          >
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
};

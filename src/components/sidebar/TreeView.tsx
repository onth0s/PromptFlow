'use client';

import React from 'react';
import { PromptNodeWithChildren } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { useSelectionStore } from '../../store/useSelectionStore';

export const TreeView: React.FC = () => {
  const promptNodes = useAppStore((state) => state.promptNodes);
  const activeWorkspaceId = useAppStore((state) => state.activeWorkspaceId);
  const { selectedNodeId, setSelectedNodeId } = useSelectionStore();

  // Filter nodes for active workspace that are not deleted
  const workspaceNodes = Object.values(promptNodes).filter(
    (node) => node.workspaceId === activeWorkspaceId && !node.deletedAt
  );

  // Find root nodes of the active workspace (nodes without parents, or whose parents are deleted/missing)
  const rootNodes = workspaceNodes.filter(
    (node) => !node.parentId || !promptNodes[node.parentId] || promptNodes[node.parentId].deletedAt
  );

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: PromptNodeWithChildren, depth = 0) => {
    const isSelected = selectedNodeId === node.id;
    const directChildren = (node.childrenIds || [])
      .map((cid) => promptNodes[cid])
      .filter((n): n is PromptNodeWithChildren => !!n && !n.deletedAt);
      
    const hasChildren = directChildren.length > 0;
    const isFork = directChildren.length > 1;

    // Scroll to the card element
    const handleNodeClick = () => {
      setSelectedNodeId(node.id);
      const element = document.getElementById(`node-card-${node.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    return (
      <div key={node.id} className="relative flex flex-col">
        {/* Connection Line */}
        {depth > 0 && (
          <div
            className="absolute left-[-16px] top-[-8px] bottom-[18px] w-4 border-l-2 border-b-2 border-zinc-200 dark:border-zinc-800 rounded-bl-lg"
            aria-hidden="true"
          />
        )}

        <div className="flex items-center gap-2 py-1">
          <button
            onClick={handleNodeClick}
            className={`flex flex-col text-left px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer max-w-[240px] truncate transition-all select-none ${
              isSelected
                ? 'bg-indigo-600 border-indigo-600 text-white font-semibold shadow-xs'
                : 'bg-white border-zinc-200 hover:border-indigo-400 text-zinc-800 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className={isSelected ? 'text-white' : 'text-indigo-600 dark:text-indigo-400 font-bold'}>
                {node.versionTag}
              </span>
              <span className="truncate max-w-[140px]">{node.name}</span>
            </div>
            {isFork && (
              <span className={`text-[9px] uppercase tracking-wide mt-0.5 font-bold ${
                isSelected ? 'text-indigo-200' : 'text-amber-500'
              }`}>
                Fork Point
              </span>
            )}
          </button>
        </div>

        {/* Render child nodes */}
        {hasChildren && (
          <div className="pl-6 ml-2 border-l border-zinc-200 dark:border-zinc-800 space-y-1 mt-1">
            {directChildren.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (rootNodes.length === 0) {
    return (
      <div className="text-center py-6 text-zinc-400 dark:text-zinc-500 text-xs">
        No lineage tree to display.
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
        Workspace Graph
      </h3>
      <div className="pl-2 space-y-4">
        {rootNodes.map((root) => renderTreeNode(root))}
      </div>
    </div>
  );
};

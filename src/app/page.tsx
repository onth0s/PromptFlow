'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useFilterStore } from '../store/useFilterStore';
import { useSelectionStore } from '../store/useSelectionStore';
import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { FilterSortPanel } from '@/components/layout/FilterSortPanel';
import { TreeView } from '@/components/sidebar/TreeView';
import { EmptyWorkspaceState } from '@/components/layout/EmptyWorkspaceState';
import { EmptyNodeState } from '@/components/layout/EmptyNodeState';
import { PromptNodeCard } from '@/components/prompts/PromptNodeCard';
import { CreateNodeDialog } from '@/components/prompts/CreateNodeDialog';
import { EditNodeMetaDialog } from '@/components/prompts/EditNodeMetaDialog';
import { DeleteConfirmDialog } from '@/components/prompts/DeleteConfirmDialog';
import { GenerationDrawer } from '@/components/generations/GenerationDrawer';
import { AddGenerationDialog } from '@/components/generations/AddGenerationDialog';
import { ExportDialog } from '@/components/workspace/ExportDialog';
import { ImportDialog } from '@/components/workspace/ImportDialog';
import { SettingsDialog } from '@/components/workspace/SettingsDialog';
import { PromptNode, PromptNodeWithChildren, Generation, GenerationOutput } from '@/types';
import { buildChildrenMap, getDescendants } from '@/lib/tree';
import { useNodeFilters } from '../hooks/useNodeFilters';

export default function Home() {
  const workspaces = useAppStore(state => state.workspaces);
  const promptNodes = useAppStore(state => state.promptNodes);
  const generations = useAppStore(state => state.generations);
  const activeWorkspaceId = useAppStore(state => state.activeWorkspaceId);
  const setActiveWorkspace = useAppStore(state => state.setActiveWorkspace);
  
  // App Actions
  const createWorkspace = useAppStore(state => state.createWorkspace);
  const createPromptNode = useAppStore(state => state.createPromptNode);
  const updatePromptNodeMeta = useAppStore(state => state.updatePromptNodeMeta);
  const softDeletePromptNode = useAppStore(state => state.softDeletePromptNode);
  const createGeneration = useAppStore(state => state.createGeneration);
  const softDeleteGeneration = useAppStore(state => state.softDeleteGeneration);

  // Selection Store
  const { selectedNodeId, setSelectedNodeId } = useSelectionStore();

  // Filters State
  const filters = useFilterStore();

  // Layout UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'filter' | 'tree'>('filter');
  const [drawerNodeId, setDrawerNodeId] = useState<string | null>(null);

  // Consolidate dialog states
  const [dialogState, setDialogState] = useState<{
    type: 'create' | 'edit' | 'delete' | 'export' | 'import' | 'settings' | 'addGen' | null;
    parentId?: string | null;
    parentTag?: string;
    node?: PromptNodeWithChildren;
    descendantsCount?: number;
    generationsCount?: number;
  }>({ type: null });

  const activeWorkspace = activeWorkspaceId ? workspaces[activeWorkspaceId] : null;

  // Active workspace nodes (non-deleted)
  const workspaceNodes = useMemo(() => {
    return Object.values(promptNodes).filter(
      (node) => node.workspaceId === activeWorkspaceId && !node.deletedAt
    );
  }, [promptNodes, activeWorkspaceId]);

  const { filteredNodes, groupedNodes } = useNodeFilters(
    workspaceNodes,
    promptNodes,
    generations,
    filters
  );

  const handleCreateNode = async (nodeData: Omit<PromptNode, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createPromptNode(nodeData);
    setDialogState({ type: null });
  };

  const handleEditNodeMeta = async (updates: Partial<Pick<PromptNodeWithChildren, 'name' | 'versionTag' | 'notes' | 'tags'>>) => {
    if (dialogState.node) {
      await updatePromptNodeMeta(dialogState.node.id, updates);
    }
    setDialogState({ type: null });
  };

  const handleDeleteConfirm = async () => {
    if (dialogState.node) {
      await softDeletePromptNode(dialogState.node.id);
      if (selectedNodeId === dialogState.node.id) {
        setSelectedNodeId(null);
      }
      if (drawerNodeId === dialogState.node.id) {
        setDrawerNodeId(null);
      }
    }
    setDialogState({ type: null });
  };

  const handleAddGeneration = async (genData: {
    promptNodeId: string;
    provider?: string;
    model?: string;
    duration?: number;
    output: GenerationOutput;
  }) => {
    await createGeneration(genData);
    setDialogState({ type: null });
  };

  const handleRetryGeneration = async (gen: Generation) => {
    await createGeneration({
      promptNodeId: gen.promptNodeId,
      provider: gen.provider,
      model: gen.model,
      output: { status: 'Queued' }
    });
  };

  // If no workspaces exist
  if (Object.keys(workspaces).length === 0) {
    return <EmptyWorkspaceState onCreateWorkspace={createWorkspace} />;
  }

  const drawerNode = drawerNodeId ? promptNodes[drawerNodeId] : null;
  const drawerGenerations = drawerNodeId
    ? Object.values(generations).filter(g => g.promptNodeId === drawerNodeId && !g.deletedAt)
    : [];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <TopBar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenExport={() => setDialogState({ type: 'export' })}
        onOpenImport={() => setDialogState({ type: 'import' })}
        onOpenSettings={() => setDialogState({ type: 'settings' })}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          activeTab={sidebarTab}
          onChangeTab={setSidebarTab}
        >
          {sidebarTab === 'filter' ? (
            <FilterSortPanel />
          ) : (
            <TreeView />
          )}
        </Sidebar>

        <main className="flex-1 overflow-y-auto p-6 focus:outline-none">
          {workspaceNodes.length === 0 ? (
            <EmptyNodeState
              workspaceName={activeWorkspace?.name || ''}
              onCreateFirstNode={() =>
                setDialogState({ type: 'create', parentId: null })
              }
            />
          ) : (
            <div className="flex flex-col gap-6">
              {/* Workspace Header info */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {activeWorkspace?.name}
                  </h1>
                  <p className="text-xs text-zinc-500 mt-1">
                    Manage and version prompt templates in this workspace.
                  </p>
                </div>
                <button
                  onClick={() => setDialogState({ type: 'create', parentId: null })}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors cursor-pointer select-none"
                >
                  Create Root Node
                </button>
              </div>

              {/* Group layout compilation */}
              {Object.keys(groupedNodes).length === 0 || filteredNodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <p className="text-sm text-zinc-500 font-medium">No nodes match your filters.</p>
                  <button
                    onClick={filters.resetFilters}
                    className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Reset all filters
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(groupedNodes).map(([groupTitle, groupItems]) => {
                    if (groupItems.length === 0) return null;
                    return (
                      <div key={groupTitle} className="space-y-4">
                        {filters.groupBy !== 'none' && (
                          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            {groupTitle} ({groupItems.length})
                          </h2>
                        )}

                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isSidebarOpen ? 'lg:grid-cols-2 lg:[@media(min-aspect-ratio:16/9)]:grid-cols-3' : 'lg:grid-cols-3 lg:[@media(min-aspect-ratio:16/9)]:grid-cols-4'}`}>
                          {groupItems.map((node) => (
                            <PromptNodeCard
                              key={node.id}
                              node={node}
                              generations={Object.values(generations).filter(g => g.promptNodeId === node.id)}
                              isSelected={selectedNodeId === node.id}
                              onSelect={() => setSelectedNodeId(node.id)}
                              onViewGenerations={() => {
                                setDrawerNodeId(node.id);
                              }}
                              onEditMeta={() => {
                                setDialogState({ type: 'edit', node });
                              }}
                              onDeleteNode={() => {
                                const childrenMap = buildChildrenMap(Object.values(promptNodes));
                                const descendants = getDescendants(node.id, childrenMap);
                                const affectedIds = [node.id, ...descendants];
                                const gensCount = Object.values(generations).filter(
                                  g => affectedIds.includes(g.promptNodeId) && !g.deletedAt
                                ).length;

                                setDialogState({
                                  type: 'delete',
                                  node,
                                  parentId: String(descendants.length),
                                  parentTag: String(gensCount),
                                });
                              }}
                              onCreateNewVersion={() => {
                                setDialogState({
                                  type: 'create',
                                  parentId: node.id,
                                  parentTag: node.versionTag,
                                });
                              }}
                              onForkNode={() => {
                                setDialogState({
                                  type: 'create',
                                  parentId: node.id,
                                  parentTag: node.versionTag,
                                });
                              }}
                              onToggleFavorite={async () => {
                                await updatePromptNodeMeta(node.id, { isFavorite: !node.isFavorite });
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Generations Drawer panel */}
      {drawerNode && (
        <GenerationDrawer
          isOpen={drawerNodeId !== null}
          onClose={() => setDrawerNodeId(null)}
          node={drawerNode}
          generations={drawerGenerations}
          onAddGeneration={() => setDialogState({ type: 'addGen' })}
          onDeleteGeneration={softDeleteGeneration}
          onRetryGeneration={handleRetryGeneration}
        />
      )}

      {/* Dialog Rendering */}
      {dialogState.type === 'create' && (
        <CreateNodeDialog
          parentId={dialogState.parentId || null}
          parentTag={dialogState.parentTag}
          workspaceId={activeWorkspaceId || ''}
          onClose={() => setDialogState({ type: null })}
          onSubmit={handleCreateNode}
        />
      )}

      {dialogState.type === 'edit' && dialogState.node && (
        <EditNodeMetaDialog
          node={dialogState.node}
          onClose={() => setDialogState({ type: null })}
          onSubmit={handleEditNodeMeta}
        />
      )}

      {dialogState.type === 'delete' && dialogState.node && (
        <DeleteConfirmDialog
          nodeName={dialogState.node.name}
          nodeTag={dialogState.node.versionTag}
          descendantsCount={Number(dialogState.parentId || 0)}
          generationsCount={Number(dialogState.parentTag || 0)}
          onClose={() => setDialogState({ type: null })}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {dialogState.type === 'addGen' && drawerNodeId && (
        <AddGenerationDialog
          nodeId={drawerNodeId}
          onClose={() => setDialogState({ type: null })}
          onSubmit={handleAddGeneration}
        />
      )}

      {/* Export Workspace modal */}
      {dialogState.type === 'export' && activeWorkspace && (
        <ExportDialog
          workspace={activeWorkspace}
          nodes={workspaceNodes}
          generations={Object.values(generations).filter(g => g.promptNodeId && promptNodes[g.promptNodeId] && promptNodes[g.promptNodeId].workspaceId === activeWorkspaceId)}
          onClose={() => setDialogState({ type: null })}
        />
      )}

      {/* Import Workspace modal */}
      {dialogState.type === 'import' && (
        <ImportDialog
          onClose={() => setDialogState({ type: null })}
          onImportSuccess={(newWorkspaceId) => {
            setActiveWorkspace(newWorkspaceId);
            setDialogState({ type: null });
          }}
        />
      )}

      {/* Settings Modal */}
      {dialogState.type === 'settings' && (
        <SettingsDialog onClose={() => setDialogState({ type: null })} />
      )}
    </div>
  );
}

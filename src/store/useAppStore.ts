import { create } from 'zustand';
import { Workspace, PromptNode, Generation, PromptNodeWithChildren } from '../types';
import { dbWorkspaces, dbPromptNodes, dbGenerations, dbSettings, checkDatabaseAvailability } from '../lib/db';
import { buildChildrenMap, getDescendants } from '../lib/tree';
import { generateSeedData } from '../lib/seed';
import { DEFAULT_RETENTION_DAYS, RetentionDays } from '../lib/constants';

function omitChildrenIds<T extends { childrenIds?: string[] }>(node: T): Omit<T, 'childrenIds'> {
  const clone = { ...node };
  delete clone.childrenIds;
  return clone;
}

function omitDeletedAt<T extends { deletedAt?: string }>(item: T): Omit<T, 'deletedAt'> {
  const clone = { ...item };
  delete clone.deletedAt;
  return clone;
}

interface AppState {
  workspaces: Record<string, Workspace>;
  promptNodes: Record<string, PromptNodeWithChildren>;
  generations: Record<string, Generation>;
  activeWorkspaceId: string | null;
  hydrated: boolean;
  dbAvailable: boolean;
  recycleBinRetentionDays: RetentionDays;

  // Actions
  hydrateStore: () => Promise<void>;
  
  // Workspace Actions
  setActiveWorkspace: (id: string | null) => void;
  createWorkspace: (name: string) => Promise<string>;
  renameWorkspace: (id: string, name: string) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>; // Cascade soft delete
  
  // PromptNode Actions
  createPromptNode: (node: Omit<PromptNode, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updatePromptNodeMeta: (id: string, updates: Partial<Pick<PromptNode, 'name' | 'versionTag' | 'notes' | 'isFavorite' | 'tags'>>) => Promise<void>;
  softDeletePromptNode: (id: string) => Promise<void>; // Cascade soft delete to subtree and generations
  restorePromptNode: (id: string) => Promise<void>;
  
  // Generation Actions
  createGeneration: (generation: Omit<Generation, 'id' | 'createdAt'>) => Promise<string>;
  updateGeneration: (id: string, updates: Partial<Omit<Generation, 'id' | 'promptNodeId' | 'createdAt'>>) => Promise<void>;
  softDeleteGeneration: (id: string) => Promise<void>;
  restoreGeneration: (id: string) => Promise<void>;

  // Recycle Bin Actions
  emptyRecycleBin: () => Promise<void>;
  setRetentionDays: (days: RetentionDays) => Promise<void>;
  purgeExpiredSoftDeleted: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  workspaces: {},
  promptNodes: {},
  generations: {},
  activeWorkspaceId: null,
  hydrated: false,
  dbAvailable: true,
  recycleBinRetentionDays: DEFAULT_RETENTION_DAYS,

  hydrateStore: async () => {
    const isAvailable = await checkDatabaseAvailability();
    if (!isAvailable) {
      set({ dbAvailable: false, hydrated: true });
      return;
    }

    try {
      // Load raw entries
      const wsKeys = await dbWorkspaces.keys();
      const workspaces: Record<string, Workspace> = {};
      for (const k of wsKeys) {
        const item = await dbWorkspaces.getItem<Workspace>(k);
        if (item) workspaces[k] = item;
      }

      const nodeKeys = await dbPromptNodes.keys();
      const rawNodes: PromptNode[] = [];
      for (const k of nodeKeys) {
        const item = await dbPromptNodes.getItem<PromptNode>(k);
        if (item) rawNodes.push(item);
      }

      const genKeys = await dbGenerations.keys();
      const generations: Record<string, Generation> = {};
      for (const k of genKeys) {
        const item = await dbGenerations.getItem<Generation>(k);
        if (item) generations[k] = item;
      }

      const savedRetention = await dbSettings.getItem<RetentionDays>('retention_days');
      const retentionDays = savedRetention || DEFAULT_RETENTION_DAYS;

      // Handle seeding if empty
      if (Object.keys(workspaces).length === 0) {
        const seed = generateSeedData();
        
        // Save seed workspace
        await dbWorkspaces.setItem(seed.workspace.id, seed.workspace);
        workspaces[seed.workspace.id] = seed.workspace;

        // Save seed nodes
        for (const node of seed.nodes) {
          await dbPromptNodes.setItem(node.id, node);
          rawNodes.push(node);
        }

        // Save seed generations
        for (const gen of seed.generations) {
          await dbGenerations.setItem(gen.id, gen);
          generations[gen.id] = gen;
        }
      }

      // Reconstruct children mapping
      const childrenMap = buildChildrenMap(rawNodes);
      const promptNodes: Record<string, PromptNodeWithChildren> = {};
      rawNodes.forEach(node => {
        promptNodes[node.id] = {
          ...node,
          childrenIds: childrenMap[node.id] || [],
        };
      });

      // Retrieve last active workspace (or pick first)
      const lastActiveWs = await dbSettings.getItem<string>('last_active_workspace');
      const activeWorkspaceId = lastActiveWs && workspaces[lastActiveWs]
        ? lastActiveWs
        : Object.keys(workspaces)[0] || null;

      set({
        workspaces,
        promptNodes,
        generations,
        activeWorkspaceId,
        recycleBinRetentionDays: retentionDays,
        dbAvailable: true,
        hydrated: true,
      });

      // Run automatic background sweep for expired soft-deleted items
      await get().purgeExpiredSoftDeleted();
    } catch (e) {
      console.error('Store hydration failed:', e);
      set({ dbAvailable: false, hydrated: true });
    }
  },

  setActiveWorkspace: (id) => {
    set({ activeWorkspaceId: id });
    if (get().dbAvailable && id) {
      dbSettings.setItem('last_active_workspace', id);
    }
  },

  createWorkspace: async (name) => {
    const id = crypto.randomUUID();
    const newWorkspace: Workspace = {
      id,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      workspaces: { ...state.workspaces, [id]: newWorkspace },
      activeWorkspaceId: state.activeWorkspaceId ? state.activeWorkspaceId : id
    }));

    if (get().dbAvailable) {
      await dbWorkspaces.setItem(id, newWorkspace);
      if (!get().activeWorkspaceId) {
        dbSettings.setItem('last_active_workspace', id);
      }
    }

    return id;
  },

  renameWorkspace: async (id, name) => {
    const ws = get().workspaces[id];
    if (!ws) return;

    const updated = {
      ...ws,
      name,
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      workspaces: { ...state.workspaces, [id]: updated },
    }));

    if (get().dbAvailable) {
      await dbWorkspaces.setItem(id, updated);
    }
  },

  deleteWorkspace: async (id) => {
    const now = new Date().toISOString();
    
    // Soft delete workspace
    const ws = get().workspaces[id];
    if (!ws) return;

    // Immutable removal of workspace key
    const updatedWorkspaces = { ...get().workspaces };
    delete updatedWorkspaces[id];

    // Soft delete all contained nodes and generations
    const updatedNodes = { ...get().promptNodes };
    const updatedGenerations = { ...get().generations };

    for (const nodeId in updatedNodes) {
      if (updatedNodes[nodeId].workspaceId === id) {
        updatedNodes[nodeId] = {
          ...updatedNodes[nodeId],
          deletedAt: now,
          updatedAt: now,
        };
        if (get().dbAvailable) {
          const persistNode = omitChildrenIds(updatedNodes[nodeId]);
          await dbPromptNodes.setItem(nodeId, persistNode);
        }
      }
    }

    for (const genId in updatedGenerations) {
      const node = get().promptNodes[updatedGenerations[genId].promptNodeId];
      if (node && node.workspaceId === id) {
        updatedGenerations[genId] = {
          ...updatedGenerations[genId],
          deletedAt: now,
        };
        if (get().dbAvailable) {
          await dbGenerations.setItem(genId, updatedGenerations[genId]);
        }
      }
    }

    if (get().dbAvailable) {
      await dbWorkspaces.removeItem(id); // Hard deletes workspace registration container
    }

    let nextActive = get().activeWorkspaceId;
    if (nextActive === id) {
      nextActive = Object.keys(updatedWorkspaces)[0] || null;
    }

    set({
      workspaces: updatedWorkspaces,
      promptNodes: updatedNodes,
      generations: updatedGenerations,
      activeWorkspaceId: nextActive,
    });

    if (get().dbAvailable) {
      dbSettings.setItem('last_active_workspace', nextActive);
    }
  },

  createPromptNode: async (nodeData) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newNode: PromptNode = {
      ...nodeData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    if (get().dbAvailable) {
      await dbPromptNodes.setItem(id, newNode);
    }

    set((state) => {
      const updatedNodes = { ...state.promptNodes };
      
      // Add the new node to promptNodes registry
      updatedNodes[id] = {
        ...newNode,
        childrenIds: [],
      };

      // If it has a parent, link it
      if (newNode.parentId && updatedNodes[newNode.parentId]) {
        const parent = updatedNodes[newNode.parentId];
        updatedNodes[newNode.parentId] = {
          ...parent,
          childrenIds: [...parent.childrenIds, id],
        };
      }

      return { promptNodes: updatedNodes };
    });

    return id;
  },

  updatePromptNodeMeta: async (id, updates) => {
    const node = get().promptNodes[id];
    if (!node) return;

    const now = new Date().toISOString();
    const updated: PromptNodeWithChildren = {
      ...node,
      ...updates,
      updatedAt: now,
    };

    const persistNode = omitChildrenIds(updated);

    set((state) => ({
      promptNodes: { ...state.promptNodes, [id]: updated },
    }));

    if (get().dbAvailable) {
      await dbPromptNodes.setItem(id, persistNode);
    }
  },

  softDeletePromptNode: async (id) => {
    const now = new Date().toISOString();
    const nodes = { ...get().promptNodes };
    const generations = { ...get().generations };

    // Get childrenMap for finding children recursively
    const rawNodesList = Object.values(nodes);
    const childrenMap = buildChildrenMap(rawNodesList);
    const descendants = getDescendants(id, childrenMap);
    const affectedNodeIds = [id, ...descendants];

    // Soft delete all target nodes
    for (const nodeId of affectedNodeIds) {
      if (nodes[nodeId]) {
        nodes[nodeId] = {
          ...nodes[nodeId],
          deletedAt: now,
          updatedAt: now,
        };
        const persistNode = omitChildrenIds(nodes[nodeId]);
        if (get().dbAvailable) {
          await dbPromptNodes.setItem(nodeId, persistNode);
        }
      }
    }

    // Soft delete associated generations
    for (const genId in generations) {
      if (affectedNodeIds.includes(generations[genId].promptNodeId)) {
        generations[genId] = {
          ...generations[genId],
          deletedAt: now,
        };
        if (get().dbAvailable) {
          await dbGenerations.setItem(genId, generations[genId]);
        }
      }
    }

    // Clean derived children mapping links on the parent
    const targetNode = nodes[id];
    if (targetNode && targetNode.parentId && nodes[targetNode.parentId]) {
      const parent = nodes[targetNode.parentId];
      nodes[targetNode.parentId] = {
        ...parent,
        childrenIds: parent.childrenIds.filter(cid => cid !== id),
      };
    }

    set({ promptNodes: nodes, generations });
  },

  restorePromptNode: async (id) => {
    const nodes = { ...get().promptNodes };
    const generations = { ...get().generations };
    
    const targetNode = nodes[id];
    if (!targetNode) return;

    const rawNodesList = Object.values(nodes);
    const childrenMap = buildChildrenMap(rawNodesList);
    const descendants = getDescendants(id, childrenMap);
    const affectedNodeIds = [id, ...descendants];

    // Restore target nodes
    for (const nodeId of affectedNodeIds) {
      if (nodes[nodeId]) {
        const restoredNode = omitDeletedAt(nodes[nodeId]);
        const updatedNode = {
          ...restoredNode,
          updatedAt: new Date().toISOString(),
        } as PromptNodeWithChildren;
        nodes[nodeId] = updatedNode;

        const persistNode = omitChildrenIds(updatedNode);
        if (get().dbAvailable) {
          await dbPromptNodes.setItem(nodeId, persistNode);
        }
      }
    }

    // Restore associated generations
    for (const genId in generations) {
      if (affectedNodeIds.includes(generations[genId].promptNodeId)) {
        const restoredGen = omitDeletedAt(generations[genId]) as Generation;
        generations[genId] = restoredGen;
        if (get().dbAvailable) {
          await dbGenerations.setItem(genId, restoredGen);
        }
      }
    }

    // Restore children connection inside the parent's runtime registry
    if (targetNode.parentId && nodes[targetNode.parentId]) {
      const parent = nodes[targetNode.parentId];
      if (!parent.childrenIds.includes(id)) {
        nodes[targetNode.parentId] = {
          ...parent,
          childrenIds: [...parent.childrenIds, id],
        };
      }
    }

    set({ promptNodes: nodes, generations });
  },

  createGeneration: async (genData) => {
    const id = crypto.randomUUID();
    const newGen: Generation = {
      ...genData,
      id,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      generations: { ...state.generations, [id]: newGen },
    }));

    if (get().dbAvailable) {
      await dbGenerations.setItem(id, newGen);
    }

    return id;
  },

  updateGeneration: async (id, updates) => {
    const gen = get().generations[id];
    if (!gen) return;

    const updated = {
      ...gen,
      ...updates,
    };

    set((state) => ({
      generations: { ...state.generations, [id]: updated },
    }));

    if (get().dbAvailable) {
      await dbGenerations.setItem(id, updated);
    }
  },

  softDeleteGeneration: async (id) => {
    const gen = get().generations[id];
    if (!gen) return;

    const updated = {
      ...gen,
      deletedAt: new Date().toISOString(),
    };

    set((state) => ({
      generations: { ...state.generations, [id]: updated },
    }));

    if (get().dbAvailable) {
      await dbGenerations.setItem(id, updated);
    }
  },

  restoreGeneration: async (id) => {
    const gen = get().generations[id];
    if (!gen) return;

    const updated = omitDeletedAt(gen) as Generation;

    set((state) => ({
      generations: { ...state.generations, [id]: updated },
    }));

    if (get().dbAvailable) {
      await dbGenerations.setItem(id, updated);
    }
  },

  emptyRecycleBin: async () => {
    const nodes = { ...get().promptNodes };
    const generations = { ...get().generations };

    // Immutable and persistent deletes
    const nextNodes = { ...nodes };
    for (const nodeId in nodes) {
      if (nodes[nodeId].deletedAt) {
        delete nextNodes[nodeId];
        if (get().dbAvailable) {
          await dbPromptNodes.removeItem(nodeId);
        }
      }
    }

    const nextGenerations = { ...generations };
    for (const genId in generations) {
      if (generations[genId].deletedAt) {
        delete nextGenerations[genId];
        if (get().dbAvailable) {
          await dbGenerations.removeItem(genId);
        }
      }
    }

    set({ promptNodes: nextNodes, generations: nextGenerations });
  },

  setRetentionDays: async (days) => {
    set({ recycleBinRetentionDays: days });
    if (get().dbAvailable) {
      await dbSettings.setItem('retention_days', days);
    }
  },

  purgeExpiredSoftDeleted: async () => {
    const retentionDays = get().recycleBinRetentionDays;
    const now = new Date();
    
    const nodes = get().promptNodes;
    const generations = get().generations;
    const nextNodes = { ...nodes };
    const nextGenerations = { ...generations };
    let hasChanges = false;

    for (const nodeId in nodes) {
      const node = nodes[nodeId];
      if (node.deletedAt) {
        const deletedTime = new Date(node.deletedAt);
        const diffTime = Math.abs(now.getTime() - deletedTime.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > retentionDays) {
          delete nextNodes[nodeId];
          hasChanges = true;
          if (get().dbAvailable) {
            await dbPromptNodes.removeItem(nodeId);
          }
        }
      }
    }

    for (const genId in generations) {
      const gen = generations[genId];
      if (gen.deletedAt) {
        const deletedTime = new Date(gen.deletedAt);
        const diffTime = Math.abs(now.getTime() - deletedTime.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > retentionDays) {
          delete nextGenerations[genId];
          hasChanges = true;
          if (get().dbAvailable) {
            await dbGenerations.removeItem(genId);
          }
        }
      }
    }

    if (hasChanges) {
      set({ promptNodes: nextNodes, generations: nextGenerations });
    }
  },
}));

import { useMemo } from 'react';
import { PromptNodeWithChildren, Generation } from '../types';
import { buildChildrenMap, getIterationDensity, getLastGenerationDate } from '../lib/tree';
import { createSearchIndex, buildSearchDocuments } from '../lib/search';

interface FilterState {
  searchQuery: string;
  filterFavorites: boolean;
  filterTags: string[];
  tagLogic: 'AND' | 'OR';
  filterInputModality: string;
  filterOutputModality: string;
  filterProvider: string;
  filterModel: string;
  filterLineage: 'all' | 'roots' | 'heads';
  groupBy: 'none' | 'lineage' | 'inputModality' | 'outputModality' | 'date';
  sortBy: 'createdAt' | 'updatedAt' | 'lastGeneration' | 'density' | 'length';
  sortDir: 'asc' | 'desc';
}

export function useNodeFilters(
  workspaceNodes: PromptNodeWithChildren[],
  promptNodes: Record<string, PromptNodeWithChildren>,
  generations: Record<string, Generation>,
  filters: FilterState
) {
  // MiniSearch Index Hydration & Search filtering
  const matchingNodeIds = useMemo(() => {
    if (!filters.searchQuery.trim()) return null;

    const index = createSearchIndex();
    const docs = buildSearchDocuments(workspaceNodes, generations);
    index.addAll(docs);

    const results = index.search(filters.searchQuery.trim());
    return new Set(results.map((r) => r.id));
  }, [workspaceNodes, generations, filters.searchQuery]);

  // Filtered List compilation
  const filteredNodes = useMemo(() => {
    let list = [...workspaceNodes];

    // 1. Search Query filter
    if (matchingNodeIds) {
      list = list.filter((node) => matchingNodeIds.has(node.id));
    }

    // 2. Favorites filter
    if (filters.filterFavorites) {
      list = list.filter((node) => node.isFavorite);
    }

    // 3. Tags filter (AND/OR logic)
    if (filters.filterTags.length > 0) {
      list = list.filter((node) => {
        if (filters.tagLogic === 'AND') {
          return filters.filterTags.every((t) => node.tags.includes(t));
        } else {
          return filters.filterTags.some((t) => node.tags.includes(t));
        }
      });
    }

    // 4. Modalities filter
    if (filters.filterInputModality !== 'all') {
      list = list.filter((node) => node.inputModality === filters.filterInputModality);
    }
    if (filters.filterOutputModality !== 'all') {
      list = list.filter((node) => node.outputModality === filters.filterOutputModality);
    }

    // 5. Providers & Models filters
    if (filters.filterProvider.trim()) {
      const targetProv = filters.filterProvider.trim().toLowerCase();
      list = list.filter((node) => {
        const activeGens = Object.values(generations).filter(
          (g) => g.promptNodeId === node.id && !g.deletedAt
        );
        return activeGens.some((g) => g.provider?.toLowerCase().includes(targetProv));
      });
    }
    if (filters.filterModel.trim()) {
      const targetModel = filters.filterModel.trim().toLowerCase();
      list = list.filter((node) => {
        const activeGens = Object.values(generations).filter(
          (g) => g.promptNodeId === node.id && !g.deletedAt
        );
        return activeGens.some((g) => g.model?.toLowerCase().includes(targetModel));
      });
    }

    // 6. Lineage Scope filter
    const childrenMap = buildChildrenMap(Object.values(promptNodes));
    if (filters.filterLineage !== 'all') {
      if (filters.filterLineage === 'roots') {
        list = list.filter((node) => node.parentId === null);
      } else if (filters.filterLineage === 'heads') {
        list = list.filter((node) => {
          const liveChildren = (childrenMap[node.id] || []).filter(
            (cid) => promptNodes[cid] && !promptNodes[cid].deletedAt
          );
          return liveChildren.length === 0;
        });
      }
    }

    // 7. Sort Logic
    const rawGensList = Object.values(generations);

    list.sort((a, b) => {
      let comparison = 0;

      if (filters.sortBy === 'createdAt') {
        comparison = a.createdAt.localeCompare(b.createdAt);
      } else if (filters.sortBy === 'updatedAt') {
        comparison = a.updatedAt.localeCompare(b.updatedAt);
      } else if (filters.sortBy === 'lastGeneration') {
        const aDate = getLastGenerationDate(a.id, childrenMap, rawGensList);
        const bDate = getLastGenerationDate(b.id, childrenMap, rawGensList);
        if (!aDate && !bDate) comparison = 0;
        else if (!aDate) comparison = -1;
        else if (!bDate) comparison = 1;
        else comparison = aDate.localeCompare(bDate);
      } else if (filters.sortBy === 'density') {
        comparison =
          getIterationDensity(a.id, childrenMap, rawGensList) -
          getIterationDensity(b.id, childrenMap, rawGensList);
      } else if (filters.sortBy === 'length') {
        comparison = (a.promptText || '').length - (b.promptText || '').length;
      }

      return filters.sortDir === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [workspaceNodes, promptNodes, generations, matchingNodeIds, filters]);

  // Grouping compiler
  const groupedNodes = useMemo(() => {
    if (filters.groupBy === 'none') {
      return { 'All Nodes': filteredNodes };
    }

    const groups: Record<string, PromptNodeWithChildren[]> = {};

    filteredNodes.forEach((node) => {
      let key = 'Other';

      if (filters.groupBy === 'inputModality') {
        key = `Input Modality: ${node.inputModality.toUpperCase()}`;
      } else if (filters.groupBy === 'outputModality') {
        key = `Output Modality: ${node.outputModality.toUpperCase()}`;
      } else if (filters.groupBy === 'date') {
        key = new Date(node.createdAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
        });
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(node);
    });

    return groups;
  }, [filteredNodes, filters.groupBy]);

  return { filteredNodes, groupedNodes };
}

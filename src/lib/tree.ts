import { PromptNode, Generation } from '../types';

/**
 * Builds a derived mapping from parent UUID to list of child UUIDs.
 */
export function buildChildrenMap(nodes: PromptNode[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  
  // Initialize map
  nodes.forEach(node => {
    map[node.id] = [];
  });

  // Populate map (skip soft-deleted nodes for live operations)
  nodes.forEach(node => {
    if (node.parentId && map[node.parentId]) {
      map[node.parentId].push(node.id);
    }
  });

  return map;
}

/**
 * Traverses down a tree to collect all descendants recursively.
 */
export function getDescendants(nodeId: string, childrenMap: Record<string, string[]>): string[] {
  const result: string[] = [];
  const queue = [...(childrenMap[nodeId] || [])];

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);
    const children = childrenMap[current] || [];
    queue.push(...children);
  }

  return result;
}

/**
 * Traverses up a tree to collect all parent nodes recursively up to the root.
 */
export function getAncestors(nodeId: string, nodesMap: Record<string, PromptNode>): string[] {
  const result: string[] = [];
  let current = nodesMap[nodeId];

  while (current && current.parentId) {
    result.push(current.parentId);
    current = nodesMap[current.parentId];
  }

  return result;
}

/**
 * Checks if a node represents a fork point in the graph (i.e. has more than 1 child).
 */
export function isForkPoint(nodeId: string, childrenMap: Record<string, string[]>): boolean {
  return (childrenMap[nodeId] || []).length > 1;
}

/**
 * Determines the date/time of the most recent generation run across the node's entire subtree.
 */
export function getLastGenerationDate(
  nodeId: string,
  childrenMap: Record<string, string[]>,
  generations: Generation[]
): string | null {
  const subtreeIds = new Set([nodeId, ...getDescendants(nodeId, childrenMap)]);
  
  let latest: string | null = null;
  generations.forEach(gen => {
    if (subtreeIds.has(gen.promptNodeId) && !gen.deletedAt) {
      if (!latest || gen.createdAt > latest) {
        latest = gen.createdAt;
      }
    }
  });

  return latest;
}

/**
 * Returns the density count (total generations) in the node's entire subtree.
 */
export function getIterationDensity(
  nodeId: string,
  childrenMap: Record<string, string[]>,
  generations: Generation[]
): number {
  const subtreeIds = new Set([nodeId, ...getDescendants(nodeId, childrenMap)]);
  
  let count = 0;
  generations.forEach(gen => {
    if (subtreeIds.has(gen.promptNodeId) && !gen.deletedAt) {
      count++;
    }
  });

  return count;
}

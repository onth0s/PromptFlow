import MiniSearch from 'minisearch';
import { PromptNodeWithChildren, Generation } from '../types';

export interface SearchDoc {
  id: string; // Maps to promptNodeId
  promptText: string;
  commitMessage: string;
  notes: string;
  tags: string;
  generationOutputText: string;
  model: string;
  provider: string;
}

// Configures MiniSearch instance with indexing keys and search options
export function createSearchIndex(): MiniSearch<SearchDoc> {
  return new MiniSearch<SearchDoc>({
    fields: ['promptText', 'commitMessage', 'notes', 'tags', 'generationOutputText', 'model', 'provider'],
    storeFields: ['id'],
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      combineWith: 'AND',
    },
  });
}

/**
 * Builds search documents from nodes and associated generations list
 */
export function buildSearchDocuments(
  nodes: PromptNodeWithChildren[],
  generations: Record<string, Generation>
): SearchDoc[] {
  const nodeGens: Record<string, string[]> = {};

  // Group generation text and metadata by prompt node
  Object.values(generations).forEach(gen => {
    if (gen.deletedAt) return;
    
    if (gen.output.status === 'Completed' && gen.output.text) {
      if (!nodeGens[gen.promptNodeId]) {
        nodeGens[gen.promptNodeId] = [];
      }
      nodeGens[gen.promptNodeId].push(gen.output.text);
    }
  });

  return nodes.map(node => {
    const activeGens = Object.values(generations).filter(g => g.promptNodeId === node.id && !g.deletedAt);
    
    const modelsStr = activeGens
      .map(g => g.model)
      .filter((m): m is string => !!m)
      .join(' ');
      
    const providersStr = activeGens
      .map(g => g.provider)
      .filter((p): p is string => !!p)
      .join(' ');

    return {
      id: node.id,
      promptText: node.promptText || '',
      commitMessage: node.commitMessage || '',
      notes: node.notes || '',
      tags: node.tags.join(' '),
      generationOutputText: (nodeGens[node.id] || []).join(' '),
      model: modelsStr,
      provider: providersStr,
    };
  });
}

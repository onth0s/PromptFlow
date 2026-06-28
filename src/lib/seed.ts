import { Workspace, PromptNode, Generation } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface SeedData {
  workspace: Workspace;
  nodes: PromptNode[];
  generations: Generation[];
}

export function generateSeedData(): SeedData {
  const workspaceId = uuidv4();
  const workspace: Workspace = {
    id: workspaceId,
    name: '🎨 Creative Writing Demo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const nodes: PromptNode[] = [];
  const generations: Generation[] = [];

  // Root Node
  const rootNodeId = uuidv4();
  const rootNode: PromptNode = {
    id: rootNodeId,
    workspaceId,
    parentId: null,
    name: 'Initial Concept Draft',
    versionTag: 'v1.0',
    commitMessage: 'Establish original prompt for generating a sci-fi narrative opener.',
    notes: 'Starting baseline. Focuses on setting the mood on an icy explorer outpost.',
    isFavorite: true,
    tags: ['baseline', 'sci-fi'],
    inputModality: 'text',
    outputModality: 'text',
    promptText: 'Write a compelling first paragraph for a science fiction novel set on a freezing, isolated research outpost on Jupiter\'s moon Europa.',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 24 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  };
  nodes.push(rootNode);

  // Generation for Root Node (Completed)
  generations.push({
    id: uuidv4(),
    promptNodeId: rootNodeId,
    createdAt: new Date(Date.now() - 3600000 * 23.5).toISOString(),
    duration: 1850,
    provider: 'Anthropic',
    model: 'claude-3-5-sonnet',
    output: {
      status: 'Completed',
      text: 'The ice of Europa sang in a high, metallic register, a continuous groaning under the weight of the dark ocean below. Inside Outpost 7, the condensation had frozen into geometric patterns across the viewports, turning the colossal silhouette of Jupiter into a cracked, copper eye.'
    }
  });

  // Linear revision node (v1.1)
  const linearNodeId = uuidv4();
  const linearNode: PromptNode = {
    id: linearNodeId,
    workspaceId,
    parentId: rootNodeId,
    name: 'Increased Tension & Detail',
    versionTag: 'v1.1',
    commitMessage: 'Add sensory details and focus on the isolation of the researcher.',
    notes: 'Adds more physical claustrophobia. Good progression.',
    isFavorite: false,
    tags: ['revision', 'sensory'],
    inputModality: 'text',
    outputModality: 'text',
    promptText: 'Write a compelling first paragraph for a sci-fi novel on Europa\'s research outpost. Emphasize the freezing isolation, the constant groan of the deep ice, and the sensory experience of cold and claustrophobia inside the metal habitat.',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  };
  nodes.push(linearNode);

  // Generation for v1.1 (Completed)
  generations.push({
    id: uuidv4(),
    promptNodeId: linearNodeId,
    createdAt: new Date(Date.now() - 3600000 * 11.5).toISOString(),
    duration: 2100,
    provider: 'Anthropic',
    model: 'claude-3-5-sonnet',
    output: {
      status: 'Completed',
      text: 'Cold was not merely a temperature in Outpost 7; it was a physical occupant. It sat in the joints of the crew, misted in shallow breaths, and hummed through the metal deckplates. Beneath their feet, the moon\'s ice crust creaked—a three-mile-thick ceiling holding back an ocean that desperately wanted in.'
    }
  });

  // Fork Node A: Shifting to action-heavy tone (v1.2-action)
  const actionForkId = uuidv4();
  const actionFork: PromptNode = {
    id: actionForkId,
    workspaceId,
    parentId: linearNodeId,
    name: 'Action Opener Variant',
    versionTag: 'v1.2-action',
    commitMessage: 'Introduce a sudden power alert to kick off immediate narrative action.',
    notes: 'Checking if an immediate warning alert creates a faster pace.',
    isFavorite: false,
    tags: ['action', 'experiment'],
    inputModality: 'text',
    outputModality: 'text',
    promptText: 'Write a first paragraph for a sci-fi novel on Europa\'s outpost. Start in media res with a critical pressure warning or electrical failure in the freezing habitat.',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(), // 6 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  };
  nodes.push(actionFork);

  // Generations for Fork A (One completed, one failed)
  generations.push({
    id: uuidv4(),
    promptNodeId: actionForkId,
    createdAt: new Date(Date.now() - 3600000 * 5.8).toISOString(),
    duration: 1950,
    provider: 'OpenAI',
    model: 'gpt-4o',
    output: {
      status: 'Completed',
      text: 'The klaxon didn\'t sound like a siren; it was a low, vibrating pulse that rattled the screws in the bulkhead. Red emergency illumination bathed the frozen condensation on Outpost 7\'s walls, casting long shadows as the main life-support heat exchangers kicked offline one by one.'
    }
  });

  generations.push({
    id: uuidv4(),
    promptNodeId: actionForkId,
    createdAt: new Date(Date.now() - 3600000 * 5.5).toISOString(),
    duration: 980,
    provider: 'OpenAI',
    model: 'gpt-4o',
    output: {
      status: 'Failed',
      error: 'API rate limit exceeded. Please wait before retrying.'
    }
  });

  // Fork Node B: Descriptive/Atmospheric focus (v1.2-atmospheric)
  const atmosphericForkId = uuidv4();
  const atmosphericFork: PromptNode = {
    id: atmosphericForkId,
    workspaceId,
    parentId: linearNodeId,
    name: 'Descriptive Atmospheric Variant',
    versionTag: 'v1.2-atmospheric',
    commitMessage: 'Focus heavily on the visual contrast of Jupiter outside vs darkness inside.',
    notes: 'Prioritize scenery and cosmic scale over claustrophobia.',
    isFavorite: false,
    tags: ['atmospheric', 'cosmic'],
    inputModality: 'text',
    outputModality: 'text',
    promptText: 'Write a sci-fi novel opening on Europa. Emphasize the giant, storm-swept bands of Jupiter hanging in the sky above the pitch-black ice sheets.',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  };
  nodes.push(atmosphericFork);

  // Queued generation for atmospheric branch (placeholder)
  generations.push({
    id: uuidv4(),
    promptNodeId: atmosphericForkId,
    createdAt: new Date(Date.now() - 3600000 * 2.8).toISOString(),
    provider: 'Stability',
    model: 'stable-diffusion-3',
    output: {
      status: 'Queued'
    }
  });

  return { workspace, nodes, generations };
}

export type InputModality = 'text' | 'image' | 'text+image';
export type OutputModality = 'text' | 'image' | 'text+image';

export type GenerationStatus = 'Completed' | 'Failed' | 'Queued';

export type GenerationOutput =
  | { status: 'Completed'; text?: string; imageId?: string }
  | { status: 'Failed'; error: string }
  | { status: 'Queued' };

export interface Workspace {
  id: string;        // UUID, auto-generated
  name: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface PromptNode {
  // Identity
  id: string;               // UUID, auto-generated at creation
  workspaceId: string;      // References the containing Workspace
  parentId: string | null;  // null for root nodes.

  // Presentation
  name: string;             // Human-readable label. Editable, mutable in place.
  versionTag: string;       // User-defined label (e.g. "v1.0", "refactor-tone"). Editable, mutable.
  commitMessage: string;    // Immutable after creation.
  notes?: string;           // Mutable free-text annotation.
  isFavorite: boolean;
  tags: string[];           // Array of tags

  // Prompt content (Immutable)
  inputModality: InputModality;
  outputModality: OutputModality;
  promptText?: string;      // Required when inputModality includes 'text'
  promptImageId?: string;   // localForage key for stored image blob

  createdAt: string;        // ISO 8601. Immutable.
  updatedAt: string;        // ISO 8601. Updated on mutable field changes.
  deletedAt?: string;       // ISO 8601. Soft-delete flag.
}

// Runtime-derived properties for Zustand state mapping
export interface PromptNodeWithChildren extends PromptNode {
  childrenIds: string[];
}

export interface Generation {
  id: string;            // UUID
  promptNodeId: string;  // References the PromptNode
  createdAt: string;     // ISO 8601
  duration?: number;     // Milliseconds from request to completion/failure. Optional.
  provider?: string;     // Structured field e.g. "OpenAI"
  model?: string;        // Structured field e.g. "gpt-4o"
  output: GenerationOutput;
  deletedAt?: string;    // ISO 8601. Soft-delete flag.
}

export interface WorkspaceSnapshot {
  schemaVersion: number;
  exportMode: 'full' | 'text-only';
  exportedAt: string;
  workspace: Workspace;
  promptNodes: PromptNode[];
  generations: Generation[];
  assets?: Record<string, string>; // key -> Base64 blob string. Present only in 'full' mode.
}

# PromptFlow: Minimalist Multimodal Prompt Versioning Spec

A lightweight, local-first dashboard for organizing, versioning, and tracking multimodal AI generation experiments. PromptFlow treats prompts as immutable versioned artifacts, allowing every iteration to be reproduced, forked, and explored through a structured history.

---

# 1. Core Architecture

Every prompt revision is represented by an immutable **PromptNode**.

A PromptNode represents **the prompt itself**, not a generation. Executions of that prompt are stored separately as **Generations**, allowing multiple outputs to originate from the same prompt version.

All PromptNodes belong to a **Workspace**. Workspaces are the top-level organizational unit and have no relationship to one another.

The full hierarchy is:

```
Workspace
    └── Root PromptNode
              ├── PromptNode (linear revision)
              │         ├── Generation A
              │         └── Generation B
              │
              └── PromptNode (forked)
                        └── Generation C
```

Linear revision:

```
A  →  B  →  C
```

Fork from A:

```
A
├── B
└── D
```

Continue D linearly, then fork B:

```
A
├── B
│   ├── C
│   └── F
└── D
    └── E
```

Branch structure is fully derivable from the tree itself. A node with more than one child is a fork point; each distinct path descending from it is a branch. No additional field is needed to encode this — the graph is the branch record. This is possible precisely because all nodes are immutable: there are no movable references, so nothing needs to be named to stay stable.

---

# 2. Data Model

## Workspace

```ts
interface Workspace {
  id: string;        // UUID, auto-generated
  name: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

A Workspace is a named container for a collection of independent prompt trees. Examples: "Anime", "Logo Design", "LLM Prompts", "Stable Diffusion", "Writing". There is no relationship between Workspaces. The user may create, rename, and delete Workspaces. Deleting a Workspace soft-deletes all contained PromptNodes and Generations (see Recycle Bin).

---

## PromptNode

```ts
interface PromptNode {
  // Identity
  id: string;               // UUID, auto-generated at creation
  workspaceId: string;      // References the containing Workspace
  parentId: string | null;  // null for root nodes. The root of any tree is the
                            // ancestor reachable by following parentId links to null
                            // — derivable at runtime, not stored.

  // Presentation
  name: string;             // Human-readable label. Defaults to the creation
                            // timestamp (e.g. "2026-06-28 14:32"). Editable at any
                            // time to a plain-text note such as
                            // "best 3D model from 2D input". Mutable in place.
  versionTag: string;       // User-defined label (e.g. "v1.0", "refactor-tone").
                            // Auto-suggested as an increment of the parent's tag
                            // (e.g. parent "v1.1" → suggest "v1.2") but always
                            // editable. Presentation metadata only — identity
                            // is always the UUID.
  commitMessage: string;    // Immutable after creation — like a Git commit message,
                            // it records the reason this node was created and must
                            // not be rewritten after the fact.
  notes?: string;           // Mutable free-text annotation. Use this for observations,
                            // reminders, or retrospective commentary that may evolve
                            // over time. Does not affect identity or history integrity.
  isFavorite: boolean;
  tags: string[];           // See Section 2 — Tag System

  // Prompt content
  inputModality: 'text' | 'image' | 'text+image';
  outputModality: 'text' | 'image' | 'text+image';
  promptText?: string;      // Required when inputModality includes 'text'
  promptImageId?: string;   // localForage key for the stored image blob;
                            // required when inputModality includes 'image'

  createdAt: string;        // ISO 8601. Immutable after creation.
  updatedAt: string;        // ISO 8601. Updated whenever any mutable field changes:
                            // name, versionTag, commitMessage, isFavorite, tags.
  deletedAt?: string;       // ISO 8601; present when soft-deleted (Recycle Bin)
}
```

### Mutable vs Immutable Fields

The prompt content fields (`promptText`, `promptImageId`, `inputModality`, `outputModality`) are immutable. Editing them always creates a new PromptNode (New Version or Fork).

The presentation fields (`name`, `versionTag`, `notes`, `isFavorite`, `tags`) are mutable in place. Mutating any of them updates `updatedAt`.

`commitMessage` is immutable after creation. It is set once at node creation time and cannot be edited. To add evolving commentary to a node, use `notes`.

---

## Tag System

Tags are free-form, user-defined strings attached to a PromptNode. They have no schema beyond being non-empty strings. They represent semantic annotations chosen by the user (e.g. "dark-tone", "v2-candidate", "rejected").

`provider` and `model` are **not** tags. They are typed fields on Generation (see below) and are filtered and searched independently. This prevents collisions between user-defined tag vocabulary and structured provider/model metadata.

Filtering supports AND and OR logic across the tag set (see Section 3). Tags are a first-class search index field.

---

## Generation

```ts
type GenerationOutput =
  | { status: 'Completed'; text?: string; imageId?: string }
  | { status: 'Failed';    error: string }
  | { status: 'Queued' };

// 'Queued' means the generation has been logged but no output has been recorded
// yet — a manual placeholder for a run the user intends to do, or to mark a node
// as "not tried yet". The name 'Queued' is chosen over 'Pending' because Pending
// implies an in-flight request, whereas Queued communicates deliberate intent.
// No lifecycle enforcement: Queued records are inert and persist as-is across
// sessions. The sidebar displays a count of Queued generations as a passive reminder.
//
// imageId, when present, is a localForage key pointing to the stored output image
// blob — consistent with promptImageId on PromptNode. All image assets are local
// in v1. When Google Drive sync is enabled in a future phase, image assets will be
// fetched from Drive and imageId will reference the remote file identifier instead.

interface Generation {
  id: string;            // UUID, auto-generated
  promptNodeId: string;  // References the PromptNode this was run from

  createdAt: string;     // ISO 8601
  duration?: number;     // Milliseconds from request to completion or failure.
                         // Optional: recorded when available, omitted otherwise.

  provider?: string;     // Structured field. e.g. "OpenAI", "Anthropic", "Stability".
                         // Optional: may be unknown at creation time for Queued
                         // generations. Filtered and searched independently from tags.
  model?: string;        // Structured field. Full API model identifier as written
                         // by the user, e.g. "gpt-4o-2024-08-06", "claude-opus-4-6".
                         // Optional: may be unknown at creation time for Queued
                         // generations. Filtered and searched independently from tags.
                         // Searching "gpt" matches only the model field, not tags.

  output: GenerationOutput;

  deletedAt?: string;    // ISO 8601; present when soft-deleted (Recycle Bin)
}
```

A single PromptNode may have zero, one, or many associated Generations.

The `parameters` field has been removed. PromptFlow v1 supports text and image I/O only; provider-specific generation parameters are out of scope.

---

## Recycle Bin

Deletion is always soft. Neither PromptNodes nor Generations are hard-deleted from IndexedDB at the moment of user action.

### Deletion Behavior

Deleting a PromptNode that has descendants (children, grandchildren, and their associated Generations) triggers a confirmation dialog that:

- Clearly states how many nodes and generations will be affected.
- Requires explicit acknowledgment before proceeding.

On confirmation, `deletedAt` is stamped with the current timestamp on the target node and all of its descendants recursively, along with their Generations.

Deleting a Workspace triggers the same confirmation dialog, scoped to all PromptNodes and Generations in that Workspace.

### Recycle Bin Settings

The user can configure the retention window: **30, 45, or 60 days**.

Items whose `deletedAt` timestamp exceeds the retention window are eligible for permanent purge. Purging runs:

- On app load (background sweep).
- Manually via an "Empty Recycle Bin" action.

The Recycle Bin is accessible as a view mode showing all soft-deleted nodes and generations. Individual items or entire trees can be restored or permanently deleted from this view.

---

## Workspace Snapshots

A Workspace can be exported as a single self-contained `.promptflow.json` file and imported on any PromptFlow instance.

### Export Modes

Two export modes are offered at export time:

**Full** — includes all data plus image assets. Produces a larger file but is fully self-contained and portable. Images referenced by `promptImageId` or `output.imageId` are read from localForage, encoded as Base64, and written into an `assets` map keyed by their localForage key. Suitable for backup, migration, and sharing with someone who needs the complete artifact set.

**Text Only** — excludes all image blobs. The `assets` map is omitted and image references (`promptImageId`, `output.imageId`) are preserved as-is in the records but will resolve to nothing on import if the target instance does not have the same blobs in its localForage. Produces a significantly smaller file. Suitable for sharing prompt trees and generation text when images are not needed or are too large.

The export mode is selected by the user in the export dialog before the file is downloaded. The file is named `{workspace-name}_{YYYY-MM-DD}.promptflow.json`, derived from the Workspace name and the export date.

### Snapshot Format

```ts
interface WorkspaceSnapshot {
  schemaVersion: number;          // Integer. Incremented when the snapshot format changes.
                                  // Current version: 1.
  exportMode: 'full' | 'text-only';
  exportedAt: string;             // ISO 8601 timestamp of export.
  workspace: Workspace;
  promptNodes: PromptNode[];
  generations: Generation[];
  assets?: Record<string, string>; // key → Base64-encoded blob. Present only in 'full' exports.
}
```

Soft-deleted items (those with a `deletedAt` field) are excluded from all exports.

### Import

Importing a `.promptflow.json` file creates a new Workspace from the snapshot. It does not merge into an existing Workspace.

On import:

- All UUIDs in the snapshot are preserved as-is. If a UUID collision with an existing record is detected, the user is informed and the import is aborted. (Collisions are astronomically unlikely with UUID v4 but must be handled.)
- If `exportMode` is `'full'`, `assets` blobs are decoded from Base64 and written back into localForage under their original keys.
- If `exportMode` is `'text-only'`, image references in the imported records are preserved but will not resolve. No error is raised; the UI renders image slots as unavailable.
- `schemaVersion` is checked against the current supported version. If the snapshot is from a newer schema version than the app supports, the import is rejected with a clear error message.

### Intended Uses

- Moving a Workspace between browsers or devices without cloud sync.
- Sharing a prompt tree with another user.
- Point-in-time backup before destructive experiments.

---

# 3. Dynamic Sorting, Filtering and Grouping

All filtering and sorting operates within the active Workspace. Switching Workspaces resets the view to that Workspace's root nodes.

## Grouping

- By Lineage (Tree View)
- By Input Modality
- By Output Modality
- By Date

---

## Filtering

- Favorites
- Tags (AND / OR) — evaluated as an in-memory filter over the full loaded dataset
- Input Modality
- Output Modality
- Provider (exact match or substring)
- Model (exact match or substring)
- Lineage
  - Roots Only
  - Branch Heads Only
  - Full History
- Full-text Search

Search indexes:

- Prompt Text
- Commit Message
- Generation Output (text)
- Tags
- Model (independent of tags)
- Provider (independent of tags)

Full-text search is implemented with MiniSearch, a lightweight in-memory full-text search library with no dependencies. The index is built at hydration time over the fields listed above and updated incrementally on mutations. Model and Provider searches operate only on their respective typed fields and do not bleed into the tag index.

---

## Sorting

- Creation Date (Ascending / Descending)
- Last Updated (Ascending / Descending)
- Last Generation Date — defined as the `createdAt` timestamp of the most recent Generation across a node's entire subtree (itself plus all descendants). Nodes with no generations sort last. Useful for surfacing prompt trees that have seen recent execution activity.
- Iteration Density — defined as the total number of Generations associated with a node's entire subtree (itself plus all descendants). Nodes with more exploratory activity rank higher.
- Prompt Length (Ascending / Descending)

---

# 4. UI Layout

Single-page layout with an optional left/right sidebar.

A Workspace selector is always visible at the top level (e.g. a top bar dropdown or a persistent left-rail list). Switching Workspaces replaces the main view entirely.

Each PromptNode is displayed as a version card.

## Sidebar

The sidebar is collapsed by default. When open, it serves one of two modes (toggled by the user):

- **Filter / Sort Panel** — exposes all filtering, grouping, and sorting controls.
- **Tree View** — renders the full lineage tree of all PromptNodes in the active Workspace, with the currently selected node highlighted. Clicking a node in the tree selects it in the main view.

## Card Layout

**Header**
- Version Tag
- Timestamp (`createdAt`; `updatedAt` shown on hover or as a secondary line if different)
- Favorite toggle
- Input / Output Modality indicators

**Body**
- Prompt text (truncated with expand option)
- Commit Message (immutable; shown as authored context)
- Notes (mutable; shown as current annotation, if present)

**Footer**
- Generation count badge (e.g. "3 generations")
- View Generations
- New Version / Fork

## Generation Detail

Selecting "View Generations" on a card opens a right-side drawer (not a modal, not a new page) showing all Generations associated with that PromptNode, ordered by `createdAt` descending.

Each Generation entry displays:
- Status badge (Completed / Failed / Queued)
- Model and Provider (as labeled fields, not tags)
- Duration (if available)
- Output: text and/or image
- Error message (if Failed)

## Empty State

On first load with no Workspaces, the app prompts the user to create their first Workspace. Once a Workspace exists but contains no PromptNodes, the main area displays a prompt to create the first node, with a brief one-line explanation of what PromptFlow is for.

## Error States

- Generation Failed: the generation entry in the drawer shows the error string and a "Retry" affordance that creates a new Generation record from the same PromptNode.
- IndexedDB unavailable: a top-level banner informs the user that persistence is unavailable and the session is ephemeral.

---

# 5. Versioning Rules

PromptNodes are immutable in their content fields.

Creating a new revision (New Version) always creates a new PromptNode as a child of the current one.

Creating a fork (Fork) also creates a new PromptNode as a child of the current one. The distinction from New Version is purely in user intent and UI affordance; structurally both are new nodes with a `parentId` pointing to their origin. Branch topology is implicit in the tree: any node with more than one child is a fork point.

Generations are immutable.

Running the same prompt multiple times creates multiple Generation objects attached to the same PromptNode.

Tree identity is tracked through `parentId` alone. No branch identifier and no root identifier are stored; both are derivable by traversing the in-memory graph. Branches are read from the graph structure: a fork point is any node with more than one child.

Version tags are presentation metadata only and are not relied upon for identity.

Every object is uniquely identified through its UUID.

Deletion is always soft. See Section 2 — Recycle Bin.

---

# 6. Tech Stack

**Frontend**
- Next.js
- TailwindCSS
- Motion
- Zustand

**Persistence**
- localForage (IndexedDB)

localForage is the persistence layer. Zustand is the runtime store. On app load, the full dataset is hydrated from localForage into Zustand. All mutations write through to localForage synchronously after updating Zustand state.

During hydration, a `childrenIds: string[]` field is derived for every PromptNode and added to the Zustand store. It is not persisted. It maps each node to its direct children, making tree rendering O(1) per node rather than O(n) per render. Any mutation that creates or soft-deletes a PromptNode updates this derived map in Zustand alongside the persisted record.

**Authentication (Optional)**
- Google OAuth

**Synchronization (Optional)**
- Google Drive AppData Folder

In the event of sync conflicts (same tree diverging across devices, detectable by shared `parentId` chains with differing nodes), the resolution strategy is last-write-wins by `updatedAt` timestamp. Conflicts are not surfaced to the user in v1.

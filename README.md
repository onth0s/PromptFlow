# PromptFlow

PromptFlow is a Next.js application designed to manage, version, and evaluate prompt templates in structured tree-graphs across multiple workspaces.

## Features

- **Workspaces**: Group templates into independent containers, with support for JSON imports/exports.
- **Version Tree-Graphs**: Track iterations and forks of prompts as nodes in a graph.
- **Multimodal Inputs/Outputs**: Support text, images, and text+image modalities.
- **IndexedDB Persistence**: Automatically persist workspaces, nodes, generations, settings, and assets locally via `localforage`.
- **Full Text Search**: Fuzzy full-text search across prompts, commits, notes, models, and providers using `minisearch`.
- **Recycle Bin**: Soft-delete nodes and generations with custom retention policies.

## Project Structure & Architecture

The codebase has been refactored for clean separation of concerns and optimal rendering performance:

```
src/
├── app/                  # Next.js App Router pages
│   ├── page.tsx          # Main workspace and node layout
│   └── recycle-bin/      # Recycle bin control panel
├── components/           # UI and layout component registry
├── hooks/                # Custom React hook controllers
│   └── useNodeFilters.ts # Search, sorting, filtering, and grouping hook
├── lib/                  # Native libraries (indexedDB, tree-graph utilities, snapshots)
├── store/                # Zustand global state stores (app, selection, filter)
└── types/                # TypeScript interfaces and schema structures
```

### Recent Refactoring Highlights

- **Extracted Hook Controller**: Moved search indexes, grouping compilers, and modality filters from `page.tsx` into `useNodeFilters` hook.
- **Immutable Store Patterns**: Replaced raw mutations in Zustand actions with immutable updates, utilizing custom helpers (`omitChildrenIds`, `omitDeletedAt`) to prevent unused variable compiler warnings.
- **Consolidated Dialog Manager**: Consolidated modal state variables in `page.tsx` into a unified `dialogState` object.
- **TreeView Optimization**: Tree View node calculations now use store-derived parent-child mapping paths instead of rebuilding derived maps dynamically on every render cycle.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Tasks

To run type checks and linter inspections:

```bash
npm run lint
```

To build a production distribution bundle:

```bash
npm run build
```

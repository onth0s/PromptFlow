'use client';

import React, { useState } from 'react';
import { useFilterStore, GroupByOption, SortByOption, LineageFilter } from '../../store/useFilterStore';
import { useAppStore } from '../../store/useAppStore';
import { Button, Input } from '../ui';
import { InputModality, OutputModality } from '../../types';

export const FilterSortPanel: React.FC = () => {
  const filterStore = useFilterStore();
  const promptNodes = useAppStore((state) => state.promptNodes);
  const activeWorkspaceId = useAppStore((state) => state.activeWorkspaceId);

  const [tagInput, setTagInput] = useState('');

  // Collect all unique tags in current workspace for suggestion helper
  const allWorkspaceTags = Array.from(
    new Set(
      Object.values(promptNodes)
        .filter((node) => node.workspaceId === activeWorkspaceId && !node.deletedAt)
        .flatMap((node) => node.tags)
    )
  );

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !filterStore.filterTags.includes(trimmed)) {
      filterStore.setFilterTags([...filterStore.filterTags, trimmed]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    filterStore.setFilterTags(filterStore.filterTags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-6 text-sm text-zinc-800 dark:text-zinc-200">
      {/* Search Input */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
          Full Text Search
        </label>
        <Input
          type="text"
          placeholder="Search text, commits, output..."
          value={filterStore.searchQuery}
          onChange={(e) => filterStore.setSearchQuery(e.target.value)}
        />
      </div>

      {/* Favorites Filter */}
      <div className="flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">Show Favorites Only</span>
        <button
          onClick={() => filterStore.setFilterFavorites(!filterStore.filterFavorites)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            filterStore.filterFavorites ? 'bg-indigo-600' : 'bg-zinc-200 dark:bg-zinc-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              filterStore.filterFavorites ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Tags Autocomplete Filter */}
      <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800 space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
          Filter by Tags
        </label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Type tag & Enter..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag(tagInput);
              }
            }}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleAddTag(tagInput)}
            className="px-3"
          >
            Add
          </Button>
        </div>

        {/* Suggestion list */}
        {tagInput.trim() && (
          <div className="max-h-24 overflow-y-auto rounded-lg border border-zinc-100 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-950 flex flex-wrap gap-1">
            {allWorkspaceTags
              .filter((t) => t.toLowerCase().includes(tagInput.toLowerCase()) && !filterStore.filterTags.includes(t))
              .map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleAddTag(tag)}
                  className="px-2 py-0.5 rounded bg-zinc-200 hover:bg-indigo-100 dark:bg-zinc-800 dark:hover:bg-indigo-950 text-xs text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
          </div>
        )}

        {/* Selected Tags list */}
        {filterStore.filterTags.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">Selected Tags:</span>
              <button
                onClick={filterStore.toggleTagLogic}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Match: {filterStore.tagLogic}
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {filterStore.filterTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/30 dark:text-indigo-300 px-2 py-0.5 text-xs font-medium"
                >
                  <span>#{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-indigo-900 dark:hover:text-indigo-100 font-bold cursor-pointer"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Modalities Filter */}
      <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
          Input Modality
        </label>
        <select
          value={filterStore.filterInputModality}
          onChange={(e) => filterStore.setFilterInputModality(e.target.value as InputModality | 'all')}
          className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <option value="all">All Modalities</option>
          <option value="text">Text Only</option>
          <option value="image">Image Only</option>
          <option value="text+image">Text + Image</option>
        </select>
      </div>

      {/* Output Modalities Filter */}
      <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
          Output Modality
        </label>
        <select
          value={filterStore.filterOutputModality}
          onChange={(e) => filterStore.setFilterOutputModality(e.target.value as OutputModality | 'all')}
          className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <option value="all">All Modalities</option>
          <option value="text">Text Only</option>
          <option value="image">Image Only</option>
          <option value="text+image">Text + Image</option>
        </select>
      </div>

      {/* Provider Filter */}
      <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
          Filter by Provider
        </label>
        <Input
          type="text"
          placeholder="e.g. Anthropic, OpenAI"
          value={filterStore.filterProvider}
          onChange={(e) => filterStore.setFilterProvider(e.target.value)}
        />
      </div>

      {/* Model Filter */}
      <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
          Filter by Model
        </label>
        <Input
          type="text"
          placeholder="e.g. gpt-4o, claude-3-5"
          value={filterStore.filterModel}
          onChange={(e) => filterStore.setFilterModel(e.target.value)}
        />
      </div>

      {/* Lineage Filter */}
      <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
          Lineage Scope
        </label>
        <select
          value={filterStore.filterLineage}
          onChange={(e) => filterStore.setFilterLineage(e.target.value as LineageFilter)}
          className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <option value="all">Full Workspace History</option>
          <option value="roots">Roots Only</option>
          <option value="heads">Branch Heads Only</option>
        </select>
      </div>

      {/* Grouping Selection */}
      <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
          Group Cards By
        </label>
        <select
          value={filterStore.groupBy}
          onChange={(e) => filterStore.setGroupBy(e.target.value as GroupByOption)}
          className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <option value="none">No Grouping</option>
          <option value="inputModality">Input Modality</option>
          <option value="outputModality">Output Modality</option>
          <option value="date">Creation Date</option>
        </select>
      </div>

      {/* Sorting Control */}
      <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800 space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
          Sort Cards By
        </label>
        <div className="flex gap-2">
          <select
            value={filterStore.sortBy}
            onChange={(e) => filterStore.setSortBy(e.target.value as SortByOption)}
            className="flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="createdAt">Creation Date</option>
            <option value="updatedAt">Last Updated</option>
            <option value="lastGeneration">Last Execution Date</option>
            <option value="density">Subtree Trial Density</option>
            <option value="length">Prompt Characters Length</option>
          </select>
          <Button
            variant="secondary"
            size="sm"
            onClick={filterStore.toggleSortDir}
            className="px-3"
            title={filterStore.sortDir === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
          >
            {filterStore.sortDir === 'asc' ? '▲' : '▼'}
          </Button>
        </div>
      </div>

      {/* Reset Button */}
      <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800 pt-4">
        <Button variant="secondary" onClick={filterStore.resetFilters} className="w-full">
          Reset Filters
        </Button>
      </div>
    </div>
  );
};

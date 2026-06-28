import { create } from 'zustand';
import { InputModality, OutputModality } from '../types';

export type LineageFilter = 'all' | 'roots' | 'heads';
export type GroupByOption = 'none' | 'lineage' | 'inputModality' | 'outputModality' | 'date';
export type SortByOption = 'createdAt' | 'updatedAt' | 'lastGeneration' | 'density' | 'length';

interface FilterState {
  searchQuery: string;
  filterFavorites: boolean;
  filterTags: string[];
  tagLogic: 'AND' | 'OR';
  filterInputModality: InputModality | 'all';
  filterOutputModality: OutputModality | 'all';
  filterProvider: string;
  filterModel: string;
  filterLineage: LineageFilter;
  groupBy: GroupByOption;
  sortBy: SortByOption;
  sortDir: 'asc' | 'desc';

  // Actions
  setSearchQuery: (query: string) => void;
  setFilterFavorites: (fav: boolean) => void;
  setFilterTags: (tags: string[]) => void;
  toggleTagLogic: () => void;
  setFilterInputModality: (mod: InputModality | 'all') => void;
  setFilterOutputModality: (mod: OutputModality | 'all') => void;
  setFilterProvider: (provider: string) => void;
  setFilterModel: (model: string) => void;
  setFilterLineage: (lin: LineageFilter) => void;
  setGroupBy: (group: GroupByOption) => void;
  setSortBy: (sort: SortByOption) => void;
  toggleSortDir: () => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  searchQuery: '',
  filterFavorites: false,
  filterTags: [],
  tagLogic: 'OR',
  filterInputModality: 'all',
  filterOutputModality: 'all',
  filterProvider: '',
  filterModel: '',
  filterLineage: 'all',
  groupBy: 'none',
  sortBy: 'createdAt',
  sortDir: 'desc',

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterFavorites: (filterFavorites) => set({ filterFavorites }),
  setFilterTags: (filterTags) => set({ filterTags }),
  toggleTagLogic: () => set((state) => ({ tagLogic: state.tagLogic === 'AND' ? 'OR' : 'AND' })),
  setFilterInputModality: (filterInputModality) => set({ filterInputModality }),
  setFilterOutputModality: (filterOutputModality) => set({ filterOutputModality }),
  setFilterProvider: (filterProvider) => set({ filterProvider }),
  setFilterModel: (filterModel) => set({ filterModel }),
  setFilterLineage: (filterLineage) => set({ filterLineage }),
  setGroupBy: (groupBy) => set({ groupBy }),
  setSortBy: (sortBy) => set({ sortBy }),
  toggleSortDir: () => set((state) => ({ sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' })),
  resetFilters: () => set({
    searchQuery: '',
    filterFavorites: false,
    filterTags: [],
    tagLogic: 'OR',
    filterInputModality: 'all',
    filterOutputModality: 'all',
    filterProvider: '',
    filterModel: '',
    filterLineage: 'all',
    groupBy: 'none',
    sortBy: 'createdAt',
    sortDir: 'desc',
  }),
}));

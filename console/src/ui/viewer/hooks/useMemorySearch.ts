import { useState, useRef, useEffect, useCallback } from 'react';
import { useProject } from '../context';

const SEARCH_TIMEOUT_MS = 120_000;

export interface MemorySearchResult {
  id: number;
  type: 'observation' | 'summary' | 'prompt';
  title: string;
  content: string;
  project: string;
  timestamp: string;
  score: number;
  obsType?: string;
}

interface MemorySearchResponse {
  results: MemorySearchResult[];
  query: string;
  usedSemantic: boolean;
  vectorDbAvailable: boolean;
}

export interface SearchMeta {
  usedSemantic: boolean;
  vectorDbAvailable: boolean;
}

export interface UseMemorySearchResult {
  isSearchMode: boolean;
  searchResults: MemorySearchResult[];
  isSearching: boolean;
  searchError: string | null;
  searchMeta: SearchMeta | null;
  handleSearch: (query: string) => Promise<void>;
  handleClearSearch: () => void;
}

export function useMemorySearch(): UseMemorySearchResult {
  const { selectedProject } = useProject();

  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<MemorySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchMeta, setSearchMeta] = useState<SearchMeta | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);

  const handleSearch = useCallback(async (query: string) => {
    abortRef.current?.abort();
    cancelledRef.current = false;
    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

    setIsSearching(true);
    setIsSearchMode(true);
    setSearchError(null);

    try {
      const params = new URLSearchParams({ query, limit: '30' });
      if (selectedProject) {
        params.set('project', selectedProject);
      }
      const response = await fetch(`/api/search/semantic?${params}`, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`);
      }
      const data: MemorySearchResponse = await response.json();

      setSearchResults(data.results || []);
      setSearchMeta({
        usedSemantic: data.usedSemantic,
        vectorDbAvailable: data.vectorDbAvailable
      });
    } catch (error) {
      if (cancelledRef.current) {
        return;
      }
      if ((error as Error).name === 'AbortError') {
        setSearchError('Search timed out. Please try again.');
      } else {
        setSearchError('Search failed. Please try again.');
      }
      setSearchResults([]);
      setSearchMeta(null);
    } finally {
      clearTimeout(timeoutId);
      if (!cancelledRef.current) {
        setIsSearching(false);
      }
    }
  }, [selectedProject]);

  const handleClearSearch = useCallback(() => {
    cancelledRef.current = true;
    abortRef.current?.abort();
    setIsSearchMode(false);
    setSearchResults([]);
    setSearchMeta(null);
    setSearchError(null);
    setIsSearching(false);
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    isSearchMode,
    searchResults,
    isSearching,
    searchError,
    searchMeta,
    handleSearch,
    handleClearSearch,
  };
}

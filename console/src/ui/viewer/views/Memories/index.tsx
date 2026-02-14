import { useState, useEffect, useCallback } from 'react';
import { MemoriesToolbar } from './MemoriesToolbar';
import { MemoryCard } from './MemoryCard';
import { MemoryDetailModal } from './MemoryDetailModal';
import { SearchInput } from '../../components/SearchInput';
import { SearchResultCard } from '../../components/SearchResultCard';
import { EmptyState, Spinner, Button, Icon, ScopeBadge, Badge } from '../../components/ui';
import { useToast, useProject } from '../../context';
import { useMemorySearch } from '../../hooks/useMemorySearch';

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'observation' | 'summary' | 'prompt';

interface Memory {
  id: number;
  type: string;
  title: string;
  content: string;
  facts: string[];
  project: string;
  timestamp: string;
  concepts?: string[];
}

export function MemoriesView() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();
  const { selectedProject } = useProject();

  const {
    isSearchMode, searchResults, isSearching, searchError,
    searchMeta, handleSearch: doSearch, handleClearSearch,
  } = useMemorySearch();

  const handleSearch = useCallback(async (query: string) => {
    if (selectionMode) {
      setSelectionMode(false);
      setSelectedIds(new Set());
    }
    await doSearch(query);
  }, [selectionMode, doSearch]);

  const fetchMemories = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') {
        params.set('type', filterType);
      }
      if (selectedProject) {
        params.set('project', selectedProject);
      }
      params.set('limit', '50');

      const response = await fetch(`/api/observations?${params}`);
      const data = await response.json();

      const items = data.items || data.observations || [];
      setMemories(items.map((item: any) => ({
        id: item.id,
        type: item.type || 'observation',
        title: item.title || 'Untitled',
        content: item.narrative || item.content || '',
        facts: item.facts ? (typeof item.facts === 'string' ? JSON.parse(item.facts) : item.facts) : [],
        project: item.project || 'unknown',
        timestamp: formatTimestamp(item.created_at),
        concepts: item.concepts ? (typeof item.concepts === 'string' ? JSON.parse(item.concepts) : item.concepts) : [],
      })));
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filterType, selectedProject]);

  function formatTimestamp(timestamp: string): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this memory?')) return;
    try {
      await fetch(`/api/observation/${id}`, { method: 'DELETE' });
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleView = (id: number) => {
    const memory = memories.find((m) => m.id === id);
    if (memory) {
      setSelectedMemory(memory);
    }
  };

  const handleToggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === memories.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(memories.map((m) => m.id)));
    }
  };

  const handleExitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkExport = async (format: 'json' | 'csv' | 'markdown') => {
    if (selectedIds.size === 0) {
      toast.error('No memories selected');
      return;
    }

    setIsExporting(true);
    try {
      const ids = Array.from(selectedIds).join(',');
      const url = `/api/export?format=${format}&ids=${ids}`;

      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `pilot-memory-export-${new Date().toISOString().split('T')[0]}.${format === 'markdown' ? 'md' : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(`Exported ${selectedIds.size} memories`);
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error('No memories selected');
      return;
    }

    if (!confirm(`Delete ${selectedIds.size} memories? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/observations/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Deleted ${data.deletedCount} memories`);
        setMemories((prev) => prev.filter((m) => !selectedIds.has(m.id)));
        setSelectedIds(new Set());
        setSelectionMode(false);
      } else {
        toast.error('Delete failed');
      }
    } catch (error) {
      toast.error('Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Memories</h1>
          <ScopeBadge project={selectedProject} />
        </div>
        <p className="text-base-content/60">
          {isSearchMode ? 'Search results' : 'Browse and manage your stored memories'}
        </p>
      </div>

      {/* Search bar */}
      <SearchInput
        onSearch={handleSearch}
        isSearching={isSearching}
        placeholder="Search memories semantically..."
      />

      {/* Clear search button */}
      {isSearchMode && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleClearSearch}>
            <Icon icon="lucide:x" size={16} className="mr-1" />
            Clear search
          </Button>
        </div>
      )}

      {/* Semantic search status badges (only show in search mode) */}
      {isSearchMode && searchMeta && (
        <div className="flex items-center gap-2 text-sm">
          {searchMeta.vectorDbAvailable ? (
            searchMeta.usedSemantic ? (
              <Badge variant="success" outline size="sm">
                <Icon icon="lucide:brain" size={14} className="mr-1" />
                Semantic Search Active
              </Badge>
            ) : (
              <Badge variant="warning" outline size="sm">
                <Icon icon="lucide:filter" size={14} className="mr-1" />
                Filter-only Mode
              </Badge>
            )
          ) : (
            <Badge variant="error" outline size="sm">
              <Icon icon="lucide:alert-triangle" size={14} className="mr-1" />
              Vector DB Unavailable
            </Badge>
          )}
          <span className="text-base-content/50">
            {searchMeta.usedSemantic
              ? 'Results ranked by semantic similarity'
              : searchMeta.vectorDbAvailable
                ? 'Enter a query for semantic ranking'
                : 'Install Chroma for semantic search'}
          </span>
        </div>
      )}

      {/* Toolbar (only show in browse mode) */}
      {!isSearchMode && (
        <MemoriesToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
          totalCount={memories.length}
          selectionMode={selectionMode}
          onToggleSelectionMode={() => selectionMode ? handleExitSelectionMode() : setSelectionMode(true)}
          selectedCount={selectedIds.size}
          onSelectAll={handleSelectAll}
          onExport={handleBulkExport}
          onDelete={handleBulkDelete}
          isExporting={isExporting}
          isDeleting={isDeleting}
          allSelected={memories.length > 0 && selectedIds.size === memories.length}
        />
      )}

      {/* Error display */}
      {searchError && !isSearching && (
        <div className="alert alert-error">
          <Icon icon="lucide:alert-circle" size={16} />
          <span>{searchError}</span>
        </div>
      )}

      {/* Results */}
      {isSearchMode ? (
        isSearching ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Spinner size="lg" />
            <span className="text-sm text-base-content/50">Searching memories...</span>
          </div>
        ) : searchError ? null : searchResults.length === 0 ? (
          <EmptyState
            icon="lucide:search-x"
            title="No results found"
            description="Try a different query"
          />
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-base-content/60">
              {searchResults.length} results
              {searchMeta?.usedSemantic && searchResults[0]?.score > 0 && (
                <span className="ml-2">
                  (best match: {Math.round(searchResults[0].score * 100)}% similarity)
                </span>
              )}
            </div>
            {searchResults.map((result) => (
              <SearchResultCard key={`${result.type}-${result.id}`} result={result} />
            ))}
          </div>
        )
      ) : (
        isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
          </div>
        ) : memories.length === 0 ? (
          <EmptyState
            icon="lucide:brain"
            title="No memories found"
            description="Memories will appear here as you use Claude Code"
          />
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {memories.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                viewMode={viewMode}
                onDelete={handleDelete}
                onView={handleView}
                selectionMode={selectionMode}
                isSelected={selectedIds.has(memory.id)}
                onToggleSelection={handleToggleSelection}
              />
            ))}
          </div>
        )
      )}

      <MemoryDetailModal
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
      />
    </div>
  );
}

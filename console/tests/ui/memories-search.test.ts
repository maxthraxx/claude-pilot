/**
 * Memories Search Integration Tests
 *
 * Tests that the Memories view properly integrates search functionality
 * via the useMemorySearch hook, including search bar rendering, result display,
 * and mode switching. Search logic tests are in tests/hooks/use-memory-search.test.ts.
 */

import { describe, it, expect } from "bun:test";
import { readFileSync } from "fs";

const viewSource = readFileSync(
  "src/ui/viewer/views/Memories/index.tsx",
  "utf-8"
);

describe("Memories search integration", () => {
  it("imports SearchInput and SearchResultCard components", () => {
    expect(viewSource).toContain("import { SearchInput }");
    expect(viewSource).toContain("import { SearchResultCard }");
    expect(viewSource).toContain("from '../../components/SearchInput'");
    expect(viewSource).toContain("from '../../components/SearchResultCard'");
  });

  it("imports useMemorySearch hook", () => {
    expect(viewSource).toContain("import { useMemorySearch }");
    expect(viewSource).toContain("from '../../hooks/useMemorySearch'");
  });

  it("destructures search state from useMemorySearch hook", () => {
    expect(viewSource).toContain("useMemorySearch()");
    expect(viewSource).toContain("isSearchMode");
    expect(viewSource).toContain("searchResults");
    expect(viewSource).toContain("isSearching");
    expect(viewSource).toContain("searchError");
    expect(viewSource).toContain("searchMeta");
    expect(viewSource).toContain("handleClearSearch");
  });

  it("wraps hook search to exit selection mode before searching", () => {
    const searchFunc = viewSource.substring(
      viewSource.indexOf("const handleSearch"),
      viewSource.indexOf("const fetchMemories")
    );
    expect(searchFunc).toContain("if (selectionMode)");
    expect(searchFunc).toContain("setSelectionMode(false)");
    expect(searchFunc).toContain("setSelectedIds(new Set())");
    expect(searchFunc).toContain("doSearch(query)");
  });

  it("renders SearchInput component with correct props", () => {
    expect(viewSource).toContain("<SearchInput");
    expect(viewSource).toContain("onSearch={handleSearch}");
    expect(viewSource).toContain("isSearching={isSearching}");
    expect(viewSource).toContain('placeholder="Search memories semantically..."');
  });

  it("renders clear search button when in search mode", () => {
    expect(viewSource).toContain("{isSearchMode && (");
    expect(viewSource).toContain("Clear search");
    expect(viewSource).toContain("onClick={handleClearSearch}");
  });

  it("shows semantic search status badges in search mode", () => {
    expect(viewSource).toContain("Semantic Search Active");
    expect(viewSource).toContain("Filter-only Mode");
    expect(viewSource).toContain("Vector DB Unavailable");
  });

  it("hides MemoriesToolbar in search mode", () => {
    expect(viewSource).toContain("{!isSearchMode && (");
    const toolbarSection = viewSource.substring(
      viewSource.indexOf("!isSearchMode && ("),
      viewSource.indexOf("/* Error display */")
    );
    expect(toolbarSection).toContain("<MemoriesToolbar");
  });

  it("conditionally renders search results or browse results", () => {
    expect(viewSource).toContain("{isSearchMode ? (");
    expect(viewSource).toContain("<SearchResultCard");
    expect(viewSource).toContain("<MemoryCard");
  });
});

describe("SearchInput component", () => {
  it("uses type='search' attribute for keyboard focus", () => {
    const source = readFileSync(
      "src/ui/viewer/components/SearchInput.tsx",
      "utf-8"
    );
    expect(source).toContain('type="search"');
  });

  it("imports from correct path after move", () => {
    const source = readFileSync(
      "src/ui/viewer/components/SearchInput.tsx",
      "utf-8"
    );
    expect(source).toContain("from './ui'");
    expect(source).not.toContain("from '../../components/ui'");
  });
});

describe("SearchResultCard component", () => {
  it("imports from correct path after move", () => {
    const source = readFileSync(
      "src/ui/viewer/components/SearchResultCard.tsx",
      "utf-8"
    );
    expect(source).toContain("from './ui'");
    expect(source).not.toContain("from '../../components/ui'");
  });

  it("exports SearchResultCard function", () => {
    const source = readFileSync(
      "src/ui/viewer/components/SearchResultCard.tsx",
      "utf-8"
    );
    expect(source).toContain("export function SearchResultCard");
  });
});

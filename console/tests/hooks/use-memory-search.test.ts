/**
 * Tests for useMemorySearch hook
 *
 * Mock Justification: Code-inspection pattern (readFileSync + string assertions)
 * Tests that useMemorySearch hook properly encapsulates search state, abort handling,
 * race condition guards, and response validation.
 *
 * Value: Validates search logic extraction from Memories view into reusable hook
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "fs";
import path from "path";

const HOOK_PATH = path.join(
  import.meta.dir,
  "../../src/ui/viewer/hooks/useMemorySearch.ts",
);
const hookSource = readFileSync(HOOK_PATH, "utf-8");

describe("useMemorySearch hook structure", () => {
  it("should export useMemorySearch function", () => {
    expect(hookSource).toContain("export function useMemorySearch");
  });

  it("should export MemorySearchResult interface", () => {
    expect(hookSource).toContain("export interface MemorySearchResult");
  });

  it("should export UseMemorySearchResult interface", () => {
    expect(hookSource).toContain("export interface UseMemorySearchResult");
  });

  it("should export SearchMeta interface", () => {
    expect(hookSource).toContain("export interface SearchMeta");
  });
});

describe("useMemorySearch state management", () => {
  it("should manage isSearchMode state", () => {
    expect(hookSource).toContain("useState(false)");
    expect(hookSource).toContain("setIsSearchMode");
  });

  it("should manage searchResults state", () => {
    expect(hookSource).toContain("useState<MemorySearchResult[]>([])");
    expect(hookSource).toContain("setSearchResults");
  });

  it("should manage isSearching state", () => {
    expect(hookSource).toContain("setIsSearching");
  });

  it("should manage searchError state", () => {
    expect(hookSource).toContain("setSearchError");
  });

  it("should manage searchMeta state", () => {
    expect(hookSource).toContain("setSearchMeta");
  });
});

describe("useMemorySearch race condition guard", () => {
  it("should use cancelledRef to prevent spurious errors on clear", () => {
    expect(hookSource).toContain("cancelledRef");
    expect(hookSource).toContain("useRef(false)");
  });

  it("should set cancelledRef to true in handleClearSearch before aborting", () => {
    const clearFn = hookSource.slice(hookSource.indexOf("handleClearSearch"));
    expect(clearFn).toContain("cancelledRef.current = true");
  });

  it("should reset cancelledRef to false at start of handleSearch", () => {
    const handleSearchStart = hookSource.indexOf("const handleSearch");
    const handleClearStart = hookSource.indexOf("const handleClearSearch");
    const searchFn = hookSource.slice(handleSearchStart, handleClearStart);
    expect(searchFn).toContain("cancelledRef.current = false");
  });

  it("should check cancelledRef before setting error state in catch block", () => {
    const catchBlock = hookSource.slice(hookSource.indexOf("} catch (error)"));
    expect(catchBlock).toContain("cancelledRef.current");
  });
});

describe("useMemorySearch response validation", () => {
  it("should check response.ok before parsing JSON", () => {
    expect(hookSource).toContain("response.ok");
    expect(hookSource).toContain("throw new Error");
  });
});

describe("useMemorySearch abort handling", () => {
  it("should abort previous request when new search starts", () => {
    const searchFn = hookSource.slice(
      hookSource.indexOf("handleSearch = useCallback"),
    );
    expect(searchFn).toContain("abortRef.current?.abort()");
  });

  it("should abort on component unmount via useEffect cleanup", () => {
    expect(hookSource).toContain("return () => {");
    expect(hookSource).toContain("abortRef.current?.abort()");
  });

  it("should use SEARCH_TIMEOUT_MS for abort timeout", () => {
    expect(hookSource).toContain("SEARCH_TIMEOUT_MS");
    expect(hookSource).toContain("120_000");
  });
});

describe("useMemorySearch project filtering", () => {
  it("should import useProject", () => {
    expect(hookSource).toContain("useProject");
  });

  it("should pass selectedProject to search API", () => {
    expect(hookSource).toContain("selectedProject");
    expect(hookSource).toContain("params.set('project'");
  });
});

describe("useMemorySearch return value", () => {
  it("should return all required fields", () => {
    const returnBlock = hookSource.slice(hookSource.lastIndexOf("return {"));
    expect(returnBlock).toContain("isSearchMode");
    expect(returnBlock).toContain("searchResults");
    expect(returnBlock).toContain("isSearching");
    expect(returnBlock).toContain("searchError");
    expect(returnBlock).toContain("searchMeta");
    expect(returnBlock).toContain("handleSearch");
    expect(returnBlock).toContain("handleClearSearch");
  });
});

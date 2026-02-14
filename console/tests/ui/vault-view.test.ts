/**
 * VaultView Component Tests
 *
 * Tests for the Vault page components: VaultView, VaultSummaryCards,
 * VaultAssetTable, and VaultAssetDetail.
 */

import { describe, it, expect } from "bun:test";
import { renderToString } from "react-dom/server";
import React from "react";

describe("VaultView", () => {
  it("VaultView is exported from views/Vault", async () => {
    const mod = await import("../../src/ui/viewer/views/Vault/index.js");
    expect(mod.VaultView).toBeDefined();
    expect(typeof mod.VaultView).toBe("function");
  });

  it("VaultSummaryCards is exported", async () => {
    const mod = await import("../../src/ui/viewer/views/Vault/VaultSummaryCards.js");
    expect(mod.VaultSummaryCards).toBeDefined();
    expect(typeof mod.VaultSummaryCards).toBe("function");
  });

  it("VaultAssetTable is exported", async () => {
    const mod = await import("../../src/ui/viewer/views/Vault/VaultAssetTable.js");
    expect(mod.VaultAssetTable).toBeDefined();
    expect(typeof mod.VaultAssetTable).toBe("function");
  });

  it("VaultAssetDetail is exported", async () => {
    const mod = await import("../../src/ui/viewer/views/Vault/VaultAssetDetail.js");
    expect(mod.VaultAssetDetail).toBeDefined();
    expect(typeof mod.VaultAssetDetail).toBe("function");
  });

  describe("VaultSummaryCards", () => {
    it("renders summary stats for assets", async () => {
      const { VaultSummaryCards } = await import("../../src/ui/viewer/views/Vault/VaultSummaryCards.js");

      const assets = [
        { name: "a", type: "skill", latestVersion: "1", versionsCount: 1, installedVersion: "v1", installed: true, hasUpdate: false, scope: null, clients: [] },
        { name: "b", type: "rule", latestVersion: "2", versionsCount: 2, installedVersion: null, installed: false, hasUpdate: false, scope: null, clients: [] },
        { name: "c", type: "command", latestVersion: "1", versionsCount: 1, installedVersion: "v1", installed: true, hasUpdate: true, scope: null, clients: [] },
        { name: "d", type: "skill", latestVersion: "3", versionsCount: 3, installedVersion: null, installed: false, hasUpdate: false, scope: null, clients: [] },
      ];

      const html = renderToString(React.createElement(VaultSummaryCards, { assets }));

      expect(html).toContain("4");
      expect(html).toContain("Skills");
      expect(html).toContain("Rules");
    });
  });

  describe("VaultAssetTable", () => {
    it("renders asset rows", async () => {
      const { VaultAssetTable } = await import("../../src/ui/viewer/views/Vault/VaultAssetTable.js");

      const assets = [
        { name: "my-skill", type: "skill", latestVersion: "3", versionsCount: 3, installedVersion: "v2", installed: true, hasUpdate: true, scope: "Global", clients: [] },
        { name: "my-rule", type: "rule", latestVersion: "1", versionsCount: 1, installedVersion: null, installed: false, hasUpdate: false, scope: null, clients: [] },
      ];

      const html = renderToString(
        React.createElement(VaultAssetTable, {
          assets,
          searchQuery: "",
          activeTab: "all",
          onTabChange: () => {},
          onSearchChange: () => {},
          expandedAsset: null,
          onAssetClick: () => {},
          fetchDetail: () => Promise.resolve(),
          detailCache: new Map(),
          loadingDetails: new Set<string>(),
        }),
      );

      expect(html).toContain("my-skill");
      expect(html).toContain("my-rule");
    });

    it("filters by search query", async () => {
      const { VaultAssetTable } = await import("../../src/ui/viewer/views/Vault/VaultAssetTable.js");

      const assets = [
        { name: "my-skill", type: "skill", latestVersion: "3", versionsCount: 3, installedVersion: "v2", installed: true, hasUpdate: true, scope: "Global", clients: [] },
        { name: "my-rule", type: "rule", latestVersion: "1", versionsCount: 1, installedVersion: null, installed: false, hasUpdate: false, scope: null, clients: [] },
      ];

      const html = renderToString(
        React.createElement(VaultAssetTable, {
          assets,
          searchQuery: "skill",
          activeTab: "all",
          onTabChange: () => {},
          onSearchChange: () => {},
          expandedAsset: null,
          onAssetClick: () => {},
          fetchDetail: () => Promise.resolve(),
          detailCache: new Map(),
          loadingDetails: new Set<string>(),
        }),
      );

      expect(html).toContain("my-skill");
      expect(html).not.toContain("my-rule");
    });

    it("filters by tab type", async () => {
      const { VaultAssetTable } = await import("../../src/ui/viewer/views/Vault/VaultAssetTable.js");

      const assets = [
        { name: "my-skill", type: "skill", latestVersion: "3", versionsCount: 3, installedVersion: "v2", installed: true, hasUpdate: true, scope: "Global", clients: [] },
        { name: "my-rule", type: "rule", latestVersion: "1", versionsCount: 1, installedVersion: null, installed: false, hasUpdate: false, scope: null, clients: [] },
      ];

      const html = renderToString(
        React.createElement(VaultAssetTable, {
          assets,
          searchQuery: "",
          activeTab: "rule",
          onTabChange: () => {},
          onSearchChange: () => {},
          expandedAsset: null,
          onAssetClick: () => {},
          fetchDetail: () => Promise.resolve(),
          detailCache: new Map(),
          loadingDetails: new Set<string>(),
        }),
      );

      expect(html).toContain("my-rule");
      expect(html).not.toContain("my-skill");
    });
  });

  describe("VaultAssetDetail", () => {
    it("renders version history when detail is loaded", async () => {
      const { VaultAssetDetail } = await import("../../src/ui/viewer/views/Vault/VaultAssetDetail.js");

      const detail = {
        name: "lsp-cleaner",
        type: "skill",
        metadata: { description: "Clean up unused code", authors: ["test"], keywords: [] },
        versions: [
          { version: "3", createdAt: "2026-02-14", filesCount: 5 },
          { version: "2", createdAt: "2026-02-10", filesCount: 4 },
        ],
      };

      const html = renderToString(
        React.createElement(VaultAssetDetail, {
          detail,
          isLoading: false,
        }),
      );

      expect(html).toContain("Clean up unused code");
      expect(html).toContain("5");
    });

    it("renders loading spinner when fetching", async () => {
      const { VaultAssetDetail } = await import("../../src/ui/viewer/views/Vault/VaultAssetDetail.js");

      const html = renderToString(
        React.createElement(VaultAssetDetail, {
          detail: null,
          isLoading: true,
        }),
      );

      expect(html).toContain("loading");
    });
  });
});

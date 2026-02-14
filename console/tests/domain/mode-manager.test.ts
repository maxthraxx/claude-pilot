/**
 * Tests for ModeManager - hardcoded 'code' mode configuration
 *
 * Mock Justification: None - tests use real ModeManager instance
 *
 * Value: Ensures hardcoded config matches the original code.json file
 * and all consumers of ModeManager still work after inlining.
 */
import { describe, it, expect } from "bun:test";
import { ModeManager } from "../../src/services/domain/ModeManager.js";

describe("ModeManager", () => {
  const manager = ModeManager.getInstance();

  describe("singleton", () => {
    it("should return the same instance", () => {
      const instance1 = ModeManager.getInstance();
      const instance2 = ModeManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("loadMode", () => {
    it("should load the hardcoded config without errors", () => {
      const mode = manager.loadMode();
      expect(mode).toBeDefined();
      expect(mode.name).toBe("Code Development");
      expect(mode.version).toBe("1.0.0");
    });

    it("should return observation types", () => {
      manager.loadMode();
      const types = manager.getObservationTypes();
      expect(types).toHaveLength(6);
      expect(types.map((t) => t.id)).toEqual([
        "bugfix",
        "feature",
        "refactor",
        "change",
        "discovery",
        "decision",
      ]);
    });

    it("should return observation concepts", () => {
      manager.loadMode();
      const concepts = manager.getObservationConcepts();
      expect(concepts).toHaveLength(7);
      expect(concepts.map((c) => c.id)).toEqual([
        "how-it-works",
        "why-it-exists",
        "what-changed",
        "problem-solution",
        "gotcha",
        "pattern",
        "trade-off",
      ]);
    });
  });

  describe("getActiveMode", () => {
    it("should throw if mode not loaded", () => {
      const freshManager = new (ModeManager as any)();
      expect(() => freshManager.getActiveMode()).toThrow("No mode loaded");
    });

    it("should return active mode after loading", () => {
      manager.loadMode();
      const activeMode = manager.getActiveMode();
      expect(activeMode.name).toBe("Code Development");
    });
  });

  describe("getTypeIcon", () => {
    it("should return correct emoji for bugfix", () => {
      manager.loadMode();
      expect(manager.getTypeIcon("bugfix")).toBe("🔴");
    });

    it("should return correct emoji for feature", () => {
      manager.loadMode();
      expect(manager.getTypeIcon("feature")).toBe("🟣");
    });

    it("should return default emoji for unknown type", () => {
      manager.loadMode();
      expect(manager.getTypeIcon("unknown")).toBe("📝");
    });
  });

  describe("getWorkEmoji", () => {
    it("should return work emoji for bugfix", () => {
      manager.loadMode();
      expect(manager.getWorkEmoji("bugfix")).toBe("🛠️");
    });

    it("should return work emoji for discovery", () => {
      manager.loadMode();
      expect(manager.getWorkEmoji("discovery")).toBe("🔍");
    });

    it("should return default emoji for unknown type", () => {
      manager.loadMode();
      expect(manager.getWorkEmoji("unknown")).toBe("📝");
    });
  });

  describe("validateType", () => {
    it("should return true for valid type", () => {
      manager.loadMode();
      expect(manager.validateType("bugfix")).toBe(true);
      expect(manager.validateType("feature")).toBe(true);
    });

    it("should return false for invalid type", () => {
      manager.loadMode();
      expect(manager.validateType("unknown")).toBe(false);
    });
  });

  describe("getTypeLabel", () => {
    it("should return label for valid type", () => {
      manager.loadMode();
      expect(manager.getTypeLabel("bugfix")).toBe("Bug Fix");
      expect(manager.getTypeLabel("feature")).toBe("Feature");
    });

    it("should return type ID for unknown type", () => {
      manager.loadMode();
      expect(manager.getTypeLabel("unknown")).toBe("unknown");
    });
  });
});

/**
 * Tests for cross-project root path resolution in PlanRoutes
 *
 * Mock Justification: Code-inspection pattern (readFileSync + string assertions)
 * Tests that route handlers accept ?project= param and resolve project roots.
 *
 * Value: Validates cross-project filesystem support across plan and git routes
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, existsSync } from "fs";
import path from "path";

const PLAN_ROUTES_PATH = path.resolve(
  import.meta.dir,
  "../../src/services/worker/http/routes/PlanRoutes.ts",
);
const RESOLVE_UTIL_PATH = path.resolve(
  import.meta.dir,
  "../../src/services/worker/http/routes/utils/resolveProjectRoot.ts",
);

describe("resolveProjectRoot utility", () => {
  it("should exist as a standalone utility module", () => {
    expect(existsSync(RESOLVE_UTIL_PATH)).toBe(true);
  });

  it("should export resolveProjectRoot function", () => {
    const source = readFileSync(RESOLVE_UTIL_PATH, "utf-8");
    expect(source).toContain("export function resolveProjectRoot");
  });

  it("should accept DatabaseManager and optional project param", () => {
    const source = readFileSync(RESOLVE_UTIL_PATH, "utf-8");
    expect(source).toContain("DatabaseManager");
    expect(source).toContain("project");
  });

  it("should validate resolved paths are directories", () => {
    const source = readFileSync(RESOLVE_UTIL_PATH, "utf-8");
    expect(source).toContain("existsSync");
  });
});

describe("PlanRoutes cross-project support", () => {
  const source = readFileSync(PLAN_ROUTES_PATH, "utf-8");

  it("should import resolveProjectRoot from shared utility", () => {
    expect(source).toContain("resolveProjectRoot");
    expect(source).toContain("utils/resolveProjectRoot");
  });

  it("handleGetActivePlan should use ?project= query param", () => {
    const handler = source.slice(source.indexOf("handleGetActivePlan"));
    expect(handler).toContain("req.query.project");
    expect(handler).toContain("resolveProjectRoot");
  });

  it("handleGetAllPlans should use ?project= query param", () => {
    const handler = source.slice(source.indexOf("handleGetAllPlans"));
    expect(handler).toContain("req.query.project");
    expect(handler).toContain("resolveProjectRoot");
  });

  it("handleGetGitInfo should use ?project= query param", () => {
    const handler = source.slice(source.indexOf("handleGetGitInfo"));
    expect(handler).toContain("req.query.project");
    expect(handler).toContain("resolveProjectRoot");
  });

  it("handleGetActiveSpecs should use ?project= query param", () => {
    const handler = source.slice(source.indexOf("handleGetActiveSpecs"));
    expect(handler).toContain("req.query.project");
    expect(handler).toContain("resolveProjectRoot");
  });

  it("handleGetPlanContent should use ?project= query param", () => {
    const handler = source.slice(source.indexOf("handleGetPlanContent"));
    expect(handler).toContain("req.query.project");
    expect(handler).toContain("resolveProjectRoot");
  });
});


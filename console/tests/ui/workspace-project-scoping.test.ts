/**
 * Tests for Task 9: Make workspace widgets project-aware
 *
 * Validates:
 * - Plan API call includes project parameter
 * - Git API call includes project parameter
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "fs";
import path from "path";

const HOOK_PATH = path.join(
  __dirname,
  "../../src/ui/viewer/hooks/useStats.ts",
);
const hookSource = readFileSync(HOOK_PATH, "utf-8");

describe("Task 9: Plan API project scoping", () => {
  it("should pass project param to /api/plan endpoint", () => {
    expect(hookSource).toMatch(/\/api\/plan.*project/);
  });

  it("should pass project param to /api/git endpoint", () => {
    expect(hookSource).toMatch(/\/api\/git.*project/);
  });
});


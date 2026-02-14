/**
 * Vexor Backend Presence Tests
 *
 * Tests that VexorRoutes backend and vexor polling are properly present
 * in the worker service and useStats hook (the dashboard status card needs them).
 */

import { describe, it, expect } from "bun:test";
import { readFileSync, existsSync } from "fs";

describe("VexorRoutes backend presence", () => {
  it("VexorRoutes.ts exists", () => {
    const vexorRoutesExists = existsSync("src/services/worker/http/routes/VexorRoutes.ts");
    expect(vexorRoutesExists).toBe(true);
  });

  it("worker-service imports VexorRoutes", () => {
    const source = readFileSync("src/services/worker-service.ts", "utf-8");
    expect(source).toContain("VexorRoutes");
  });

  it("worker-service registers VexorRoutes", () => {
    const source = readFileSync("src/services/worker-service.ts", "utf-8");
    expect(source).toContain("new VexorRoutes");
  });
});

describe("useStats vexor polling presence", () => {
  it("useStats defines VexorStatus interface", () => {
    const source = readFileSync("src/ui/viewer/hooks/useStats.ts", "utf-8");
    expect(source).toContain("interface VexorStatus");
  });

  it("useStats includes vexorStatus in result type", () => {
    const source = readFileSync("src/ui/viewer/hooks/useStats.ts", "utf-8");
    const resultInterface = source.substring(
      source.indexOf("interface UseStatsResult"),
      source.indexOf("export function useStats")
    );
    expect(resultInterface).toContain("vexorStatus");
  });

  it("useStats has loadVexorStatus callback", () => {
    const source = readFileSync("src/ui/viewer/hooks/useStats.ts", "utf-8");
    expect(source).toContain("loadVexorStatus");
    expect(source).toContain("/api/vexor/status");
  });

  it("useStats has vexor polling interval", () => {
    const source = readFileSync("src/ui/viewer/hooks/useStats.ts", "utf-8");
    expect(source).toContain("VEXOR_POLL_INTERVAL_MS");
    expect(source).toContain("vexorInterval");
  });

  it("useStats returns vexorStatus", () => {
    const source = readFileSync("src/ui/viewer/hooks/useStats.ts", "utf-8");
    const returnBlock = source.substring(
      source.lastIndexOf("return {"),
      source.lastIndexOf("}")
    );
    expect(returnBlock).toContain("vexorStatus");
  });
});

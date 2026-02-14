/**
 * Tests for WorkerService signal and error handlers
 *
 * Mock Justification: Code-inspection pattern (readFileSync + string assertions)
 * Tests that signal handlers (SIGHUP, SIGTERM, SIGINT) and error handlers
 * (unhandledRejection, uncaughtException) are properly registered.
 *
 * Value: Prevents daemon from silently dying on terminal close (SIGHUP) or
 * unhandled errors. Critical for production reliability.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "fs";
import path from "path";

const WORKER_SERVICE_PATH = path.resolve(
  import.meta.dir,
  "../../src/services/worker-service.ts",
);

describe("WorkerService signal handlers", () => {
  const source = readFileSync(WORKER_SERVICE_PATH, "utf-8");

  it("should register SIGHUP handler in registerSignalHandlers()", () => {
    const registerMatch = source.match(
      /registerSignalHandlers\(\): void\s*\{([\s\S]*?)^\s{2}\}/m,
    );
    expect(registerMatch).not.toBeNull();
    const registerBody = registerMatch![1];

    expect(registerBody).toContain("SIGHUP");
    expect(registerBody).toContain('process.on("SIGHUP"');
  });

  it("should platform-check SIGHUP handler for non-Windows", () => {
    const registerMatch = source.match(
      /registerSignalHandlers\(\): void\s*\{([\s\S]*?)^\s{2}\}/m,
    );
    expect(registerMatch).not.toBeNull();
    const registerBody = registerMatch![1];

    expect(registerBody).toContain('process.platform !== "win32"');
  });

  it("should register SIGTERM handler in registerSignalHandlers()", () => {
    const registerMatch = source.match(
      /registerSignalHandlers\(\): void\s*\{([\s\S]*?)^\s{2}\}/m,
    );
    expect(registerMatch).not.toBeNull();
    const registerBody = registerMatch![1];

    expect(registerBody).toContain("SIGTERM");
    expect(registerBody).toContain('process.on("SIGTERM"');
  });

  it("should register SIGINT handler in registerSignalHandlers()", () => {
    const registerMatch = source.match(
      /registerSignalHandlers\(\): void\s*\{([\s\S]*?)^\s{2}\}/m,
    );
    expect(registerMatch).not.toBeNull();
    const registerBody = registerMatch![1];

    expect(registerBody).toContain("SIGINT");
    expect(registerBody).toContain('process.on("SIGINT"');
  });
});

describe("WorkerService error handlers in daemon mode", () => {
  const source = readFileSync(WORKER_SERVICE_PATH, "utf-8");

  it("should register unhandledRejection handler in --daemon case", () => {
    const daemonMatch = source.match(
      /case\s+["']--daemon["']:\s*\n\s*default:\s*\{([\s\S]*?)^\s{4}\}/m,
    );
    expect(daemonMatch).not.toBeNull();
    const daemonBody = daemonMatch![1];

    expect(daemonBody).toContain("unhandledRejection");
    expect(daemonBody).toContain('process.on("unhandledRejection"');
  });

  it("should register uncaughtException handler in --daemon case", () => {
    const daemonMatch = source.match(
      /case\s+["']--daemon["']:\s*\n\s*default:\s*\{([\s\S]*?)^\s{4}\}/m,
    );
    expect(daemonMatch).not.toBeNull();
    const daemonBody = daemonMatch![1];

    expect(daemonBody).toContain("uncaughtException");
    expect(daemonBody).toContain('process.on("uncaughtException"');
  });
});

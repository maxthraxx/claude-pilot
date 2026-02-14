export const HOOK_TIMEOUTS = {
  DEFAULT: 300000,
  // Healthy worker responds in <100ms; 3s is generous (reduced from 30s)
  HEALTH_CHECK: 3000,
  // Wait for daemon to start after spawn (macOS: <1s startup)
  POST_SPAWN_WAIT: 5000,
  // Wait when port occupied but health failing
  PORT_IN_USE_WAIT: 3000,
  WORKER_STARTUP_WAIT: 1000,
  PRE_RESTART_SETTLE_DELAY: 2000,
  POWERSHELL_COMMAND: 10000,
  // Hook-side Windows multiplier (worker-side uses 2.0x)
  WINDOWS_MULTIPLIER: 1.5,
} as const;

/**
 * Hook exit codes for Claude Code
 *
 * Exit code behavior per Claude Code docs:
 * - 0: Success. For SessionStart/UserPromptSubmit, stdout added to context.
 * - 2: Blocking error. For SessionStart, stderr shown to user only.
 * - Other non-zero: stderr shown in verbose mode only.
 */
export const HOOK_EXIT_CODES = {
  SUCCESS: 0,
  FAILURE: 1,
  /** Blocking error - for SessionStart, shows stderr to user only */
  BLOCKING_ERROR: 2,
  /** User message only - shows message to user without injecting into Claude context */
  USER_MESSAGE_ONLY: 3,
} as const;

export function getTimeout(baseTimeout: number): number {
  return process.platform === "win32" ? Math.round(baseTimeout * HOOK_TIMEOUTS.WINDOWS_MULTIPLIER) : baseTimeout;
}

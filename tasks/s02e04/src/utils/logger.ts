/**
 * Tagged, ANSI-colored logger for the agent runtime.
 *
 * Tags:
 *   [MYŚL]   — model's reasoning / thought content
 *   [AKCJA]  — tool dispatch (what the agent is doing)
 *   [WYNIK]  — tool result (what came back)
 *   [SYSTEM] — lifecycle events: bootstrap, errors, guards
 *
 * Also exports MCP_LABEL / NATIVE_LABEL constants and aliases that
 * match the naming convention used across existing tasks.
 */

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
};

export const MCP_LABEL = `${c.cyan}[MCP]${c.reset}`;
export const NATIVE_LABEL = `${c.yellow}[Native]${c.reset}`;

// ── Primary tagged API ────────────────────────────────────────────────────────

/** [MYŚL] Model's internal reasoning or text response. */
export const logThought = (text: string): void => {
  console.log(`\n${c.blue}[MYŚL]${c.reset} ${text}`);
};

/** [AKCJA] Tool dispatch — label is MCP_LABEL or NATIVE_LABEL. */
export const logAction = (
  label: string,
  toolName: string,
  args: unknown,
): void => {
  console.log(
    `  ${label} ${c.bold}${toolName}${c.reset}(${c.dim}${JSON.stringify(args)}${c.reset})`,
  );
};

/** [WYNIK] Tool result. */
export const logResult = (result: unknown): void => {
  console.log(
    `       ${c.green}[WYNIK]${c.reset} ${c.dim}${JSON.stringify(result)}${c.reset}`,
  );
};

/** [SYSTEM] Lifecycle / infrastructure event. */
export const logSystem = (
  step: string,
  detail?: Record<string, unknown>,
): void => {
  const ts = new Date().toISOString();
  const extra =
    detail && Object.keys(detail).length > 0
      ? ` ${c.dim}${JSON.stringify(detail)}${c.reset}`
      : "";
  console.error(
    `${c.dim}[${ts}]${c.reset} ${c.magenta}[SYSTEM]${c.reset} ${c.bold}${step}${c.reset}${extra}`,
  );
};

/** Tool call error. */
export const logError = (message: string): void => {
  console.log(`       ${c.red}[ERR]${c.reset} ${message}`);
};

// ── Convenience aliases (match existing task conventions) ─────────────────────

/** Separator + user query header. */
export const logQuery = (query: string): void => {
  console.log(`\n${c.bold}${"═".repeat(60)}${c.reset}`);
  console.log(`${c.bold}Query: ${query}${c.reset}`);
  console.log(`${c.bold}${"═".repeat(60)}${c.reset}`);
};

/** Alias for logAction (named to match s02e03 convention). */
export const logToolCall = logAction;

/** Alias for logResult. */
export const logToolResult = logResult;

/** Alias for logError. */
export const logToolError = logError;

/** Tool call count summary line. */
export const logToolCount = (count: number): void => {
  console.log(`\n${c.dim}Tool calls: ${count}${c.reset}`);
};

/** Final assistant response line. */
export const logResponse = (text: string): void => {
  console.log(`\n${c.green}Assistant:${c.reset} ${text}`);
};

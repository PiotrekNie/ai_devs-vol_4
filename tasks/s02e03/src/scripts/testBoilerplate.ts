/**
 * Pilot integration test for @ai-devs/agent-boilerplate.
 *
 * Demonstrates that the package is importable from tasks/s02e03 via
 * the `file:../boilerplate` path reference.
 *
 * Run: bun --env-file=../.env run src/scripts/testBoilerplate.ts
 */

import {
  logSystem,
  logThought,
  logResult,
  MCP_LABEL,
  NATIVE_LABEL,
} from "@ai-devs/agent-boilerplate/src/utils/logger.js";
import {
  MessageSchema,
  mcpOk,
  mcpErr,
} from "@ai-devs/agent-boilerplate/src/types/index.js";
import { noopMemoryHooks, estimateTokens } from "@ai-devs/agent-boilerplate/src/agent/memory.js";
import { FinishTaskSignal } from "@ai-devs/agent-boilerplate/src/tools/native/finish_task.js";
import { extractFlag } from "@ai-devs/agent-boilerplate/src/tools/mcp/submit_to_hub.js";
import { DEFAULT_AGENT_MODEL, MAX_ITERATIONS } from "@ai-devs/agent-boilerplate/config.js";

// ── Logger ─────────────────────────────────────────────────────────────────────
logSystem("@ai-devs/agent-boilerplate pilot integration", { episode: "s02e03" });

// Tags
logThought("Testing boilerplate logger tags...");
logResult({ status: "all tags imported correctly" });

// Label constants
logSystem("MCP_LABEL and NATIVE_LABEL", { mcp: MCP_LABEL, native: NATIVE_LABEL });

// ── Types ──────────────────────────────────────────────────────────────────────
const msg = MessageSchema.parse({ role: "user", content: "hello from s02e03" });
logSystem("MessageSchema.parse", { role: msg.role });

const okResp = mcpOk("it works");
const errResp = mcpErr("test error");
logSystem("mcpOk / mcpErr", {
  ok: okResp.content[0]?.text,
  err: errResp.isError,
});

// ── Memory hooks ───────────────────────────────────────────────────────────────
const noop = noopMemoryHooks;
const memResult = await noop.beforeTurn?.({
  conversation: [{ role: "user", content: "hi" }],
  instructions: "sys",
  iteration: 0,
});
logSystem("noopMemoryHooks.beforeTurn", {
  conversationLen: memResult?.conversation.length,
});
logSystem("estimateTokens('hello world')", { tokens: estimateTokens("hello world") });

// ── FinishTaskSignal ───────────────────────────────────────────────────────────
const signal = new FinishTaskSignal("test answer");
logSystem("FinishTaskSignal", { name: signal.name, answer: signal.finalAnswer });

// ── extractFlag ────────────────────────────────────────────────────────────────
const flag = extractFlag('{"msg":"Great job! {FLG:TEST_FLAG_123}"}');
logSystem("extractFlag", { flag });

// ── Config values ──────────────────────────────────────────────────────────────
logSystem("Config", { DEFAULT_AGENT_MODEL, MAX_ITERATIONS });

logSystem("Pilot integration complete — all boilerplate imports resolved successfully.");

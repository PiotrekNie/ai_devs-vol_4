/**
 * Shared Zod schemas and TypeScript types for the agent runtime.
 *
 * These are the canonical contracts used by:
 *   - agent.ts (loop orchestration)
 *   - ai.ts (adapter input/output)
 *   - mcp/server.ts (tool return shape)
 *   - tools/mcp/* (tool input validation)
 */

import { z } from "zod";

// ── Message schemas ───────────────────────────────────────────────────────────

export const RoleSchema = z.enum(["system", "user", "assistant", "tool"]);
export type Role = z.infer<typeof RoleSchema>;

/** Single text content item within a multimodal message. */
export const TextContentSchema = z.object({
  type: z.literal("input_text"),
  text: z.string(),
});

/** Image content item (base64 data URL or https URL). */
export const ImageContentSchema = z.object({
  type: z.literal("input_image"),
  image_url: z.string(),
});

export const MessageContentSchema = z.union([
  z.string(),
  z.array(z.union([TextContentSchema, ImageContentSchema])),
]);

/** A single turn in the conversation history. */
export const MessageSchema = z.object({
  role: RoleSchema,
  content: MessageContentSchema,
});
export type Message = z.infer<typeof MessageSchema>;

// ── Tool schemas ──────────────────────────────────────────────────────────────

/**
 * A tool call emitted by the model (Responses API `function_call` output item).
 * The `arguments` field is a raw JSON string.
 */
export const ToolCallSchema = z.object({
  type: z.literal("function_call"),
  name: z.string(),
  arguments: z.string(),
  call_id: z.string(),
});
export type ToolCall = z.infer<typeof ToolCallSchema>;

/** Tool result sent back to the model. */
export const ToolResultSchema = z.object({
  type: z.literal("function_call_output"),
  call_id: z.string(),
  output: z.string(),
});
export type ToolResult = z.infer<typeof ToolResultSchema>;

/** A tool definition passed to the LLM (OpenAI Responses API function format). */
export const ToolDefinitionSchema = z.object({
  type: z.literal("function"),
  name: z.string(),
  description: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
  strict: z.boolean().optional(),
});
export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;

// ── AIAdapter types ───────────────────────────────────────────────────────────

/** Parsed result of a single LLM call. */
export const ModelResponseSchema = z.object({
  /** Text extracted from the model's output message (null if only tool calls). */
  content: z.string().nullable(),
  /** Parsed tool calls from the output. */
  toolCalls: z.array(ToolCallSchema),
  /**
   * Raw Responses API output items (function_call + message items, reasoning
   * stripped). Appended to the conversation before the next call.
   */
  rawOutputItems: z.array(z.unknown()),
});
export type ModelResponse = z.infer<typeof ModelResponseSchema>;

// ── MCP response shape ────────────────────────────────────────────────────────

/** Standard MCP tool return shape required by @modelcontextprotocol/sdk. */
export const McpContentItemSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

export const McpToolResponseSchema = z.object({
  content: z.array(McpContentItemSchema),
  isError: z.boolean().optional(),
});
export type McpToolResponse = z.infer<typeof McpToolResponseSchema>;

// ── Convenience helpers ───────────────────────────────────────────────────────

/** Build a successful MCP tool response with a single text item. */
export function mcpOk(text: string): McpToolResponse {
  return { content: [{ type: "text", text }] };
}

/** Build an error MCP tool response. */
export function mcpErr(message: string): McpToolResponse {
  return {
    content: [{ type: "text", text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}

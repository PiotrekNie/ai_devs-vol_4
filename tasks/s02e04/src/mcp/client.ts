/**
 * MCP client — in-process, linked via InMemoryTransport.
 *
 * Connects a McpServer and exposes helpers for listing tools, calling them,
 * and converting their schemas to OpenAI strict function-calling format.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// ── Client lifecycle ──────────────────────────────────────────────────────────

/** Creates a connected MCP client for the given in-process server. */
export async function createMcpClient(server: McpServer): Promise<Client> {
  const client = new Client(
    { name: "boilerplate-client", version: "0.1.0" },
    { capabilities: {} },
  );

  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  return client;
}

// ── Tool listing / calling ────────────────────────────────────────────────────

export async function listMcpTools(client: Client) {
  const { tools } = await client.listTools();
  return tools;
}

export async function callMcpTool(
  client: Client,
  name: string,
  args: Record<string, unknown>,
) {
  return client.callTool({ name, arguments: args });
}

/** Concatenates all text content items from an MCP tool result into a string. */
export function mcpToolResultToText(result: unknown): string {
  if (result && typeof result === "object" && "content" in result) {
    const content = (
      result as { content?: Array<{ type?: string; text?: string }> }
    ).content;
    if (Array.isArray(content)) {
      return content
        .filter((c) => c?.type === "text" && typeof c?.text === "string")
        .map((c) => c!.text!)
        .join("");
    }
  }
  return typeof result === "string" ? result : JSON.stringify(result);
}

// ── Schema normalisation ──────────────────────────────────────────────────────

/**
 * Strip JSON Schema meta keys and recurse — keeps Zod-emitted shapes (incl.
 * `z.record` / optional fields). Does **not** force `additionalProperties: false`
 * on every object (that broke `http_request` `body` and optional props).
 */
function sanitizeToolJsonSchema(schema: unknown): unknown {
  if (schema == null || typeof schema !== "object") return schema;
  if (Array.isArray(schema)) return schema.map(sanitizeToolJsonSchema);

  const out = { ...(schema as Record<string, unknown>) };
  delete out["$schema"];
  delete out["$defs"];
  delete out["definitions"];

  if (out["properties"] && typeof out["properties"] === "object") {
    const props = out["properties"] as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const k of Object.keys(props)) {
      next[k] = sanitizeToolJsonSchema(props[k]);
    }
    out["properties"] = next;
  }

  if (out["items"]) {
    out["items"] = sanitizeToolJsonSchema(out["items"]);
  }

  for (const key of ["allOf", "anyOf", "oneOf"] as const) {
    if (Array.isArray(out[key])) {
      out[key] = (out[key] as unknown[]).map(sanitizeToolJsonSchema);
    }
  }

  if (out["not"]) {
    out["not"] = sanitizeToolJsonSchema(out["not"]);
  }

  return out;
}

/**
 * Converts the MCP tool list returned by `listMcpTools` to OpenAI
 * Responses API function-calling definitions.
 *
 * Uses `strict: false` so optional tool fields and `z.record` bodies stay valid
 * (strict + ensureStrictSchema caused HTTP 400 with OpenRouter/OpenAI).
 */
export function mcpToolsToOpenAI(
  mcpTools: Awaited<ReturnType<typeof listMcpTools>>,
) {
  return mcpTools.map((tool) => ({
    type: "function" as const,
    name: tool.name,
    description: tool.description ?? "",
    parameters: sanitizeToolJsonSchema(tool.inputSchema) as Record<
      string,
      unknown
    >,
    strict: false,
  }));
}

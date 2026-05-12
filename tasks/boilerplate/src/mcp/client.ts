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
 * Recursively ensures every object schema node has:
 *   - `additionalProperties: false`   (required by OpenAI strict mode)
 *   - `required` listing every property key  (Zod .default() can omit these)
 *
 * Also strips draft-07 meta keys (`$schema`, `$defs`, `definitions`) that
 * some strict validators reject.
 */
function ensureStrictSchema(schema: unknown): unknown {
  if (schema == null || typeof schema !== "object") return schema;
  if (Array.isArray(schema)) return schema.map(ensureStrictSchema);

  const out = { ...(schema as Record<string, unknown>) };
  delete out["$schema"];
  delete out["$defs"];
  delete out["definitions"];

  if (out["type"] === "object") {
    out["additionalProperties"] = false;
    if (out["properties"] && typeof out["properties"] === "object") {
      const props: Record<string, unknown> = {};
      for (const k of Object.keys(
        out["properties"] as Record<string, unknown>,
      )) {
        props[k] = ensureStrictSchema(
          (out["properties"] as Record<string, unknown>)[k],
        );
      }
      out["properties"] = props;
      out["required"] = Object.keys(props);
    }
  }

  if (out["type"] === "array" && out["items"]) {
    out["items"] = ensureStrictSchema(out["items"]);
  }

  for (const key of ["allOf", "anyOf", "oneOf"] as const) {
    if (Array.isArray(out[key])) {
      out[key] = (out[key] as unknown[]).map(ensureStrictSchema);
    }
  }

  return out;
}

/**
 * Converts the MCP tool list returned by `listMcpTools` to OpenAI
 * Responses API function-calling definitions (strict mode compatible).
 */
export function mcpToolsToOpenAI(
  mcpTools: Awaited<ReturnType<typeof listMcpTools>>,
) {
  return mcpTools.map((tool) => ({
    type: "function" as const,
    name: tool.name,
    description: tool.description ?? "",
    parameters: ensureStrictSchema(tool.inputSchema),
    strict: true,
  }));
}

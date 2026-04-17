import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp";

export const createMcpClient = async (server: McpServer) => {
  const client = new Client(
    { name: "s02e03-client", version: "1.0.0" },
    { capabilities: {} },
  );

  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
};

export const listMcpTools = async (client: Client) => {
  const { tools } = await client.listTools();
  return tools;
};

export const callMcpTool = async (client: Client, name: string, args: any) => {
  const result = await client.callTool({ name, arguments: args });
  return result;
};

/** Concatenates MCP `content` text parts (tool result for the model). */
export const mcpToolResultToText = (result: unknown): string => {
  if (result && typeof result === "object" && "content" in result) {
    const content = (result as { content?: Array<{ type?: string; text?: string }> })
      .content;
    if (Array.isArray(content)) {
      return content
        .filter((c) => c?.type === "text" && typeof c?.text === "string")
        .map((c) => c!.text!)
        .join("");
    }
  }
  return typeof result === "string" ? result : JSON.stringify(result);
};

/**
 * OpenAI / Azure strict Responses API requires `additionalProperties: false`
 * on every object in the tool JSON Schema (MCP/Zod output omits it), and
 * `required` must list every key in `properties` (Zod `.default()` otherwise
 * omits keys from `required`, which breaks strict validation).
 */
const ensureAdditionalPropertiesFalse = (
  schema: unknown,
): unknown | unknown[] => {
  if (schema == null || typeof schema !== "object") return schema;
  if (Array.isArray(schema)) {
    return schema.map(ensureAdditionalPropertiesFalse);
  }
  const out = { ...schema } as Record<string, any>;
  // Azure / strict mode may reject or mis-handle draft-07 meta keys inside parameters
  delete out.$schema;
  delete out.$defs;
  delete out.definitions;
  if (out.type === "object") {
    out.additionalProperties = false;
    if (out.properties && typeof out.properties === "object") {
      const props: Record<string, any> = {} as Record<string, any>;
      for (const k of Object.keys(out.properties)) {
        props[k] = ensureAdditionalPropertiesFalse(
          out.properties[k as keyof typeof out.properties],
        );
      }
      out.properties = props;
      out.required = Object.keys(props);
    }
  }
  if (out.type === "array" && out.items) {
    out.items = ensureAdditionalPropertiesFalse(out.items);
  }
  for (const key of ["allOf", "anyOf", "oneOf"]) {
    if (Array.isArray(out[key])) {
      out[key] = out[key].map(ensureAdditionalPropertiesFalse);
    }
  }
  return out;
};

// Converts MCP tool schemas → OpenAI function-calling format
export const mcpToolsToOpenAI = (mcpTools: any) =>
  mcpTools.map((tool: any) => ({
    type: "function",
    name: tool.name,
    description: tool.description,
    parameters: ensureAdditionalPropertiesFalse(tool.inputSchema),
    strict: true,
  }));

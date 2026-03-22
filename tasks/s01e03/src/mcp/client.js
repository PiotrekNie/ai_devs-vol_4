import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

export const createMcpClient = async (server) => {
  const client = new Client(
    { name: "task-01e03-client", version: "1.0.0" },
    { capabilities: {} },
  );

  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);

  return client;
};

export const listMcpTools = async (client) => {
  const { tools } = await client.listTools();
  return tools;
};

// Calls an MCP tool and parses the text result
export const callMcpTool = async (client, name, args) => {
  const result = await client.callTool({ name, arguments: args });
  const textContent = result.content.find((c) => c.type === "text");
  if (!textContent) return result;
  try {
    return JSON.parse(textContent.text);
  } catch {
    return { error: textContent.text };
  }
};

/**
 * OpenAI / Azure strict Responses API requires `additionalProperties: false`
 * on every object in the tool JSON Schema (MCP/Zod output omits it).
 */
const ensureAdditionalPropertiesFalse = (schema) => {
  if (schema == null || typeof schema !== "object") return schema;
  if (Array.isArray(schema)) {
    return schema.map(ensureAdditionalPropertiesFalse);
  }
  const out = { ...schema };
  // Azure / strict mode may reject or mis-handle draft-07 meta keys inside parameters
  delete out.$schema;
  delete out.$defs;
  delete out.definitions;
  if (out.type === "object") {
    out.additionalProperties = false;
    if (out.properties && typeof out.properties === "object") {
      const props = {};
      for (const k of Object.keys(out.properties)) {
        props[k] = ensureAdditionalPropertiesFalse(out.properties[k]);
      }
      out.properties = props;
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
export const mcpToolsToOpenAI = (mcpTools) =>
  mcpTools.map((tool) => ({
    type: "function",
    name: tool.name,
    description: tool.description,
    parameters: ensureAdditionalPropertiesFalse(tool.inputSchema),
    strict: true,
  }));

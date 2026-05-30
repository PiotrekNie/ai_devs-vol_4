import { META_TOOL_NAMES, type ToolCatalog, type ToolCatalogEntry } from "./types.js";
import { logSystem } from "../../utils/logger.js";

function extractToolName(tool: unknown): string | null {
  if (!tool || typeof tool !== "object") return null;
  const name = (tool as { name?: unknown }).name;
  return typeof name === "string" && name.length > 0 ? name : null;
}

function extractToolFields(tool: unknown): Omit<ToolCatalogEntry, "definition"> | null {
  const name = extractToolName(tool);
  if (!name) return null;

  const obj = tool as {
    description?: unknown;
    parameters?: unknown;
  };

  const description =
    typeof obj.description === "string" ? obj.description : "";
  const parameters =
    obj.parameters && typeof obj.parameters === "object"
      ? (obj.parameters as Record<string, unknown>)
      : { type: "object", properties: {} };

  return { name, description, parameters };
}

const metaSet = new Set<string>(META_TOOL_NAMES);

/**
 * Builds a name → entry map from OpenAI-format tool definitions.
 * Warns when an episode tool name collides with reserved meta tool names.
 */
export function buildToolCatalog(tools: unknown[]): ToolCatalog {
  const catalog: ToolCatalog = new Map();

  for (const tool of tools) {
    const fields = extractToolFields(tool);
    if (!fields) continue;

    if (metaSet.has(fields.name)) {
      logSystem("tool discovery: skipping tool — name reserved for meta tool", {
        name: fields.name,
      });
      continue;
    }

    if (catalog.has(fields.name)) {
      logSystem("tool discovery: duplicate tool name in catalog", {
        name: fields.name,
      });
      continue;
    }

    catalog.set(fields.name, {
      ...fields,
      definition: tool,
    });
  }

  return catalog;
}

export function getToolNameFromDefinition(tool: unknown): string | null {
  return extractToolName(tool);
}

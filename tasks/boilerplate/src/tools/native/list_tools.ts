import { z } from "zod";

export const listToolsInputSchema = z.object({});
export type ListToolsInput = z.infer<typeof listToolsInputSchema>;

export const listToolsToolDefinition = {
  type: "function" as const,
  name: "list_tools",
  description:
    "List all MCP and native tools available in this session (name, description, active flag). " +
    "Use before activating extended tools. Meta tools are always active.",
  parameters: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  strict: true,
};

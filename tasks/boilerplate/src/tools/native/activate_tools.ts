import { z } from "zod";

export const activateToolsInputSchema = z.object({
  names: z
    .array(z.string())
    .min(1)
    .describe("Tool names to register for API function calling on subsequent turns"),
});
export type ActivateToolsInput = z.infer<typeof activateToolsInputSchema>;

export const activateToolsToolDefinition = {
  type: "function" as const,
  name: "activate_tools",
  description:
    "Activate tools by name so they appear in function calling on the next ReAct turns. " +
    "Call after list_tools / describe_tool when you need extended MCP tools.",
  parameters: {
    type: "object",
    properties: {
      names: {
        type: "array",
        items: { type: "string" },
        description:
          "Tool names to register for API function calling on subsequent turns",
      },
    },
    required: ["names"],
    additionalProperties: false,
  },
  strict: true,
};

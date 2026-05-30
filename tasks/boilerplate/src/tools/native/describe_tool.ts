import { z } from "zod";

export const describeToolInputSchema = z.object({
  name: z.string().describe("Exact tool name from list_tools"),
});
export type DescribeToolInput = z.infer<typeof describeToolInputSchema>;

export const describeToolToolDefinition = {
  type: "function" as const,
  name: "describe_tool",
  description:
    "Get the full JSON Schema and description for a tool before calling it. " +
    "Does not execute the tool. If the tool is not active, call activate_tools next.",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Exact tool name from list_tools",
      },
    },
    required: ["name"],
    additionalProperties: false,
  },
  strict: true,
};

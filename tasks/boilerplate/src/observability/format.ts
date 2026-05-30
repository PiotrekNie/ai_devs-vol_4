/** Format Responses API conversation items for Langfuse generation input. */

function formatItem(item: unknown): Record<string, unknown> {
  if (typeof item !== "object" || item === null) {
    return { raw: item };
  }

  const o = item as Record<string, unknown>;

  if (typeof o.role === "string") {
    const content =
      typeof o.content === "string"
        ? o.content
        : Array.isArray(o.content)
          ? o.content
              .map((part) => {
                if (
                  typeof part === "object" &&
                  part !== null &&
                  "text" in part &&
                  typeof (part as { text?: unknown }).text === "string"
                ) {
                  return (part as { text: string }).text;
                }
                return JSON.stringify(part);
              })
              .join("\n")
          : "";
    return { role: o.role, content };
  }

  if (o.type === "function_call_output") {
    return {
      type: "function_call_output",
      call_id: o.call_id,
      output: o.output,
    };
  }

  return o;
}

export function formatResponsesInput(
  messages: unknown[],
  instructions?: string,
): Array<Record<string, unknown>> {
  const formatted = messages.map(formatItem);
  if (!instructions) return formatted;
  return [{ role: "system", content: instructions }, ...formatted];
}

export function formatAssistantOutput(
  text: string | null | undefined,
  toolCalls: Array<{ name: string; call_id: string; arguments: string }>,
): Record<string, unknown> | undefined {
  const content = text?.trim() ?? "";
  if (!content && toolCalls.length === 0) return undefined;

  return {
    role: "assistant",
    ...(content ? { content } : {}),
    ...(toolCalls.length > 0
      ? {
          tool_calls: toolCalls.map((tc) => ({
            type: "function",
            call_id: tc.call_id,
            name: tc.name,
            arguments: tc.arguments,
          })),
        }
      : {}),
  };
}

export function buildGenerationInput(
  formattedMessages: Array<Record<string, unknown>>,
  tools: unknown[],
): unknown {
  if (tools.length > 0) {
    return { messages: formattedMessages, tools };
  }
  return formattedMessages;
}

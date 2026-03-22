import { chat, extractText, extractToolCalls } from "./helpers/api.js";
import {
  executeNativeTool,
  isNativeTool,
  nativeToolsOpenAI,
} from "./native/tools.js";
import { CHAT_MODEL } from "./config.js";

const MAX_STEPS = 50;

const runTool = async (toolCall: {
  call_id?: string;
  id?: string;
  name?: string;
  arguments?: string;
}) => {
  const name = toolCall.name ?? "";
  const callId = toolCall.call_id ?? toolCall.id ?? "";
  const args = JSON.parse(toolCall.arguments ?? "{}") as Record<
    string,
    unknown
  >;

  try {
    if (!isNativeTool(name)) {
      throw new Error(`Unsupported tool: ${name}`);
    }
    const result = await executeNativeTool(name, args);
    const output = JSON.stringify(result);
    return { type: "function_call_output" as const, call_id: callId, output };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      type: "function_call_output" as const,
      call_id: callId,
      output: JSON.stringify({ error: message }),
    };
  }
};

export async function runAgentTurn(
  query: string,
  conversationHistory: unknown[],
  instructions: string,
): Promise<{
  responseText: string | null;
  conversationHistory: unknown[];
  declaration: string | null;
}> {
  const tools = nativeToolsOpenAI;
  const messages = [...conversationHistory, { role: "user", content: query }];

  let declaration: string | null = null;

  for (let step = 1; step <= MAX_STEPS; step++) {
    const response = await chat({
      model: CHAT_MODEL,
      input: messages,
      tools,
      instructions,
    });

    const toolCalls = extractToolCalls(response);

    if (toolCalls.length === 0) {
      const text = extractText(response) ?? null;
      messages.push(...(response.output ?? []));
      return { responseText: text, conversationHistory: messages, declaration };
    }

    messages.push(...(response.output ?? []));

    for (const tc of toolCalls) {
      const out = await runTool(tc);
      messages.push(out);
      if (tc.name === "fill_declaration") {
        try {
          const parsed = JSON.parse(out.output) as { declaration?: string };
          if (parsed.declaration) declaration = parsed.declaration;
        } catch {
          /* ignore */
        }
      }
    }
  }

  throw new Error(`Max agent steps (${MAX_STEPS}) reached`);
}

import type { AIAdapter } from "../agent/ai.js";
import {
  buildGenerationInput,
  formatAssistantOutput,
  formatResponsesInput,
} from "./format.js";
import { isTracingActive } from "./init.js";
import { startGeneration } from "./tracer.js";

/**
 * Wraps an {@link AIAdapter} with Langfuse generation spans (no-op when tracing inactive).
 */
export function withTracingAdapter(
  ai: AIAdapter,
  model: string,
): AIAdapter {
  return {
    async generateResponse(messages, tools, instructions, options) {
      if (!isTracingActive()) {
        return ai.generateResponse(messages, tools, instructions, options);
      }

      const formatted = formatResponsesInput(messages, instructions);
      const generation = startGeneration({
        model,
        input: buildGenerationInput(formatted, tools),
        metadata: {
          mode: "responses",
          toolCount: tools.length,
          ...options?.tracingMetadata,
        },
      });

      try {
        const response = await ai.generateResponse(
          messages,
          tools,
          instructions,
          options,
        );

        const usage = response.usage
          ? {
              input: response.usage.inputTokens,
              output: response.usage.outputTokens,
              total:
                response.usage.inputTokens + response.usage.outputTokens,
            }
          : undefined;

        generation.end({
          output: formatAssistantOutput(
            response.content,
            response.toolCalls,
          ),
          usage,
        });

        return response;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        generation.error({ message });
        throw error;
      }
    },
  };
}

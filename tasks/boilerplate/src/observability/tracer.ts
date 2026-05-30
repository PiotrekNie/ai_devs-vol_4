import {
  type LangfuseAgent,
  type LangfuseGeneration,
  type LangfuseSpan,
  type LangfuseTool,
  startActiveObservation,
  startObservation,
  updateActiveTrace,
} from "@langfuse/tracing";
import {
  advanceTurn,
  formatGenerationName,
  formatToolName,
  getCurrentTurn,
  withAgentContext,
} from "./context.js";
import { isTracingActive } from "./init.js";
import type {
  AgentParams,
  ToolParams,
  TraceParams,
  Usage,
} from "./types.js";

export type ErrorInfo = {
  code?: string;
  message: string;
};

export type GenerationResult = {
  output?: unknown;
  usage?: Usage;
};

export type GenerationHandle = {
  id: string;
  end: (result?: GenerationResult) => void;
  error: (err: ErrorInfo) => void;
};

function toUsageDetails(usage?: Usage): Record<string, number> | undefined {
  if (!usage) return undefined;
  const entries = Object.entries(usage).filter(
    (entry): entry is [string, number] => typeof entry[1] === "number",
  );
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries);
}

export async function withTrace<T>(
  params: TraceParams,
  fn: () => Promise<T>,
): Promise<T> {
  if (!isTracingActive()) return fn();

  return startActiveObservation(params.name, async (span: LangfuseSpan) => {
    span.update({
      input: params.input,
      metadata: params.metadata,
    });
    span.updateTrace({
      sessionId: params.sessionId,
      userId: params.userId,
      tags: params.tags,
    });

    try {
      const result = await fn();
      updateActiveTrace({ output: result });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      span.update({ level: "ERROR", statusMessage: message });
      throw error;
    }
  });
}

export function setTraceOutput(output: unknown): void {
  if (!isTracingActive()) return;
  updateActiveTrace({ output });
}

export async function withAgentSpan<T>(
  params: AgentParams,
  fn: () => Promise<T>,
): Promise<T> {
  if (!isTracingActive()) {
    return withAgentContext(params.name, params.agentId, fn);
  }

  return startActiveObservation(
    params.name,
    async (span: LangfuseAgent) => {
      span.update({
        input: { task: params.task },
        metadata: { agentId: params.agentId, ...params.metadata },
      });

      return withAgentContext(params.name, params.agentId, async () => {
        try {
          const result = await fn();
          span.update({ output: result });
          return result;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          span.update({ level: "ERROR", statusMessage: message });
          throw error;
        }
      });
    },
    { asType: "agent" },
  );
}

export function startGeneration(args: {
  model: string;
  input?: unknown;
  metadata?: Record<string, unknown>;
}): GenerationHandle {
  if (!isTracingActive()) {
    return { id: "", end: () => {}, error: () => {} };
  }

  const name = formatGenerationName();
  const span = startObservation(
    name,
    {
      model: args.model,
      input: args.input,
      metadata: {
        turn: getCurrentTurn(),
        ...args.metadata,
      },
    },
    { asType: "generation" },
  ) as LangfuseGeneration;

  return {
    id: name,
    end(result?: GenerationResult) {
      if (result) {
        span.update({
          output: result.output,
          usageDetails: toUsageDetails(result.usage),
        });
      }
      span.end();
    },
    error(err: ErrorInfo) {
      span.update({
        level: "ERROR",
        statusMessage: err.message,
        output: { error: err.message, code: err.code },
      });
      span.end();
    },
  };
}

export async function withToolSpan<T>(
  params: ToolParams,
  fn: () => Promise<T>,
): Promise<T> {
  if (!isTracingActive()) return fn();

  const name = formatToolName(params.name);

  return startActiveObservation(
    name,
    async (span: LangfuseTool) => {
      span.update({
        input: params.input,
        metadata: {
          callId: params.callId,
          turn: getCurrentTurn(),
          ...params.metadata,
        },
      });

      try {
        const result = await fn();
        span.update({ output: result });
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        span.update({ level: "ERROR", statusMessage: message });
        throw error;
      }
    },
    { asType: "tool" },
  );
}

export { advanceTurn };

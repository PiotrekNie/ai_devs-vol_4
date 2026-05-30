import { advanceTurn } from "./context.js";
import {
  flushTracing,
  initTracing,
  isTracingActive,
  shutdownTracing,
} from "./init.js";
import {
  setTraceOutput,
  withAgentSpan,
  withToolSpan,
  withTrace,
} from "./tracer.js";
import { withTracingAdapter } from "./tracing-adapter.js";
import type {
  AgentParams,
  ToolParams,
  TraceParams,
  TracingRuntime,
  TracingRuntimeOptions,
} from "./types.js";

export function createTracingRuntime(
  options: TracingRuntimeOptions = {},
): TracingRuntime {
  const agentName = options.agentName ?? "agent";
  const agentId =
    options.agentId ??
    options.sessionId ??
    `agent-${Date.now().toString(36)}`;

  return {
    options,

    isActive(): boolean {
      return isTracingActive();
    },

    advanceGenerationTurn(metadata?: Record<string, unknown>): void {
      if (!isTracingActive()) return;
      void metadata;
      advanceTurn();
    },

    withTrace<T>(params: TraceParams, fn: () => Promise<T>): Promise<T> {
      return withTrace(
        {
          ...params,
          sessionId: params.sessionId ?? options.sessionId,
          userId: params.userId ?? options.userId,
          tags: params.tags ?? options.tags,
        },
        fn,
      );
    },

    withAgent<T>(params: AgentParams, fn: () => Promise<T>): Promise<T> {
      return withAgentSpan(
        {
          name: params.name || agentName,
          agentId: params.agentId || agentId,
          task: params.task,
          metadata: { ...options.metadata, ...params.metadata },
        },
        fn,
      );
    },

    withTool<T>(params: ToolParams, fn: () => Promise<T>): Promise<T> {
      return withToolSpan(params, fn);
    },

    setTraceOutput(output: unknown): void {
      setTraceOutput(output);
    },
  };
}

export {
  initTracing,
  flushTracing,
  shutdownTracing,
  isTracingActive,
  withTracingAdapter,
};
export type { TracingRuntimeOptions, TracingRuntime } from "./types.js";

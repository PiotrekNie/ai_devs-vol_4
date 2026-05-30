import type { OmTracingCallbacks } from "../agent/observational_memory/om-callbacks.js";
import type { ObservationalMemoryHooksOptions } from "../agent/observational_memory/index.js";
import { startMemorySpan, type MemorySpanHandle } from "./memory-span.js";
import type { TracingRuntime } from "./types.js";

function mapUsage(usage?: {
  inputTokens?: number;
  outputTokens?: number;
}): { input?: number; output?: number } | undefined {
  if (!usage) return undefined;
  const mapped: { input?: number; output?: number } = {};
  if (usage.inputTokens != null) mapped.input = usage.inputTokens;
  if (usage.outputTokens != null) mapped.output = usage.outputTokens;
  return Object.keys(mapped).length > 0 ? mapped : undefined;
}

/**
 * Langfuse span callbacks for Observational Memory (Observer / Reflector).
 * Pass to `createObservationalMemoryHooks({ ...createOmTracingCallbacks(runtime) })`.
 */
export function createOmTracingCallbacks(
  runtime: TracingRuntime,
): OmTracingCallbacks {
  let observerSpan: MemorySpanHandle | null = null;
  let reflectorSpan: MemorySpanHandle | null = null;

  return {
    onObserverStart(ctx) {
      if (!runtime.isActive()) return;
      observerSpan = startMemorySpan("memory/observer", { ...ctx });
    },

    onObserverEnd(ctx) {
      if (!runtime.isActive() || !observerSpan) return;
      const { usage, ...metadata } = ctx;
      const mappedUsage = mapUsage(usage);
      observerSpan.end({
        metadata: mappedUsage ? { ...metadata, usage: mappedUsage } : metadata,
      });
      observerSpan = null;
    },

    onReflectorStart(ctx) {
      if (!runtime.isActive()) return;
      reflectorSpan = startMemorySpan("memory/reflector", { ...ctx });
    },

    onReflectorEnd(ctx) {
      if (!runtime.isActive() || !reflectorSpan) return;
      const { usage, ...metadata } = ctx;
      const mappedUsage = mapUsage(usage);
      reflectorSpan.end({
        metadata: mappedUsage ? { ...metadata, usage: mappedUsage } : metadata,
      });
      reflectorSpan = null;
    },
  };
}

/** Merge OM options with Langfuse tracing callbacks. */
export function withObservationalMemoryTracing(
  memoryOptions: ObservationalMemoryHooksOptions,
  runtime: TracingRuntime,
): ObservationalMemoryHooksOptions {
  return {
    ...memoryOptions,
    tracing: {
      ...createOmTracingCallbacks(runtime),
      ...memoryOptions.tracing,
    },
  };
}

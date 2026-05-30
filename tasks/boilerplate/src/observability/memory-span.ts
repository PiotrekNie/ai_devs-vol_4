import { type LangfuseSpan, startObservation } from "@langfuse/tracing";
import { formatMemoryName, getCurrentTurn } from "./context.js";
import { isTracingActive } from "./init.js";

export type MemorySpanHandle = {
  end(output?: { metadata?: Record<string, unknown> }): void;
};

export function startMemorySpan(
  baseName: string,
  metadata?: Record<string, unknown>,
): MemorySpanHandle {
  if (!isTracingActive()) {
    return { end: () => {} };
  }

  const name = formatMemoryName(baseName);
  const span = startObservation(
    name,
    {
      metadata: {
        turn: getCurrentTurn(),
        ...metadata,
      },
    },
    { asType: "span" },
  ) as LangfuseSpan;

  return {
    end(output) {
      if (output?.metadata) {
        span.update({ output: output.metadata });
      }
      span.end();
    },
  };
}

export async function withMemorySpan<T>(
  baseName: string,
  metadata: Record<string, unknown> | undefined,
  fn: () => Promise<T>,
  endMetadata?: (result: T) => Record<string, unknown>,
): Promise<T> {
  if (!isTracingActive()) return fn();

  const handle = startMemorySpan(baseName, metadata);
  try {
    const result = await fn();
    handle.end({ metadata: endMetadata?.(result) });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    handle.end({ metadata: { error: message } });
    throw error;
  }
}

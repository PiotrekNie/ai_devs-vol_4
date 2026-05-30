import { LangfuseSpanProcessor } from "@langfuse/otel";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  LANGFUSE_BASE_URL,
  LANGFUSE_PUBLIC_KEY,
  LANGFUSE_SECRET_KEY,
  TRACING_SERVICE_NAME,
} from "../../config.js";

export type TracingInitConfig = {
  enabled?: boolean;
  serviceName?: string;
};

let sdk: NodeSDK | null = null;
let spanProcessor: LangfuseSpanProcessor | null = null;
let initialized = false;

export function initTracing(config: TracingInitConfig = {}): void {
  if (initialized) return;

  const { enabled = true, serviceName = TRACING_SERVICE_NAME } = config;

  if (!enabled) {
    initialized = true;
    return;
  }

  if (!LANGFUSE_SECRET_KEY || !LANGFUSE_PUBLIC_KEY) {
    initialized = true;
    return;
  }

  try {
    spanProcessor = new LangfuseSpanProcessor();
    sdk = new NodeSDK({
      serviceName,
      spanProcessors: [spanProcessor],
      autoDetectResources: false,
    });
    sdk.start();
    initialized = true;
    void LANGFUSE_BASE_URL;
  } catch {
    initialized = true;
  }
}

export async function flushTracing(): Promise<void> {
  try {
    await spanProcessor?.forceFlush();
  } catch {
    // best effort
  }
}

export async function shutdownTracing(): Promise<void> {
  try {
    await sdk?.shutdown();
  } catch {
    // best effort
  } finally {
    sdk = null;
    spanProcessor = null;
    initialized = false;
  }
}

export function isTracingActive(): boolean {
  return initialized && spanProcessor !== null;
}

/** Reset internal state — tests only. */
export function resetTracingForTests(): void {
  sdk = null;
  spanProcessor = null;
  initialized = false;
}

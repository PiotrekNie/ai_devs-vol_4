/**
 * Observability (Langfuse tracing) — types only, no Langfuse imports.
 * Safe to import from `agent.ts` without peer dependencies.
 */

export type Usage = {
  input?: number;
  output?: number;
  total?: number;
};

export type TraceParams = {
  name: string;
  sessionId?: string;
  userId?: string;
  input?: unknown;
  metadata?: Record<string, unknown>;
  tags?: string[];
};

export type AgentParams = {
  name: string;
  agentId: string;
  task?: string;
  metadata?: Record<string, unknown>;
};

export type ToolParams = {
  name: string;
  input?: unknown;
  callId?: string;
  metadata?: Record<string, unknown>;
};

export type TracingRuntimeOptions = {
  sessionId?: string;
  userId?: string;
  agentName?: string;
  agentId?: string;
  traceName?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
};

/**
 * Pluggable tracing runtime — default is {@link noopTracingRuntime}.
 * Pass a Langfuse-backed instance from `@ai-devs/agent-boilerplate/observability`.
 */
export interface TracingRuntime {
  readonly options: TracingRuntimeOptions;
  isActive(): boolean;
  advanceGenerationTurn(metadata?: Record<string, unknown>): void;
  withTrace<T>(params: TraceParams, fn: () => Promise<T>): Promise<T>;
  withAgent<T>(params: AgentParams, fn: () => Promise<T>): Promise<T>;
  withTool<T>(params: ToolParams, fn: () => Promise<T>): Promise<T>;
  setTraceOutput(output: unknown): void;
}

import type {
  AgentParams,
  ToolParams,
  TraceParams,
  TracingRuntime,
  TracingRuntimeOptions,
} from "./types.js";

const EMPTY_OPTIONS: TracingRuntimeOptions = {};

export const noopTracingRuntime: TracingRuntime = {
  options: EMPTY_OPTIONS,
  isActive: () => false,
  advanceGenerationTurn() {},
  async withTrace(_params, fn) {
    return fn();
  },
  async withAgent(_params, fn) {
    return fn();
  },
  async withTool(_params, fn) {
    return fn();
  },
  setTraceOutput() {},
};

export function createNoopTracingRuntime(
  options: TracingRuntimeOptions = {},
): TracingRuntime {
  return {
    ...noopTracingRuntime,
    options,
  };
}

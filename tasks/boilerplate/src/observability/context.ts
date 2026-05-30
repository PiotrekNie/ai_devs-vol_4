import { AsyncLocalStorage } from "node:async_hooks";

export type TracingContext = {
  agentName: string;
  agentId: string;
  turnNumber: number;
  toolIndex: number;
};

const storage = new AsyncLocalStorage<TracingContext>();

export async function withAgentContext<T>(
  agentName: string,
  agentId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const ctx: TracingContext = {
    agentName,
    agentId,
    turnNumber: 0,
    toolIndex: 0,
  };
  return storage.run(ctx, fn);
}

export function advanceTurn(): number {
  const ctx = storage.getStore();
  if (!ctx) return 0;
  ctx.turnNumber += 1;
  ctx.toolIndex = 0;
  return ctx.turnNumber;
}

function nextToolIndex(): number {
  const ctx = storage.getStore();
  if (!ctx) return 1;
  ctx.toolIndex += 1;
  return ctx.toolIndex;
}

export function getCurrentTurn(): number {
  return storage.getStore()?.turnNumber ?? 0;
}

export function formatGenerationName(baseName = "generation"): string {
  const ctx = storage.getStore();
  if (!ctx) return baseName;
  return `${ctx.agentName}/${baseName}#${ctx.turnNumber}`;
}

export function formatToolName(toolName: string): string {
  const ctx = storage.getStore();
  if (!ctx) return toolName;
  return `${ctx.agentName}/${toolName}#${nextToolIndex()}`;
}

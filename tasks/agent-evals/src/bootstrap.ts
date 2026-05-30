import { LangfuseClient } from "@langfuse/client";

export type ExperimentContext = {
  langfuse: LangfuseClient;
  shutdown: () => Promise<void>;
};

export type BootstrapParams = {
  experimentName: string;
};

/**
 * Creates a Langfuse client for offline/online eval experiments.
 *
 * For generation/tool traces during eval runs, call `initTracing()` from
 * `@ai-devs/agent-boilerplate/observability` in your task before running the agent.
 */
export async function bootstrapExperiment(
  _params: BootstrapParams,
): Promise<ExperimentContext> {
  const langfuse = new LangfuseClient();

  const shutdown = async (): Promise<void> => {
    await Promise.all([
      langfuse.flush().catch(() => {}),
      langfuse.shutdown().catch(() => {}),
    ]);
  };

  return { langfuse, shutdown };
}

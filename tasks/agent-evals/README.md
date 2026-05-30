# @ai-devs/agent-evals

Langfuse **eval harness** for [AI Devs 4](https://aidevs.pl/) agent tasks — dataset helpers, evaluators, and experiment bootstrap.

**Not included:** domain logic for course homework (e.g. sensor anomaly detection).  
**Boilerplate tracing:** [`@ai-devs/agent-boilerplate/observability`](../boilerplate/README.md).

---

## Install

From a task directory:

```json
{
  "dependencies": {
    "@ai-devs/agent-evals": "file:../agent-evals",
    "@ai-devs/agent-boilerplate": "file:../boilerplate",
    "@langfuse/client": "^4.6.1"
  }
}
```

Also install boilerplate **observability peers** when using tracing during evals:

```bash
bun add @langfuse/tracing @langfuse/otel @opentelemetry/sdk-node @opentelemetry/api
```

---

## Environment

Add to `tasks/.env`:

| Variable | Purpose |
| --- | --- |
| `LANGFUSE_PUBLIC_KEY` | Langfuse project |
| `LANGFUSE_SECRET_KEY` | Langfuse project |
| `LANGFUSE_BASE_URL` | Optional (default `https://cloud.langfuse.com`) |
| `OPENAI_API_KEY` or `OPENROUTER_API_KEY` | Agent under test |

**PII:** do not send production user data to Langfuse without a task-level redaction policy.

---

## Quick start (local dry-run)

```bash
cd tasks/agent-evals
bun install
bun run example:tool-use
```

This runs evaluators against the synthetic dataset **without** calling an LLM.

---

## Live experiment (task code)

```typescript
import {
  bootstrapExperiment,
  confirmExperiment,
  ensureDataset,
  syncDatasetItems,
  toolUseEvaluator,
  createAvgScoreEvaluator,
  loadJsonFile,
} from "@ai-devs/agent-evals";

const ctx = await bootstrapExperiment({ experimentName: "my_episode" });
// Optional: initTracing() from @ai-devs/agent-boilerplate/observability before agent runs
try {
  await confirmExperiment({
    name: "Tool use",
    datasetCases: 5,
    description: "Calls LLM per case — costs tokens",
  });

  await ensureDataset(ctx.langfuse, {
    name: "my_episode/tool-use",
    description: "Synthetic tool selection cases",
  });

  const dataset = await ctx.langfuse.dataset.get("my_episode/tool-use");
  const result = await dataset.runExperiment({
    name: "Tool Use Eval",
    task: async (item) => {
      // Run your agent here; return { toolNames: [...] }
      return { toolNames: [] };
    },
    evaluators: [toolUseEvaluator],
    runEvaluators: [createAvgScoreEvaluator("tool_use_overall")],
  });

  console.log(await result.format({ includeItemResults: true }));
} finally {
  await ctx.shutdown();
}
```

**CI:** eval experiments are **not** run on PR — local / maintainer only.

---

## Exports

| Export | Purpose |
| --- | --- |
| `bootstrapExperiment` | Langfuse client for dataset experiments |
| `loadJsonFile`, `ensureDataset`, `syncDatasetItems` | Dataset management |
| `toolUseEvaluator` | Tool selection / usage scoring (0–1) |
| `responseCorrectnessEvaluator` | Deterministic response checks |
| `confirmExperiment` | Interactive cost guard before live runs |

Templates: `templates/datasets/*.json` (from lesson `03_01_evals`).

---

## Tests

```bash
bun test
bunx tsc --noEmit
```

No network or Langfuse keys required for unit tests.

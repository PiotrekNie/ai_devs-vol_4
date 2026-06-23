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

## System self-observation (S04E03)

Lesson **S04E03** describes **meta-agents** that audit whether background automation still delivers value — for example whether a daily digest is read, or whether monitored RSS sources return HTTP errors. This is the same *LLM-as-judge* idea as [S03E01 observability](../boilerplate/docs/specs/agent-observability-evals/agent-observability-evals.research.md), applied to **system health**, not a single homework trajectory.

**Pattern (do this):**

1. A **periodic worker** (cron, heartbeat — see [§2.7](../docs/boilerplate-documentation.md#27-contextual-collaboration-in-daily--business-workflows-s04e03) and `lessons/03_02_events/`) collects metrics (open rates, broken URLs, queue depth).
2. Build a **user message** with JSON metrics + a short audit instruction.
3. Call `createAgent().processQuery(...)` (or a single `chat()` pass) → recommendation: disable a process, remove a source, or escalate to a human.
4. Optionally persist cases to a Langfuse dataset and score audit rules offline with `responseCorrectnessEvaluator`.

**Anti-pattern:** running self-observation hooks inside every ReAct turn of a production agent — that belongs in a **separate** worker, not in `@ai-devs/agent-boilerplate` core.

**PII:** redact user identifiers before sending audit payloads to Langfuse (see [Environment](#environment)).

Normative course guidance: [§2.7 in boilerplate-documentation.md](../docs/boilerplate-documentation.md#27-contextual-collaboration-in-daily--business-workflows-s04e03).

---

## Tests

```bash
bun test
bunx tsc --noEmit
```

No network or Langfuse keys required for unit tests.

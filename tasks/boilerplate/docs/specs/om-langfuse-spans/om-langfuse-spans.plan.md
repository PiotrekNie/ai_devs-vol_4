# Plan wdrożenia — OM Langfuse spans (Wariant 2, v1)

**Normatywny research:** [om-langfuse-spans.research.md](om-langfuse-spans.research.md) — **zaakceptowany** (Wariant 2: callback port; span metadata-only v1).  
**Workspace:** `tasks/boilerplate/` (`@ai-devs/agent-boilerplate`)  
**Wymaga:** wdrożonej Opcji B tracing ([agent-observability-evals.plan.md](../agent-observability-evals/agent-observability-evals.plan.md))

**Weryfikacja UI:** brak.

**Poza zakresem v1:**

- Wariant D (`composeHooks`) — v3
- Nested Langfuse generation dla wywołań `OM_MODEL` (Wariant B) — v2
- Span `memory/flush` — P3
- Wbudowany redactor PII
- Wymuszanie spanów dla wszystkich użytkowników OM

---

## 1. Zakres (scope)

| Element | Opis |
| --- | --- |
| **Callback port** | Typy + opcjonalne hooki w `ObservationalMemoryHooksOptions` / config przekazywany do processor |
| **Hook points** | `runObserver`, `runReflector` — start/end z kontekstem metryk |
| **`createOmTracingCallbacks`** | `src/observability/om-tracing.ts` — implementacja Langfuse spanów |
| **`withObservationalMemoryTracing`** | Helper łączący options + runtime (docs) |
| **Spany** | `memory/observer`, `memory/reflector` pod aktywnym `agent` span |
| **Output span** | Tylko liczniki (lines, tokens) — **bez** pełnego XML obserwacji |
| **Domyślne zachowanie** | Brak callbacks → OM identyczne jak dziś |

---

## 2. Decyzje projektowe (zatwierdzone)

| # | Decyzja |
| --- | --- |
| 1 | **Wariant 2** — OM nie importuje Langfuse; callbacks + implementacja w subpath |
| 2 | **Span A (v1)** — metadata + usage w `end()`; bez nested generation |
| 3 | Observer **i** Reflector w v1 |
| 4 | Aktywacja gdy callbacks ustawione **i** `runtime.isActive()` |
| 5 | Nazwy spanów: `memory/observer`, `memory/reflector` (z prefiksem agenta jak tool spans) |

---

## 3. Analiza stanu obecnego (gap)

| Komponent | Stan | Gap |
| --- | --- | --- |
| `observational_memory/index.ts` | `ObservationalMemoryHooksOptions` bez tracing callbacks | Dodać opcjonalne hooki |
| `processor.ts` | Woła `runObserver` / `runReflector` bez portu | Owinięcie hook start/end |
| `observability/tracer.ts` | `withToolSpan`, `startGeneration` | Dodać `withMemorySpan` lub reuse span helper |
| `observability/index.ts` | Brak OM bridge | Eksport `createOmTracingCallbacks` |
| README | OM vs Langfuse opisane | Sekcja „OM + tracing together” |

---

## 4. Architektura docelowa

```text
createAgent({
  ai: withTracingAdapter(...),
  tracing: createTracingRuntime({ sessionId }),
  memory: createObservationalMemoryHooks({
    ...createOmTracingCallbacks(tracingRuntime),
  }),
})
  │
  └─ beforeTurn → processObservationalMemory
        │
        ├─ hooks.onObserverStart(ctx)
        ├─ runObserver → chat(OM_MODEL)
        ├─ hooks.onObserverEnd(ctx, result)
        ├─ (optional) hooks.onReflectorStart / End
        └─ return trimmed conversation
```

**Langfuse hierarchy:**

```text
agent
├── memory/observer#1    ← nowy (metadata: messagesSealed, tailKept, …)
├── generation#1
├── tool#1
├── memory/reflector#1   ← gdy reflect
└── generation#2
```

---

## 5. Kontrakt callback port (propozycja)

```typescript
// observational_memory/types.ts — bez importu Langfuse

export type OmObserverStartContext = {
  messagesSealed: number;
  pendingTokensRaw: number;
  threshold: number;
  generation: number;
};

export type OmObserverEndContext = OmObserverStartContext & {
  tailKept: number;
  observationLines: number;
  obsTokensRaw: number;
  obsTokensCalibrated: number;
  usage?: { inputTokens?: number; outputTokens?: number };
};

export type OmReflectorStartContext = {
  obsTokensBefore: number;
  threshold: number;
  targetTokens: number;
  generation: number;
};

export type OmReflectorEndContext = OmReflectorStartContext & {
  obsTokensAfter: number;
  compressionLevel: number;
  usage?: { inputTokens?: number; outputTokens?: number };
};

export type OmTracingCallbacks = {
  onObserverStart?(ctx: OmObserverStartContext): void | Promise<void>;
  onObserverEnd?(ctx: OmObserverEndContext): void | Promise<void>;
  onReflectorStart?(ctx: OmReflectorStartContext): void | Promise<void>;
  onReflectorEnd?(ctx: OmReflectorEndContext): void | Promise<void>;
};
```

`ObservationalMemoryHooksOptions` rozszerzone o `tracing?: OmTracingCallbacks`.

`createOmTracingCallbacks(runtime)` zwraca `OmTracingCallbacks` używające `runtime.withTool`-like span API.

---

## 6. Plan fazowy i zadania

### Faza A — Typy i port w OM

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| A1 | [CREATE] | **`observational_memory/om-callbacks.ts`** — typy `OmTracingCallbacks`, context types (eksport z modułu OM). | [ ] Bez importu observability |
| A2 | [MODIFY] | **`ObservationalMemoryHooksOptions`** + **`ObservationalMemoryConfig`** — pole `tracing?: OmTracingCallbacks`. | [ ] Przekazywane do processor |
| A3 | [MODIFY] | **`index.ts` factory** — merge callbacks z options do config. | [ ] |

### Faza B — Hook points w processor

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| B1 | [MODIFY] | **`runObservationPass` / `runObserver` flow** — `onObserverStart` przed `runObserver`; `onObserverEnd` po (z usage z response). | [ ] No-op gdy brak callbacks |
| B2 | [MODIFY] | **`runReflectionIfNeeded`** — `onReflectorStart` / `onReflectorEnd` wokół `runReflector`. | [ ] |
| B3 | [MODIFY] | **`observer.ts` / `reflector.ts`** — zwracać / propagować `usage` do end context (jeśli brak — opcjonalne w end). | [ ] |

### Faza C — Implementacja Langfuse (`om-tracing.ts`)

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| C1 | [CREATE] | **`observability/memory-span.ts`** — `withMemorySpan(name, metadata, fn)` — span pod active agent (reuse `startActiveObservation` asType span). | [ ] No-op when !isTracingActive |
| C2 | [CREATE] | **`observability/om-tracing.ts`** — `createOmTracingCallbacks(runtime)` mapujące hooki → memory spans. | [ ] |
| C3 | [CREATE] | **`withObservationalMemoryTracing(options, runtime)`** — spread helper dla docs. | [ ] |
| C4 | [MODIFY] | **`observability/index.ts`** — eksport nowych symboli. | [ ] |

### Faza D — Testy

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| D1 | [CREATE] | **`observational_memory/om-callbacks.test.ts`** — mock callbacks wołane przy przekroczeniu progu (processor test). | [ ] |
| D2 | [CREATE] | **`observability/om-tracing.test.ts`** — mock runtime / inactive tracing → no throw. | [ ] |
| D3 | [REUSE] | `bun test` + `bunx tsc --noEmit` w `tasks/boilerplate/`. | [ ] Zero failures |

### Faza E — Dokumentacja

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| E1 | [MODIFY] | **`README.md`** — podsekcja „OM + Langfuse tracing” z przykładem `createOmTracingCallbacks`. | [ ] |
| E2 | [MODIFY] | **`CHANGELOG.md`** — [Unreleased] OM Langfuse spans v1. | [ ] |
| E3 | [MODIFY] | **`boilerplate-documentation.md` §4.3/4.4** — krótki cross-link. | [ ] |
| E4 | [MODIFY] | **`om-langfuse-spans.research.md`** — link do planu; status implementacji. | [ ] |

---

## 7. Przykład użycia (docelowy)

```typescript
import { createAgent, createAIAdapter, createObservationalMemoryHooks } from "@ai-devs/agent-boilerplate";
import {
  initTracing,
  createTracingRuntime,
  withTracingAdapter,
  createOmTracingCallbacks,
  flushTracing,
  shutdownTracing,
} from "@ai-devs/agent-boilerplate/observability";

initTracing({ serviceName: "sXXeYY" });
const tracing = createTracingRuntime({ sessionId: "run-1", agentName: "episode" });
const model = "gpt-4o-mini";

const agent = createAgent({
  ai: withTracingAdapter(createAIAdapter({ model }), model),
  tracing,
  memory: createObservationalMemoryHooks({
    ...createOmTracingCallbacks(tracing),
  }),
  // ...
});
```

---

## 8. Bezpieczeństwo

- Domyślnie **nie** wysyłać `activeObservations` XML do Langfuse span output.
- Input span: liczby i progi, nie serializowana historia konwersacji.
- PII — polityka task-level (README).

---

## 9. Kolejność realizacji

**A → B → C → D → E** — jeden PR boilerplate.

---

## 10. Changelog planu

| Data | Autor | Zmiana |
| --- | --- | --- |
| 2026-05-30 | Architect / EM | Plan v1 — Wariant 2 callback port (decyzja użytkownika). |

---

## 11. Status implementacji

- [x] Fazy A–E
- [x] `bun test` + `tsc` — boilerplate (po implementacji)

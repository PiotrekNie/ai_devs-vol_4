# @ai-devs/s04e01 — okoeditor (OKO hub API)

Agent **ReAct** dla zadania kursu **AI Devs 4** (S04E01): edycja danych Centrum Operacyjnego OKO wyłącznie przez hub (`task: okoeditor`).

**Research / plan:** [docs/specs/okoeditor/](./docs/specs/okoeditor/)  
**Kontekst rekonesansu:** [docs/context/okoeditor.md](./docs/context/okoeditor.md)

---

## Ścieżka nauki (L0 → L2)

| Poziom | Komenda | Cel |
| --- | --- | --- |
| **L0** | `bun run probe` | `oko_help` + próbne `oko_done` — zrozum API |
| **L1** | curl / ręczne `oko_update` | Deterministyczne edycje ze znanymi ID |
| **L2** | `bun run start` | Agent ReAct z pętlą feedback `done` |

---

## Wymagania

- [Bun](https://bun.sh/)
- `HUB_API_KEY` w `tasks/.env`
- Klucz LLM: `OPENAI_API_KEY` lub `OPENROUTER_API_KEY`
- Rekonesans ID w panelu https://oko.ag3nts.org/ (login Zofia — **tylko odczyt**)

---

## Instalacja

```bash
cd tasks/s04e01
bun install
bun run probe
bun run start
```

---

## Architektura

```text
Turn 0: plan (3× update + done)
  → oko_help (optional)
  → oko_update ×3 (Skolwin report, Skolwin task, Komarowo)
  → oko_done → iteracja na message
  → finish_task → {FLG:...}
```

| Narzędzie | Rola |
| --- | --- |
| `oko_help` | Dokumentacja API z huba |
| `oko_update` | Mutacja rekordu (`page`, `id`, …) |
| `oko_done` | Weryfikacja + flaga |
| `finish_task` | Po `{FLG:...}` |

Epizod **nie** eksponuje `http_request`, `read_file` ani browser — profil hub z [§2.5](../../docs/boilerplate-documentation.md#25-production-deployments-s04e01).

---

## Jakość

```bash
bun test
bun run typecheck
```

---

## Zmienne (wybrane)

| Zmienna | Domyślnie | Opis |
| --- | --- | --- |
| `HUB_API_KEY` | — | **Wymagane** |
| `AGENT_MODEL` | `gpt-4o-mini` | Model ReAct |
| `AGENT_MAX_ITERATIONS` | `12` | Limit pętli |

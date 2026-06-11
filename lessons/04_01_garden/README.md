# 04_01_garden — Cyfrowy Ogród (S04E01)

Referencyjna aplikacja z lekcji **S04E01 — Wdrożenia rozwiązań AI**: agent LLM + sandbox Daytona + baza wiedzy w Markdown + publikacja statycznej strony.

**To nie jest `@ai-devs/agent-boilerplate`.** Lekcja ma własną pętlę agenta (OpenAI Responses API, `previous_response_id`). Typowe epizody homework w `tasks/sXXeYY/` używają pakietu kursowego — patrz [§2.5 Production deployments](../../../tasks/docs/boilerplate-documentation.md#25-production-deployments-s04e01).

## Cel

- Edycja i wzbogacanie notatek w katalogu `vault/`
- Budowa strony www z markdown (`grove/` → `dist/`)
- Opcjonalna publikacja przez GitHub Actions → GitHub Pages

Przepływ: **rozmowa z agentem → zmiany w vault → build → (deploy)**.

## Wymagania

- [Bun](https://bun.sh/)
- `OPENAI_API_KEY` — model w konfiguracji agenta (`src/config.ts`, szablon `vault/system/main.agent.md`)
- Konto i klucz **Daytona** — sandbox przy pierwszym użyciu narzędzi `terminal` / `code_mode` (`@daytonaio/sdk`)

Ustaw zmienne w `.env` w katalogu lekcji (nie commituj sekretów).

## Komendy

```bash
bun install
bun start "Dopisz trzy ulubione książki do shelf"
bun run build    # MD → dist/
bun run preview  # podgląd dist/ (serwer statyczny)
```

## Struktura (skrót)

| Ścieżka | Rola |
| --- | --- |
| `vault/` | Treści markdown (publiczne + `vault/system/` — instrukcje agenta, skills, workflows) |
| `grove/` | Kompilator MD → HTML |
| `src/agent/` | Pętla agenta, szablony, skills |
| `src/tools/` | `terminal`, `code_mode`, `git_push` |
| `src/sandbox/` | Klient Daytona, sync vault ↔ VM |

Więcej: [vault/system/agent-architecture-concepts.md](vault/system/agent-architecture-concepts.md).

## Relacja do boilerplate kursowego

| | `tasks/sXXeYY/` + boilerplate | `04_01_garden` |
| --- | --- | --- |
| Runtime | `createAgent`, MCP, ReAct | Własna pętla, Responses API |
| Narzędzia | `http_request`, `read_file`, hub | terminal, code_mode, git_push |
| Sandbox | Chroot odczytu | Pełny VM (Daytona) |
| Cel | Zadanie hub, `/verify` | Długotrwała baza wiedzy + publikacja |

## Materiały

- Transkrypt lekcji: `markdowns/s04e01-wdrozenia-rozwiazan-ai-1774824465.md`
- Research / plan docs: [s04e01-production-deployments](../../../tasks/boilerplate/docs/specs/s04e01-production-deployments/)

# S02E02 — Electricity (`electricity`)

Solves the hub `electricity` task: read a 3×3 tile board from PNG (vision), compare to the target layout, and rotate cells via `POST https://hub.ag3nts.org/verify`.

## Modes

| Command | Description |
|--------|-------------|
| `bun run start` | Deterministic loop (`index.ts`): vision → plan → `apply_rotations_for_cell` until flag or max rounds. |
| `bun run agent` | LLM agent (`agent.ts`) with OpenRouter Chat Completions (`fetch`) and a manual tool-calling loop. |

Prefer **deterministic** when you want minimal tokens and predictable behavior. Use the **agent** to experiment with tool-calling orchestration.

## Environment (`tasks/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `HUB_API_KEY` | Yes | Hub key for PNG + `/verify`. |
| `OPENROUTER_API_KEY` | Yes* | OpenRouter for vision + agent (unless you only set a fixed target; vision still needed for live board reads). |
| `ELECTRICITY_TARGET_MASKS` | No | JSON `[[0-15]×3]×3` — nadpisuje domyślny target z kodu (`REFERENCE_SOLVED_MASKS` w `src/config.ts`, np. `[[6,7,5],[10,14,10],[14,3,9]]`). |
| `ELECTRICITY_VISION_MODEL` | No | OpenRouter model id for vision (default: `google/gemini-3-flash-preview`). |
| `ELECTRICITY_AGENT_MODEL` | No | OpenRouter model for `agent.ts` (default: `openai/gpt-4o-mini`). |
| `ELECTRICITY_MAX_ITERATIONS` | No | Outer rounds in `index.ts` (default: `12`). |
| `ELECTRICITY_AGENT_MAX_STEPS` | No | Max LLM steps per outer iteration (default: `32`). |

\* Vision jest używane do odczytu **bieżącej** planszy (`electricity.png`). Stan docelowy jest domyślnie w kodzie (`REFERENCE_SOLVED_MASKS`); możesz go nadpisać przez `ELECTRICITY_TARGET_MASKS`.

## MCP

`bun run mcp` starts a stdio MCP server with the same tools as the in-process agent (`fetch_board`, `read_board_state`, `plan_rotations`, `rotate_cell`, `reset_board`, `apply_rotations_for_cell`).

## Tile encoding

Each cell is a 4-bit mask: **N=1, E=2, S=4, W=8** (add edges that have a wire). The hub only accepts right rotations `1x1`…`3x3`.

# Savethem — task specification

## Deliverable

Submit to the hub:

- `task_name`: `savethem`
- `answer`: string array — first element is the **starting vehicle** (`rocket`, `horse`, `car`, or `walk`), followed by moves: `up`, `down`, `left`, `right`, and optionally `dismount`.

Example shape: `["rocket", "up", "right", "dismount", "right", ...]`

Success: hub returns `{FLG:...}`.

Preview (manual check): https://hub.ag3nts.org/savethem_preview.html

## Discovery sequence (hub_query)

All `query` values must be **English**.

1. `path: toolsearch` — find available endpoints (`movement`, `terrain`, `vehicles`, …).
2. `path: maps`, `query: Skolwin` — 10×10 grid with S (start) and G (goal).
3. `path: wehicles` — one call per vehicle: `rocket`, `horse`, `car`, `walk`.
4. `path: books` — rules, e.g. `movement`, `water`, `trees`, `fuel`.

Each hub tool returns at most **3** best matches per query — iterate queries if needed.

## Execution sequence

1. Complete discovery (map + 4 vehicles + books notes on movement/water).
2. `plan_route` — optionally pass `vehicle`; omit to auto-pick shortest valid route.
3. `submit_to_hub` with the returned `route` array.
4. On hub error: read feedback, adjust discovery or vehicle, repeat `plan_route` → submit.
5. `finish_task` after flag.

## Domain constraints

- Start with **10 fuel** and **10 food**; both consumed per move (vehicle-dependent).
- `R` = blocked; `W` = water (only horse and walk cross safely); `T` = trees (+fuel for powered vehicles).
- Vehicle chosen only at departure; `dismount` switches to walk mode mid-route.
- Hub path for vehicles is spelled **`wehicles`** (course API typo).

## Anti-patterns

- Polish or non-English `query` strings.
- Skipping `plan_route` and inventing moves.
- `finish_task` before `{FLG:...}`.
- Guessing vehicle stats instead of calling `wehicles`.

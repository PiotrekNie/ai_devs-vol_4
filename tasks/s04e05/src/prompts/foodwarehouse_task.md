# Foodwarehouse — task specification (S04E05)

## Goal

Prepare **one warehouse order per city** listed in the demand file so autonomous transporters deliver the right goods. Hub returns `{FLG:...}` on success after `fw_done`.

| Item | Value |
| --- | --- |
| Hub task | `foodwarehouse` |
| Demand file (local) | `{{DEMAND_JSON_PATH}}` |
| Demand source URL | {{FOOD4CITIES_URL}} |

## What you must do

1. Read `food4cities.json` — each top-level key is a city slug; values are `{ good: quantity }`.
2. Use `fw_database` to map each city **name** to `destination_id` in table `destinations`.
3. Find active users who may create orders (explore `users` + `roles`; seeded orders use transport-related roles).
4. For each city in the JSON, create **one order**:
   - `fw_signature` with `login`, `birthday` (from DB), and `destination` (integer id).
   - `fw_orders` with **`action": "create"`** (required), plus `title`, `creatorID` (= same `user_id` as login/birthday), `destination`, `signature` (= `hash` from signature tool).
   - `fw_orders` with **`action": "append"`**, `id` = `order.id` from the create response (not guessed), plus batch `items` matching the JSON **exactly**.
5. `fw_done` — if `missing[]` is returned, fix those cities only; do not add extra goods elsewhere.

## Signature chain

- `creatorID` in create = `user_id` from `users`.
- `fw_signature` needs the same person's `login` + `birthday` + target `destination_id`.
- The returned `hash` is the `signature` field in create.

## Database tips

- Start with `show tables`, then `show create table destinations` (and users, roles).
- Use `WHERE` on city name — result rows may be limited to 30 per query.
- Do **not** use password fields; they are not needed for signatures.

## Orders tips

- Every `fw_orders` call **must** include `"action": "get" | "create" | "append" | "delete"`.
- After `create`, read `order.id` from the tool result and use that exact string in `append`.
- `creatorID` must be the `user_id` of the same person as `login`/`birthday` used in `fw_signature`.
- `append` with `items: { "chleb": 45, "woda": 120 }` adds or increments lines.
- Duplicate item names merge quantities — avoid accidental double-append.
- `fw_reset` clears your mutations back to seed state if you need a clean retry.

## Anti-patterns

- Guessing `destination` codes without SQL.
- Creating orders before you have a valid signature.
- Quantities that differ from `food4cities.json` (even by 1).
- Calling `finish_task` before `{FLG:...}` in `fw_done` output.
- Using `http_request` or raw hub calls — use `fw_*` tools only.

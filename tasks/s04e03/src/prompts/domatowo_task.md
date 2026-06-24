# Domatowo — task specification (S04E03)

## Goal

Find the partisan hiding in Domatowo and evacuate by helicopter. Hub returns `{FLG:...}` on success.

| Item | Value |
| --- | --- |
| Hub task | `domatowo` |
| Action budget | **300** points for the whole operation |
| Units | Max **4** transporters, max **8** scouts |
| Map | 11×11 grid (columns A–K, rows 1–11) |
| Spawn | Units appear at next free slot **A6 → D6** |
| Preview (manual) | https://hub.ag3nts.org/domatowo_preview |

## Intercepted radio signal

> Przeżyłem. Bomby zniszczyły miasto. Żołnierze tu byli, szukali surowców, zabrali ropę. Teraz jest pusto. Mam broń, jestem ranny. Ukryłem się w jednym z najwyższych bloków. Nie mam jedzenia. Pomocy.

Use this context to narrow your search — interpret terrain symbols from `getMap` / `searchSymbol` yourself.

## Action costs (mandatory)

| Action | Cost |
| --- | --- |
| Create scout | 5 |
| Create transporter | 5 + 5 × passengers |
| Move scout | 7 × fields (shortest orthogonal path) |
| Move transporter | 1 × field (**roads only**) |
| Inspect | 1 |
| Dismount | 0 |
| callHelicopter | 0 |
| help, getMap, getLogs, getObjects, expenses, actionCost, searchSymbol, reset | 0 |

## Movement rules

- **Transporters** drive only on **streets** (ulice).
- **Scouts** walk on foot anywhere reachable orthogonally.
- After `inspect`, always read logs via `domatowo_recon` with action `getLogs`.
- `callHelicopter` requires a scout to have **confirmed** a human on the destination cell.

## Typical mission flow

1. Recon: learn API and map layout.
2. Plan: how many units, where to deploy, estimated point spend.
3. Create transporter(s) with scouts aboard; move along roads; dismount near search areas.
4. Inspect candidate buildings; read logs in Polish.
5. When partisan found → `domatowo_call_helicopter` → `finish_task` after `{FLG:...}`.

## Anti-patterns

- Long scout walks when a transporter + dismount would be cheaper.
- Skipping `getLogs` after `inspect`.
- Calling helicopter before confirming the human on that cell.
- Ignoring `action_points_left` until too late.
- `finish_task` before `{FLG:...}` appears in a hub tool result.

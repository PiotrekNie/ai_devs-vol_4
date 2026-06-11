# Savethem — context (human + probe notes)

Homework **savethem** (S03E05): plan a route to **Skolwin** on a 10×10 map with **10 fuel** and **10 food**.

## Hub API probe (2026-06-11)

### toolsearch

- Returns top **3** tools per English `query`.
- Known paths: `maps`, `wehicles`, `books`.

### maps

- `query`: city name only, e.g. `Skolwin` (not “map for Skolwin”).
- Response: `map` as `string[][]`, symbols `.` `S` `G` `R` `T` `W`.

### wehicles (typo intentional)

- `query`: vehicle id — `rocket`, `horse`, `car`, `walk`.
- Response: `consumption.fuel`, `consumption.food`, `note` with rules.

| Vehicle | fuel/move | food/move | Water |
| --- | --- | --- | --- |
| rocket | 1.0 | 0.1 | no |
| horse | 0 | 1.6 | yes |
| car | 0.7 | 1.0 | no |
| walk | 0 | 2.5 | yes (on foot / after dismount) |

### books

- `query`: keywords — `movement`, `water`, `trees`, `fuel`, `travel`.
- Returns top 3 notes (movement rules, legend, dismount, tree +0.2 fuel for powered vehicles, etc.).

## Verify

```json
POST /verify
{
  "apikey": "...",
  "task": "savethem",
  "answer": ["rocket", "up", "right", "dismount", "..."]
}
```

## Verified route (solver)

```json
["rocket","up","up","up","right","right","right","right","right","dismount","right","right","right"]
```

Hub: `{FLG:INTACTCITY}`

# Filesystem — task specification (S04E04)

## Goal

Organize Natan Rams's chaotic trade notes into the hub **virtual filesystem**. Hub returns `{FLG:...}` on success after `fs_done`.

| Item | Value |
| --- | --- |
| Hub task | `filesystem` |
| Preview | https://hub.ag3nts.org/filesystem_preview.html |
| Notes archive | https://hub.ag3nts.org/dane/natan_notes.zip (already extracted locally) |

## Local note files (read with `read_file`)

Use these **absolute paths**:

| File | Role |
| --- | --- |
| `{{NOTES_README}}` | Describes the three data files |
| `{{NOTES_OGLOSZENIA}}` | City **demand** (what each city needs) |
| `{{NOTES_TRANSAKCJE}}` | Trade lines: seller → good → buyer |
| `{{NOTES_ROZMOWY}}` | Diary: who manages trade in which city |

You must **read all four** before building the FS.

## Required virtual structure

| Directory | Files | Content |
| --- | --- | --- |
| `/miasta` | One file per city (ASCII slug, nominative) | **JSON** object: `{ "towar": quantity }` — needs only, **no units**, no Polish diacritics in JSON keys/values |
| `/osoby` | One file per trader (filename flexible, e.g. `Imie_Nazwisko`) | Markdown: person's full name + **markdown link** to the city file they manage |
| `/towary` | One file per good (singular nominative ASCII slug, e.g. `chleb`) | Markdown: **link** to the city that **offers** this good for sale |

## Mapping hints (you infer details from notes)

- **Cities / demand:** from `ogłoszenia.txt` — what each city needs and how much (strip units like kg, bottles).
- **Goods for sale:** from `transakcje.txt` — city on the **left** sells the good in the middle.
- **Traders:** from `rozmowy.txt` — who handles trade for which city.

## API rules (confirm with `fs_help`)

- File names: pattern `^[a-z0-9_]+$`, max length 20, **global unique** basenames.
- File content: markdown only; **links must point to existing files** — create `/miasta/*` before `/osoby` and `/towary` that link to them.
- Hub action is **`listFiles`** (not listDir).
- **`fs_batch`:** array of create/delete/reset actions; **`fs_done` is separate**, not inside batch.

## Batch order (critical)

```text
createDirectory /miasta, /osoby, /towary
createFile /miasta/{city} ...   (all cities first)
createFile /osoby/{person} ...  (links → /miasta/...)
createFile /towary/{good} ...  (links → selling city)
fs_done
```

## Anti-patterns

- Skipping any source note file.
- Polish characters in file names or city JSON.
- Creating person/good files before city files they link to.
- Calling `finish_task` before `{FLG:...}` in `fs_done` output.
- Many single createFile calls instead of `fs_batch`.

# Zadanie okoeditor (S04E01)

Zmień dane w Centrum Operacyjnym OKO **wyłącznie** przez API huba (`task: okoeditor`). Panel [https://oko.ag3nts.org/](https://oko.ag3nts.org/) służy tylko do **odczytu** (rekonesans ID) — nie zapisuj tam nic ręcznie.

## Cel fabularny

- Raport **Skolwin**: klasyfikacja **zwierzęta** (nie pojazdy/ludzie).
- Zadanie **Skolwin**: `done: YES`, treść o zwierzętach (np. bobry).
- **Komarowo**: incydent o wykryciu ruchu ludzi (odwrócenie uwagi operatorów).
- Na końcu: `oko_done` → `{FLG:...}`.

## Rekordy (uzupełnij po rekonesansie UI)

Wypełnij tabelę w `docs/context/okoeditor.md` po zalogowaniu do panelu (login Zofia). **Bez ID agent nie może wykonać update.**

| Cel                                     | page        | id (32 hex)                        | Uwagi                                     |
| --------------------------------------- | ----------- | ---------------------------------- | ----------------------------------------- |
| Raport Skolwin (klasyfikacja zwierzęta) | `incydenty` | `380792b2c86d9c5be670b3bde48e187b` | Zmień pole klasyfikacji / tytuł według UI |
| Zadanie Skolwin                         | `zadania`   | `380792b2c86d9c5be670b3bde48e187b` | `done: YES`, content o bobrach            |
| Incydent Komarowo                       | `incydenty` | `bcdfc393f811cc05d3a189c679f50659` | Tytuł z prefiksem MOVE00/PROB00/RECO00    |

Jeśli w tabeli nadal `TODO`, poproś użytkownika o ID (lub użyj `ask_human` jeśli dostępne).

## Przykłady wywołań

Skolwin — zadanie:

```json
{
  "page": "zadania",
  "id": "<32-hex>",
  "done": "YES",
  "content": "W okolicach Skolwin zaobserwowano bobry."
}
```

Komarowo — incydent (dopasuj tytuł do konwencji z panelu):

```json
{
  "page": "incydenty",
  "id": "<32-hex>",
  "title": "MOVE00 ... Komarowo ...",
  "content": "Wykryto ruch ludzi w okolicach Komarowo."
}
```

## Po błędzie `oko_done`

Hub zwraca `message` (np. brak „Skolwin” w tytule). Popraw **konkretny** rekord i wywołaj `oko_done` ponownie — nie kończ `finish_task` bez flagi.

# okoeditor — kontekst pracy (S04E01)

Skrót zadania i miejsce na **Twoje notatki** po rekonesansie w panelu OKO.

## Zadanie hub

- **task:** `okoeditor`
- **verify:** `POST https://hub.ag3nts.org/verify`
- **Panel (tylko odczyt):** https://oko.ag3nts.org/
- **Login:** Zofia / **Hasło:** Zofia2026! / **Klucz:** `HUB_API_KEY`

## Checklist fabularny

- [ ] Raport Skolwin: klasyfikacja **zwierzęta** (nie pojazdy/ludzie)
- [ ] Zadanie Skolwin: `done: YES`, treść o zwierzętach (np. bobry)
- [ ] Incydent: ruch ludzi przy **Komarowo**
- [ ] `action: done` → `{FLG:...}`

## API (skrót)

- Akcje: `help` | `update` | `done`
- `update`: `page` = `incydenty` | `notatki` | `zadania`, `id` = 32 hex
- `incydenty`: tytuł z kodem incydentu na początku (np. `MOVE03` dla Skolwin — **zachowaj oryginalny kod**, nie podmieniaj na `RECO00`)
- `zadania`: opcjonalnie `done: YES|NO`

Pełny research: [../specs/okoeditor/okoeditor.research.md](../specs/okoeditor/okoeditor.research.md)

---

## Rekonesans UI — wypełnij po przeglądzie panelu

| Cel                                       | page        | id (32 hex)                        | Tytuł (UI)                                                     | Do zmiany                                                                                                                    |
| ----------------------------------------- | ----------- | ---------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Raport Skolwin (klasyfikacja → zwierzęta) | `incydenty` | `380792b2c86d9c5be670b3bde48e187b` | `MOVE03 Trudne do klasyfikacji ruchy nieopodal miasta Skolwin` | title: MOVE03 Obserwacja zwierząt nieopodal miasta Skolwin content: W rejonie Skolwin zaobserwowano zwierzęta (m.in. bobry). |
| Zadanie Skolwin                           | `zadania`   | `380792b2c86d9c5be670b3bde48e187b` | `Zbadanie nagrań z okolic Skolwina`                            | `done: YES`, content o bobrach / zwierzętach                                                                                 |
| Incydent Komarowo (ruch ludzi)            | `incydenty` | `bcdfc393f811cc05d3a189c679f50659` | `PROB01 Podejrzana retransmisja na paśmie VHF`                 | Przepisać na **Komarowo** + ruch ludzi (prefiks incydentu); _nie_ ten sam `id` co Skolwin                                    |

## Log prób `done`

| #   | Odpowiedź hub (`code`, `message`) | Co poprawiłem |
| --- | --------------------------------- | ------------- |
| 1   |                                   |               |

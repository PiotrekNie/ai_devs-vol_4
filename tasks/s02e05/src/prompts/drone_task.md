# Zadanie operacyjne — drone (DRN-BMB7)

## Kontekst (skrót)

Sterujesz fikcyjnym dronem bojowym **DRN-BMB7**. Musisz z mapy odczytać siatkę/sektor tamy, z **live** dokumentacji HTML złożyć poprawną sekwencję poleceń i zweryfikować ją na hubie.

## Deliverables (obowiązkowe — `submit_to_hub`)

Wywołaj narzędzie **`submit_to_hub`** (nie surowy `http_request` na `/verify`):

```json
{
  "task_name": "drone",
  "answer": {
    "instructions": ["selfCheck", "set(3,4)", "..."]
  }
}
```

- **`apikey`** — **nie podawaj** w argumencie narzędzia; `submit_to_hub` wstawia `HUB_API_KEY` z env.
- Przykłady JSON w live HTML pokazują **pełne body** POST (`apikey`, `task`, `answer`) — to ten sam endpoint, ale agent używa wyłącznie `submit_to_hub`.

- **`instructions`** — tablica **stringów** (pojedyncze polecenia w składni z dokumentacji), co najmniej 1 element.
- Format każdego elementu: jak w docs (np. `setDestinationObject(BLD1234PL)`, `set(3,4)`, `flyToLocation`) — **nie** zagnieżdżony JSON wewnątrz tablicy.

**Sukces:** hub zwraca `{FLG:...}`. Dopiero wtedy `finish_task`.

## Ograniczenia domenowe

### Mapa (vision — obowiązkowe przed czymkolwiek innym)

Plik mapy jest **prefetchowany** (ścieżka w runtime context). Wywołaj `analyze_image_vision` z zapytaniem zawierającym **dokładnie**:

1. Ile kolumn i wierszy ma siatka (podaj `KolumnyxWiersze`)?
2. Współrzędne `(x,y)` komórki z **jasno-niebieską wodą** (tama/zapora) — numeracja od lewego górnego rogu `(1,1)`.

**Nie** używaj `set(x,y)` bez wcześniejszego wyniku vision. **Nie** pobieraj mapy przez `http_request`.

### ID obiektu

Format ID: `[A-Z]{3}[0-9]+[A-Z]{2}` (prefix 3 litery + cyfry + kod kraju).

**`PWR6132PL`** — obiekt znany z fabuły kursu (elektrownia wodna w Żarnowcu). Hub go rozpoznaje. **Użyj go jako pierwszego kandydata.** Obiekt zawiera zarówno reaktor/turbiny jak i tamę — hub feedbackiem wskaże, który sektor jest poprawny (patrz tabela kodów błędów niżej).

Jeśli hub zwraca `-945` dla wszystkich prób z `PWR6132PL`, sprawdź inne ID iterując prefiksy (`DAM`, `BLD`, `HYD`, …) z numerem z UUID (`HUB_API_KEY` / `DRONE_MAP_URL`).

### Diagnostyka stanu drona

Przed składaniem misji po serii błędów:

1. `["hardReset"]` — osobny `submit_to_hub` (nie łącz z misją w jednej paczce).
2. `["getConfig"]` — sprawdź `destination`, `sektor_x`, `sektor_y`, `goal` w odpowiedzi.
3. Dopiero po potwierdzeniu `destination: null` składaj nową sekwencję misji.

### Kody błędów huba

| Kod | Komunikat (fragment) | Znaczenie | Akcja |
| --- | --- | --- | --- |
| `-945` | „I don't know that location." | Nieznane ID obiektu | Zmień ID (inny prefix/numer) |
| `-880` | „…pretending to destroy power plants…" | Sektor trafia w reaktor/turbiny obiektu | Zmień `set(x,y)` — spróbuj innego sektora |
| `-880` | „…won't hit the dam…somewhere nearby." | ID poprawne, sektor zbyt daleko od tamy | Zmień `set(x,y)` — iteruj wiersze/kolumny |
| `-880` | „…engine power set to 0%…" | Brak mocy silnika | Dodaj `set(engineON)` i `set(100%)` przed lotem |
| `1` / `200` + `{FLG:...}` | „Instructions processed…" + flaga | Sukces | Wywołaj `finish_task` |

**Uwaga o sektorach:** `set(x,y)` to współrzędne na **wewnętrznej mapie obiektu**, nie na mapie poglądowej. Siatka obiektu może być większa niż 4×3 widoczne na mapie. Iteruj sektory kierując się feedbackiem huba.

### Pozostałe ograniczenia

- **Dokumentacja:** wyłącznie live — `http_request` GET na `DRONE_DOCS_URL` z runtime context. Nie czytaj `docs/context/drone-api.md`.
- **Pułapka `set(...)`:** ta sama nazwa metody dla sektora `set(x,y)`, silników `set(engineON|OFF)`, mocy `set(N%)`, wysokości `set(Nm)`, celów `set(video|image|destroy|return)` — parametr decyduje; nie zgaduj.
- **Hub vs dron:** `POST /verify` w HTML to ten sam endpoint co `submit_to_hub` — nie wywołuj go przez `http_request`.
- **Iteracja:** po każdym błędzie huba popraw **tylko to, co feedback wskazuje**; nie kończ `finish_task` wcześniej.

## Anty-wzorce

- `read_file` na snapshot w `docs/context/` zamiast live HTML.
- `finish_task` przed flagą z huba — przy blokadzie użyj `ask_human`.
- `http_request` na URL mapy PNG (mapa jest już lokalnie).
- Halucynacja współrzędnych mapy bez vision.
- Mylenie wariantów `set(...)` (np. `set(50%)` zamiast sektora `set(x,y)`).
- Odrzucanie `PWR6132PL` po jednym błędzie sektora — to poprawny obiekt; iteruj sektory.
- Łączenie `hardReset` z misją w jednej paczce — reset musi być osobnym submittem.
- Długi monolog zamiast kolejnego narzędzia.

## Przepływ (przykład)

```
analyze_image_vision(mapLocalPath) — siatka + komórka tamy
→ http_request(DRONE_DOCS_URL) — live docs
→ submit_to_hub(hardReset) — czyść stan
→ submit_to_hub(getConfig) — weryfikuj destination: null
→ submit_to_hub(pełna misja z ID i set(x,y) z vision)
→ koryguj wg feedbacku aż {FLG:...}
→ finish_task
```

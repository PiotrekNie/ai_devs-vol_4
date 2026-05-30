# Zadanie — evaluation (anomalie sensorów)

## Cel

Znajdź **wszystkie** pliki z anomaliami w ~10 000 odczytów JSON w katalogu `sensors/` i wyślij ich ID w polu `recheck`.

## Typy anomalii

1. **Pomiar poza normą** (aktywne pole poza zakresem lub nieaktywne pole ≠ 0)
2. Operator twierdzi **OK**, a pomiary są złe
3. Operator twierdzi **problem/błąd**, a pomiary są OK
4. Czujnik zwraca wartość w polu, którego nie obsługuje (`sensor_type`)

## Zakresy (aktywne pola)

| Pole | Min | Max |
| --- | --- | --- |
| temperature_K | 553 | 873 |
| pressure_bar | 60 | 160 |
| water_level_meters | 5.0 | 15.0 |
| voltage_supply_v | 229.0 | 231.0 |
| humidity_percent | 40.0 | 80.0 |

## Submit

```json
{
  "task_name": "evaluation",
  "answer": {
    "recheck": ["0001", "0002"]
  }
}
```

Hub akceptuje stringi z zerami (`"0001"`), liczby, nazwy plików — używaj **4-cyfrowych stringów z zerem wiodącym**.

## Koszty

- Pomiary: **scan_sensors** (programistycznie, 0 tokenów LLM)
- Notatki: **classify_operator_notes** (batch po unikalnym tekście, cache)
- Nie analizuj plik po pliku w głównym modelu ReAct

## Po błędzie hub

Odczytaj komunikat z `submit_to_hub`, popraw listę (brakujące / nadmiarowe ID), ponów `build_recheck` jeśli trzeba i submit ponownie.

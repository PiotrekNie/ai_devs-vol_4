# IMPLEMENTATION — restrukturyzacja transkrypcji

**Status:** Zakończone (2026-06-11)  
**Research:** [RESEARCH-proponowane-tytuly-i-restrukturyzacja.md](../transcriptions/RESEARCH-proponowane-tytuly-i-restrukturyzacja.md)

## Decyzje projektowe (zatwierdzone)

- [x] Akceptacja proponowanych tytułów (14 plików)
- [x] Scalenie S04E03 + S04E04 → `odpornosc-operacyjna-workflow-i-automatyzacji.md`
- [x] Nowy folder `markdowns/wiedza/`; oryginały w `markdowns/transcriptions/_surowe/`
- [x] Brak uzupełniania brakujących odcinków (tylko 14 istniejących)

## Fazy implementacji

### Phase 1: Setup — DONE

- Utworzono `markdowns/transcriptions/_surowe/`
- Skopiowano 14 oryginalnych plików bez zmian
- Utworzono strukturę `markdowns/wiedza/` (+ `bezpieczenstwo/`, `prywatnosc/`)

### Phase 2: Transform — DONE

- Szablon quick-reference: Esencja, Słownik, Kiedy stosować, Wzorce, Checklist, Case studies, Pułapki, Powiązane tematy
- Usunięto timestampy STT, meta lekcyjne, artefakty (rosyjski tekst S05E05, „Bank Roberts" w S03E03)
- S03E01, S03E03: narracja „spowiedź" → sekcje faktograficzne
- S04E03+S04E04: jeden spójny dokument bez duplikacji motywu cichej degradacji
- Stopka `Źródło:` z linkiem do `_surowe/`

### Phase 3: Index — DONE

- `markdowns/wiedza/README.md` — indeks z grupowaniem i mapowaniem źródeł

### Phase 4: Research artifact — DONE

- Checklist w RESEARCH zaktualizowany
- Niniejszy plik IMPLEMENTATION.plan.md

## Changelog

| Data | Zmiana |
|------|--------|
| 2026-06-11 | Implementacja Phase 1–4; 13 plików wiedzy + README |

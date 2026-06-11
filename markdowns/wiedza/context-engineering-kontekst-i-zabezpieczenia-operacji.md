# Context engineering — kontekst i zabezpieczenia operacji

> **Esencja:** Agent bez kontekstu podejmuje złe decyzje mimo poprawnego wykonania zadania — operuje na metadanych plików, nie na znaczeniu dla użytkownika. Context engineering dostarcza dynamiczny kontekst; cztery mechanizmy bezpieczeństwa (dry-run, backup, confirm bulk, audit log) ograniczają skalę błędów.

## Słownik

| Termin | Definicja |
|--------|-----------|
| **Context engineering** | Świadome dostarczanie informacji, które agent potrzebuje w momencie decyzji |
| **Dynamiczny kontekst** | Kontekst zależny od sytuacji, nie tylko statyczny system prompt |
| **Dry run** | Domyślny tryb planowania przed wykonaniem |
| **Odkrywanie reguł** | Agent wnioskuje reguły organizacji ze stanu zastanego |

## Kiedy stosować / kiedy nie

**Zawsze**, gdy agent operuje na danych użytkownika (pliki, CRM, dokumenty) — bez kontekstu semantyki „IMG_4521.jpg" to tylko znaki.

**Kontekst bez zabezpieczeń** = lepsze decyzje, ale katastrofa przy pomyłce. **Zabezpieczenia bez kontekstu** = bezpieczny, ale bezużyteczny (80% w folderze „inne").

## Wzorce i mechanizmy

### Case studies błędów kontekstu

1. **Grupowanie plików** — 80% w „inne" bez wiedzy o workflow użytkownika
2. **Deduplikacja** — usunięcie RAW jako „duplikatu" JPEG (nieodwracalne)
3. **Zmiana nazw** — utrata timestampów/EXIF w oryginalnej nazwie

### Szablon kontekstu (organizator plików)

- Rola użytkownika (np. fotograf)
- Pary formatów (RAW+JPEG ≠ duplikat)
- Semantyka folderów („do obróbki" = nie przenosić)
- Reguły sesji/klientów

### Cztery mechanizmy bezpieczeństwa

1. **Dry run domyślny** — plan → zgoda → wykonanie
2. **Kopia przed operacją** — sekundy dysku vs godziny/dni odzyskiwania
3. **Potwierdzenie przy bulk** — np. 300 operacji: podsumowanie + confirm
4. **Log z cofaniem** — skąd, dokąd, kiedy; rollback serii

## Checklist

- [ ] Zdefiniowano, czego agent **nie wie**, a powinien
- [ ] System prompt jako mapa, nie encyklopedia
- [ ] Dry run jako domyślny tryb dla operacji na danych
- [ ] Backup przed move/delete/rename
- [ ] Audit log z możliwością undo

## Pułapki i antywzorce

- „Lepszy prompt" zamiast właściwego kontekstu
- Agent domyślnie wykonujący bez planu
- Brak rozróżnienia metadanych pliku od znaczenia biznesowego

## Powiązane tematy

- [Kontrola dostępu](bezpieczenstwo/kontrola-dostepu-przed-wdrozeniem.md)
- [Pamięć AI](pamiec-ai-wyszukiwanie-hybrid-rag-i-bezpieczenstwo-embeddingow.md)
- [Odporność operacyjna](odpornosc-operacyjna-workflow-i-automatyzacji.md)

---

Źródło: [AID4_S02E01 [1172274472].md](../transcriptions/_surowe/AID4_S02E01%20%5B1172274472%5D.md)

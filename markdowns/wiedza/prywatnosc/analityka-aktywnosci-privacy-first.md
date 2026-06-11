# Analityka aktywności — privacy first

> **Esencja:** Surowe dane z ekranu (screenshoty, tytuły okien z nazwiskami klientów) to inwigilacja, nie analityka. Architektura privacy first: lokalna klasyfikacja → tylko agregaty (kategoria + czas) wychodzą z procesu.

## Słownik

| Termin | Definicja |
|--------|-----------|
| **Recall (Microsoft)** | Screenshoty co kilka sekund — case nadmiaru danych |
| **Privacy First** | Ekran → lokalna klasyfikacja → agregat; surowe dane giną |
| **ActivityWatch** | OSS tracker z danymi lokalnie |

## Kiedy stosować / kiedy nie

**Agregaty wystarczą**, gdy pytanie brzmi: ile czasu na kod vs maile — nie **jakie** maile.

**Unikaj:** screenshotów, keyloggerów, śledzenia bezczynności myszy co 3 min (CNIL: kara 40k EUR, 2024).

## Wzorce i mechanizmy

### Recall — lekcja

Pierwsza wersja: SQLite niezaszyfrowane (hasła, karty). Signal: Screen Security. 2025: filtry wciąż przepuszczają wrażliwe dane.

### Regulacje (CNIL / RODO)

- Proporcjonalność: kategoria aktywności OK; treść maili — nie
- Amazon France Logistics: **32 mln EUR** (2023) — mikroprzestoje na każdej zmianie
- 2025: CNIL — 16 organizacji ukaranych za monitoring

### Implementacja

1. Tytuł okna → lokalny LLM (Ollama, Llama 3 8B / Phi-3)
2. Prompt: kategorie (programowanie, komunikacja, spotkania, …)
3. Zapis: „e-mail, 23 min" zamiast „Gmail, re: negocjacje wynagrodzenia"

## Checklist

- [ ] Brak surowych screenshotów na serwerze
- [ ] Lokalna klasyfikacja tytułów okien
- [ ] Zapis tylko agregatów
- [ ] Zero ruchu sieciowego dla wrażliwych danych
- [ ] Informacja pracowników (RODO)

## Pułapki i antywzorce

- Screenshot co 5 s → serwer = decyzja architektoniczna przeciw prywatności
- Tracker widzący nazwy klientów w tytułach okien

## Powiązane tematy

- [Speech-to-text routing](speech-to-text-routing.md)
- [Kontrola dostępu](../bezpieczenstwo/kontrola-dostepu-przed-wdrozeniem.md)

---

Źródło: [AID4_S02E05 [1173227948].md](../../transcriptions/_surowe/AID4_S02E05%20%5B1173227948%5D.md)

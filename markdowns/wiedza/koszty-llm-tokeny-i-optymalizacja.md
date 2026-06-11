# Koszty LLM — tokeny i optymalizacja

> **Esencja:** Koszty API LLM wynikają z liczby tokenów (input i output), a nie z liczby pytań. Trzy pytania przed kodem (czy potrzebuję AI, który model, ile kontekstu) oraz mechanizmy API (caching, batch, routing) mogą obniżyć rachunek nawet o rząd wielkości bez utraty jakości przy typowych zadaniach.

## Słownik

| Termin | Definicja |
|--------|-----------|
| **Token** | Fragment tekstu przetwarzany jako jedna jednostka |
| **Input / output pricing** | Osobne ceny; output zwykle 3–5× droższy niż input |
| **Chain-of-thought (CoT)** | Tokeny wewnętrznego rozumowania liczone jako output |
| **Prompt caching** | Powtarzający się kontekst ~10% ceny po pierwszym użyciu |
| **Batch API** | Do 24 h oczekiwania, ~50% zniżki |
| **Model routing** | Proste → tani model; złożone → drogi |

## Kiedy stosować / kiedy nie

**Optymalizuj koszty** przy dużej liczbie zapytań, powtarzalnym system prompcie i zadaniach bez SLA czasu rzeczywistego.

**Nie zastępuj AI kodem**, gdy potrzebujesz rozumienia intencji lub analizy wieloznacznych dokumentów — ale regex i prosta logika często wystarczą (daty, słowa kluczowe).

## Wzorce i mechanizmy

### Trzy pytania przed implementacją

1. Czy w ogóle potrzebuję AI?
2. Który model jest wystarczająco dobry? (~80% zadań: tanie modele OK)
3. Ile kontekstu naprawdę potrzebuję?

Polski język: **~50–70% więcej tokenów** niż angielski przy tym samym przekazie.

### Studium: 100 faktur/dzień

| Wariant | Koszt mies. (szac.) |
|---------|---------------------|
| Opus 4.5 bez optymalizacji | ~45 USD |
| GPT-4o mini | ~1,35 USD |
| mini + caching + batch | ~0,60 USD |

Przy 100k faktur/dzień: ~45 000 USD vs ~600 USD/mies.

## Checklist

- [ ] Trzy pytania gate przed kodem
- [ ] Uwzględniony koszt output i CoT
- [ ] Prompt caching + batch gdzie możliwe
- [ ] Model routing + pomiar jakości
- [ ] Guard na pętle agenta (runaway bills)

## Case studies (skrócone)

- Rachunek **$14k/mies.** — pętla agenta, brak liczenia tokenów; zoptymalizowany: ~$200
- Kontekst 50k tokenów „na wszelki wypadek" — po obcięciu: 10× mniej zużycia

## Pułapki i antywzorce

- Patrzenie tylko na cenę inputu
- GPT „wszędzie, bo można"
- Brak warunku stopu w pętlach

## Powiązane tematy

- [Context engineering](context-engineering-kontekst-i-zabezpieczenia-operacji.md)
- [Odporność operacyjna](odpornosc-operacyjna-workflow-i-automatyzacji.md)
- [Architektura Master Controller](architektura-master-controller-agentow-produkcyjnych.md)

---

Źródło: [AID4_S01E01 [1169549431].md](../transcriptions/_surowe/AID4_S01E01%20%5B1169549431%5D.md)

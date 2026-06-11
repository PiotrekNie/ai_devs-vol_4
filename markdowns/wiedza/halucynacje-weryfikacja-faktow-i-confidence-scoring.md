# Halucynacje — weryfikacja faktów i confidence scoring

> **Esencja:** Modele bez źródeł „strzelają", bo benchmarki premiują odpowiedź nad „nie wiem". Pipeline 3 warstw (źródło istnieje → treść potwierdza → confidence score) i rozróżnienie RAG ≠ grounding to podstawowa higiena informacyjna agentów produkcyjnych.

## Słownik

| Termin | Definicja |
|--------|-----------|
| **Halucination rate** | Zależy od benchmarku i typu zadania — jedna liczba bez kontekstu nic nie znaczy |
| **Grounding** | Model odpowiada na podstawie znalezionych źródeł |
| **RAG** | Dostarcza kontekst do promptu — nie gwarantuje wiernego użycia |
| **Confidence scoring** | Spektrum pewności zamiast binarnej prawdy |

## Kiedy stosować / kiedy nie

**Weryfikacja obowiązkowa**, gdy agent podaje fakty, cytaty, procedury prawne/finansowe lub cytuje dokumenty.

Benchmarki bez kontekstu: ten sam model 1,5% (streszczenie) vs 45% (pytania otwarte).

## Wzorce i mechanizmy

### Dowody problemu

- NeurIPS 2025: **>100** sfabrykowanych cytowań w 51 zaakceptowanych paperach
- USA: **>400** spraw prawników z halucynowanymi cytatami (Morgan & Morgan: 8/9 spraw nie istnieje)
- OpenAI: benchmarki premiują strzelanie (0 pkt za „nie wiem")

### Pipeline 3 warstw

| Warstwa | Pytanie | Koszt |
|---------|---------|-------|
| 1 | Czy źródło **istnieje**? (HTTP, DOI/Crossref) | ~zero |
| 2 | Czy źródło **mówi to**, co twierdzi model? (drugi LLM: tak/nie/częściowo) | centy per źródło |
| 3 | **Confidence** — high / medium / low | agregacja |

**Poziomy confidence:** zielony (≥3 źródła), żółty (częściowe potwierdzenie), czerwony (brak/sprzeczność).

### Narzędzia

- **Google Search Grounding (Gemini)** — metadata + cytaty; tylko Google Search
- **Perplexity Sonar** — cytowania wbudowane; ~10% mniej halucynacji niż GPT-4o na złożonych — **nie zero**
- **Multi-model verification** — zgodność modeli → wyższa pewność; rozbieżność → review

### RAG vs grounding

- **RAG:** model „wie" (ma dokument w kontekście)
- **Grounding:** model **wiernie** używa dokumentu — oba kroki potrzebne

Zasada: **traktuj każdy fakt jak anonimowy tip z internetu** — sprawdź przed powtórzeniem.

## Checklist

- [ ] Pipeline weryfikacji dla faktów w outputcie
- [ ] Confidence score widoczny dla użytkownika
- [ ] RAG + grounding (nie tylko retrieval)
- [ ] Pytania o politykę firmy → router do docs, nie wolna generacja
- [ ] Kontekst benchmarku przy porównywaniu halucination rate

## Pułapki i antywzorce

- Jedna liczba „2% halucynacji" bez typu zadania
- RAG bez weryfikacji wierności cytatu
- Pełne zaufanie do Search Grounding / Perplexity bez warstwy 2

## Powiązane tematy

- [Nadzór i ewaluacja](nadzor-obserwowalnosc-i-ewaluacja-agentow.md)
- [Pamięć AI / RAG](pamiec-ai-wyszukiwanie-hybrid-rag-i-bezpieczenstwo-embeddingow.md)
- [Decyzje projektowe](decyzje-projektowe-ai-case-studies-porazek.md)

---

Źródło: [S05E04.md](../transcriptions/_surowe/S05E04.md)


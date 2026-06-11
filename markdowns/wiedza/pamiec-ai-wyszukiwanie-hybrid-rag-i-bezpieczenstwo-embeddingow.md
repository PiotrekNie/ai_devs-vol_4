# Pamięć AI — hybrid RAG i bezpieczeństwo embeddingów

> **Esencja:** Nie ma jednej strategii wyszukiwania — trzy typy pytań (podobieństwo, relacje, globalne) wymagają wektorów, grafu lub podsumowań społeczności. PolyStore (Postgres + vector DB + graf) i hybrid search (BM25 + wektory) to świadomy podział; embeddingi nie są „bezpieczne" — inwersja (Vec2Text ~92%) wymaga kontroli dostępu i szyfrowania.

## Słownik

| Termin | Definicja |
|--------|-----------|
| **Hybrid RAG** | Wzorzec: wektory + graf wiedzy (paper Nvidia/BlackRock 08/2024 — prototyp badawczy) |
| **Hybrid search** | Wektory + BM25 — inna kombinacja niż graf |
| **PolyStore** | Postgres (źródło prawdy) + dedykowana baza wektorowa + opcjonalnie graf |
| **GraphRAG** | Community summaries dla pytań globalnych |
| **Vec2Text** | Odtworzenie ~92% tekstu z 32-tokenowych embeddingów |

## Kiedy stosować / kiedy nie

| Typ pytania | Strategia |
|-------------|-----------|
| Podobieństwo („dokumenty o RODO") | Wektory |
| Relacje („kto raportuje do X", zależności API) | Graf / metadane relacji |
| Globalne („trendy z 100 spotkań") | GraphRAG, agregaty |

**PG Vector:** OK do ~setek tys. dokumentów; post-mortem 11/2025 (Alex Jacobs): 5M wektorów → niestabilna latencja, HNSW buildy godzinami. Powyżej skali: Qdrant, Milvus, Weaviate.

## Wzorce i mechanizmy

### Case: 8 projektów z API płatności, wektor znalazł 3

Wektory trafiły w opisy ze słowem „płatności"; 5 projektów używa API pod innymi nazwami (rozliczenia, faktury).

### Ścieżki naprawy recall

1. **Minimalna:** metadane zależności w dokumentach
2. **Kompromis:** hybrid search (BM25 + wektory) — Weaviate, Qdrant, ES
3. **Pełna:** graf zależności + intent routing (podobieństwo / relacje / globalne)

### Bezpieczeństwo embeddingów

- Nie zwracaj surowych wektorów w API
- Access control na bazę wektorową
- Szyfrowanie (np. Cloaked AI) — inwersja bez dostępu do modelu (Algen 02/2025)

## Checklist

- [ ] Zmapowano typy pytań użytkowników
- [ ] Wybrano strategię per typ (nie jedno narzędzie do wszystkiego)
- [ ] Skala: PG Vector vs dedykowana baza wektorowa
- [ ] Embeddingi chronione (ACL, bez ekspozycji wektorów)
- [ ] Hybrid gdzie potrzeba literalnych dopasowań (nazwy endpointów)

## Pułapki i antywzorce

- „Hybrid RAG" jako marketing bez rozróżnienia BM25 vs graf
- Założenie, że embeddingów nie da się odwrócić
- GraphRAG overkill bez pytań o relacje

## Powiązane tematy

- [Context engineering](context-engineering-kontekst-i-zabezpieczenia-operacji.md)
- [Zagrożenia — RAG](bezpieczenstwo/zagrozenia-i-obrona.md)
- [Weryfikacja faktów](halucynacje-weryfikacja-faktow-i-confidence-scoring.md)
- [Master Controller](architektura-master-controller-agentow-produkcyjnych.md)

---

Źródło: [S04E01 — transkrypcja.md](../transcriptions/_surowe/S04E01%20%E2%80%94%20transkrypcja.md)

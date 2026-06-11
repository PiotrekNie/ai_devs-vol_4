# Wiedza — AI Devs 4 (quick reference)

Skrócone, ustrukturyzowane notatki z transkrypcji kursu. Oryginały (surowe STT) w [`../transcriptions/_surowe/`](../transcriptions/_surowe/).

## Koszty i architektura

| Plik | Opis |
|------|------|
| [koszty-llm-tokeny-i-optymalizacja.md](koszty-llm-tokeny-i-optymalizacja.md) | Tokeny, input/output, caching, batch, routing — trzy pytania przed kodem |
| [architektura-master-controller-agentow-produkcyjnych.md](architektura-master-controller-agentow-produkcyjnych.md) | Tool Registry, routing, Memory Triad, Graduated Autonomy — produkcja vs hype |

## Bezpieczeństwo

| Plik | Opis |
|------|------|
| [bezpieczenstwo/zagrozenia-i-obrona.md](bezpieczenstwo/zagrozenia-i-obrona.md) | OWASP LLM, injection, MCP, obrona w 5 warstwach |
| [bezpieczenstwo/kontrola-dostepu-przed-wdrozeniem.md](bezpieczenstwo/kontrola-dostepu-przed-wdrozeniem.md) | 4 pytania gate, least privilege, RODO/AI Act, proces wdrożenia |

## Prywatność

| Plik | Opis |
|------|------|
| [prywatnosc/speech-to-text-routing.md](prywatnosc/speech-to-text-routing.md) | STT lokalne vs chmura, biometria głosu, routing wrażliwych nagrań |
| [prywatnosc/analityka-aktywnosci-privacy-first.md](prywatnosc/analityka-aktywnosci-privacy-first.md) | Lokalna klasyfikacja okien → agregaty bez screenshotów |

## Kontekst, pamięć, niezawodność

| Plik | Opis |
|------|------|
| [context-engineering-kontekst-i-zabezpieczenia-operacji.md](context-engineering-kontekst-i-zabezpieczenia-operacji.md) | Dynamiczny kontekst + dry-run, backup, log operacji na plikach |
| [pamiec-ai-wyszukiwanie-hybrid-rag-i-bezpieczenstwo-embeddingow.md](pamiec-ai-wyszukiwanie-hybrid-rag-i-bezpieczenstwo-embeddingow.md) | 3 typy pytań, PolyStore, hybrid search, inwersja embeddingów |
| [odpornosc-operacyjna-workflow-i-automatyzacji.md](odpornosc-operacyjna-workflow-i-automatyzacji.md) | Retry, circuit breaker, DLQ, heartbeat, weryfikacja outputu (S04E03+04) |

## Nadzór, etyka, jakość outputu

| Plik | Opis |
|------|------|
| [nadzor-obserwowalnosc-i-ewaluacja-agentow.md](nadzor-obserwowalnosc-i-ewaluacja-agentow.md) | Deepfake, HITL, observability, approval flow |
| [web-scraping-etyka-i-obrona.md](web-scraping-etyka-i-obrona.md) | robots.txt, rate limit, AI Labyrinth, ai.txt/llms.txt |
| [halucynacje-weryfikacja-faktow-i-confidence-scoring.md](halucynacje-weryfikacja-faktow-i-confidence-scoring.md) | Pipeline 3 warstw, RAG vs grounding, confidence score |
| [decyzje-projektowe-ai-case-studies-porazek.md](decyzje-projektowe-ai-case-studies-porazek.md) | McDonald's, Chevrolet, Air Canada, Klarna, DPD — 3 pytania gate |

## Mapowanie źródeł

| Oryginał (`_surowe/`) | Artefakt `wiedza/` |
|------------------------|-------------------|
| AID4_S01E01 | koszty-llm-tokeny-i-optymalizacja.md |
| AID4_S01E02 | bezpieczenstwo/zagrozenia-i-obrona.md |
| AID4_S01E03 | bezpieczenstwo/kontrola-dostepu-przed-wdrozeniem.md |
| AID4_S02E01 | context-engineering-kontekst-i-zabezpieczenia-operacji.md |
| AID4_S02E03 | prywatnosc/speech-to-text-routing.md |
| AID4_S02E05 | prywatnosc/analityka-aktywnosci-privacy-first.md |
| AID4_S03E01 | nadzor-obserwowalnosc-i-ewaluacja-agentow.md |
| AID4_S03E03 | web-scraping-etyka-i-obrona.md |
| S04E01 | pamiec-ai-wyszukiwanie-hybrid-rag-i-bezpieczenstwo-embeddingow.md |
| S04E03 + S04E04 | odpornosc-operacyjna-workflow-i-automatyzacji.md |
| S05E02 | decyzje-projektowe-ai-case-studies-porazek.md |
| S05E04 | halucynacje-weryfikacja-faktow-i-confidence-scoring.md |
| S05E05 | architektura-master-controller-agentow-produkcyjnych.md |

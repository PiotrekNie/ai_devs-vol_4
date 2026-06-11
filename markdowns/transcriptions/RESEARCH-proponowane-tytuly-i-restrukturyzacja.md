# RESEARCH: Proponowane tytuły i restrukturyzacja transkrypcji AI Devs 4

**Faza:** Research (Ideate) — bramka do zatwierdzenia przed rename/edit  
**Data:** 2026-06-11  
**Zakres:** 14 plików w `markdowns/transcriptions/`  
**Język propozycji:** polski

---

## Metodologia

Na podstawie podejścia z `eversis-analyze-materials` (faza czyszczenia transkryptu) oraz `eversis-transcript-processing`: usunięcie narracji lekcyjnej, meta-odwołań („Adam pokaże…”, „w dzisiejszej lekcji”), powtórzeń i timestampów; ekstrakcja definicji, wzorców, checklist i trade-offów do struktury quick-reference.

---

## Spis plików — propozycje per plik

### 1. `AID4_S01E01 [1169549431].md`

**Esencja:** Mechanika kosztów LLM (tokeny, input vs output, polski droższy), trzy pytania przed kodem oraz mechanizmy oszczędności (caching, batch, routing) z kalkulacją na przykładzie faktur.

**Kluczowe terminy:** token, input/output pricing, chain-of-thought, prompt caching, Batch API, model routing, Gemini Flash vs Opus

**Proponowany tytuł:** `koszty-llm-tokeny-i-optymalizacja.md`

**Proponowana struktura:**

1. Słownik pojęć (token, input/output, CoT)
2. Trzy pytania przed projektem (czy potrzebuję AI / który model / ile kontekstu)
3. Mechanizmy API: caching, batch, routing, modele lokalne
4. Studium przypadku: 100 faktur/dzień — 3 warianty kosztów
5. Checklist decyzyjny

**Usunąć:** anegdota o $14k na wstępie (skrócić do 1 zdania), „dzisiaj pokażę”, „wracając do przykładu”, powtórzenia o polskim języku

**Wyodrębnić:** tabelę wariantów kosztowych; listę pytań gate przed implementacją

---

### 2. `AID4_S01E02 [1171062996].md`

**Esencja:** Agent jako wzmacniacz uprawnień; OWASP LLM Top 10 (2025); wektory ataku (prompt injection direct/indirect, prompt leakage, MCP); obrona w głąb (5 warstw); 4 pytania przed produkcją.

**Kluczowe terminy:** prompt injection, indirect injection, Force Leak/Salesforce, Excessive Agency, Tool Poisoning, RAG Pull, Defense in Depth, least privilege

**Proponowany tytuł:** `bezpieczenstwo-agentow-ai-zagrozenia-i-obrona.md`

**Struktura:**

1. Agent vs aplikacja webowa (determinizm vs autonomia)
2. OWASP LLM Top 10 — zmiany 2023→2025
3. Wektory ataku (3 + MCP bonus)
4. Obrona w 5 warstwach
5. 4 pytania gate przed wdrożeniem
6. Case studies (Chevrolet, Lakera, Palo Alto MCP)

**Usunąć:** „Adam pokaże function calling”, odniesienia do game.aidevs.pl jako meta-lekcji, powtórzenia o Force Leak

**Wyodrębnić:** macierz atak → warstwa obrony; checklist least privilege

---

### 3. `AID4_S01E03 [1171080320].md`

**Esencja:** Framework „Zanim dasz AI dostęp” — 4 pytania (threat model, rollback, audit, prawo); least privilege w praktyce (read-only, HITL, backup); zarządzanie sekretami; AI Act/RODO/Digital Omnibus; 4-krokowy proces wdrożenia.

**Proponowany tytuł:** `kontrola-dostepu-agentow-przed-wdrozeniem.md`

**Struktura:**

1. 4 pytania przed podłączeniem narzędzi
2. Least privilege — 3 poziomy (read-only, dry-run/HITL, auto-backup)
3. Sekrety i tokeny (scope, rotacja, vault)
4. Compliance: AI Act, RODO, Digital Omnibus (timeline)
5. Proces 4 kroków: mapuj → skonfiguruj → siatka → compliance

**Usunąć:** „poprzednio mówiłem”, „Adam pokaże”, Varonis jako długi wstęp (1 akapit)

**Wyodrębnić:** checklist „Zanim dasz AI dostęp”; tabela regulacji z datami

---

### 4. `AID4_S02E01 [1172274472].md`

**Esencja:** Context engineering — agent bez kontekstu podejmuje złe decyzje mimo poprawnego wykonania zadania; dynamiczny kontekst + 4 mechanizmy bezpieczeństwa operacji na danych (dry-run, backup, potwierdzenie, log+cofanie).

**Proponowany tytuł:** `context-engineering-kontekst-i-zabezpieczenia-operacji.md`

**Struktura:**

1. Problem: semantyka plików vs metadane (3 case studies)
2. Context engineering — co podać agentowi
3. Odkrywanie reguł ze stanu zastanego
4. 4 mechanizmy bezpieczeństwa (dry-run domyślny, backup, confirm bulk, audit log)
5. Para kontekst + zabezpieczenia

**Usunąć:** meta „w lekcji Adam pokaże”, powtórzenia pulpitu/fotografa

**Wyodrębnić:** szablon kontekstu dla agenta plikowego; checklist 4 zabezpieczeń

---

### 5. `AID4_S02E03 [1172919468].md`

**Esencja:** Nagranie głosowe = dane biometryczne; chmura vs lokalnie; Whisper Large V3 Turbo; routing prywatności; ryzyko klonowania głosu.

**Proponowany tytuł:** `speech-to-text-prywatnosc-i-routing.md`

**Struktura:**

1. Co niesie audio poza tekstem (4 kategorie)
2. Chmura vs lokalne STT
3. Modele 2025 (Canary-Qwen, Whisper V3/Turbo, VOSK)
4. Klonowanie głosu — implikacje
5. Routing prywatności — reguła decyzyjna
6. 4 zasady do zapamiętania

**Usunąć:** wstęp lekarski (zostawić jako 1-liniowy case); „dzisiaj porozmawiamy”

**Uwaga:** plik ma już nagłówek `# Transkrypcja — AID4 S02E03` i sekcje `---` — dobry punkt wyjścia

---

### 6. `AID4_S02E05 [1173227948].md`

**Esencja:** Monitoring ekranu vs prywatność (Recall, CNIL); architektura Privacy First (lokalna klasyfikacja → agregaty); Ollama do klasyfikacji tytułów okien; ActivityWatch.

**Proponowany tytuł:** `analityka-aktywnosci-privacy-first.md`

**Struktura:**

1. Co zbiera tracker ekranu (ryzyka)
2. Granice RODO/CNIL (case Amazon, CNIL)
3. Architektura: surowe dane → lokalna klasyfikacja → agregaty
4. Implementacja: Ollama + prompt kategorii
5. ActivityWatch jako referencja OSS
6. 3 zasady

**Usunąć:** „zamyka drugi tydzień”, „do zobaczenia w trzecim tygodniu”

---

### 7. `AID4_S03E01.md`

**Esencja:** Narracja „bot-spowiedź” o nadzorze agentów komunikacyjnych: deepfake, voice cloning, potrzeba observability/evals, transparentność, approval flow, logowanie.

**Proponowany tytuł:** `nadzor-obserwowalnosc-i-ewaluacja-agentow.md`

**Struktura:**

1. Ryzyka autonomicznej komunikacji (phishing playbook: autorytet, pilność, znajomość, izolacja)
2. Deepfake audio/wideo — statystyki i obrona (hasło rodzinne, callback, dual approval)
3. Różnica: narzędzie z HITL vs samopas
4. 4 zasady uczciwego użycia (transparentność, brak podszywania, approval, nadzór)
5. Wymagania observability (logi, evals, anomalie)

**Usunąć:** **wszystkie timestampy** `*00:00*` (543 linii szumu); narrację pierwszoosobową bota — zastąpić sekcjami faktograficznymi; dramatyzację „214 wiadomości”

**Uwaga:** największy ROI czyszczenia w całym zbiorze

---

### 8. `AID4_S03E03.md`

**Esencja:** Etyczny scraping vs „scraping po chamsku”; robots.txt, rate limiting, user agent; obrona stron (AI Labyrinth, Anubis); standardy ai.txt/llms.txt; kontekstowy feedback scrapera.

**Proponowany tytuł:** `web-scraping-etyka-i-obrona.md`

**Struktura:**

1. Granica prawna: scraping vs ignorowanie woli właściciela
2. Case law (Reddit/Perplexity, Anthropic, Ziff Davis)
3. Obrona stron (AI Labyrinth, Anubis, statystyki 13% botów)
4. 4 zasady etycznego scrapera
5. Standardy: ai.txt, llms.txt, pay-per-crawl
6. Kontekstowy feedback — sygnały honeypot/degradacji

**Usunąć:** timestampy (513 linii); narrację „nawróconego skrapera”; artefakty STT („Bank Roberts”, „Didosem”)

---

### 9. `S04E01 — transkrypcja.md`

**Esencja:** Trzy typy pytań w pamięci AI (podobieństwo, relacje, globalne); PolyStore; PG Vector limits; inwersja embeddingów (Vec2Text); opcje naprawy recall (metadane, hybrid BM25, graf).

**Proponowany tytuł:** `pamiec-ai-wyszukiwanie-hybrid-rag-i-bezpieczenstwo-embeddingow.md`

**Struktura:**

1. 3 typy zapytań → strategia wyszukiwania
2. Hybrid RAG (definicja vs marketing)
3. PolyStore: Postgres + vector DB + graf
4. PG Vector — kiedy wystarczy, kiedy nie (post-mortem skala)
5. Ryzyko inwersji embeddingów + mitigacje
6. Ścieżki naprawy recall (minimalna / kompromis / pełna)

**Usunąć:** żart o orle 1 (opcjonalnie footnote); powtórzenia „nie ma jednej strategii”

---

### 10. `S04E03.md`

**Esencja:** Cicha degradacja workflow AI; 4 wzorce odporności: retry+backoff+jitter, circuit breaker, DLQ, monitoring jakości outputu; priorytety wdrożenia.

**Proponowany tytuł:** `workflow-ai-odpornosc-retry-circuit-breaker-dlq.md`

**Struktura:**

1. Cicha degradacja vs binarna awaria
2. Retry: exponential backoff, jitter, typy błędów (400 vs 429 vs timeout)
3. Circuit breaker: 3 stany, progi, failure w AI (HTTP 200 + halucynacja)
4. Dead Letter Queue — schema tabeli
5. Monitoring outputu: schema, długość, canary checks
6. Roadmapa wdrożenia (ROI kolejność)

**Usunąć:** timestampy; dygresje o Thundering Herd bez kontekstu

---

### 11. `S04E04.md`

**Esencja:** Ironies of Automation; weryfikacja automatyzacji (nie exit code); heartbeat; timezone; weryfikacja backupu (GitLab); lockfile; 4 pytania weryfikacji outputu.

**Proponowany tytuł:** `automatyzacja-weryfikacja-heartbeat-i-lockfile.md`

**Struktura:**

1. Pułapka zaufania do automatyzacji (Bainbridge 1983)
2. Cicha odmowa vs cichy błąd
3. Heartbeat monitoring (healthchecks.io)
4. Jawna strefa czasowa w schedulerze
5. Weryfikacja backupu — restore test, nie exit code
6. Weryfikacja outputu — 4 pytania
7. Lockfile + TTL przy overlapping runs
8. Checklist „wersja finalna” (~30 linii kodu)

**Usunąć:** timestampy; meta „czwarty tydzień kursu”; fikcyjna historia raportu (skrócić do diagramu flow)

**Merge opportunity:** silne powiązanie z S04E03 → patrz sekcja cross-cutting

---

### 12. `S05E02.md`

**Esencja:** 5 case studies porażek AI (McDonald's, Chevrolet, Air Canada, Klarna, DPD); Gartner 30% porzuceń; 3 pytania projektowe (błąd → HITL, generować vs wybierać, czy potrzebujemy).

**Proponowany tytuł:** `decyzje-projektowe-ai-case-studies-porazek.md`

**Struktura:**

1. Statystyki Gartner (30%, 43% dane)
2. Case studies — tabela: projekt | błąd | lekcja
3. McDonald's — scope/automation boundary
4. Chevrolet/DPD — prompt injection, brak filtrów
5. Air Canada — halucynacja procedury, odpowiedzialność prawna
6. Klarna — efektywność vs jakość, model hybrydowy
7. 3 pytania gate przed startem projektu

**Usunąć:** timestampy; „w lekcji znajdziesz pełen framework”

---

### 13. `S05E04.md`

**Esencja:** Halucynacje — benchmarki bez kontekstu; 3-warstwowy pipeline weryfikacji (źródło istnieje → treść potwierdza → confidence score); RAG ≠ grounding; multi-model verification.

**Proponowany tytuł:** `halucynacje-weryfikacja-faktow-i-confidence-scoring.md`

**Struktura:**

1. Dlaczego modele „strzelają” (benchmarki premiują odpowiedź)
2. Halucination rate — kontekst zadania
3. Case studies (NeurIPS, prawnicy US)
4. Pipeline 3 warstw (z kosztami)
5. Narzędzia: Google Search Grounding, Perplexity Sonar — limity
6. Multi-model verification
7. RAG vs grounding — dwa osobne kroki
8. Zasada: „anonimowy tip z internetu”

**Usunąć:** timestampy; „na grafice widzisz” (zastąpić opisem warstw)

---

### 14. `S05E05.md`

**Esencja:** Realia agentów 2026 (11% w produkcji, 40% anulowanych); 3 problemy produkcyjne (pamięć, integracje, polling); architektura Master Controller (Tool Registry, Routing, Memory Triad, Graduated Autonomy).

**Proponowany tytuł:** `architektura-master-controller-agentow-produkcyjnych.md`

**Struktura:**

1. Dane rynkowe (Gartner, Deloitte, Apex Agents benchmark)
2. Agent washing — definicja
3. 3 failure modes produkcyjne (RAG, connectors, polling tax)
4. Master Controller — 4 komponenty
5. Graduated Autonomy: read-only → supervised → trusted → bounded auto
6. Frameworki (LangGraph, CrewAI, Claude Agent SDK) vs architektura
7. Metafora Orzeł 1 — opcjonalny box (skrócony)

**Usunąć:** meta „piąty tydzień”, „do roboty”, rosyjski tekst na końcu (`Продолжение следует...` — artefakt STT do usunięcia)

---

## Tematy przekrojowe i możliwości scalenia

| Grupa tematyczna            | Pliki          | Propozycja                                                            |
| --------------------------- | -------------- | --------------------------------------------------------------------- |
| **Bezpieczeństwo agentów**  | S01E02, S01E03 | Folder `bezpieczenstwo/` + ewentualnie jeden plik indeksowy z linkami |
| **Prywatność danych**       | S02E03, S02E05 | `prywatnosc/` — wspólny wstęp „routing danych wrażliwych”             |
| **Niezawodność operacyjna** | S04E03, S04E04 | **Scal:** `odpornosc-operacyjna-workflow-i-automatyzacji.md`          |
| **Pamięć i kontekst**       | S02E01, S04E01 | Osobno, ale cross-link: kontekst sesji vs infrastruktura pamięci      |
| **Wiarygodność outputu**    | S03E01, S05E04 | Cross-link: observability ↔ weryfikacja faktów                        |
| **Decyzje produkcyjne**     | S05E02, S05E05 | S05E02 = „czego nie robić”; S05E05 = „jak budować”                    |
| **Format narracyjny**       | S03E01, S03E03 | Wspólny szablon: case → zasady → checklist                            |

### Proponowana konwencja nazewnictwa katalogu

```
markdowns/wiedza/
├── koszty-llm-tokeny-i-optymalizacja.md
├── bezpieczenstwo/
│   ├── zagrozenia-i-obrona.md
│   └── kontrola-dostepu-przed-wdrozeniem.md
├── prywatnosc/
│   ├── speech-to-text-routing.md
│   └── analityka-aktywnosci-privacy-first.md
├── context-engineering.md
├── nadzor-i-ewaluacja-agentow.md
├── web-scraping-etyka.md
├── pamiec-ai-hybrid-rag.md
├── odpornosc-operacyjna.md
├── decyzje-projektowe-case-studies.md
├── weryfikacja-faktow-confidence.md
└── architektura-master-controller.md
```

---

## Wspólny szablon quick-reference

```markdown
# [Tytuł wiedzy]

> Esencja: 1–2 zdania

## Słownik

| Termin | Definicja |

## Kiedy stosować / kiedy nie

## Wzorce i mechanizmy

## Checklist

## Case studies (skrócone)

## Pułapki i antywzorce

## Powiązane tematy
```

---

## Priorytety implementacji (po zatwierdzeniu)

| Priorytet | Akcja                                                                               | Uzasadnienie                         |
| --------- | ----------------------------------------------------------------------------------- | ------------------------------------ |
| P0        | Normalizacja S03E01, S03E03, S04E03, S04E04, S05E02, S05E04 — usunięcie timestampów | ~60% linii to szum STT               |
| P0        | Ujednolicenie konwencji nazw (usunąć `AID4_`, ID w nawiasach)                       | Spójność z S04E01/S05E\*             |
| P1        | Scalenie S04E03 + S04E04                                                            | Duplikacja motywu „cicha degradacja” |
| P1        | Folder `bezpieczenstwo/` dla S01E02 + S01E03                                        | Logiczna ciągłość treści             |
| P2        | Przeniesienie z `transcriptions/` do `wiedza/` po czyszczeniu                       | Oddzielenie surowca od artefaktu     |

---

## Bramka Research — do zatwierdzenia

- [x] Akceptacja proponowanych tytułów (14 plików)
- [x] Decyzja o scaleniu S04E03+S04E04 → `odpornosc-operacyjna-workflow-i-automatyzacji.md`
- [x] Decyzja o folderze `wiedza/` (oryginały w `transcriptions/_surowe/`)
- [x] Brak uzupełniania brakujących odcinków w tej iteracji (tylko 14 istniejących plików)

## Implementacja (2026-06-11)

- Artefakty: `markdowns/wiedza/` — 13 plików treści + README + [IMPLEMENTATION.plan.md](../wiedza/IMPLEMENTATION.plan.md)
- Surowe kopie: `markdowns/transcriptions/_surowe/` (14 plików)

---

_Wygenerowano w fazie Research. Oryginały przeniesione do `_surowe/`; treść wiedzy w `markdowns/wiedza/`._

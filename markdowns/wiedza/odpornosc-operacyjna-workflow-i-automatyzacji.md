# Odporność operacyjna — workflow i automatyzacji

> **Esencja:** Workflow AI i automatyzacje cierpią na **cichą degradację** — HTTP 200 i „ładny" output przy złych danych lub skróconym kontekście. Cztery wzorce odporności (retry+backoff+jitter, circuit breaker, DLQ, monitoring jakości) plus weryfikacja automatyzacji (heartbeat, timezone, output, lockfile) chronią przed utratą danych i fałszywym spokojem.

## Słownik

| Termin | Definicja |
|--------|-----------|
| **Cicha degradacja** | System działa technicznie, wynik merytorycznie gorszy — nikt nie zauważa |
| **Thundering herd** | Synchroniczne retry przy masowym timeoucie → DDoS własnego providera |
| **Exponential backoff + jitter** | Rosnące opóźnienia + losowe odchylenie (decorrelated jitter — AWS) |
| **Circuit breaker** | Zamknięty / otwarty / półotwarty — szybka informacja „usługa niedostępna" |
| **DLQ (Dead Letter Queue)** | Nieudane zadania czekają na reprocessing, nie znikają |
| **Heartbeat** | Ping po każdym uruchomieniu (np. healthchecks.io) |
| **Ironies of Automation (Bainbridge 1983)** | Im lepsza automatyzacja, tym trudniej zauważyć błąd |

## Kiedy stosować / kiedy nie

**Workflow AI** — zawsze retry z rozróżnieniem błędów (400 ≠ 429 ≠ timeout). **Automatyzacja cron** — zawsze heartbeat + weryfikacja outputu (nie tylko exit code).

Priorytet wdrożenia: (1) retry + monitoring outputu, (2) circuit breaker przy wielu zależnościach, (3) DLQ dla danych krytycznych.

## Wzorce i mechanizmy

### Workflow AI vs skrypt

| Skrypt | Workflow AI |
|--------|-------------|
| Porażka binarna | Spektrum — „prawie sukces" najtrudniejszy |
| Error + stack trace | HTTP 200 + halucynacja lub skrócony output |

### Retry — reguły

- Timeout 30s → retry; **400 Bad Request** → nie retry
- **429** → backoff dłuższy
- Każde retry LLM = koszt tokenów

### Circuit breaker w AI

Failure = timeout, 5xx, ale też **200 + halucynacja** — granica klasycznych wzorców; wymaga walidacji outputu.

### DLQ — minimalna schema

`timestamp`, `payload`, `error_type`, `retry_count`, `status`

### Monitoring jakości outputu

1. Zgodność ze schematem (JSON, wymagane pola)
2. Długość / proporcje (300 tokenów → 50 = flaga)
3. Canary checks — znane dane testowe na produkcji
4. Alert w **minutach**, nie godzinach

### Automatyzacja — weryfikacja (S04E04)

**Dwie potrzeby jednocześnie:**
- Odmowa przy złych danych (timestamp check)
- **Alarm** przy ciszej odmowie (heartbeat)

**Cztery pytania o output:**
1. Czy wynik istnieje? (GitLab 2017: backup do nieistniejącego katalogu)
2. Czy sensowny rozmiar? (0 B ≠ backup)
3. Czy format poprawny? (parse JSON/CSV)
4. Czy zawartość kompletna? (7 dni danych w raporcie tygodniowym)

**Timezone:** jawna strefa w schedule (`Europe/Warsaw`), nie domyślna serwera (US East vs PL).

**Lockfile + TTL:** overlapping cron — druga instancja nie startuje; TTL po crashu.

### Wersja „finalna" raportu (~30 linii)

Timezone → walidacja input → walidacja output → heartbeat z wynikiem → lockfile → alert na Slack przy fail.

## Checklist

- [ ] Retry: exponential backoff + jitter
- [ ] Rozróżnienie typów błędów przed retry
- [ ] Circuit breaker na zewnętrznych API
- [ ] DLQ dla danych biznesowo krytycznych
- [ ] Monitoring schematu, długości, canary
- [ ] Heartbeat (brak pinga = alert)
- [ ] Jawny timezone w schedulerze
- [ ] Weryfikacja outputu, nie exit code
- [ ] Lockfile przy długich / overlapping taskach
- [ ] Test restore backupu (nie tylko „Backup Complete!")

## Case studies (skrócone)

- **Slack summary workflow** — zmiana limitów tokenów → krótsze podsumowania 14 dni; nikt nie zauważył
- **Poranny raport** — dane z zeszłego miesiąca, model napisał „dane aktualne na dziś"
- **GitLab 01/2017** — 6 h danych utraconych; skrypt OK, katalog docelowy nie istniał

## Pułapki i antywzorce

- Naiwne retry bez jitter → thundering herd
- Poleganie na exit code / „zadanie wykonane"
- Cicha odmowa bez heartbeat
- Cron bez timezone i bez lockfile

## Powiązane tematy

- [Koszty LLM](koszty-llm-tokeny-i-optymalizacja.md) — retry kosztuje tokeny
- [Weryfikacja faktów](halucynacje-weryfikacja-faktow-i-confidence-scoring.md)
- [Master Controller](architektura-master-controller-agentow-produkcyjnych.md)

---

Źródło: [S04E03.md](../transcriptions/_surowe/S04E03.md) + [S04E04.md](../transcriptions/_surowe/S04E04.md)


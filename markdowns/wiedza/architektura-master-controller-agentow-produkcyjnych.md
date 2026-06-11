# Architektura Master Controller — agenci produkcyjni

> **Esencja:** W 2026 tylko ~11% organizacji ma agentów w produkcji (Deloitte); Gartner: >40% projektów anulowanych do 2027. Problemy to nie jakość LLM, lecz pamięć, integracje i polling. Master Controller: Tool Registry, Routing Intelligence, Memory Triad, Graduated Autonomy — framework to materiał, nie architektura.

## Słownik

| Termin | Definicja |
|--------|-----------|
| **Agent washing** | Rebrand chatbotów/if-else na „AI Agent Platform" |
| **Polling tax** | Agent pyta co 30 s zamiast reagować na eventy |
| **Tool Registry** | Katalog narzędzi: możliwości, koszt, limity, fallbacki |
| **Memory Triad** | Short-term (sesja), long-term (dane/procesy), epizodik (historia z wynikami) |
| **Graduated Autonomy** | Read-only → supervised → trusted → bounded auto |

## Kiedy stosować / kiedy nie

**Master Controller** — gdy system ma wiele narzędzi, integracji i ma działać >1 tydzień w produkcji.

**Nie** „pełna autonomia" od dnia jeden — Never go full auto.

## Wzorce i mechanizmy

### Dane rynkowe

- Apex Agents: top modele **<25%** tasków za 1. próbą; **~40%** po 8 próbach
- ~130 prawdziwych platform agentowych vs tysiące „agent washing"
- Karpathy: dekada agentów, nie rok — brak percepcji, pamięci, operacji w świecie rzeczywistym

### Trzy failure modes produkcyjne

1. **Głupi RAG** — brak zarządzania pamięcią między wywołaniami (agent „zapomina" potwierdzonego adresu)
2. **Brutal connectors** — demo 3 ścieżki, produkcja 300; brak retry, partial failure, graceful degradation (Amazon: większość awarii = integracja)
3. **Polling tax** — marnowanie CPU/tokenów; opóźniona reakcja na eventy

### Cztery komponenty Master Controller

1. **Tool Registry** — nie 25 luźnych narzędzi; katalog z metadanymi
2. **Routing Intelligence** — intencja + złożoność → jedno narzędzie / łańcuch / człowiek (MIT TR: 3× wyższy przejście pilot→prod)
3. **Memory Triad** — większość systemów ma tylko short-term
4. **Graduated Autonomy** — read-only → supervised (propozycja+zatwierdzenie) → trusted (raport) → bounded auto w ścisłych granicach

### Frameworki (materiał budowlany)

- LangGraph (graf stanów) — LinkedIn, Uber
- CrewAI (role) — prototypy
- Claude Agent SDK — subagenci, paralelizacja

## Checklist

- [ ] Tool Registry z limitami i fallbackami
- [ ] Routing intencji (nie sama kaskada if-else)
- [ ] Trzy warstwy pamięci zdefiniowane
- [ ] Autonomia stopniowana — start read-only / supervised
- [ ] Event-driven zamiast polling gdzie możliwe
- [ ] Retry, circuit breaker, DLQ na integracjach
- [ ] Unikanie agent washing w ocenie vendorów

## Pułapki i antywzorce

- Demo na konferencję bez architektury operacyjnej
- Jeden chatbot + 2× if-else = „platforma agentowa"
- Pełna autonomia komunikacji z klientem
- Framework bez projektu architektonicznego

## Powiązane tematy

- [Odporność operacyjna](odpornosc-operacyjna-workflow-i-automatyzacji.md)
- [Pamięć AI](pamiec-ai-wyszukiwanie-hybrid-rag-i-bezpieczenstwo-embeddingow.md)
- [Decyzje projektowe](decyzje-projektowe-ai-case-studies-porazek.md)
- [Kontrola dostępu](bezpieczenstwo/kontrola-dostepu-przed-wdrozeniem.md)
- [Koszty LLM](koszty-llm-tokeny-i-optymalizacja.md)

---

Źródło: [S05E05.md](../transcriptions/_surowe/S05E05.md)


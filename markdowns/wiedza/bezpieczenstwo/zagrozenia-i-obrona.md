# Bezpieczeństwo agentów AI — zagrożenia i obrona

> **Esencja:** Agent to wzmacniacz uprawnień — posłuszny danym i ukrytym instrukcjom w mailach, formularzach, dokumentach. Obrona w głąb (5 warstw) i cztery pytania przed produkcją to decyzje architektoniczne od dnia zero.

## Słownik

| Termin | Definicja |
|--------|-----------|
| **Prompt injection** | Direct (do modelu) lub indirect (w danych) |
| **System prompt leakage** | Ekstrakcja instrukcji systemowych |
| **Excessive Agency** | Zbyt szerokie uprawnienia agenta |
| **Tool Poisoning / RAG Pull** | Ataki specyficzne dla MCP |
| **Defense in Depth** | Wiele warstw obrony |
| **Least privilege** | Minimum niezbędnych uprawnień |

## Kiedy stosować / kiedy nie

Security od projektu, gdy agent ma narzędzia, RAG lub MCP. OWASP LLM 2025: #1 Injection, #7 Prompt Leakage, #8 Vector weaknesses, #6 Excessive Agency.

## Wzorce i mechanizmy

### Agent vs aplikacja webowa

Aplikacja: determinizm, zakres w kodzie. Agent: interpretacja NL, zakres w **uprawnieniach** (tendencja do puchnięcia).

### Case studies ataków

- **Force Leak / Salesforce (CVE 9.4)** — indirect injection w formularzu, dostęp do CRM
- **Chevrolet (2023)** — direct injection, wiążąca oferta za $1
- **MCP (2025)** — Tool Poisoning, RAG Pull, Token Hijacking

### Obrona w 5 warstwach

1. Walidacja wejścia
2. Least privilege
3. Filtrowanie wyjścia
4. Izolacja (sandbox, proxy MCP)
5. Monitoring i audyt

## Checklist

- [ ] Minimalne uprawnienia zdefiniowane
- [ ] Scenariusz indirect injection przemyślany
- [ ] Sekrety poza promptem
- [ ] Logowanie każdego wywołania narzędzia
- [ ] Cztery pytania gate przed produkcją

## Pułapki i antywzorce

- Pełen dostęp „żeby działał"
- Security na końcu zamiast w designie narzędzia
- Jeden token z pełnym dostępem MCP

## Powiązane tematy

- [Kontrola dostępu](kontrola-dostepu-przed-wdrozeniem.md)
- [Pamięć AI — embeddingi](../pamiec-ai-wyszukiwanie-hybrid-rag-i-bezpieczenstwo-embeddingow.md)

---

Źródło: [AID4_S01E02 [1171062996].md](../../transcriptions/_surowe/AID4_S01E02%20%5B1171062996%5D.md)

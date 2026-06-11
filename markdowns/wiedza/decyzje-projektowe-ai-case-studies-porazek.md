# Decyzje projektowe AI — case studies porażek

> **Esencja:** Gartner (07/2024): ≥30% projektów GenAI porzuconych do końca 2025; 43% — niska jakość danych. Pięć historii (McDonald's, Chevrolet, Air Canada, Klarna, DPD) pokazuje błędy zakresu, injection, halucynacji procedur, over-automation i braku filtrów — oraz trzy pytania gate przed startem.

## Słownik

| Termin | Definicja |
|--------|-----------|
| **Scope / automation boundary** | Granica tego, co AI może zrobić samodzielnie |
| **Prompt injection** | Zmiana zachowania przez input użytkownika |
| **HITL** | Człowiek przy błędzie o wysokim koszcie |
| **Routing vs generowanie** | Wybór z opcji vs wolna generacja (różne ryzyko) |

## Kiedy stosować / kiedy nie

**Trzy pytania przed każdym projektem** — nie „czy da się zrobić demo", ale „co gdy się pomyli".

## Wzorce i mechanizmy

### Statystyki

- Gartner: **30%** porzuceń PoC; **43%** — jakość danych
- Przyczyny: niejasna wartość, rosnące koszty, słabe zarządzanie ryzykiem

### Tabela case studies

| Projekt | Błąd | Lekcja |
|---------|------|--------|
| **McDonald's / IBM Drive-Thru** | 85% dokładności = co 6. zamówienie błędne; pełna automatyzacja głosu | Nie automatyzuj rozmowy na żywo — wspieraj pracownika (sugestia na ekranie) |
| **Chevrolet Watsonville** | Brak filtrów; injection → „wiążąca oferta" za $1 | Kontrola programistyczna akcji; walidacja treści odpowiedzi |
| **Air Canada** | Halucynacja zniżki żałobnej; sąd: firma odpowiada za chatbota | Router do dokumentacji, nie generator polityki; grounding w źródłach |
| **Klarna** | 2/3 rozmów AI → spadek jakości; powrót do hybrydy | AI proste zapytania; ludzie złożone; agent **nie wysyła** maili sam |
| **DPD** | Jailbreak → wulgaryzmy w imieniu firmy | Filtr outputu; prompt systemowy jak publiczny |

### Trzy pytania gate

1. **Co gdy system się pomyli?** — jeśli koszt wysoki → HITL **dziś**
2. **Generować czy wybierać?** — klasyfikacja/routing < generowanie otwartego tekstu
3. **Czy naprawdę tego potrzebujesz?** — bez danych nie ma projektu (43%)

## Checklist

- [ ] Zdefiniowany blast radius błędu
- [ ] HITL dla komunikacji zewnętrznej i transakcji
- [ ] Preferuj routing/klasyfikację nad generowaniem tam, gdzie możliwe
- [ ] Jakość i inventory danych przed RAG
- [ ] Filtry i limity na publicznych chatbotach

## Pułapki i antywzorce

- Pełna automatyzacja relacji z klientem (nawet „prostego" zamawiania)
- Chatbot bez walidacji obietnic handlowych
- Metryki efektywności bez jakości (Klarna)
- Publiczny bot bez testów jailbreak

## Powiązane tematy

- [Zagrożenia i obrona](bezpieczenstwo/zagrozenia-i-obrona.md)
- [Nadzór agentów](nadzor-obserwowalnosc-i-ewaluacja-agentow.md)
- [Architektura Master Controller](architektura-master-controller-agentow-produkcyjnych.md)
- [Weryfikacja faktów](halucynacje-weryfikacja-faktow-i-confidence-scoring.md)

---

Źródło: [S05E02.md](../transcriptions/_surowe/S05E02.md)


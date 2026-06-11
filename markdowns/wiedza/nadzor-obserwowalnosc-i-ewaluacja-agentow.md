# Nadzór, obserwowalność i ewaluacja agentów

> **Esencja:** Autonomiczna komunikacja AI (tekst, głos, wideo) skaluje zarówno pomoc, jak i szkody — deepfake, voice cloning, phishing playbook. Różnica między narzędziem z HITL a „samopasem" to nadzór: logi, evals, approval flow, transparentność.

## Słownik

| Termin | Definicja |
|--------|-----------|
| **Deepfake / voice cloning** | Fałszywe audio/wideo z sekund nagrania |
| **Phishing playbook** | Autorytet, pilność, znajomość, izolacja |
| **HITL** | Człowiek zatwierdza przed wysyłką |
| **Observability** | Logi, evals, wykrywanie anomalii |

## Kiedy stosować / kiedy nie

**Obowiązkowy nadzór**, gdy agent komunikuje się zewnętrznie (mail, chat, telefon) lub działa autonomicznie bez review.

Model „ja piszę, ty wysyłasz" działa; „puść samopas" bez logów — nie.

## Wzorce i mechanizmy

### Ryzyka komunikacji autonomicznej

- Boty lepsze od ludzi w dopasowaniu tonu — skala tysięcy równoległych rozmów
- **Voice cloning:** Kanada 01/2025 — $12M, jeden telefon (głos CFO)
- **Deepfake wideo:** Arup 2024 — $25M, wideokonferencja na żywo
- Koszt deepfake: **<$2**; ~8 mln deepfake'ów (vs 500k w 2023); vishing +1600% Q1 2025
- Detekcja: ~0,1% ludzi konsekwentnie rozpoznaje; automatyczna omijana >90%

### Obrona osobista i firmowa

- Hasło rodzinne (weryfikacja głosu)
- Callback na **znany** numer (nie z rozmowy)
- Dual approval przelewów powyżej progu
- **Wideokall ≠ weryfikacja tożsamości**

### Cztery zasady uczciwego użycia

1. **Transparentność** — opcjonalny podpis „wysłano z pomocą AI"
2. **Brak podszywania** — styl OK, fałszywa tożsamość = oszustwo
3. **Approval flow** — każda wiadomość przez człowieka przed wysyłką
4. **Nadzór** — loguj, ewaluuj, wykrywaj anomalie

### Wymagania observability

- Log każdej akcji i decyzji modelu
- Evals spójności z oczekiwaniami
- Alerty przy odchyleniach (np. masowa wysyłka)

## Checklist

- [ ] HITL dla komunikacji zewnętrznej
- [ ] Logowanie wszystkich działań agenta
- [ ] Evals / jakościowe przeglądy outputu
- [ ] Procedury weryfikacji głosu/wideo (hasło, callback)
- [ ] Transparentność wobec odbiorcy AI

## Pułapki i antywzorce

- „Zaufaj modelowi" bez monitoringu
- Pełna autonomia bez approval i audit trail
- Poleganie na wideokonferencji jako dowodzie tożsamości

## Powiązane tematy

- [Weryfikacja faktów](halucynacje-weryfikacja-faktow-i-confidence-scoring.md)
- [Zagrożenia i obrona](bezpieczenstwo/zagrozenia-i-obrona.md)
- [Decyzje projektowe](decyzje-projektowe-ai-case-studies-porazek.md)

---

Źródło: [AID4_S03E01.md](../transcriptions/_surowe/AID4_S03E01.md)

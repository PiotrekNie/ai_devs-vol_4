# Kontrola dostępu agentów przed wdrożeniem

> **Esencja:** Zanim podłączysz narzędzia — cztery pytania (co może pójść źle, jak cofnę, kto zobaczy, co na to prawo) i least privilege w praktyce. Fundamentem jest to, **do czego** agent ma dostęp.

## Słownik

| Termin | Definicja |
|--------|-----------|
| **Blast radius** | Maksymalna szkoda przy awarii |
| **HITL** | Człowiek zatwierdza krytyczne akcje |
| **Audit trail** | Pełna ścieżka działań agenta |

## Wzorce i mechanizmy

### Cztery pytania „Zanim dasz AI dostęp"

1. Co może pójść źle? (threat model)
2. Jak to cofnę? (DR od dnia zero)
3. Kto to zobaczy? (audit)
4. Co na to prawo? (RODO, AI Act)

### Least privilege — poziomy

- Read-only → zapis chirurgiczny (staging, draft)
- Dry run + potwierdzenie przed destrukcją
- Backup przed modyfikacją

### Compliance (skrót)

- **RODO:** podstawa prawna, minimalizacja, **72 h** na zgłoszenie naruszenia
- **AI Act:** transparentność — użytkownik wie, że rozmawia z AI
- **Digital Omnibus (propozycja 11/2025):** uproszczenie, opóźnienia wysokiego ryzyka

### Proces 4 kroków

Mapuj dostępy → skonfiguruj kontrole → siatka (HITL, kill switch) → compliance

Varonis 2025: 99% środowisk ma wrażliwe dane wystawione na AI.

## Checklist

- [ ] Cztery pytania — odpowiedzi przed wdrożeniem
- [ ] Tokeny scope per narzędzie, rotacja, vault
- [ ] Kill switch przetestowany

## Powiązane tematy

- [Zagrożenia i obrona](zagrozenia-i-obrona.md)
- [Context engineering](../context-engineering-kontekst-i-zabezpieczenia-operacji.md)

---

Źródło: [AID4_S01E03 [1171080320].md](../../transcriptions/_surowe/AID4_S01E03%20%5B1171080320%5D.md)

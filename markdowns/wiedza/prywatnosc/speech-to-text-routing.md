# Speech-to-text — prywatność i routing

> **Esencja:** Nagranie głosowe to paczka danych osobowych i biometrycznych (ton, akcent, tło, voice print). Routing prywatności — świadomy wybór chmury vs lokalnego STT — to decyzja projektowa agenta, nie dodatek.

## Słownik

| Termin | Definicja |
|--------|-----------|
| **Voice print** | Biometryczny identyfikator głosu (siła porównywalna z odciskiem palca) |
| **STT lokalne** | Whisper, VOSK — audio nie opuszcza urządzenia |
| **Routing prywatności** | Reguła: wrażliwe → lokalnie; banalne → chmura |

## Kiedy stosować / kiedy nie

**Lokalnie:** spotkania z klientem, dane medyczne/finansowe, cokolwiek, czego nie wysłałbyś mailem do obcego.

**Chmura OK:** lista zakupów, publiczny webinar — szybko i tanio.

## Wzorce i mechanizmy

### Co niesie audio poza tekstem

1. Emocje, stres (ton)
2. Akcent, region, często wiek/płeć
3. Tło — miejsce, czasem czas zdarzenia
4. Biometria — BIPA (Illinois), ugoda Google/Texas $1,375 mld (2025)

### Modele 2025

| Model | Uwagi |
|-------|-------|
| Nvidia Canary-Qwen 2.5B | Leaderboard OpenASR ~5% WER; **tylko angielski** |
| Whisper Large V3 / V3 Turbo | Najlepsza opcja lokalna PL; Turbo ~6 GB VRAM |
| VOSK | Offline, telefon, niższa jakość |

Lokalna transkrypcja PL: jakość porównywalna z API (rok temu wymagała kompromisów).

### Klonowanie głosu

~1 min nagrania → przekonująca kopia (MIT/Google). Hongkong 2025: $193M oszustwa HSBC. GJ Legal: >1250 przypadków, średnio ~8400 PLN.

## Checklist

- [ ] Traktuj nagrania jak dane osobowe / biometryczne (RODO)
- [ ] Routing zdefiniowany **przed** wdrożeniem agenta STT
- [ ] Wrażliwe nagrania nie lecą do chmury
- [ ] Po STT: usuwanie plików źródłowych tam, gdzie możliwe

## Pułapki i antywzorce

- Założenie „tylko tekst" — wysyłasz całe audio
- Brak polityki dla agentów transkrybujących rozmowy użytkowników
- Voice print jako uwierzytelnianie (Altman, 07/2025: „AI to całkowicie pokonało")

## Powiązane tematy

- [Analityka aktywności privacy-first](analityka-aktywnosci-privacy-first.md)
- [Kontrola dostępu](../bezpieczenstwo/kontrola-dostepu-przed-wdrozeniem.md)
- [Nadzór agentów](../nadzor-obserwowalnosc-i-ewaluacja-agentow.md)

---

Źródło: [AID4_S02E03 [1172919468].md](../../transcriptions/_surowe/AID4_S02E03%20%5B1172919468%5D.md)

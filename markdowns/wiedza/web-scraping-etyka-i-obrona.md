# Web scraping — etyka i obrona

> **Esencja:** Scraping bez pytania i z ignorowaniem robots.txt to ryzyko prawne i operacyjne — nie intencja, a skala decyduje w pozwach. Etyczny scraper: robots.txt, rate limit, uczciwy user-agent; strony bronią się AI Labyrinth i Anubis; kontekstowy feedback wykrywa honeypoty i degradację.

## Słownik

| Termin | Definicja |
|--------|-----------|
| **robots.txt** | Jawna wola właściciela — „nie wchodź" |
| **ai.txt / llms.txt** | Granularne reguły dla botów AI |
| **AI Labyrinth (Cloudflare)** | Pułapka: nieskończone fałszywe strony — marnuje tokeny bota |
| **Anubis** | Proof-of-work przed odpowiedzią — koszt masowego scrapingu |
| **Pay-per-crawl** | Monetyzacja treści (Cloudflare testy) |

## Kiedy stosować / kiedy nie

**Etyczny scraping:** publiczne dane, zgodność z robots.txt, rate limiting, identyfikacja bota.

**Nie:** fałszywy User-Agent (Googlebot), ignorowanie robots.txt, masowe pobieranie danych osobowych.

## Wzorce i mechanizmy

### Case law (2025)

- **Reddit vs Perplexity** — treści bez odsyłania do źródła
- **Reddit vs Anthropic** — trening bez licencji
- **Ziff Davis vs OpenAI** — ignorowanie robots.txt

Argument: nie „scraping zły", ale **scraping bez zgody / z łamaniem reguł**.

### Statystyki obrony

- ~6 mln stron blokuje GPTBot (+70% rok do roku)
- **~13%** żądań botów AI łamie wyrażoną wolę właściciela

### Cztery zasady etycznego scrapera

1. Parsuj robots.txt przed pierwszym requestem
2. Rate limit ≥5 s między requestami
3. Uczciwy User-Agent + kontakt
4. Stop przy danych osobowych — pytaj operatora

### Kontekstowy feedback

Scraper raportuje: zmiana struktury, nowe blokady, podejrzane dane (honeypot, labirynt). **„Nie wiem"** lepsze niż ciche śmieci.

## Checklist

- [ ] robots.txt enforced
- [ ] Rate limiting
- [ ] Prawdziwy User-Agent
- [ ] Flaga PII → halt
- [ ] Feedback: anomalie struktury/treści

## Pułapki i antywzorce

- „Publiczne = wolne" — błąd prawny i etyczny
- Proxy + fake Googlebot
- Scraper milczący przy degradacji jakości

## Powiązane tematy

- [Zagrożenia i obrona](bezpieczenstwo/zagrozenia-i-obrona.md)
- [Pamięć AI / RAG](pamiec-ai-wyszukiwanie-hybrid-rag-i-bezpieczenstwo-embeddingow.md)

---

Źródło: [AID4_S03E03.md](../transcriptions/_surowe/AID4_S03E03.md)

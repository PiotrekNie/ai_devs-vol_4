# Changelog

All notable changes to **@ai-devs/s02e04** are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- **`MemoryHooks` (faza E):** `createMailboxMemoryHooks` — journal `date` / `password` / `confirmation_code` z wyjść narzędzi + przycinanie środka konwersacji (`MAILBOX_MEMORY_*`).

### Changed

- **`http_request`:** `POST` wymaga `body`; żądanie na endpoint zmail dokleja `apikey` z `HUB_API_KEY` jak `postZmail`; doprecyzowane prompty i opis MCP (`help` przez `{"action":"help"}`).
- **Mailbox run hardening:** prompty z jawnym `https://hub.ag3nts.org/api/zmail`, wczesny `submit_to_hub`, guard odrzucający zmail API na złym hoście; `AGENT_MAX_OUTPUT_TOKENS` (domyślnie 4096); `enablePlanningPhase` + skrócone `mailbox_task.md`; `planning_turn.md` — dyscyplina URL.
- **`download_mail_content`:** odrzuca `rowID` (number); wymaga `messageID` (32 hex) z wyniku `search_mail`; prompty — ekstrakcja tylko z `message`, `confirmation_code` 36 znaków, brak powtórnego submit po `-970`.
- **Planning turn 0 (fork sync):** empty tools on API call; tool names in instructions; reasoning-text fallback for `[PLAN]`; `resolveEnablePlanningPhase`.
- **Mailbox merge / submit guard:** prompty — składanie `answer` z trzech źródeł; `validateMailboxHubAnswer` w `submit_to_hub` (odrzuca kod ≠ 36 znaków przed HTTP); `finish_task` tylko po `{FLG:...}`; pamięć preferuje pełny kod SEC z korekty.

---

## [0.1.0] — 2026-05-15

### Added

- **Pakiet `@ai-devs/s02e04`** — osobny manifest npm, skrypt `start` → `run.ts`.
- **MCP zmail:** `search_mail`, `download_mail_content`, wspólny `postZmail` z retry (`fetchWithRetry`), `ZMAIL_API_URL` w `config.ts`.
- **`createS02e04McpServer`** — rejestruje narzędzia boilerplate + zmail; `createBoilerplateMcpServer` pozostaje aliasem.
- **Prompt domenowy** `src/prompts/system.md` oraz **bootstrap** `run.ts` (kontekst z `docs/context/s02e04.md`).
- **Testy** `src/tools/mcp/zmail_tools.test.ts` (mock `fetch`, payload `search` / `getMessages`).

### Changed

- README przepisany pod epizod mailbox.

### Note

Kod runtime (agent, MCP, narzędzia poza zmail) wywodzi się ze snapshota **agent-boilerplate** (2026-05-12); pierwotny changelog boilerplate zachowany w [tasks/boilerplate/CHANGELOG.md](../boilerplate/CHANGELOG.md).

[Unreleased]: https://github.com/PiotrNie-Eversis/ai-devs-vol-4/compare/s02e04-v0.1.0...HEAD
[0.1.0]: https://github.com/PiotrNie-Eversis/ai-devs-vol-4/releases/tag/s02e04-v0.1.0

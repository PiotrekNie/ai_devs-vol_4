import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function posInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const NEGOTIATIONS_TASK_NAME = "negotiations";

/**
 * Azyl app port for agent11784 (same as S01E03 `tasks/s01e03/app.ts`).
 * Public URL: https://azyl-{PORT}.ag3nts.org — NOT agent11784.azyl.ag3nts.org
 */
export const AZYL_AGENT_NUM = posInt("AZYL_AGENT_NUM", 11784);

/** SSH port from course login (`ssh ... -p 5022`) — dokumentacja only. */
export const AZYL_SSH_PORT = posInt("AZYL_SSH_PORT", 5022);

export function azylAppPort(agentNum: number = AZYL_AGENT_NUM): number {
  if (agentNum >= 50_000) return agentNum;
  return 50_000 + (agentNum % 10_000);
}

/** App listen port on azyl (S01E03: agent11784 → 51784). */
export const PORT = posInt("PORT", azylAppPort());

/** Public HTTPS host — subdomain = app PORT, e.g. https://azyl-51784.ag3nts.org */
export function azylPublicBaseUrl(appPort: number = PORT): string {
  return `https://azyl-${appPort}.ag3nts.org`;
}

/** Public HTTPS base URL (no trailing slash) — used by register.ts. */
export function getPublicBaseUrl(): string {
  const raw = process.env["PUBLIC_BASE_URL"]?.trim().replace(/\/+$/, "");
  return raw ?? azylPublicBaseUrl();
}

/** Used by server logs. */
export const PUBLIC_BASE_URL = getPublicBaseUrl();

export const HUB_VERIFY_URL =
  process.env["HUB_VERIFY_URL"]?.trim() ?? "https://hub.ag3nts.org/verify";

export const HUB_API_KEY = process.env["HUB_API_KEY"]?.trim() ?? "";

export const CSV_DIR = path.join(__dirname, "csv");

export const AZYL_SSH =
  process.env["AZYL_SSH"]?.trim() ??
  "agent11784@azyl.ag3nts.org -p 5022";

export const TOOL_DESCRIPTIONS = {
  findCitiesForProduct:
    "Sprawdza, w których miastach można kupić jeden produkt. W polu params podaj opis po polsku (np. turbina wiatrowa 400W 48V, inwerter DC/AC 48V 3000W, akumulator AGM 48V). Zwraca wyłącznie nazwy miast oddzielone przecinkami, bez kodów.",
  findCitiesWithAllProducts:
    "Zwraca miasta, które sprzedają jednocześnie wszystkie wymienione produkty. W params wypisz cały zestaw (oddziel przecinkiem lub słowami oraz/i), np. turbina wiatrowa 48V, inwerter 48V 3000W, akumulator AGM 48V 150Ah. Użyj tego narzędzia, gdy szukasz miejsca na kompletny zakup.",
} as const;

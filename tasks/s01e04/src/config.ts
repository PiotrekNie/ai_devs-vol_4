import path from "node:path";
import { resolveModelForProvider } from "../../config.js";

export const CHAT_MODEL = resolveModelForProvider("gpt-4o-mini");
/** Vision / OCR via OpenRouter (same key as chat). */
export const VISION_MODEL = resolveModelForProvider("google/gemini-2.0-flash-001");

export const DOC_BASE_URL = "https://hub.ag3nts.org/dane/doc";
export const WORKSPACE_DOC = path.join(import.meta.dir, "../workspace/doc");

export const HUB_VERIFY_URL = "https://hub.ag3nts.org/verify";

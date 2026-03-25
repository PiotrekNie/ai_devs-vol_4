import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export const HUB_VERIFY_URL = "https://hub.ag3nts.org/verify";
export const TASK_NAME = "railway" as const;

/** OpenRouter model slug (e.g. openai/gpt-4o-mini). */
export const PLANNER_MODEL = "openai/gpt-4o-mini";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

function openRouterHeaders(): Record<string, string> | undefined {
  const referer = process.env.OPENROUTER_HTTP_REFERER?.trim();
  const title = process.env.OPENROUTER_APP_NAME?.trim();
  if (!referer && !title) {
    return undefined;
  }
  return {
    ...(referer ? { "HTTP-Referer": referer } : {}),
    ...(title ? { "X-Title": title } : {}),
  };
}

/**
 * OpenRouter-backed model instance for `generateText` / structured output.
 */
export function getOpenRouterModel(): LanguageModel {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const openrouter = createOpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    headers: openRouterHeaders(),
  });

  return openrouter(PLANNER_MODEL);
}

/** Target route id from the task brief; keep casing as returned by `help`. */
export const TARGET_ROUTE_ID = "X-01";

/** Single place to normalize route ids from the model or env (trim only; preserve casing). */
export function normalizeRouteId(route: string): string {
  return route.trim();
}

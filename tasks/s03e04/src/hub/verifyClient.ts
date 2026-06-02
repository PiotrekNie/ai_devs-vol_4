import { fetchWithRetry } from "../http/fetchWithRetry.js";
import {
  HUB_API_KEY,
  HUB_VERIFY_URL,
  NEGOTIATIONS_TASK_NAME,
  getPublicBaseUrl,
  TOOL_DESCRIPTIONS,
} from "../../config.js";

const FLAG_PATTERN = /\{FLG:[^}]+\}/;

export function extractFlag(text: string): string | null {
  const match = FLAG_PATTERN.exec(text);
  return match ? (match[0] ?? null) : null;
}

export type ToolRegistration = {
  URL: string;
  description: string;
};

export function buildToolUrls(baseUrl?: string): ToolRegistration[] {
  const base = (baseUrl ?? getPublicBaseUrl()).replace(/\/+$/, "");
  return [
    {
      URL: `${base}/api/find-cities-for-product`,
      description: TOOL_DESCRIPTIONS.findCitiesForProduct,
    },
    {
      URL: `${base}/api/find-cities-with-all-products`,
      description: TOOL_DESCRIPTIONS.findCitiesWithAllProducts,
    },
  ];
}

export type VerifyClientOptions = {
  apiKey?: string;
  verifyUrl?: string;
  baseUrl?: string;
};

export function createVerifyClient(options: VerifyClientOptions = {}) {
  const apiKey = options.apiKey ?? HUB_API_KEY;
  const verifyUrl = options.verifyUrl ?? HUB_VERIFY_URL;
  const baseUrl = options.baseUrl ?? getPublicBaseUrl();

  if (!apiKey) {
    throw new Error(
      "HUB_API_KEY is not set. Add it to tasks/.env before register/check.",
    );
  }

  async function registerTools(): Promise<unknown> {
    const response = await fetchWithRetry(verifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: apiKey,
        task: NEGOTIATIONS_TASK_NAME,
        answer: { tools: buildToolUrls(baseUrl) },
      }),
    });

    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`Hub returned non-JSON: ${text.slice(0, 300)}`);
    }

    if (!response.ok) {
      throw new Error(
        `Hub register failed (${response.status}): ${text.slice(0, 300)}`,
      );
    }

    return parsed;
  }

  async function checkTask(): Promise<{ data: unknown; flag: string | null }> {
    const response = await fetchWithRetry(verifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: apiKey,
        task: NEGOTIATIONS_TASK_NAME,
        answer: { action: "check" },
      }),
    });

    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`Hub returned non-JSON: ${text.slice(0, 300)}`);
    }

    if (!response.ok) {
      throw new Error(
        `Hub check failed (${response.status}): ${text.slice(0, 300)}`,
      );
    }

    return {
      data: parsed,
      flag: extractFlag(text) ?? extractFlag(JSON.stringify(parsed)),
    };
  }

  return { registerTools, checkTask, buildToolUrls };
}

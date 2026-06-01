import { fetchWithRetry } from "@ai-devs/agent-boilerplate";
import { extractFlag } from "../../../boilerplate/src/tools/mcp/submit_to_hub.js";
import {
  HUB_API_KEY,
  HUB_VERIFY_URL,
  REACTOR_TASK_NAME,
} from "../../config.js";
import type { Command } from "../domain/types.js";
import {
  reactorHubResponseSchema,
  type ReactorHubResponse,
} from "../domain/types.js";

export type ReactorClientOptions = {
  apiKey?: string;
  verifyUrl?: string;
};

export function createReactorClient(options: ReactorClientOptions = {}) {
  const apiKey = options.apiKey ?? HUB_API_KEY;
  const verifyUrl = options.verifyUrl ?? HUB_VERIFY_URL;

  if (!apiKey) {
    throw new Error(
      "HUB_API_KEY is not set. Add it to tasks/.env to run the reactor solver.",
    );
  }

  async function sendCommand(command: Command): Promise<ReactorHubResponse> {
    const response = await fetchWithRetry(verifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: apiKey,
        task: REACTOR_TASK_NAME,
        answer: { command },
      }),
    });

    const rawText = await response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error(`Hub returned non-JSON: ${rawText.slice(0, 200)}`);
    }

    return reactorHubResponseSchema.parse(parsed);
  }

  function findFlag(data: ReactorHubResponse): string | null {
    return (
      extractFlag(JSON.stringify(data)) ??
      extractFlag(data.message) ??
      null
    );
  }

  return { sendCommand, findFlag };
}

export type ReactorClient = ReturnType<typeof createReactorClient>;

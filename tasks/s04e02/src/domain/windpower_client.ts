import type { SubmitToHubInput } from "../../../boilerplate/src/tools/mcp/submit_to_hub.js";
import { extractFlag } from "../../../boilerplate/src/tools/mcp/submit_to_hub.js";
import { executeSubmitToHub } from "../../../boilerplate/src/tools/mcp/submit_to_hub.js";
import { HUB_API_KEY, WINDPOWER_TASK_NAME } from "../../config.js";
import type { WindpowerHubResult } from "./types.js";

export function parseSubmitToHubText(text: string): WindpowerHubResult {
  const envelope = JSON.parse(text) as {
    ok: boolean;
    status: number;
    data: Record<string, unknown>;
    flag?: string;
  };

  const flag =
    envelope.flag ??
    extractFlag(JSON.stringify(envelope.data)) ??
    extractFlag(text);

  return {
    ok: envelope.ok,
    status: envelope.status,
    data: envelope.data,
    flag,
  };
}

export async function postWindpowerAction(
  answer: Record<string, unknown>,
): Promise<WindpowerHubResult> {
  if (!HUB_API_KEY) {
    throw new Error(
      "HUB_API_KEY is not set. Add it to tasks/.env to run windpower.",
    );
  }

  const response = await executeSubmitToHub({
    task_name: WINDPOWER_TASK_NAME,
    answer: answer as SubmitToHubInput["answer"],
  });

  const text = response.content[0]?.text;
  if (!text) {
    throw new Error("Empty hub response from submit_to_hub");
  }

  const parsed = parseSubmitToHubText(text);
  if (!parsed.ok) {
    throw new Error(
      `Hub error [${String(parsed.data.code)}]: ${String(parsed.data.message)}`,
    );
  }

  return parsed;
}

export function unlockSlotKey(
  startDate: string,
  startHour: string,
  pitchAngle: number,
): string {
  return `${startDate}|${startHour}|${pitchAngle}`;
}

export function scheduleSlotToUnlockKey(slot: {
  timestamp: string;
  pitchAngle: number;
}): string {
  const [startDate, startHour] = slot.timestamp.split(" ");
  return unlockSlotKey(startDate!, startHour!, slot.pitchAngle);
}

import { hubApiKey } from "../../config.js";

const VERIFY_URL = "https://hub.ag3nts.org/verify";

export async function verifyAnswer(logs: string): Promise<{
  ok: boolean;
  status: number;
  body: string;
}> {
  const response = await fetch(VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: hubApiKey(),
      task: "failure",
      answer: { logs },
    }),
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${body.slice(0, 500)}`);
  }

  return { ok: true, status: response.status, body };
}

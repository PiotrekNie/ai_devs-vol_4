import { HUB_VERIFY_URL } from "../config.js";

const HUB_API_KEY = process.env.HUB_API_KEY?.trim() ?? "";

export interface VerifyResult {
  flag?: string;
  message?: string;
  code?: number;
}

export async function submitSendit(declaration: string): Promise<VerifyResult> {
  if (!HUB_API_KEY) {
    throw new Error("HUB_API_KEY is not set");
  }

  const response = await fetch(HUB_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: HUB_API_KEY,
      task: "sendit",
      answer: { declaration },
    }),
  });

  return response.json() as Promise<VerifyResult>;
}

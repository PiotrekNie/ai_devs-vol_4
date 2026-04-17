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

export type ParsedVerifyBody = {
  ok: boolean;
  flag?: string;
  code?: number;
  message?: string;
  raw: unknown;
};

/**
 * Parses hub JSON (or plain text) returned in the verify response body.
 */
export function parseVerifyBody(body: string): ParsedVerifyBody {
  let raw: unknown;
  try {
    raw = JSON.parse(body);
  } catch {
    const flag = body.match(/\{FLG:[^}]+\}/)?.[0];
    if (flag) {
      return { ok: true, flag, message: body, raw: body };
    }
    return {
      ok: false,
      message: body.slice(0, 800),
      raw: body,
    };
  }

  if (typeof raw !== "object" || raw === null) {
    return { ok: false, raw };
  }

  const o = raw as Record<string, unknown>;
  const message =
    typeof o.message === "string"
      ? o.message
      : typeof o.msg === "string"
        ? o.msg
        : "";
  const code = typeof o.code === "number" ? o.code : undefined;

  const flag = message.match(/\{FLG:[^}]+\}/)?.[0];

  if (flag) {
    return { ok: true, flag, message, code, raw };
  }

  if (code !== undefined && code < 0) {
    return { ok: false, code, message: message || JSON.stringify(raw).slice(0, 500), raw };
  }

  if (code === 0) {
    return { ok: true, message, code, raw };
  }

  if (/accepted|success|complete|flag/i.test(message)) {
    return { ok: true, message, code, raw };
  }

  if (message && code === undefined) {
    return { ok: false, message, raw };
  }

  return {
    ok: false,
    code,
    message: message || JSON.stringify(raw).slice(0, 500),
    raw,
  };
}

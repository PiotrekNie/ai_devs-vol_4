import { HUB_VERIFY_URL, TASK_NAME, hubApiKey } from "./config.ts";

const MAX_ATTEMPTS = 10;
const BASE_BACKOFF_MS = 1000;
const BACKOFF_CAP_MS = 30_000;
const DEFAULT_RATE_LIMIT_MS = 5000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function bodySnippet(text: string, max = 1200): string {
  const t = text.trim();
  if (t.length <= max) {
    return t;
  }
  return `${t.slice(0, max)}…`;
}

function parseRetryAfterMs(headers: Headers): number | undefined {
  const raw = headers.get("retry-after");
  if (!raw) {
    return undefined;
  }
  const secs = Number.parseInt(raw, 10);
  if (Number.isNaN(secs)) {
    return undefined;
  }
  return secs * 1000;
}

function parse429WaitMs(response: Response, bodyText: string): number {
  const fromHeader = parseRetryAfterMs(response.headers);
  if (fromHeader !== undefined && fromHeader > 0) {
    return fromHeader;
  }

  const ct = response.headers.get("content-type") ?? "";
  if (ct.includes("application/json") && bodyText.length > 0) {
    try {
      const j = JSON.parse(bodyText) as Record<string, unknown>;
      const retryAfter = Number(j.retry_after ?? j.retryAfter);
      const penalty = Number(j.penalty_seconds ?? j.penaltySeconds);
      let sumSec = 0;
      if (!Number.isNaN(retryAfter)) {
        sumSec += retryAfter;
      }
      if (!Number.isNaN(penalty)) {
        sumSec += penalty;
      }
      if (sumSec > 0) {
        return sumSec * 1000;
      }
    } catch {
      // ignore
    }
  }

  return DEFAULT_RATE_LIMIT_MS;
}

function backoffMsFor503(attempt: number): number {
  return Math.min(BACKOFF_CAP_MS, BASE_BACKOFF_MS * 2 ** attempt);
}

export interface HubVerifyResult {
  status: number;
  bodyText: string;
  json: unknown;
}

export function extractFlagFromText(text: string): string | undefined {
  const m = text.match(/\{FLG:[^}]+\}/);
  return m?.[0];
}

export async function postVerifyRotate(
  rotate: string,
  maxAttempts = MAX_ATTEMPTS,
): Promise<HubVerifyResult> {
  const key = hubApiKey();
  let lastBody = "";

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const payload = {
      apikey: key,
      task: TASK_NAME,
      answer: { rotate },
    };

    console.log(
      `[hub] POST /verify rotate=${rotate} attempt ${attempt + 1}/${maxAttempts}`,
    );

    const response = await fetch(HUB_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    lastBody = await response.text();

    if (response.status === 503) {
      const wait = backoffMsFor503(attempt);
      console.log(`[hub] 503 — sleeping ${wait}ms`);
      await sleep(wait);
      continue;
    }

    if (response.status === 429) {
      const wait = parse429WaitMs(response, lastBody);
      console.log(`[hub] 429 — sleeping ${wait}ms`);
      await sleep(wait);
      continue;
    }

    if (!response.ok) {
      if (attempt < maxAttempts - 1 && response.status >= 500) {
        const wait = backoffMsFor503(attempt);
        console.log(`[hub] ${response.status} — sleeping ${wait}ms`);
        await sleep(wait);
        continue;
      }
    }

    let json: unknown = lastBody;
    try {
      json = JSON.parse(lastBody) as unknown;
    } catch {
      // keep text
    }

    return { status: response.status, bodyText: lastBody, json };
  }

  let json: unknown = lastBody;
  try {
    json = JSON.parse(lastBody) as unknown;
  } catch {
    // keep text
  }

  return { status: 0, bodyText: lastBody || "(empty)", json };
}

/** GET board PNG; append `?reset=1` to reset server-side state. */
export async function fetchBoardPng(
  url: string,
): Promise<{ ok: boolean; status: number; bytes: Uint8Array; contentType: string }> {
  const response = await fetch(url);
  const buf = new Uint8Array(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") ?? "";
  return {
    ok: response.ok,
    status: response.status,
    bytes: buf,
    contentType,
  };
}

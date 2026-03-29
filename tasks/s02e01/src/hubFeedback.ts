/** Parsed JSON body from POST https://hub.ag3nts.org/verify (task categorize). */
export interface HubCategorizeResult {
  code?: number;
  message?: string;
  error?: string;
  hint?: string;
  /** Hub may attach model output + progress (classified_items / required_items). */
  debug?: {
    result?: string;
    output?: string;
    classified_items?: number;
    required_items?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Single string for LLM repair: prefers message, then error/hint, then raw body / JSON fallback.
 */
export function extractHubFeedback(result: HubCategorizeResult, bodyText?: string): string {
  const parts: string[] = [];
  if (typeof result.message === "string" && result.message.trim()) {
    parts.push(result.message.trim());
  }
  if (typeof result.error === "string" && result.error.trim()) {
    parts.push(`error: ${result.error.trim()}`);
  }
  if (typeof result.hint === "string" && result.hint.trim()) {
    parts.push(`hint: ${result.hint.trim()}`);
  }
  if (parts.length > 0) {
    return parts.join("\n");
  }
  if (bodyText?.trim()) {
    return bodyText.trim();
  }
  return JSON.stringify(result);
}

/** Richer text for LLM repair (includes hub classifier output when present). */
export function formatHubFeedbackForRepair(result: HubCategorizeResult, bodyText: string): string {
  const base = extractHubFeedback(result, bodyText);
  const out = result.debug?.output != null
    ? `${base}\nHub classifier output: ${String(result.debug.output)}`
    : base;
  if (result.debug?.result != null) {
    return `${out}\nHub result field: ${String(result.debug.result)}`;
  }
  return out;
}

/** Hub balance depleted — must send prompt `reset` before further classify calls (-910). */
export function hubInsufficientFunds(result: HubCategorizeResult): boolean {
  return result.code === -910;
}

/** Wrong label for current item; session progress may reset (see debug.classified_items). */
export function hubWrongClassification(result: HubCategorizeResult): boolean {
  if (result.code === -890) {
    return true;
  }
  return result.debug?.result === "wrong classification";
}

/** Hard failures: retrying the same row with a shorter prompt is unlikely to help. */
export function responseLooksLikeHardError(result: HubCategorizeResult, httpStatus: number): boolean {
  if (httpStatus === 401 || httpStatus === 403) {
    return true;
  }
  const fb = extractHubFeedback(result).toLowerCase();
  if (fb.includes("rate limit")) {
    return true;
  }
  if (fb.includes("invalid api") || fb.includes("unauthorized")) {
    return true;
  }
  if (fb.includes("invalid key") || fb.includes("bad api")) {
    return true;
  }
  // Budget / PP exhausted (PL + EN)
  if (
    (fb.includes("przekrocz") && (fb.includes("budżet") || fb.includes("pp")))
    || (fb.includes("budget") && (fb.includes("exceed") || fb.includes("exhaust") || fb.includes("depleted")))
    || (fb.includes("wyczerp") && fb.includes("budżet"))
  ) {
    return true;
  }
  return false;
}

export function messageHasFlag(message: string): boolean {
  return message.includes("{FLG:");
}

/**
 * Hub uses `code: 1` (with `message: "ACCEPTED"`) for a successful per-item classification,
 * not `code: 0`.
 */
export function hubCategorizeRowAccepted(result: HubCategorizeResult): boolean {
  if (result.code === 1) {
    return true;
  }
  if (result.debug?.result === "correct classification") {
    return true;
  }
  return false;
}

/**
 * Sent the same item again after hub already advanced — do not repair; go to next CSV row.
 * (Occurs if a successful `code: 1` response was mistaken for an error.)
 */
export function hubCategorizeAlreadyDoneThisItem(result: HubCategorizeResult): boolean {
  return result.code === -923;
}

/** Whether we should try prefix repair instead of aborting the attempt. */
export function hubResultNeedsRepair(
  status: number,
  result: HubCategorizeResult,
  bodyText: string,
): boolean {
  const msg = extractHubFeedback(result, bodyText);
  if (messageHasFlag(msg)) {
    return false;
  }
  if (hubCategorizeRowAccepted(result)) {
    return false;
  }
  if (hubCategorizeAlreadyDoneThisItem(result)) {
    return false;
  }
  if (hubInsufficientFunds(result)) {
    return false;
  }
  if (hubWrongClassification(result)) {
    return false;
  }
  if (responseLooksLikeHardError(result, status)) {
    return false;
  }
  if (status !== 200 && status !== 202) {
    return true;
  }
  if (result.code != null && result.code !== 0) {
    return true;
  }
  const low = msg.toLowerCase();
  if (
    low.includes("błąd")
    || low.includes("error")
    || low.includes("wrong")
    || low.includes("incorrect")
    || low.includes("niepopraw")
    || low.includes("failed")
    || low.includes("token")
    || low.includes("limit")
    || low.includes("za dług")
    || low.includes("too long")
  ) {
    return true;
  }
  return false;
}

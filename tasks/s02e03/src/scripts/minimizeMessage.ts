/**
 * Minifies log text for the LLM: coalesces duplicate `[date] [SEV] …` lines, trims to a token budget.
 * Set `S02E03_MINIFY_MAX_INPUT_TOKENS` to cap `JSON.stringify({ data: [payload] })` size (default 1500, `o200k_base`).
 */
import { chat, extractText } from "../ai.js";
import { countTokens } from "./countTokens.js";
import { parseJsonObjectFromText } from "./parseModelJson.js";

/** Max tokens for the string inside `JSON.stringify({ data: [payload] })` before calling the model. */
const DEFAULT_MINIFY_MAX_INPUT_TOKENS = 1500;

function resolveMinifyMaxInputTokens(): number {
  const raw = process.env.S02E03_MINIFY_MAX_INPUT_TOKENS?.trim();
  if (!raw) {
    return DEFAULT_MINIFY_MAX_INPUT_TOKENS;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) {
    return DEFAULT_MINIFY_MAX_INPUT_TOKENS;
  }
  return Math.floor(n);
}

/** Same line shape as parseData.ts */
const STRUCTURED_LOG_LINE =
  /^\[([^\]]+)\]\s+\[([A-Z]+)\]\s+(.*)$/;

const SEVERITY_ORDER: Record<string, number> = {
  CRIT: 0,
  WARN: 1,
  INFO: 2,
};

const MAX_BODY_CHARS = 120;

/** Normalizes log message bodies for duplicate detection (same as structured-line coalescing). */
export function normalizeBodyKey(body: string): string {
  return body.replace(/\s+/g, " ").trim().toLowerCase();
}

function truncateBodyForDisplay(body: string): string {
  const t = body.trim();
  if (t.length <= MAX_BODY_CHARS) {
    return t;
  }
  return `${t.slice(0, MAX_BODY_CHARS - 1)}…`;
}

type MergedLine = {
  status: string;
  displayBody: string;
  count: number;
  firstDate: string;
  lastDate: string;
};

type UnparsedLine = {
  raw: string;
  count: number;
};

type LogGroup =
  | { kind: "structured"; key: string; merged: MergedLine }
  | { kind: "unparsed"; key: string; unparsed: UnparsedLine };

function coalesceToGroups(message: string): LogGroup[] {
  const lines = message.split("\n").map((l) => l.trim()).filter(Boolean);
  const structured = new Map<string, MergedLine>();
  const unparsed = new Map<string, UnparsedLine>();

  for (const line of lines) {
    const m = line.match(STRUCTURED_LOG_LINE);
    if (m) {
      const date = m[1] ?? "";
      const status = m[2] ?? "";
      const body = m[3] ?? "";
      const key = `${status}|${normalizeBodyKey(body)}`;
      const prev = structured.get(key);
      if (prev) {
        prev.count += 1;
        prev.lastDate = date;
      } else {
        structured.set(key, {
          status,
          displayBody: body.trim(),
          count: 1,
          firstDate: date,
          lastDate: date,
        });
      }
    } else {
      const key = `u|${line}`;
      const prev = unparsed.get(key);
      if (prev) {
        prev.count += 1;
      } else {
        unparsed.set(key, { raw: line, count: 1 });
      }
    }
  }

  const out: LogGroup[] = [];
  for (const merged of structured.values()) {
    const key = `${merged.status}|${normalizeBodyKey(merged.displayBody)}`;
    out.push({ kind: "structured", key, merged });
  }
  for (const u of unparsed.values()) {
    out.push({ kind: "unparsed", key: `u|${u.raw}`, unparsed: u });
  }
  return out;
}

function sortGroupsForTrim(groups: LogGroup[]): LogGroup[] {
  return [...groups].sort((a, b) => {
    const sa =
      a.kind === "structured"
        ? (SEVERITY_ORDER[a.merged.status] ?? 9)
        : 9;
    const sb =
      b.kind === "structured"
        ? (SEVERITY_ORDER[b.merged.status] ?? 9)
        : 9;
    if (sa !== sb) {
      return sa - sb;
    }
    const ca = a.kind === "structured" ? a.merged.count : a.unparsed.count;
    const cb = b.kind === "structured" ? b.merged.count : b.unparsed.count;
    return cb - ca;
  });
}

function renderGroupLine(g: LogGroup): string {
  if (g.kind === "unparsed") {
    const { raw, count } = g.unparsed;
    return count > 1 ? `${raw} ×${count}` : raw;
  }
  const m = g.merged;
  const body = truncateBodyForDisplay(m.displayBody);
  const countSuffix = m.count > 1 ? ` ×${m.count}` : "";
  const span =
    m.firstDate !== m.lastDate
      ? ` [${m.firstDate}…${m.lastDate}]`
      : "";
  return `[${m.status}] ${body}${span}${countSuffix}`;
}

function globalDateSpan(groups: LogGroup[]): { first: string; last: string } | undefined {
  let minD = "";
  let maxD = "";
  for (const g of groups) {
    if (g.kind !== "structured") {
      continue;
    }
    const { firstDate, lastDate } = g.merged;
    if (!minD || firstDate < minD) {
      minD = firstDate;
    }
    if (!maxD || lastDate > maxD) {
      maxD = lastDate;
    }
  }
  if (minD && maxD && minD !== maxD) {
    return { first: minD, last: maxD };
  }
  return undefined;
}

function renderCoalescedFromGroups(groups: LogGroup[], truncatedNote?: string): string {
  const span = globalDateSpan(groups);
  const header =
    span && groups.length > 0
      ? `${span.first}–${span.last} (aggregated)\n`
      : "";
  const body = groups.map(renderGroupLine).join("\n");
  const note = truncatedNote ? `\n${truncatedNote}` : "";
  return `${header}${body}${note}`.trim();
}

function payloadTokenCount(text: string): number {
  return countTokens(JSON.stringify({ data: [text] }));
}

/**
 * Collapse duplicate structured log lines (same status + normalized body) with counts.
 */
export function coalesceStructuredLogLines(message: string): string {
  const groups = coalesceToGroups(message);
  return renderCoalescedFromGroups(sortGroupsForTrim(groups));
}

function binarySearchMaxPrefixLen(
  full: string,
  fits: (len: number) => boolean,
): number {
  let lo = 0;
  let hi = full.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (fits(mid)) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return lo;
}

function trimGroupsToTokenBudget(
  sortedGroups: LogGroup[],
  maxTokens: number,
): string {
  const picked: LogGroup[] = [];
  for (const g of sortedGroups) {
    const candidate = renderCoalescedFromGroups([...picked, g]);
    if (payloadTokenCount(candidate) <= maxTokens) {
      picked.push(g);
    } else {
      break;
    }
  }
  const omitted = sortedGroups.length - picked.length;
  if (picked.length === 0 && sortedGroups.length > 0) {
    const g0 = sortedGroups[0]!;
    const moreNote =
      sortedGroups.length > 1
        ? `+${sortedGroups.length - 1} more template(s) truncated`
        : undefined;
    if (g0.kind === "structured") {
      const base = g0.merged;
      const maxLen = binarySearchMaxPrefixLen(base.displayBody, (len) => {
        const body =
          len >= base.displayBody.length
            ? base.displayBody
            : `${base.displayBody.slice(0, len).trimEnd()}…`;
        const merged: MergedLine = { ...base, displayBody: body };
        return (
          payloadTokenCount(
            renderCoalescedFromGroups([
              { kind: "structured", key: g0.key, merged },
            ]),
          ) <= maxTokens
        );
      });
      const displayBody =
        maxLen >= base.displayBody.length
          ? base.displayBody
          : `${base.displayBody.slice(0, maxLen).trimEnd()}…`;
      return renderCoalescedFromGroups(
        [
          {
            kind: "structured",
            key: g0.key,
            merged: { ...base, displayBody },
          },
        ],
        moreNote,
      );
    }
    const u = g0.unparsed;
    const maxLen = binarySearchMaxPrefixLen(u.raw, (len) => {
      const raw =
        len >= u.raw.length ? u.raw : `${u.raw.slice(0, len).trimEnd()}…`;
      return (
        payloadTokenCount(
          renderCoalescedFromGroups([
            { kind: "unparsed", key: g0.key, unparsed: { raw, count: u.count } },
          ]),
        ) <= maxTokens
      );
    });
    const raw =
      maxLen >= u.raw.length ? u.raw : `${u.raw.slice(0, maxLen).trimEnd()}…`;
    return renderCoalescedFromGroups(
      [{ kind: "unparsed", key: g0.key, unparsed: { raw, count: u.count } }],
      moreNote,
    );
  }
  const note =
    omitted > 0 ? `+${omitted} more template(s) truncated` : undefined;
  return renderCoalescedFromGroups(picked, note);
}

function prepareMessageForModel(message: string, maxTokens: number): string {
  const skipCoalesce =
    !message.includes("\n") && payloadTokenCount(message) <= maxTokens;
  if (skipCoalesce) {
    return message;
  }

  let coalesced: string;
  if (message.includes("\n")) {
    const groups = coalesceToGroups(message);
    const sorted = sortGroupsForTrim(groups);
    coalesced = trimGroupsToTokenBudget(sorted, maxTokens);
  } else {
    // Single line but over budget: binary-search truncate
    coalesced = message;
    if (payloadTokenCount(coalesced) > maxTokens) {
      let lo = 0;
      let hi = message.length;
      while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2);
        const candidate = `${message.slice(0, mid)}…`;
        if (payloadTokenCount(candidate) <= maxTokens) {
          lo = mid;
        } else {
          hi = mid - 1;
        }
      }
      coalesced = `${message.slice(0, lo)}…`;
    }
  }

  if (payloadTokenCount(coalesced) > maxTokens) {
    coalesced = trimGroupsToTokenBudget(
      sortGroupsForTrim(coalesceToGroups(coalesced)),
      maxTokens,
    );
  }

  return coalesced;
}

const minimizeMessageInstructions = [
  "You compress log text into an ultra-short summary.",
  "Input may be one line or pre-aggregated multi-line text (duplicate lines merged with ×N counts, optional date span header).",
  "Return ONLY JSON with exactly this shape:",
  '{"data":[{"id":"string","message":"string"}]}',
  "The data array must contain exactly one object (one minimized message for the input).",
  "Rules:",
  "1) Keep ONLY 1-2 short facts, remove filler.",
  "2) Prefer format: '<critical fact>.'.",
  "3) Max 8 words per sentence.",
].join("\n");

function minimizedMessageFromParsed(parsed: unknown, rawText: string): string {
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error(
      `Invalid model response: not an object. Raw: ${rawText.slice(0, 500)}`,
    );
  }
  const data = (parsed as { data?: unknown }).data;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(
      `Invalid model response: missing or empty data. Raw: ${rawText.slice(0, 500)}`,
    );
  }
  const first = data[0];
  if (typeof first !== "object" || first === null) {
    throw new Error(
      `Invalid model response: data[0] is not an object. Raw: ${rawText.slice(0, 500)}`,
    );
  }
  const msg = (first as { message?: unknown }).message;
  if (typeof msg !== "string") {
    throw new Error(
      `Invalid model response: data[0].message is not a string. Raw: ${rawText.slice(0, 500)}`,
    );
  }
  return msg;
}

export const minimizeMessage = async (message: string) => {
  const ID_REGEX = /\b[A-Z]{2,}\d+[A-Z0-9-]*\b/g;
  const maxTokens = resolveMinifyMaxInputTokens();
  const forModel = prepareMessageForModel(message, maxTokens);

  const response = await chat({
    model: "gpt-4o-mini",
    instructions: minimizeMessageInstructions,
    input: [
      {
        role: "user",
        content: [
          "Minimize this log entry (possibly pre-aggregated). Input JSON:",
          JSON.stringify({ data: [forModel] }),
        ].join("\n"),
      },
    ],
  });
  const text = extractText(response);
  if (!text) {
    throw new Error("Empty model response");
  }
  const parsed = parseJsonObjectFromText(text);
  const minimized = minimizedMessageFromParsed(parsed, text);
  const ids = [...new Set(message.match(ID_REGEX) ?? [])];

  if (ids.length > 0) {
    return `${ids.join(", ")} ${minimized}`;
  }

  return minimized;
};

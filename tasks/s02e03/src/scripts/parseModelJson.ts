/**
 * Resilient JSON extraction from LLM text (markdown fences, leading prose).
 */

/**
 * Finds the first `{…}` slice with brace depth, respecting JSON string rules
 * (so `}` inside "reasoning" does not truncate the object).
 */
function extractFirstJsonObjectString(text: string): string {
  const start = text.indexOf("{");
  if (start === -1) {
    throw new Error("Model output did not contain '{'");
  }
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i]!;
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }
  throw new Error("Unclosed JSON object in model output");
}

export function parseJsonObjectFromText(text: string): unknown {
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);

  const candidates: string[] = [];
  if (fenced?.[1]?.trim()) {
    candidates.push(fenced[1].trim());
  }
  try {
    candidates.push(extractFirstJsonObjectString(trimmed));
  } catch {
    /* no `{` in full text */
  }

  let lastError: unknown;
  for (const raw of candidates) {
    if (!raw) {
      continue;
    }
    try {
      return JSON.parse(raw) as unknown;
    } catch (e) {
      lastError = e;
    }
    try {
      return JSON.parse(extractFirstJsonObjectString(raw)) as unknown;
    } catch (e) {
      lastError = e;
    }
  }
  const hint =
    lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(
    `JSON parse failed (${hint}). First 500 chars: ${trimmed.slice(0, 500)}`,
  );
}

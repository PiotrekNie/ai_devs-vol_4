import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  AI_API_KEY,
  EXTRA_API_HEADERS,
  RESPONSES_API_ENDPOINT,
} from "../../../config.js";
import { VISION_MODEL } from "../config.js";

const OCR_INSTRUCTIONS = `Jesteś OCR dla dokumentacji SPK. Zwróć WYŁĄCZNIE poprawny JSON (bez markdown), strukturalnie:
- dla tabel: { "type": "table", "title": string|null, "rows": string[][] }
- dla list tras: { "type": "routes", "items": { "code": string, "description": string, ... }[] }
- ogólnie: { "type": "text", "lines": string[] }
Bez komentarzy biznesowych — same dane z obrazu.`;

/**
 * Wielostronicowy / wieloobrazowy OCR: zwraca scalony obiekt z polem pages.
 */
export async function imagePathsToStructuredJson(
  absolutePaths: string[],
): Promise<{ pages: unknown[] }> {
  const pages: unknown[] = [];

  for (const filePath of absolutePaths) {
    const buf = await readFile(filePath);
    const mime =
      path.extname(filePath).toLowerCase() === ".png"
        ? "image/png"
        : path.extname(filePath).toLowerCase() === ".jpg" ||
            path.extname(filePath).toLowerCase() === ".jpeg"
          ? "image/jpeg"
          : "application/octet-stream";
    const b64 = Buffer.from(buf).toString("base64");
    const dataUrl = `data:${mime};base64,${b64}`;

    const body = {
      model: VISION_MODEL,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: OCR_INSTRUCTIONS },
            { type: "input_image", image_url: dataUrl },
          ],
        },
      ],
      max_output_tokens: 4096,
    };

    const response = await fetch(RESPONSES_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
        ...EXTRA_API_HEADERS,
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as {
      error?: { message?: string };
      output?: { type: string; content?: { type: string; text?: string }[] }[];
    };

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || `Vision failed (${response.status})`);
    }

    const text = extractOutputText(data);
    pages.push(parseJsonLoose(text, filePath));
  }

  return { pages };
}

function extractOutputText(data: {
  output?: { type: string; content?: { type: string; text?: string }[] }[];
}): string {
  const parts =
    data.output?.flatMap((o) =>
      o.type === "message" ? (o.content ?? []) : [],
    ) ?? [];
  const t = parts.find((p) => p.type === "output_text" && p.text);
  return t?.text ?? "";
}

function parseJsonLoose(text: string, filePath: string): unknown {
  const trimmed = text.trim();
  const jsonBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = jsonBlock ? jsonBlock[1].trim() : trimmed;
  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    return { type: "raw", file: filePath, text: trimmed };
  }
}

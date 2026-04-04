import { z } from "zod";
import { electricityVisionModel } from "./config.ts";
import { glyphCharToMask, TILE_GLYPH_CHARS, type TileGlyphChar } from "./glyphMap.ts";
import { extractJsonObject } from "./jsonUtils.ts";
import {
  assistantMessageToText,
  getFirstChoiceMessage,
  postChatCompletion,
  type ChatCompletionMessageParam,
  type ChatContentPart,
} from "./openrouter/chat.ts";
import { type RectPixels, pngBufferToDataUrl } from "./splitImageGrid.ts";

const VISION_MAX_TOKENS = 4096;
const GLYPH_JSON_MAX_TOKENS = 256;

const VISION_PROMPT = `You analyze a 3x3 electricity puzzle board image. Each tile connects to N, E, S, W edges.
Encode each cell as a 4-bit mask: N=1, E=2, S=4, W=8 (add edges that have a wire/cable).
Rows: 0..2 top to bottom. Cols: 0..2 left to right.

Reply with ONLY valid JSON (no markdown): {"masks":[[a,b,c],[d,e,f],[g,h,i]]} — nine integers 0-15.`;

const BOARD_LOCATE_PROMPT = `Locate the square region containing the 3×3 electricity wire puzzle grid (ignore titles, icons, margins).
Return ONLY valid JSON (no markdown): {"x": number, "y": number, "size": number}
where (x,y) are normalized coordinates (0–1) of the top-left corner of that square relative to image width/height, and size is the normalized side length of the square (0–1), measured relative to min(image width, image height).
Alternatively: {"x0": number, "y0": number, "x1": number, "y1": number} with normalized corners (0–1) of the bounding box of the grid; the code will crop a square from this box.`;

const TILES_VISION_PROMPT = `You are given 9 separate PNG images in order: row-major, left-to-right, top-to-bottom — image 1 = row 0 col 0, image 2 = row 0 col 1, … image 9 = row 2 col 2.
Each image is one cell of a 3×3 electricity puzzle board. Each cell connects to N, E, S, W edges.
Encode each cell as a 4-bit mask: N=1, E=2, S=4, W=8 (add edges that have a wire/cable).
Rows: 0..2 top to bottom. Cols: 0..2 left to right.

Reply with ONLY valid JSON (no markdown): {"masks":[[a,b,c],[d,e,f],[g,h,i]]} — nine integers 0-15.`;

const TILE_GLYPH_PROMPT = `You see one cropped grayscale tile from a 3×3 electricity puzzle. Dark pixels are wires. North is the top of the image.
Which single box-drawing character best matches the wire shape?
You must pick exactly one symbol from this set and no other: ${TILE_GLYPH_CHARS.join(" ")}
Reply with ONLY valid JSON (no markdown): {"symbol":"…"} where the value is exactly one character from the set.`;

const tileGlyphSchema = z.object({
  symbol: z.enum(TILE_GLYPH_CHARS as unknown as [TileGlyphChar, ...TileGlyphChar[]]),
});

function userMessageWithImage(prompt: string, imageSource: string): ChatCompletionMessageParam {
  const isHttp =
    imageSource.startsWith("http://") || imageSource.startsWith("https://");
  const url = isHttp ? imageSource : imageSource;
  const content: ChatContentPart[] = [
    { type: "text", text: prompt },
    { type: "image_url", image_url: { url } },
  ];
  return { role: "user", content };
}

async function visionCompletionText(messages: ChatCompletionMessageParam[]): Promise<string> {
  const model = electricityVisionModel();
  const res = await postChatCompletion({
    model,
    messages,
    max_tokens: VISION_MAX_TOKENS,
  });
  const msg = getFirstChoiceMessage(res);
  return assistantMessageToText(msg ?? {});
}

export function normalizeMaskGrid(raw: unknown): number[][] {
  if (!raw || typeof raw !== "object") {
    throw new Error("Vision JSON must be an object");
  }
  const o = raw as Record<string, unknown>;
  let grid = o.masks ?? o.board ?? o.cells;
  if (!Array.isArray(grid)) {
    throw new Error("Expected masks/board/cells array");
  }
  if (grid.length !== 3) {
    throw new Error(`Expected 3 rows, got ${grid.length}`);
  }
  const out: number[][] = [];
  for (let r = 0; r < 3; r++) {
    const row = grid[r];
    if (!Array.isArray(row) || row.length !== 3) {
      throw new Error(`Row ${r} must have 3 cells`);
    }
    const rowNums: number[] = [];
    for (let c = 0; c < 3; c++) {
      const v = row[c];
      const n = typeof v === "number" ? v : Number.parseInt(String(v), 10);
      if (!Number.isFinite(n) || n < 0 || n > 15) {
        throw new Error(`Invalid mask at ${r},${c}: ${String(v)}`);
      }
      rowNums.push(n & 0xf);
    }
    out.push(rowNums);
  }
  return out;
}

/**
 * Read board state from a PNG via vision (image URL or data URL).
 */
export async function readBoardStateViaVision(
  imageSource: string,
): Promise<number[][]> {
  const messages: ChatCompletionMessageParam[] = [
    userMessageWithImage(VISION_PROMPT, imageSource),
  ];
  const text = await visionCompletionText(messages);
  const parsed = extractJsonObject(text);
  return normalizeMaskGrid(parsed);
}

function visionImagePart(imageSource: string) {
  const isHttp =
    imageSource.startsWith("http://") || imageSource.startsWith("https://");
  const url = isHttp ? imageSource : imageSource;
  return { type: "image_url" as const, image_url: { url } };
}

/**
 * Parse vision JSON for board location into pixel square. Returns null if invalid or nonsensical.
 */
export function parseBoardRectFromVisionJson(
  raw: unknown,
  w: number,
  h: number,
): RectPixels | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;

  if (
    typeof o.x === "number"
    && typeof o.y === "number"
    && typeof o.size === "number"
  ) {
    const x = o.x;
    const y = o.y;
    const size = o.size;
    if (![x, y, size].every((n) => Number.isFinite(n))) {
      return null;
    }
    if (size <= 0 || size > 1.5) {
      return null;
    }
    const minDim = Math.min(w, h);
    let sidePx = Math.round(size * minDim);
    let left = Math.round(x * w);
    let top = Math.round(y * h);
    if (sidePx < 8) {
      return null;
    }
    sidePx = Math.min(sidePx, w - left, h - top, w, h);
    if (sidePx < 8) {
      return null;
    }
    return { left, top, size: sidePx };
  }

  if (
    typeof o.x0 === "number"
    && typeof o.y0 === "number"
    && typeof o.x1 === "number"
    && typeof o.y1 === "number"
  ) {
    const x0 = o.x0;
    const y0 = o.y0;
    const x1 = o.x1;
    const y1 = o.y1;
    if (![x0, y0, x1, y1].every((n) => Number.isFinite(n))) {
      return null;
    }
    let left = Math.round(Math.min(x0, x1) * w);
    let top = Math.round(Math.min(y0, y1) * h);
    const rw = Math.abs(Math.round((x1 - x0) * w));
    const rh = Math.abs(Math.round((y1 - y0) * h));
    let sidePx = Math.min(rw, rh);
    if (sidePx < 8) {
      return null;
    }
    const cx = left + rw / 2;
    const cy = top + rh / 2;
    left = Math.round(cx - sidePx / 2);
    top = Math.round(cy - sidePx / 2);
    left = Math.max(0, Math.min(left, w - sidePx));
    top = Math.max(0, Math.min(top, h - sidePx));
    sidePx = Math.min(sidePx, w - left, h - top);
    if (sidePx < 8) {
      return null;
    }
    return { left, top, size: sidePx };
  }

  return null;
}

/**
 * One vision call: full image → normalized square bbox for the wire grid.
 */
export async function detectBoardSquareViaVision(
  imageSource: string,
  width: number,
  height: number,
): Promise<RectPixels | null> {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "user",
      content: [
        { type: "text", text: BOARD_LOCATE_PROMPT },
        visionImagePart(imageSource),
      ],
    },
  ];

  try {
    const text = await visionCompletionText(messages);
    const parsed = extractJsonObject(text);
    return parseBoardRectFromVisionJson(parsed, width, height);
  } catch {
    return null;
  }
}

/**
 * Read 3×3 masks from nine tile PNG buffers (row-major) in a single vision call.
 */
export async function readBoardStateViaVisionFromTiles(
  tileBuffers: Buffer[],
): Promise<number[][]> {
  if (tileBuffers.length !== 9) {
    throw new Error("Expected exactly 9 tile buffers");
  }

  const imageParts: ChatContentPart[] = tileBuffers.map((b) => ({
    type: "image_url" as const,
    image_url: { url: pngBufferToDataUrl(b) },
  }));

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "user",
      content: [{ type: "text", text: TILES_VISION_PROMPT }, ...imageParts],
    },
  ];

  const text = await visionCompletionText(messages);
  const parsed = extractJsonObject(text);
  return normalizeMaskGrid(parsed);
}

/**
 * One tile PNG → one glyph via JSON response, then → 4-bit mask.
 */
export async function readTileGlyphViaVision(tilePng: Buffer): Promise<number> {
  const dataUrl = pngBufferToDataUrl(tilePng);
  const model = electricityVisionModel();

  const res = await postChatCompletion({
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: TILE_GLYPH_PROMPT },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    temperature: 0,
    max_tokens: GLYPH_JSON_MAX_TOKENS,
    response_format: { type: "json_object" },
  });

  const text = assistantMessageToText(getFirstChoiceMessage(res) ?? {});
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    parsed = extractJsonObject(text);
  }
  const obj = tileGlyphSchema.safeParse(parsed);
  if (!obj.success) {
    throw new Error(`glyph_json_invalid: ${text.slice(0, 200)}`);
  }
  const mask = glyphCharToMask(obj.data.symbol);
  if (mask === null) {
    throw new Error(`glyph_to_mask_failed: ${JSON.stringify(obj.data.symbol)}`);
  }
  return mask & 0xf;
}

/**
 * Nine tile PNG buffers (row-major) → 9× vision calls → 3×3 mask grid.
 */
export async function readMasksFromGlyphTiles(tileBuffers: Buffer[]): Promise<number[][]> {
  if (tileBuffers.length !== 9) {
    throw new Error("Expected exactly 9 tile buffers");
  }

  const masks: number[][] = [[], [], []];
  let i = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const m = await readTileGlyphViaVision(tileBuffers[i]!);
      masks[r]![c] = m;
      i++;
    }
  }
  return masks;
}

import sharp from "sharp";
import type { GridLines } from "./gridDetect.ts";
import { uniformGridLines } from "./gridDetect.ts";

export interface RectPixels {
  left: number;
  top: number;
  size: number;
}

function clampSquareRect(rect: RectPixels, w: number, h: number): RectPixels {
  let left = Math.round(rect.left);
  let top = Math.round(rect.top);
  let size = Math.round(rect.size);
  left = Math.max(0, Math.min(left, Math.max(0, w - 1)));
  top = Math.max(0, Math.min(top, Math.max(0, h - 1)));
  const maxSide = Math.min(w - left, h - top);
  size = Math.max(1, Math.min(size, maxSide));
  return { left, top, size };
}

/**
 * Center square crop with optional inset (fraction of side, 0–0.45) shrinking toward the middle.
 * Or extract a square region from `rectPixels` (from vision).
 */
export async function extractBoardSquare(
  buffer: Buffer,
  opts: {
    cropInset?: number;
    rectPixels?: RectPixels;
  },
): Promise<Buffer> {
  const meta = await sharp(buffer).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w <= 0 || h <= 0) {
    throw new Error("Invalid image dimensions");
  }

  if (opts.rectPixels) {
    const { left, top, size } = clampSquareRect(opts.rectPixels, w, h);
    return sharp(buffer)
      .extract({ left, top, width: size, height: size })
      .png()
      .toBuffer();
  }

  let s = Math.min(w, h);
  let left = Math.floor((w - s) / 2);
  let top = Math.floor((h - s) / 2);

  const inset = opts.cropInset ?? 0;
  const insetClamped = Math.max(0, Math.min(0.45, inset));
  if (insetClamped > 0) {
    const margin = Math.round(s * insetClamped);
    const newSide = s - 2 * margin;
    if (newSide < 1) {
      throw new Error("cropInset too large for image");
    }
    left += margin;
    top += margin;
    s = newSide;
  }

  return sharp(buffer)
    .extract({ left, top, width: s, height: s })
    .png()
    .toBuffer();
}

/** Shrink each side of the tile by `fraction` of width/height (reduces neighbor bleed for vision). */
export async function applyFractionalTileInset(
  tile: Buffer,
  fraction: number,
): Promise<Buffer> {
  const f = Math.max(0, Math.min(0.45, fraction));
  if (f <= 0) {
    return tile;
  }
  const meta = await sharp(tile).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w < 1 || h < 1) {
    return tile;
  }
  const mx = Math.round(w * f);
  const my = Math.round(h * f);
  const nw = Math.max(1, w - 2 * mx);
  const nh = Math.max(1, h - 2 * my);
  return sharp(tile)
    .extract({ left: mx, top: my, width: nw, height: nh })
    .png()
    .toBuffer();
}

/**
 * Split square board into 9 tiles using grid line positions; inset each cell by `paddingPx`
 * from the cell rectangle to avoid grid line artifacts.
 * Optional `visionInsetFraction` trims a further fraction from each side of every tile (neighbor noise).
 */
export async function splitSquareToTilesWithGrid(
  square: Buffer,
  lines: GridLines,
  paddingPx: number,
  opts?: { visionInsetFraction?: number },
): Promise<Buffer[]> {
  const meta = await sharp(square).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w <= 0 || h <= 0) {
    throw new Error("Invalid square dimensions");
  }

  const frac = opts?.visionInsetFraction ?? 0;
  const tiles: Buffer[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const x0 = lines.x[c]!;
      const x1 = lines.x[c + 1]!;
      const y0 = lines.y[r]!;
      const y1 = lines.y[r + 1]!;
      let left = x0 + paddingPx;
      let top = y0 + paddingPx;
      let width = x1 - x0 - 2 * paddingPx;
      let height = y1 - y0 - 2 * paddingPx;
      left = Math.max(0, Math.min(left, w - 1));
      top = Math.max(0, Math.min(top, h - 1));
      width = Math.max(1, Math.min(width, w - left));
      height = Math.max(1, Math.min(height, h - top));
      let buf = await sharp(square)
        .extract({ left, top, width, height })
        .png()
        .toBuffer();
      if (frac > 0) {
        buf = await applyFractionalTileInset(buf, frac);
      }
      tiles.push(buf);
    }
  }
  return tiles;
}

function thirdSegmentLengths(total: number): [number, number, number] {
  const a = Math.floor(total / 3);
  const r = total % 3;
  return [
    a + (r > 0 ? 1 : 0),
    a + (r > 1 ? 1 : 0),
    a + (r > 2 ? 1 : 0),
  ];
}

export interface SplitTilesOptions {
  /** Inset from cell bounds; use TILE_PADDING_PX (e.g. 12) to skip grid lines. */
  paddingPx?: number;
  /** If omitted, equal thirds of the square side. */
  gridLines?: GridLines;
  /** Extra inset per tile as a fraction of tile width/height (vision noise from neighbors). */
  visionInsetFraction?: number;
}

/**
 * Split a square PNG buffer into 9 tiles (row-major: [0,0]…[2,2]).
 * Default: equal thirds; optional grid lines + padding shrink each crop inward.
 */
export async function splitPngToTiles3x3(
  square: Buffer,
  opts?: SplitTilesOptions,
): Promise<Buffer[]> {
  const meta = await sharp(square).metadata();
  const s = meta.width ?? 0;
  const sh = meta.height ?? 0;
  if (s <= 0 || s !== sh) {
    throw new Error("splitPngToTiles3x3 expects a square image");
  }

  const lines = opts?.gridLines ?? uniformGridLines(s);
  const pad = opts?.paddingPx ?? 0;
  const visFrac = opts?.visionInsetFraction ?? 0;
  if (pad === 0 && !opts?.gridLines) {
    const [w0, w1, w2] = thirdSegmentLengths(s);
    const [h0, h1, h2] = thirdSegmentLengths(s);
    const colLeft = [0, w0, w0 + w1];
    const rowTop = [0, h0, h0 + h1];
    const tiles: Buffer[] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const left = colLeft[c]!;
        const top = rowTop[r]!;
        const width = c === 2 ? w2 : (c === 0 ? w0 : w1);
        const height = r === 2 ? h2 : (r === 0 ? h0 : h1);
        let buf = await sharp(square)
          .extract({ left, top, width, height })
          .png()
          .toBuffer();
        if (visFrac > 0) {
          buf = await applyFractionalTileInset(buf, visFrac);
        }
        tiles.push(buf);
      }
    }
    return tiles;
  }

  return splitSquareToTilesWithGrid(square, lines, pad, {
    visionInsetFraction: visFrac,
  });
}

export function pngBufferToDataUrl(buffer: Buffer): string {
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

import type { RawBinary } from "./imagePreprocess.ts";
import { thresholdToBinary } from "./imagePreprocess.ts";

/** Longest contiguous run of black pixels per row. */
export function longestBlackRunPerRow(
  binary: Uint8Array,
  width: number,
  height: number,
): number[] {
  const out = new Array<number>(height).fill(0);
  for (let y = 0; y < height; y++) {
    let best = 0;
    let cur = 0;
    for (let x = 0; x < width; x++) {
      const dark = binary[y * width + x] === 0;
      if (dark) {
        cur++;
        if (cur > best) best = cur;
      } else {
        cur = 0;
      }
    }
    out[y] = best;
  }
  return out;
}

/** Longest contiguous run of black pixels per column. */
export function longestBlackRunPerCol(
  binary: Uint8Array,
  width: number,
  height: number,
): number[] {
  const out = new Array<number>(width).fill(0);
  for (let x = 0; x < width; x++) {
    let best = 0;
    let cur = 0;
    for (let y = 0; y < height; y++) {
      const dark = binary[y * width + x] === 0;
      if (dark) {
        cur++;
        if (cur > best) best = cur;
      } else {
        cur = 0;
      }
    }
    out[x] = best;
  }
  return out;
}

function horizontalProjection(binary: Uint8Array, width: number, height: number): number[] {
  const proj = new Array<number>(height).fill(0);
  for (let y = 0; y < height; y++) {
    let s = 0;
    for (let x = 0; x < width; x++) {
      if (binary[y * width + x] === 0) s++;
    }
    proj[y] = s;
  }
  return proj;
}

function verticalProjection(binary: Uint8Array, width: number, height: number): number[] {
  const proj = new Array<number>(width).fill(0);
  for (let x = 0; x < width; x++) {
    let s = 0;
    for (let y = 0; y < height; y++) {
      if (binary[y * width + x] === 0) s++;
    }
    proj[x] = s;
  }
  return proj;
}

function pickPeaks(values: number[], count: number, minSep: number): number[] | null {
  if (values.length < count || count < 1) return null;
  const candidates: { i: number; v: number }[] = [];
  for (let i = 1; i < values.length - 1; i++) {
    const v = values[i]!;
    if (v >= values[i - 1]! && v >= values[i + 1]! && v > 0) {
      candidates.push({ i, v });
    }
  }
  candidates.sort((a, b) => b.v - a.v);
  const picked: number[] = [];
  for (const { i } of candidates) {
    if (picked.every((p) => Math.abs(p - i) >= minSep)) {
      picked.push(i);
      if (picked.length === count) break;
    }
  }
  if (picked.length < count) return null;
  return picked.sort((a, b) => a - b);
}

export interface GridLines {
  x: number[];
  y: number[];
}

/**
 * Detect two internal horizontal and two internal vertical grid lines from dark pixels
 * (projections + longest black runs). Returns 4 boundaries per axis including edges.
 */
export function detectGridLines(raw: RawBinary): GridLines | null {
  const w = raw.width;
  const h = raw.height;
  if (w < 16 || h < 16) return null;
  const binary = thresholdToBinary(raw, 128);
  const hProj = horizontalProjection(binary, w, h);
  const vProj = verticalProjection(binary, w, h);
  const hRuns = longestBlackRunPerRow(binary, w, h);
  const vRuns = longestBlackRunPerCol(binary, w, h);

  const minSepH = Math.max(4, Math.floor(h / 10));
  const minSepW = Math.max(4, Math.floor(w / 10));

  const maxH = Math.max(...hProj, 1);
  const maxV = Math.max(...vProj, 1);
  const hScore = hProj.map((v, i) => v + hRuns[i]! * 0.5 + (v >= maxH * 0.4 ? maxH * 0.1 : 0));
  const vScore = vProj.map((v, i) => v + vRuns[i]! * 0.5 + (v >= maxV * 0.4 ? maxV * 0.1 : 0));

  const innerH = pickPeaks(hScore, 2, minSepH);
  const innerV = pickPeaks(vScore, 2, minSepW);
  if (!innerH || !innerV) return null;

  const yLines = [0, innerH[0]!, innerH[1]!, h];
  const xLines = [0, innerV[0]!, innerV[1]!, w];

  if (yLines[1]! >= yLines[2]! || xLines[1]! >= xLines[2]!) return null;

  return { x: xLines, y: yLines };
}

export function uniformGridLines(size: number): GridLines {
  const a = Math.floor(size / 3);
  const r = size % 3;
  const x1 = a + (r > 0 ? 1 : 0);
  const x2 = x1 + a + (r > 1 ? 1 : 0);
  return {
    x: [0, x1, x2, size],
    y: [0, x1, x2, size],
  };
}

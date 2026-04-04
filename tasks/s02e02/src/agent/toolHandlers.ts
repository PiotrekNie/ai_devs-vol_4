import sharp from "sharp";
import { extractFlagFromText, fetchBoardPng, postVerifyRotate } from "../hub.ts";
import {
  cellIdFromIndices,
  diffVsTarget,
  parseCellId,
  planRotationsFlat,
  type CellId,
} from "../plan.ts";
import {
  detectBoardSquareViaVision,
  readBoardStateViaVision,
  readMasksFromGlyphTiles,
} from "../pipeline.ts";
import {
  extractBoardSquare,
  pngBufferToDataUrl,
  splitPngToTiles3x3,
  splitSquareToTilesWithGrid,
} from "../splitImageGrid.ts";
import { rotateMaskBy } from "../symbols.ts";
import { boardPngUrl, hubApiKey, TILE_PADDING_PX } from "../config.ts";
import { readBoardConsensusFromUrl } from "../visionConsensus.ts";
import { toGrayscaleBinaryPng, toGreyscaleRaw } from "../imagePreprocess.ts";
import { detectGridLines, uniformGridLines } from "../gridDetect.ts";
import { solveBoard, type SolveBoardResult } from "../deterministicSolver.ts";

export interface FetchBoardResult {
  ok: boolean;
  status: number;
  url: string;
  byteLength: number;
  contentType: string;
}

export async function handleFetchBoard(options?: {
  reset?: boolean;
}): Promise<FetchBoardResult> {
  const key = hubApiKey();
  let url = boardPngUrl(key);
  if (options?.reset) {
    url += (url.includes("?") ? "&" : "?") + "reset=1";
  }
  const res = await fetchBoardPng(url);
  return {
    ok: res.ok,
    status: res.status,
    url,
    byteLength: res.bytes.length,
    contentType: res.contentType,
  };
}

/**
 * Fetch → grayscale+threshold → square crop → detect grid lines (or uniform thirds) →
 * 9 tiles with TILE_PADDING_PX inset → vision masks.
 */
async function masksFromPreprocessedPipeline(
  buf: Buffer,
  opts: {
    cropInset?: number;
    boardCrop?: "center" | "vision";
  },
): Promise<{
  masks: number[][];
  originalSize: { width: number; height: number };
  croppedSize: { width: number; height: number };
  grid: "detected" | "uniform";
}> {
  const meta0 = await sharp(buf).metadata();
  const ow = meta0.width ?? 0;
  const oh = meta0.height ?? 0;

  const bin = await toGrayscaleBinaryPng(buf);

  const mode = opts.boardCrop ?? "center";
  let rectPixels: { left: number; top: number; size: number } | undefined;
  if (mode === "vision") {
    const detected = await detectBoardSquareViaVision(
      pngBufferToDataUrl(bin),
      ow,
      oh,
    );
    if (detected) {
      rectPixels = detected;
    }
  }

  const square = await extractBoardSquare(bin, {
    cropInset: mode === "center" ? opts.cropInset : undefined,
    rectPixels,
  });
  const meta1 = await sharp(square).metadata();
  const sw = meta1.width ?? 0;

  const raw = await toGreyscaleRaw(square);
  const detectedLines = detectGridLines(raw);
  const lines = detectedLines ?? uniformGridLines(sw);
  const grid = detectedLines ? "detected" : "uniform";

  const tiles = await splitSquareToTilesWithGrid(square, lines, TILE_PADDING_PX);
  const masks = await readMasksFromGlyphTiles(tiles);

  return {
    masks,
    originalSize: { width: ow, height: oh },
    croppedSize: {
      width: meta1.width ?? 0,
      height: meta1.height ?? 0,
    },
    grid,
  };
}

/**
 * Deterministic perception path: B&W, grid detection, 9 crops with 12px padding, vision.
 */
export async function handleReadBoard(input: {
  imageUrl?: string;
}): Promise<{
  masks: number[][];
  source: string;
  grid: "detected" | "uniform";
  originalSize: { width: number; height: number };
  croppedSize: { width: number; height: number };
}> {
  const url = input.imageUrl?.trim() || boardPngUrl();
  const res = await fetchBoardPng(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch board PNG: HTTP ${res.status}`);
  }
  const buf = Buffer.from(res.bytes);
  const r = await masksFromPreprocessedPipeline(buf, { boardCrop: "center" });
  return {
    masks: r.masks,
    source: url,
    grid: r.grid,
    originalSize: r.originalSize,
    croppedSize: r.croppedSize,
  };
}

export async function handleReadBoardState(input: {
  imageUrl?: string;
}): Promise<{ masks: number[][]; source: string }> {
  const url = input.imageUrl?.trim() || boardPngUrl();
  const masks = await readBoardStateViaVision(url);
  return { masks, source: url };
}

/** Two agreeing full-frame vision reads (or single read if consensus rounds = 0). */
export async function handleReadBoardStateConsensus(input: {
  imageUrl?: string;
}): Promise<{ masks: number[][]; source: string }> {
  const url = input.imageUrl?.trim() || boardPngUrl();
  const masks = await readBoardConsensusFromUrl(url);
  return { masks, source: url };
}

/**
 * Fetch PNG → B&W → optional vision bbox → square → grid lines → 9 tiles with padding → vision.
 */
export async function handleSplitImageToGrid(input: {
  imageUrl?: string;
  cropInset?: number;
  boardCrop?: "center" | "vision";
}): Promise<{
  masks: number[][];
  source: string;
  originalSize?: { width: number; height: number };
  croppedSize?: { width: number; height: number };
  grid?: "detected" | "uniform";
}> {
  const url = input.imageUrl?.trim() || boardPngUrl();
  const res = await fetchBoardPng(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch board PNG: HTTP ${res.status}`);
  }

  const buf = Buffer.from(res.bytes);
  const r = await masksFromPreprocessedPipeline(buf, {
    cropInset: input.cropInset,
    boardCrop: input.boardCrop,
  });

  return {
    masks: r.masks,
    source: url,
    originalSize: r.originalSize,
    croppedSize: r.croppedSize,
    grid: r.grid,
  };
}

export function handlePlanRotations(input: {
  current: number[][];
  target: number[][];
}): {
  ok: boolean;
  topologyMismatch?: unknown;
  rotations: Array<{ cell: CellId; count: number }>;
  flat: CellId[];
} {
  const diff = diffVsTarget(input.current, input.target);
  return {
    ok: diff.ok,
    ...(diff.topologyMismatch
      ? { topologyMismatch: diff.topologyMismatch }
      : {}),
    rotations: diff.rotations,
    flat: planRotationsFlat(diff.rotations),
  };
}

/** Deterministic rotation counts 0–3 per cell; no LLM. */
export function handleSolveBoard(input: {
  current: number[][];
  target: number[][];
}): SolveBoardResult {
  return solveBoard(input.current, input.target);
}

/**
 * Row-major: for each cell apply `rotations[r][c]` right turns (0–3). Stops early if hub returns a flag.
 */
export async function handleApplyRotations(input: {
  rotations: number[][];
}): Promise<{
  ok: boolean;
  flag?: string;
  rotationsApplied: number;
  verifyBodies: string[];
}> {
  const g = input.rotations;
  if (!Array.isArray(g) || g.length !== 3) {
    return { ok: false, rotationsApplied: 0, verifyBodies: [] };
  }
  const verifyBodies: string[] = [];
  let rotationsApplied = 0;
  let flag: string | undefined;

  for (let r = 0; r < 3; r++) {
    if (!Array.isArray(g[r]) || g[r]!.length !== 3) {
      return { ok: false, rotationsApplied, verifyBodies };
    }
    for (let c = 0; c < 3; c++) {
      const n = Math.min(3, Math.max(0, Math.floor(g[r]![c] ?? 0)));
      const cell = cellIdFromIndices(r, c);
      for (let i = 0; i < n; i++) {
        const res = await postVerifyRotate(cell);
        verifyBodies.push(res.bodyText);
        rotationsApplied++;
        flag =
          extractFlagFromText(res.bodyText)
          ?? (typeof res.json === "object" && res.json !== null
            ? extractFlagFromText(JSON.stringify(res.json))
            : undefined);
        if (flag) {
          return { ok: true, flag, rotationsApplied, verifyBodies };
        }
      }
    }
  }

  return { ok: true, rotationsApplied, verifyBodies };
}

export async function handleRotateCell(input: { rotate: string }): Promise<{
  status: number;
  bodyText: string;
  json: unknown;
  flag?: string;
}> {
  const res = await postVerifyRotate(input.rotate);
  const flag =
    extractFlagFromText(res.bodyText)
    ?? (typeof res.json === "object" && res.json !== null
      ? extractFlagFromText(JSON.stringify(res.json))
      : undefined);
  return { ...res, ...(flag ? { flag } : {}) };
}

export async function handleResetBoard(): Promise<FetchBoardResult> {
  return handleFetchBoard({ reset: true });
}

/**
 * Apply `count` consecutive right rotations at `cell`, checking each /verify response for a flag.
 * Then re-read the board and compare the cell mask to the expected mask after applying turns
 * to the **pre-rotation** mask from the last vision read.
 */
export async function handleApplyRotationsForCell(input: {
  cell: string;
  count: number;
  /** 3×3 grid from the last `read_board_state` (required for mismatch detection). */
  previousMasks: number[][];
  targetMasks: number[][];
}): Promise<{
  ok: boolean;
  cell: string;
  count: number;
  flag?: string;
  verifyBodies: string[];
  expectedMask?: number;
  seenMask?: number;
  mismatch?: boolean;
  error?: string;
}> {
  const cell = input.cell.trim() as CellId;
  const idx = parseCellId(cell);
  if (!idx) {
    return {
      ok: false,
      cell,
      count: input.count,
      error: "invalid_cell",
      verifyBodies: [],
    };
  }

  const count = Math.min(4, Math.max(1, Math.floor(input.count)));
  const { row, col } = idx;
  const startMask = input.previousMasks[row]?.[col];
  if (startMask === undefined) {
    return {
      ok: false,
      cell,
      count,
      error: "missing_previous_mask",
      verifyBodies: [],
    };
  }

  const verifyBodies: string[] = [];
  let flag: string | undefined;

  for (let i = 0; i < count; i++) {
    const res = await postVerifyRotate(cell);
    verifyBodies.push(res.bodyText);
    const f = extractFlagFromText(res.bodyText);
    if (f) {
      flag = f;
      break;
    }
    const fj = typeof res.json === "object" && res.json !== null
      ? extractFlagFromText(JSON.stringify(res.json))
      : undefined;
    if (fj) {
      flag = fj;
      break;
    }
  }

  if (flag) {
    return {
      ok: true,
      cell,
      count,
      flag,
      verifyBodies,
    };
  }

  const url = boardPngUrl();
  const seen = await readBoardStateViaVision(url);
  const expectedMask = rotateMaskBy(startMask & 0xf, count) & 0xf;
  const seenMask = seen[row]?.[col];
  if (seenMask === undefined) {
    return {
      ok: false,
      cell,
      count,
      verifyBodies,
      error: "vision_read_failed",
    };
  }

  const mismatch = (seenMask & 0xf) !== expectedMask;

  return {
    ok: !mismatch,
    cell,
    count,
    verifyBodies,
    expectedMask,
    seenMask: seenMask & 0xf,
    mismatch,
  };
}

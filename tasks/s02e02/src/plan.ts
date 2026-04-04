import { rotationsToReachMask } from "./symbols.ts";

export type CellId = `${1 | 2 | 3}x${1 | 2 | 3}`;

const CELL_RE = /^([123])x([123])$/;

export function parseCellId(cell: string): { row: number; col: number } | null {
  const m = cell.trim().match(CELL_RE);
  if (!m?.[1] || !m?.[2]) {
    return null;
  }
  return { row: Number(m[1]) - 1, col: Number(m[2]) - 1 };
}

export function cellIdFromIndices(row: number, col: number): CellId {
  return `${row + 1}x${col + 1}` as CellId;
}

export interface CellRotation {
  cell: CellId;
  /** Number of 90° right turns needed (0–3). */
  count: number;
}

export interface DiffResult {
  ok: boolean;
  /** Present when a cell's mask cannot be rotated into the target (wrong piece). */
  topologyMismatch?: Array<{ cell: CellId; current: number; target: number }>;
  rotations: CellRotation[];
}

/**
 * Compare current vs target 3×3 masks. Only includes cells that need >0 turns.
 */
export function diffVsTarget(
  current: number[][],
  target: number[][],
): DiffResult {
  const mismatch: NonNullable<DiffResult["topologyMismatch"]> = [];
  const rotations: CellRotation[] = [];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cur = current[r]?.[c];
      const tgt = target[r]?.[c];
      if (cur === undefined || tgt === undefined) {
        continue;
      }
      const k = rotationsToReachMask(cur, tgt);
      const cell = cellIdFromIndices(r, c);
      if (k === null) {
        mismatch.push({ cell, current: cur & 0xf, target: tgt & 0xf });
      } else if (k > 0) {
        rotations.push({ cell, count: k });
      }
    }
  }

  return {
    ok: mismatch.length === 0,
    ...(mismatch.length ? { topologyMismatch: mismatch } : {}),
    rotations,
  };
}

/** Flat sequence: repeat each cell `count` times (one hub call per turn). */
export function planRotationsFlat(rotations: CellRotation[]): CellId[] {
  const out: CellId[] = [];
  for (const { cell, count } of rotations) {
    for (let i = 0; i < count; i++) {
      out.push(cell);
    }
  }
  return out;
}

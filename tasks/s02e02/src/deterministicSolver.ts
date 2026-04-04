import {
  EDGE_E,
  EDGE_N,
  EDGE_S,
  EDGE_W,
  rotateMaskBy,
} from "./symbols.ts";
import { cellIdFromIndices, type CellId } from "./plan.ts";

export type PieceFamily = "void" | "end" | "I" | "L" | "T" | "cross";

function popcount4(m: number): number {
  let n = m & 0xf;
  let c = 0;
  while (n) {
    c += n & 1;
    n >>= 1;
  }
  return c;
}

/** Group tile shape for diagnostics (I/L/T/…). */
export function pieceFamily(mask: number): PieceFamily {
  const m = mask & 0xf;
  const pc = popcount4(m);
  if (pc === 0) return "void";
  if (pc === 1) return "end";
  if (pc === 4) return "cross";
  if (pc === 3) return "T";
  if (pc === 2) {
    const opp =
      (m === (EDGE_N | EDGE_S)) || (m === (EDGE_E | EDGE_W));
    return opp ? "I" : "L";
  }
  return "T";
}

/** All k in 0..3 such that rotateMaskBy(current,k) === (target & 0xf). */
export function allValidRotations(current: number, target: number): number[] {
  const t = target & 0xf;
  const out: number[] = [];
  for (let k = 0; k < 4; k++) {
    if (rotateMaskBy(current & 0xf, k) === t) {
      out.push(k);
    }
  }
  return out;
}

export interface SolveBoardResult {
  ok: boolean;
  rotations?: number[][];
  pieceFamilies?: PieceFamily[][];
  topologyMismatch?: Array<{ cell: CellId; current: number; target: number }>;
}

/**
 * Deterministic solver: per-cell rotation counts to match target.
 * - Groups tiles by piece family for diagnostics (I/L/T/cross/…).
 * - For each cell, picks the smallest valid k in 0..3 (equivalent to
 *   rotationsToReachMask / first successful quarter-turn count). When a piece
 *   has rotational symmetry (e.g. cross 0xF), all k ∈ {0,1,2,3} are valid;
 *   we always choose k = 0 as the minimal right-turn count.
 * Neighbor backtracking is not applied: hub applies independent cell rotations;
 * shared-edge bitwise checks on raw masks are not guaranteed by the task’s
 * reference encoding, so compatibility is expressed solely as equality to the
 * target mask after rotation per cell.
 */
export function solveBoard(
  current: number[][],
  target: number[][],
): SolveBoardResult {
  const rotations: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const families: PieceFamily[][] = [];
  const mismatch: NonNullable<SolveBoardResult["topologyMismatch"]> = [];

  for (let r = 0; r < 3; r++) {
    families[r] = [];
    for (let c = 0; c < 3; c++) {
      const cur = current[r]![c]!;
      const tgt = target[r]![c]!;
      families[r]![c] = pieceFamily(cur);
      const opts = allValidRotations(cur, tgt);
      if (opts.length === 0) {
        mismatch.push({
          cell: cellIdFromIndices(r, c),
          current: cur & 0xf,
          target: tgt & 0xf,
        });
      } else {
        rotations[r]![c] = Math.min(...opts);
      }
    }
  }

  if (mismatch.length > 0) {
    return { ok: false, topologyMismatch: mismatch, pieceFamilies: families };
  }

  return { ok: true, rotations, pieceFamilies: families };
}

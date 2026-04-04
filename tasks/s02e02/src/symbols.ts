/**
 * Edge masks for one tile: N=1, E=2, S=4, W=8 (clockwise from north).
 * Rotating the physical tile 90° clockwise moves each edge to the next compass direction.
 */
export const EDGE_N = 1;
export const EDGE_E = 2;
export const EDGE_S = 4;
export const EDGE_W = 8;

/** One clockwise 90° turn on the tile (edges move with the artwork). */
export function rotateMaskCw(mask: number): number {
  const n = mask & EDGE_N;
  const e = mask & EDGE_E;
  const s = mask & EDGE_S;
  const w = mask & EDGE_W;
  // N<-W, E<-N, S<-E, W<-S
  let out = 0;
  if (w) {
    out |= EDGE_N;
  }
  if (n) {
    out |= EDGE_E;
  }
  if (e) {
    out |= EDGE_S;
  }
  if (s) {
    out |= EDGE_W;
  }
  return out;
}

export function rotateMaskBy(mask: number, quarterTurns: number): number {
  let m = mask & 0xf;
  let t = ((quarterTurns % 4) + 4) % 4;
  while (t > 0) {
    m = rotateMaskCw(m);
    t--;
  }
  return m;
}

/**
 * Smallest k in 0..3 such that rotateMaskBy(current,k)===target, or null if impossible
 * (different topology / piece family).
 */
export function rotationsToReachMask(current: number, target: number): number | null {
  let m = current & 0xf;
  const t = target & 0xf;
  for (let k = 0; k < 4; k++) {
    if (m === t) {
      return k;
    }
    m = rotateMaskCw(m);
  }
  return null;
}

/** Apply the same rotation operator used by the hub (right turns) to a mask. */
export function applyRotationsToSymbolMask(mask: number, rightTurns: number): number {
  return rotateMaskBy(mask, rightTurns);
}

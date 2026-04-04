import { electricityVisionConsensusRounds } from "./config.ts";
import { readBoardStateViaVision } from "./pipeline.ts";

export function masksEqual(a: number[][], b: number[][]): boolean {
  if (a.length !== 3 || b.length !== 3) {
    return false;
  }
  for (let r = 0; r < 3; r++) {
    const rowA = a[r];
    const rowB = b[r];
    if (!rowA || !rowB || rowA.length !== 3 || rowB.length !== 3) {
      return false;
    }
    for (let c = 0; c < 3; c++) {
      if ((rowA[c]! & 0xf) !== (rowB[c]! & 0xf)) {
        return false;
      }
    }
  }
  return true;
}

type VisionReadFn = (imageSource: string) => Promise<number[][]>;

/**
 * Two (or more) full-frame vision reads until two agree, then a third read as tie-break.
 * When `ELECTRICITY_VISION_CONSENSUS_ROUNDS` is 0, performs a single read.
 */
export async function readBoardConsensusFromUrl(
  url: string,
  read: VisionReadFn = readBoardStateViaVision,
): Promise<number[][]> {
  const rounds = electricityVisionConsensusRounds();
  if (rounds === 0) {
    return read(url);
  }

  for (let i = 0; i < rounds; i++) {
    const first = await read(url);
    const second = await read(url);
    if (masksEqual(first, second)) {
      return first;
    }
  }

  return read(url);
}

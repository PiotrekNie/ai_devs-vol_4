import { REFERENCE_SOLVED_MASKS } from "./config.ts";

function parseEnvMasks(): number[][] | null {
  const raw = process.env.ELECTRICITY_TARGET_MASKS?.trim();
  if (!raw) {
    return null;
  }
  const data = JSON.parse(raw) as unknown;
  if (!Array.isArray(data) || data.length !== 3) {
    throw new Error("ELECTRICITY_TARGET_MASKS must be a JSON 3×3 array of numbers");
  }
  return data.map((row, ri) => {
    if (!Array.isArray(row) || row.length !== 3) {
      throw new Error(`ELECTRICITY_TARGET_MASKS row ${ri} must have 3 numbers`);
    }
    return row.map((v, ci) => {
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isFinite(n) || n < 0 || n > 15) {
        throw new Error(`Invalid mask at [${ri}][${ci}]`);
      }
      return n & 0xf;
    });
  });
}

function cloneGrid(g: readonly (readonly number[])[]): number[][] {
  return g.map((row) => [...row]);
}

/**
 * Stan docelowy: `ELECTRICITY_TARGET_MASKS` w env, inaczej {@link REFERENCE_SOLVED_MASKS}.
 * Aktualny stan planszy nadal pochodzi z vision na `electricity.png` (`read_board_state`).
 */
export async function resolveTargetMasks(): Promise<number[][]> {
  const fromEnv = parseEnvMasks();
  if (fromEnv) {
    return fromEnv;
  }
  return cloneGrid(REFERENCE_SOLVED_MASKS);
}

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { CalibrationState } from "./types.js";
import { getCalibration } from "./tokens.js";
import { logMemory } from "../../utils/logger.js";

const pad = (n: number): string => String(n).padStart(3, "0");

async function persistMemoryLog(
  persistDir: string,
  prefix: string,
  seq: number,
  body: string,
  metadata: Record<string, string | number>,
): Promise<void> {
  if (!persistDir) return;

  const filename = `${prefix}-${pad(seq)}.md`;
  const path = join(persistDir, filename);
  const frontmatter = Object.entries(metadata)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const content = `---\n${frontmatter}\ncreated: ${new Date().toISOString()}\n---\n\n${body}\n`;

  try {
    await mkdir(persistDir, { recursive: true });
    await writeFile(path, content, "utf8");
    logMemory("persist", { file: filename });
  } catch (err) {
    logMemory("persist-error", {
      file: filename,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

function calibrationMeta(
  cal: CalibrationState,
  tokensRaw: number,
  tokensCalibrated: number,
): Record<string, string | number> {
  const { ratio } = getCalibration(cal);
  return {
    tokens_raw: tokensRaw,
    tokens_calibrated: tokensCalibrated,
    calibration_ratio: ratio ?? "n/a",
  };
}

export async function persistObserverLog(args: {
  persistDir: string;
  sessionId: string;
  sequence: number;
  observations: string;
  tokensRaw: number;
  tokensCalibrated: number;
  messagesObserved: number;
  generation: number;
  calibration: CalibrationState;
}): Promise<void> {
  await persistMemoryLog(
    args.persistDir,
    "observer",
    args.sequence,
    args.observations,
    {
      type: "observation",
      session: args.sessionId,
      sequence: args.sequence,
      generation: args.generation,
      messages_observed: args.messagesObserved,
      ...calibrationMeta(args.calibration, args.tokensRaw, args.tokensCalibrated),
    },
  );
}

export async function persistReflectorLog(args: {
  persistDir: string;
  sessionId: string;
  sequence: number;
  observations: string;
  tokensRaw: number;
  tokensCalibrated: number;
  generation: number;
  compressionLevel: number;
  calibration: CalibrationState;
}): Promise<void> {
  await persistMemoryLog(
    args.persistDir,
    "reflector",
    args.sequence,
    args.observations,
    {
      type: "reflection",
      session: args.sessionId,
      sequence: args.sequence,
      generation: args.generation,
      compression_level: args.compressionLevel,
      ...calibrationMeta(args.calibration, args.tokensRaw, args.tokensCalibrated),
    },
  );
}

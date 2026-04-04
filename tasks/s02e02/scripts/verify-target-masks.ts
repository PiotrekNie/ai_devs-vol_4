/**
 * Maintenance: po zmianie assetu huba (`solved_electricity.png`) lub podejrzeniu rozjazdu mask,
 * porównuje odczyt vision z `resolveTargetMasks()` i wychodzi z kodem 1 przy rozbieżności —
 * wtedy zaktualizuj `REFERENCE_SOLVED_MASKS` lub `ELECTRICITY_TARGET_MASKS`.
 *
 * Uruchomienie z katalogu `tasks/s02e02`: `bun run verify-target` (albo:
 * `bun --env-file=../.env run scripts/verify-target-masks.ts`).
 */
import { DEFAULT_REFERENCE_SOLVED_IMAGE } from "../src/config.ts";
import { readBoardStateViaVision } from "../src/pipeline.ts";
import { resolveTargetMasks } from "../src/target.ts";
import { masksEqual } from "../src/visionConsensus.ts";

const target = await resolveTargetMasks();
console.log("Target (env or reference):", JSON.stringify(target));
console.log("Vision URL:", DEFAULT_REFERENCE_SOLVED_IMAGE);

const seen = await readBoardStateViaVision(DEFAULT_REFERENCE_SOLVED_IMAGE);
console.log("Vision read:", JSON.stringify(seen));

if (!masksEqual(seen, target)) {
  console.error("verify-target-masks: MISMATCH — fix ELECTRICITY_TARGET_MASKS or REFERENCE_SOLVED_MASKS.");
  process.exit(1);
}

console.log("verify-target-masks: OK — target grid matches vision on solved PNG.");

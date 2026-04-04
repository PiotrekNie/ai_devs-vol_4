/**
 * Orkiestracja: read_board → solve_board → apply_rotations → flag; retry po resecie.
 */
import { ELECTRICITY_MAX_ITERATIONS } from "./src/config.ts";
import { resolveTargetMasks } from "./src/target.ts";
import {
  handleApplyRotations,
  handleFetchBoard,
  handleReadBoard,
} from "./src/agent/toolHandlers.ts";
import { solveBoard } from "./src/deterministicSolver.ts";
import { masksEqual } from "./src/visionConsensus.ts";

async function main() {
  console.log("[deterministic] Resolving target masks (env or reference vision)…");
  const target = await resolveTargetMasks();
  console.log("[deterministic] Target:", JSON.stringify(target));

  for (let round = 0; round < ELECTRICITY_MAX_ITERATIONS; round++) {
    console.log(
      `\n[deterministic] ══ Round ${round + 1}/${ELECTRICITY_MAX_ITERATIONS} ══`,
    );

    console.log("[deterministic] Step 1/5 read_board (vision → masks)");
    const read = await handleReadBoard({});
    console.log("[deterministic]   masks:", JSON.stringify(read.masks));

    console.log("[deterministic] Step 2/5 solve_board (vs target)");
    const sol = solveBoard(read.masks, target);
    if (!sol.ok) {
      console.warn(
        "[deterministic]   topology_mismatch:",
        sol.topologyMismatch,
      );
      console.log("[deterministic] Step 2b reset_board (hub) and retry round");
      await handleFetchBoard({ reset: true });
      continue;
    }

    const totalTurns = sol.rotations!.flat().reduce((a, b) => a + b, 0);
    console.log(
      `[deterministic]   rotations matrix (0–3 per cell): ${JSON.stringify(sol.rotations)} | total quarter-turns=${totalTurns}`,
    );

    if (totalTurns === 0) {
      console.log(
        "[deterministic] Step 3/5 skipped — vision already matches target (0 rotations). If the hub already returned a flag earlier, you are done.",
      );
      return;
    }

    console.log(
      `[deterministic] Step 3/5 apply_rotations (${totalTurns} POST /verify calls)`,
    );
    const res = await handleApplyRotations({ rotations: sol.rotations! });
    console.log(
      `[deterministic]   applied=${res.rotationsApplied} ok=${res.ok}`,
      res.flag ? `flag=${res.flag}` : "",
    );
    if (res.flag) {
      console.log("[deterministic] Step 4/5 done — Flag:", res.flag);
      return;
    }

    console.log("[deterministic] Step 4/5 read_board again (post-rotate sanity check)");
    const after = await handleReadBoard({});
    const matchesTarget = masksEqual(after.masks, target);
    console.log(
      `[deterministic]   matches_target=${matchesTarget} masks:`,
      JSON.stringify(after.masks),
    );
    if (!matchesTarget) {
      const diff = solveBoard(after.masks, target);
      console.warn(
        "[deterministic]   still diverges (vision noise or hub drift):",
        diff.ok ? JSON.stringify(diff.rotations) : JSON.stringify(diff.topologyMismatch),
      );
    }

    console.log(
      "[deterministic] Step 5/5 reset_board — no flag from hub; retry next round",
    );
    await handleFetchBoard({ reset: true });
  }

  console.error("[deterministic] Stopped without flag.");
  process.exitCode = 1;
}

await main();

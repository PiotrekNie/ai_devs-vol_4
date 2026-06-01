/**
 * S03E03 reactor — deterministic BFS planner (no LLM).
 *
 * Run: `bun --env-file=../.env run run.ts`
 */

import { runReactor } from "./src/reactorRun.js";

async function main() {
  const flag = await runReactor();
  console.log(`\nDone: ${flag}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

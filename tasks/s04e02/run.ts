/**
 * S04E02 windpower — deterministic orchestrator (no LLM).
 *
 * Run: `bun --env-file=../.env run run.ts`
 */

import { solveWindpower } from "./src/domain/orchestrator.js";

async function main() {
  const flag = await solveWindpower();
  console.log(`\nDone: ${flag}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

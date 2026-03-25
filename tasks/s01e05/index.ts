import "../config.js";

import { buildPlanFromHelp } from "./src/planner.ts";
import { loadHelpPayload } from "./src/helpCache.ts";
import { runRailwayPlan } from "./src/stateMachine.ts";

async function main() {
  console.log("[s01e05] railway — loading help (cache or Hub)…");
  const helpPayload = await loadHelpPayload();

  console.log("[s01e05] building plan via OpenRouter…");
  const plan = await buildPlanFromHelp(helpPayload);
  console.log("[s01e05] plan:", JSON.stringify(plan, null, 2));

  console.log("[s01e05] executing plan…");
  const { finalState, lastResponse } = await runRailwayPlan(plan);

  console.log("[s01e05] last response:", JSON.stringify(lastResponse, null, 2));
  console.log("[s01e05] final state:", finalState);

  if (finalState.kind === "done" && finalState.flag) {
    console.log("[s01e05] FLAG:", finalState.flag);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { electricityAgentModel } from "./src/config.ts";
import { resolveTargetMasks } from "./src/target.ts";
import { runElectricityAgent } from "./src/agent/runElectricityAgent.ts";

console.log("[agent] Model:", electricityAgentModel());
const target = await resolveTargetMasks();
console.log("[agent] Target masks:", JSON.stringify(target));

const { text, flag } = await runElectricityAgent({ targetMasks: target });
console.log("[agent] Final text:\n", text);
if (flag) {
  console.log("[agent] Flag:", flag);
}

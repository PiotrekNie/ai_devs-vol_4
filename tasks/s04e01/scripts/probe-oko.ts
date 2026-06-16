/**
 * L0 probe — OKO Editor hub API (no LLM).
 *
 * Run: `bun --env-file=../.env run scripts/probe-oko.ts`
 */

import { executeOkoDone } from "../src/tools/mcp/oko_done.js";
import { executeOkoHelp } from "../src/tools/mcp/oko_help.js";

function printToolResult(label: string, result: { content: { text: string }[]; isError?: boolean }) {
  console.log(`\n=== ${label} ===`);
  console.log(result.content[0]?.text ?? "(empty)");
  if (result.isError) console.log("(tool error)");
}

async function main() {
  printToolResult("oko_help", await executeOkoHelp({}));
  printToolResult("oko_done (before edits)", await executeOkoDone({}));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

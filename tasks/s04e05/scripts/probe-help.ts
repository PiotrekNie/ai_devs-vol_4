/**
 * Dev helper — print foodwarehouse hub help JSON.
 * Run: bun --env-file=../.env run scripts/probe-help.ts
 */

import { fetchFoodwarehouseHelp } from "../src/hub/foodwarehouseClient.js";

const result = await fetchFoodwarehouseHelp();
console.log(result.content[0]?.text ?? result);

/**
 * Dev helper — print filesystem hub help JSON.
 * Run: bun --env-file=../.env run scripts/probe-help.ts
 */

import { fetchFilesystemHelp } from "../src/hub/filesystemClient.js";

const result = await fetchFilesystemHelp();
console.log(result.content[0]?.text ?? result);

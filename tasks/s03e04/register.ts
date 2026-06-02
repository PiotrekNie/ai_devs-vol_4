import { createVerifyClient } from "./src/hub/verifyClient.js";
import { getPublicBaseUrl } from "./config.js";
import { validatePublicBaseUrl } from "./src/http/validatePublicUrl.js";

function readBaseUrlArg(): string | undefined {
  const idx = process.argv.indexOf("--base-url");
  if (idx === -1) return undefined;
  return process.argv[idx + 1]?.trim();
}

const baseUrl = readBaseUrlArg() ?? getPublicBaseUrl();
const client = createVerifyClient({ baseUrl });

console.log(`[SYSTEM] Validating ${baseUrl}/health ...`);
await validatePublicBaseUrl(baseUrl);
console.log("[SYSTEM] Health OK");

console.log(`[SYSTEM] Registering negotiations tools for ${baseUrl}`);
for (const tool of client.buildToolUrls(baseUrl)) {
  console.log(`  - ${tool.URL}`);
}

const result = await client.registerTools();
console.log("[SYSTEM] Hub response:", JSON.stringify(result, null, 2));
console.log("[SYSTEM] Wait 30–60 s, then run: bun run check");

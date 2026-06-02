import { createVerifyClient } from "./src/hub/verifyClient.js";

const client = createVerifyClient();
const { data, flag } = await client.checkTask();

console.log("[SYSTEM] Hub check response:", JSON.stringify(data, null, 2));
if (flag) {
  console.log(`[SYSTEM] Flag: ${flag}`);
} else {
  console.log("[SYSTEM] No flag yet — retry after a short wait.");
}

/**
 * Refresh drone-api.raw.html from the live course URL.
 * After running, manually update drone-api.md if HTML content changed.
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DRONE_DOCS_URL } from "../config.js";

const outPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../docs/context/drone-api.raw.html",
);

const response = await fetch(DRONE_DOCS_URL);
if (!response.ok) {
  console.error(`Failed to fetch ${DRONE_DOCS_URL}: ${response.status}`);
  process.exit(1);
}

const html = await response.text();
writeFileSync(outPath, html, "utf8");
console.log(`Wrote ${outPath} (${html.length} bytes)`);
console.log(
  "Reminder: if content changed, update docs/context/drone-api.md manually (faithful HTML→MD).",
);

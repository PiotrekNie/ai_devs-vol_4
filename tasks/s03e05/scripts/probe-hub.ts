/**
 * Probe savethem hub APIs — run: bun --env-file=../../.env run scripts/probe-hub.ts
 * Writes redacted JSON to stdout (no apikey in output).
 */

const BASE = "https://hub.ag3nts.org/api";
const apikey = process.env["HUB_API_KEY"]?.trim();
if (!apikey) {
  console.error("HUB_API_KEY missing");
  process.exit(1);
}

async function hubPost(path: string, query: string): Promise<unknown> {
  const res = await fetch(`${BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apikey, query }),
  });
  const text = await res.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { _raw: text, _status: res.status };
  }
}

const probes: Array<{ path: string; query: string }> = [
  { path: "toolsearch", query: "movement rules terrain map" },
  { path: "toolsearch", query: "fuel food consumption vehicles" },
  { path: "toolsearch", query: "simulate route validate path" },
  { path: "maps", query: "Skolwin 10x10 terrain map" },
  { path: "maps", query: "full map grid start goal" },
  { path: "wehicles", query: "all vehicles fuel speed food consumption" },
  { path: "wehicles", query: "list vehicles" },
];

for (const p of probes) {
  console.log(`\n=== ${p.path} | ${p.query} ===`);
  const data = await hubPost(p.path, p.query);
  console.log(JSON.stringify(data, null, 2));
}

// Discover additional endpoints from first toolsearch
const ts = (await hubPost(
  "toolsearch",
  "movement rules fuel food terrain",
)) as { tools?: Array<{ name: string; url: string }> };
const seen = new Set<string>();
for (const t of ts.tools ?? []) {
  const path = t.url.replace(/^\/api\//, "");
  if (seen.has(path)) continue;
  seen.add(path);
  if (path === "toolsearch" || path === "maps" || path === "wehicles") continue;
  console.log(`\n=== discovered ${path} | rules ===`);
  console.log(JSON.stringify(await hubPost(path, "movement rules"), null, 2));
}

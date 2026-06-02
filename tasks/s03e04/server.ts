import { Hono } from "hono";
import { loadCatalog } from "./src/catalog/loadCatalog.js";
import { createToolHandler } from "./src/http/toolRoute.js";
import { findCitiesForProduct } from "./src/tools/findCitiesForProduct.js";
import { findCitiesWithAllProducts } from "./src/tools/findCitiesWithAllProducts.js";
import { PORT, PUBLIC_BASE_URL } from "./config.js";

const catalog = loadCatalog();

const app = new Hono();

app.get("/health", (c) =>
  c.json({ ok: true, task: "negotiations", baseUrl: PUBLIC_BASE_URL }),
);

app.post(
  "/api/find-cities-for-product",
  createToolHandler((params) => findCitiesForProduct(catalog, params)),
);

app.post(
  "/api/find-cities-with-all-products",
  createToolHandler((params) => findCitiesWithAllProducts(catalog, params)),
);

console.log(`[SYSTEM] negotiations tools loaded (${catalog.items.length} items)`);
console.log(`[SYSTEM] PUBLIC_BASE_URL=${PUBLIC_BASE_URL}`);
console.log(`[SYSTEM] listening on 0.0.0.0:${PORT}`);

Bun.serve({
  hostname: "0.0.0.0",
  port: PORT,
  fetch: app.fetch,
});

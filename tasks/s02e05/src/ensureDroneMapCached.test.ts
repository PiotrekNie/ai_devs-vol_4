import { describe, expect, it } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ensureDroneMapCached } from "./ensureDroneMapCached.js";

describe("ensureDroneMapCached", () => {
  it("writes PNG bytes to local path", async () => {
    const dir = await mkdtemp(join(tmpdir(), "s02e05-map-"));
    const localPath = join(dir, "map.png");
    const payload = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);

    const mockFetch = async () =>
      new Response(payload, {
        status: 200,
        headers: { "content-type": "image/png" },
      });

    const result = await ensureDroneMapCached(
      "https://example.com/drone.png",
      localPath,
      mockFetch,
    );

    expect(result.bytes).toBe(payload.length);
    expect(result.localPath).toBe(localPath);
    const onDisk = await readFile(localPath);
    expect(onDisk.equals(payload)).toBe(true);

    await rm(dir, { recursive: true, force: true });
  });

  it("throws when map URL is empty", async () => {
    await expect(
      ensureDroneMapCached("", "data/map.png", async () => new Response()),
    ).rejects.toThrow(/DRONE_MAP_URL is required/);
  });

  it("throws when fetch fails", async () => {
    const mockFetch = async () => new Response(null, { status: 404 });
    await expect(
      ensureDroneMapCached("https://example.com/missing.png", "data/map.png", mockFetch),
    ).rejects.toThrow(/HTTP 404/);
  });
});

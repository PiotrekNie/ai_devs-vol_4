import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "bun:test";
import { scanSensorDirectory } from "./scanSensors.js";

const FIXTURE_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures/sensors",
);

describe("scanSensorDirectory", () => {
  it("scans fixture directory with expected anomaly count and profiles", () => {
    const scan = scanSensorDirectory(FIXTURE_DIR);

    expect(scan.totalFiles).toBe(3);
    expect(scan.uniqueNotes).toBe(3);
    expect(scan.measurementAnomalyIds.sort()).toEqual(["0002", "0003"]);
    expect(scan.noteGroups.every((g) => g.profile === "all_ok" || g.profile === "all_bad")).toBe(
      true,
    );
    expect(scan.noteGroups.filter((g) => g.profile === "all_bad").length).toBe(2);
  });
});

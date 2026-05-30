import { describe, expect, it } from "bun:test";
import {
  hasMeasurementAnomaly,
  normalizeSensorId,
  type SensorReading,
} from "./sensorRules.js";
import { fileHasNoteAnomaly, buildRecheckList } from "./buildRecheck.js";
import type { ScanResult } from "./scanSensors.js";

describe("sensorRules", () => {
  it("flags inactive field with non-zero value", () => {
    const reading: SensorReading = {
      sensor_type: "temperature",
      timestamp: 1,
      temperature_K: 600,
      pressure_bar: 0,
      water_level_meters: 0,
      voltage_supply_v: 0,
      humidity_percent: 0,
      operator_notes: "ok",
    };
    expect(hasMeasurementAnomaly(reading)).toBe(false);

    reading.voltage_supply_v = 230;
    expect(hasMeasurementAnomaly(reading)).toBe(true);
  });

  it("normalizes ids to 4 digits", () => {
    expect(normalizeSensorId("1.json")).toBe("0001");
    expect(normalizeSensorId("4321")).toBe("4321");
  });
});

describe("buildRecheck", () => {
  it("merges measurement and note mismatch ids", () => {
    const scan: ScanResult = {
      sensorsDir: "sensors",
      totalFiles: 3,
      measurementAnomalyIds: ["0002"],
      uniqueNotes: 2,
      noteGroups: [
        {
          note: "All good",
          profile: "all_bad",
          files: [
            {
              id: "0002",
              measurementAnomaly: true,
              reading: {} as SensorReading,
            },
          ],
        },
        {
          note: "Found critical fault",
          profile: "all_ok",
          files: [
            {
              id: "0003",
              measurementAnomaly: false,
              reading: {} as SensorReading,
            },
          ],
        },
      ],
    };

    const sentiments = new Map<string, "ok" | "problem" | "neutral">([
      ["All good", "ok"],
      ["Found critical fault", "problem"],
    ]);

    expect(buildRecheckList({ scan, sentiments }).sort()).toEqual([
      "0002",
      "0003",
    ]);
  });

  it("detects note/data mismatch pairs", () => {
    expect(
      fileHasNoteAnomaly({ measurementAnomaly: true, sentiment: "ok" }),
    ).toBe(true);
    expect(
      fileHasNoteAnomaly({ measurementAnomaly: false, sentiment: "problem" }),
    ).toBe(true);
    expect(
      fileHasNoteAnomaly({ measurementAnomaly: false, sentiment: "ok" }),
    ).toBe(false);
  });
});

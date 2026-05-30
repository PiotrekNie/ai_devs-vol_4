import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  hasMeasurementAnomaly,
  normalizeSensorId,
  type SensorReading,
} from "./sensorRules.js";

export type ScannedFile = {
  id: string;
  measurementAnomaly: boolean;
  reading: SensorReading;
};

export type NoteGroup = {
  note: string;
  files: ScannedFile[];
  profile: "all_ok" | "all_bad" | "mixed";
};

export type ScanResult = {
  sensorsDir: string;
  totalFiles: number;
  measurementAnomalyIds: string[];
  noteGroups: NoteGroup[];
  uniqueNotes: number;
};

function profileForFiles(files: ScannedFile[]): NoteGroup["profile"] {
  const badCount = files.filter((f) => f.measurementAnomaly).length;
  if (badCount === 0) return "all_ok";
  if (badCount === files.length) return "all_bad";
  return "mixed";
}

export function scanSensorDirectory(sensorsDir: string): ScanResult {
  const filenames = readdirSync(sensorsDir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const byNote = new Map<string, ScannedFile[]>();
  const measurementAnomalyIds: string[] = [];

  for (const filename of filenames) {
    const raw = readFileSync(join(sensorsDir, filename), "utf8");
    const reading = JSON.parse(raw) as SensorReading;
    const id = normalizeSensorId(filename);
    const measurementAnomaly = hasMeasurementAnomaly(reading);

    if (measurementAnomaly) measurementAnomalyIds.push(id);

    const note = reading.operator_notes.trim();
    const entry: ScannedFile = { id, measurementAnomaly, reading };
    const group = byNote.get(note) ?? [];
    group.push(entry);
    byNote.set(note, group);
  }

  const noteGroups: NoteGroup[] = [...byNote.entries()].map(
    ([note, files]) => ({
      note,
      files,
      profile: profileForFiles(files),
    }),
  );

  return {
    sensorsDir,
    totalFiles: filenames.length,
    measurementAnomalyIds: [...new Set(measurementAnomalyIds)].sort(),
    noteGroups,
    uniqueNotes: noteGroups.length,
  };
}

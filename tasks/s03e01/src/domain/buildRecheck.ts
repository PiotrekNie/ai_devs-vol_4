import type { NoteSentiment } from "./classifyNotes.js";
import type { NoteGroup, ScanResult } from "./scanSensors.js";

export function fileHasNoteAnomaly(args: {
  measurementAnomaly: boolean;
  sentiment: NoteSentiment;
}): boolean {
  const { measurementAnomaly, sentiment } = args;
  if (sentiment === "ok" && measurementAnomaly) return true;
  if (sentiment === "problem" && !measurementAnomaly) return true;
  return false;
}

export function idsFromNoteGroup(
  group: NoteGroup,
  sentiment: NoteSentiment,
): string[] {
  return group.files
    .filter((f) => fileHasNoteAnomaly({ measurementAnomaly: f.measurementAnomaly, sentiment }))
    .map((f) => f.id);
}

export function buildRecheckList(args: {
  scan: ScanResult;
  sentiments: Map<string, NoteSentiment>;
}): string[] {
  const ids = new Set<string>(args.scan.measurementAnomalyIds);

  for (const group of args.scan.noteGroups) {
    const sentiment = args.sentiments.get(group.note) ?? "neutral";
    for (const id of idsFromNoteGroup(group, sentiment)) {
      ids.add(id);
    }
  }

  return [...ids].sort();
}

import type { ScanResult } from "./domain/scanSensors.js";
import type { NoteSentiment } from "./domain/classifyNotes.js";

let lastScan: ScanResult | null = null;
const sentiments = new Map<string, NoteSentiment>();

export function setLastScan(scan: ScanResult): void {
  lastScan = scan;
}

export function getLastScan(): ScanResult | null {
  return lastScan;
}

export function setNoteSentiment(note: string, sentiment: NoteSentiment): void {
  sentiments.set(note, sentiment);
}

export function getSentimentsMap(): Map<string, NoteSentiment> {
  return sentiments;
}

export function resetEvaluationState(): void {
  lastScan = null;
  sentiments.clear();
}

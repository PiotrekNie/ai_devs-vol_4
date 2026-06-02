const MIN_OUTPUT_BYTES = 4;
const MAX_OUTPUT_BYTES = 500;

export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function clampOutput(text: string): string {
  let output = text.trim();

  if (byteLength(output) < MIN_OUTPUT_BYTES) {
    output = "Brak.";
  }

  if (byteLength(output) <= MAX_OUTPUT_BYTES) {
    return output;
  }

  const parts = output.split(", ");
  let kept: string[] = [];
  let suffix = "";

  for (const part of parts) {
    const candidate = kept.length === 0 ? part : `${kept.join(", ")}, ${part}`;
    if (byteLength(candidate) <= MAX_OUTPUT_BYTES) {
      kept.push(part);
      continue;
    }
    break;
  }

  const omitted = parts.length - kept.length;
  if (omitted > 0) {
    suffix = ` (+${omitted})`;
  }

  let result = kept.join(", ") + suffix;
  while (byteLength(result) > MAX_OUTPUT_BYTES && kept.length > 1) {
    kept.pop();
    suffix = ` (+${parts.length - kept.length})`;
    result = kept.join(", ") + suffix;
  }

  if (byteLength(result) > MAX_OUTPUT_BYTES) {
    result = result.slice(0, Math.floor(result.length * 0.8));
    while (byteLength(result) > MAX_OUTPUT_BYTES && result.length > 4) {
      result = result.slice(0, -1);
    }
  }

  if (byteLength(result) < MIN_OUTPUT_BYTES) {
    return "Brak.";
  }

  return result;
}

export function formatCityList(cities: string[]): string {
  if (cities.length === 0) return "Brak miast.";
  return clampOutput(cities.join(", "));
}

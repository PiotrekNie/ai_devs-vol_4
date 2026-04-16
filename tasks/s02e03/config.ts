export function hubApiKey(): string {
  const key = process.env.HUB_API_KEY?.trim() ?? "";
  if (!key) {
    throw new Error("HUB_API_KEY is not set");
  }
  return key;
}

const MAX_RETRY_ATTEMPTS = 5;
const RETRY_BASE_DELAY_MS = 500;
const RETRYABLE_STATUS_CODES = new Set([429, 503]);

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  delayOverrideMs?: number,
): Promise<Response> {
  const baseDelay = delayOverrideMs ?? RETRY_BASE_DELAY_MS;

  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    const response = await fetch(url, options);

    if (!RETRYABLE_STATUS_CODES.has(response.status)) {
      return response;
    }

    const isLastAttempt = attempt === MAX_RETRY_ATTEMPTS - 1;
    if (isLastAttempt) {
      return response;
    }

    const delay = baseDelay * 2 ** attempt;
    await new Promise<void>((resolve) => setTimeout(resolve, delay));
  }

  throw new Error("fetchWithRetry: unreachable");
}

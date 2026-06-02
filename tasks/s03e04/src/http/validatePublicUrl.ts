import { PORT } from "../../config.js";

export async function validatePublicBaseUrl(baseUrl: string): Promise<void> {
  const healthUrl = `${baseUrl.replace(/\/+$/, "")}/health`;

  let response: Response;
  try {
    response = await fetch(healthUrl, { signal: AbortSignal.timeout(10_000) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `PUBLIC_BASE_URL is not reachable: ${healthUrl}\n` +
        `(${message})\n\n` +
        "Azyl: app PORT=51784, public URL https://azyl-51784.ag3nts.org. " +
        `curl http://127.0.0.1:${PORT}/health`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `Health check failed (${response.status}): ${healthUrl}\n` +
        `Upewnij się, że serwer działa: curl http://127.0.0.1:${PORT}/health`,
    );
  }
}

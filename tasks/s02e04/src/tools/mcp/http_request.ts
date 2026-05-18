/**
 * http_request MCP tool — GET/POST with exponential backoff on 429/503.
 *
 * The course hub deliberately returns HTTP 503 to simulate production errors.
 * This tool applies the same retry policy as the LLM adapter.
 */

import { z } from 'zod';
import { fetchWithRetry } from '../../agent/ai.js';
import { ZMAIL_API_URL } from '../../../config.js';
import { mcpOk, mcpErr } from '../../types/index.js';
import type { McpToolResponse } from '../../types/index.js';

const ZMAIL_API_ACTIONS = new Set([
  'help',
  'getInbox',
  'getThread',
  'search',
  'getMessages',
]);

/** Same-origin + pathname match — ignores trailing slashes and stray querystrings on the request URL. */
export function isZmailEndpoint(requestUrl: string): boolean {
  try {
    const u = new URL(requestUrl.trim());
    const base = new URL(ZMAIL_API_URL.trim());
    return (
      u.origin === base.origin &&
      u.pathname.replace(/\/+$/, '') === base.pathname.replace(/\/+$/, '')
    );
  } catch {
    return false;
  }
}

export function isZmailApiBody(
  body: Record<string, unknown> | undefined,
): boolean {
  return (
    typeof body?.action === 'string' &&
    ZMAIL_API_ACTIONS.has(body.action as string)
  );
}

export const httpRequestInputSchema = z
  .object({
    url: z
      .string()
      .url()
      .describe(
        `Request URL. Course zmail API (only host that receives apikey merge): ${ZMAIL_API_URL}`,
      ),
    method: z
      .enum(['GET', 'POST'])
      .default('GET')
      .describe('HTTP method. Defaults to GET.'),
    body: z
      .record(z.string(), z.unknown())
      .optional()
      .describe(
        'Required when method is POST: JSON object as raw body (serialised automatically). ' +
          `For zmail use url ${ZMAIL_API_URL} with e.g. {"action":"help"}. ` +
          'Prefer search_mail / download_mail_content for mailbox work. apikey is injected from HUB_API_KEY on the course zmail URL only.',
      ),
    headers: z
      .record(z.string(), z.string())
      .optional()
      .describe('Optional extra HTTP headers to include.'),
  })
  .superRefine((val, ctx) => {
    if (val.method === 'POST' && val.body === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'POST requests require `body` (JSON object). For course zmail use e.g. {"action":"help"}.',
        path: ['body'],
      });
    }
  });

export type HttpRequestInput = z.infer<typeof httpRequestInputSchema>;

function formatZodError(err: z.ZodError): string {
  return err.issues
    .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('; ');
}

function mergeHubApiKeyForZmail(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const apikey = process.env['HUB_API_KEY']?.trim() ?? '';
  if (!apikey) {
    throw new Error(
      'HUB_API_KEY is not set. Add it to tasks/.env for zmail HTTP calls via http_request.',
    );
  }
  return { apikey, ...body };
}

export async function executeHttpRequest(
  args: unknown,
): Promise<McpToolResponse> {
  const parsed = httpRequestInputSchema.safeParse(args);
  if (!parsed.success) {
    return mcpErr(formatZodError(parsed.error));
  }

  const { url, method, body, headers: extraHeaders } = parsed.data;

  if (
    method === 'POST' &&
    isZmailApiBody(body) &&
    !isZmailEndpoint(url)
  ) {
    return mcpErr(
      `Zmail API calls must use exactly ${ZMAIL_API_URL}. ` +
        'Do not use other hosts (e.g. zmail.com). ' +
        'Use search_mail and download_mail_content for mailbox actions, ' +
        'or http_request only with the course URL above.',
    );
  }

  try {
    const init: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
    };
    if (method === 'POST') {
      const raw =
        body && isZmailEndpoint(url) ? mergeHubApiKeyForZmail(body) : body;
      init.body = JSON.stringify(raw);
    }

    const response = await fetchWithRetry(url, init);
    const rawText = await response.text();

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(rawText);
    } catch {
      parsedBody = rawText;
    }

    const result = {
      ok: response.ok,
      status: response.status,
      data: parsedBody,
    };
    return mcpOk(JSON.stringify(result));
  } catch (error) {
    return mcpErr(error instanceof Error ? error.message : String(error));
  }
}

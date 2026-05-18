import { describe, it, expect, mock, afterEach } from 'bun:test';
import {
  executeHttpRequest,
  isZmailApiBody,
  isZmailEndpoint,
} from './http_request.js';

describe('isZmailEndpoint', () => {
  it('matches default hub zmail URL with or without trailing slash', () => {
    expect(isZmailEndpoint('https://hub.ag3nts.org/api/zmail')).toBe(true);
    expect(isZmailEndpoint('https://hub.ag3nts.org/api/zmail/')).toBe(true);
  });

  it('returns false for other origins or paths', () => {
    expect(isZmailEndpoint('https://example.com/api/zmail')).toBe(false);
    expect(isZmailEndpoint('https://hub.ag3nts.org/other')).toBe(false);
  });
});

describe('isZmailApiBody', () => {
  it('detects zmail action fields', () => {
    expect(isZmailApiBody({ action: 'help' })).toBe(true);
    expect(isZmailApiBody({ action: 'search' })).toBe(true);
    expect(isZmailApiBody({ action: 'other' })).toBe(false);
    expect(isZmailApiBody(undefined)).toBe(false);
  });
});

describe('executeHttpRequest', () => {
  afterEach(() => {
    globalThis.fetch = global.fetch;
    delete process.env.HUB_API_KEY;
  });

  it('rejects zmail-like POST on wrong host without calling fetch', async () => {
    let fetchCalled = false;
    globalThis.fetch = mock(async () => {
      fetchCalled = true;
      return new Response('{}', { status: 200 });
    }) as unknown as typeof fetch;

    const out = await executeHttpRequest({
      url: 'https://zmail.com/api',
      method: 'POST',
      body: { action: 'help' },
    });

    expect(out.isError).toBe(true);
    expect(out.content[0]?.text).toContain('hub.ag3nts.org/api/zmail');
    expect(fetchCalled).toBe(false);
  });

  it('rejects POST without body', async () => {
    const out = await executeHttpRequest({
      url: 'https://hub.ag3nts.org/api/zmail',
      method: 'POST',
    });
    expect(out.isError).toBe(true);
    expect(out.content[0]?.text).toContain('body');
  });

  it('returns error when zmail POST and HUB_API_KEY missing', async () => {
    const out = await executeHttpRequest({
      url: 'https://hub.ag3nts.org/api/zmail',
      method: 'POST',
      body: { action: 'help' },
    });
    expect(out.isError).toBe(true);
    expect(out.content[0]?.text).toContain('HUB_API_KEY');
  });

  it('merges apikey for zmail POST and sends JSON body', async () => {
    process.env.HUB_API_KEY = 'k-from-env';
    let capturedBody: string | null = null;

    globalThis.fetch = mock(async (_url, init) => {
      capturedBody = init?.body as string;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as unknown as typeof fetch;

    const out = await executeHttpRequest({
      url: 'https://hub.ag3nts.org/api/zmail',
      method: 'POST',
      body: { action: 'help' },
    });

    expect(out.isError).toBeUndefined();
    expect(capturedBody).toBeDefined();
    expect(JSON.parse(capturedBody!)).toEqual({
      apikey: 'k-from-env',
      action: 'help',
    });
  });

  it('does not merge apikey for non-zmail POST', async () => {
    process.env.HUB_API_KEY = 'ignored';
    let capturedBody: string | null = null;

    globalThis.fetch = mock(async (_url, init) => {
      capturedBody = init?.body as string;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as unknown as typeof fetch;

    const out = await executeHttpRequest({
      url: 'https://example.com/hook',
      method: 'POST',
      body: { x: 1 },
    });

    expect(out.isError).toBeUndefined();
    expect(JSON.parse(capturedBody!)).toEqual({ x: 1 });
  });
});

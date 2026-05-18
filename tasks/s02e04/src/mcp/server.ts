/**
 * MCP server — S02E04 mailbox task: boilerplate tools + zmail search/getMessages.
 *
 * Usage:
 *   const server = createS02e04McpServer();
 *   const client = await createMcpClient(server);
 *
 * `createBoilerplateMcpServer` is an alias for backwards compatibility.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import {
  httpRequestInputSchema,
  executeHttpRequest,
} from '../tools/mcp/http_request.js';
import {
  submitToHubInputSchema,
  executeSubmitToHub,
} from '../tools/mcp/submit_to_hub.js';
import {
  readFileInputSchema,
  executeReadFile,
} from '../tools/mcp/read_file.js';
import {
  analyzeImageVisionInputSchema,
  executeAnalyzeImageVision,
} from '../tools/mcp/analyze_image_vision.js';
import {
  searchMailInputSchema,
  executeSearchMail,
} from '../tools/mcp/search_mail.js';
import {
  downloadMailContentInputSchema,
  executeDownloadMailContent,
} from '../tools/mcp/download_mail_content.js';

export function createS02e04McpServer(): McpServer {
  const server = new McpServer(
    { name: 's02e04-mailbox-server', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    'http_request',
    {
      description:
        'Make an HTTP GET or POST request. Retries automatically on 429 and 503. ' +
        'For mailbox prefer search_mail / download_mail_content. ' +
        'Zmail help/inbox/thread only via POST to https://hub.ag3nts.org/api/zmail with JSON body (apikey injected). ' +
        'Wrong hosts (e.g. zmail.com) are rejected.',
      inputSchema: httpRequestInputSchema,
    },
    executeHttpRequest,
  );

  server.registerTool(
    'search_mail',
    {
      description:
        'Search mailbox (metadata only). Each item has messageID (32-char hex) — ' +
        'always pass that ID to download_mail_content, never numeric rowID.',
      inputSchema: searchMailInputSchema,
    },
    executeSearchMail,
  );

  server.registerTool(
    'download_mail_content',
    {
      description:
        'Fetch full message bodies (getMessages). ids must be messageID string(s) ' +
        'from search_mail items (32 hex chars). rowID is rejected. Read body before extracting facts.',
      inputSchema: downloadMailContentInputSchema,
    },
    executeDownloadMailContent,
  );

  server.registerTool(
    'submit_to_hub',
    {
      description:
        'Submit an answer to the AI Devs course verification hub. ' +
        'Requires HUB_API_KEY. Returns { ok, status, data, flag? }. ' +
        'mailbox: answer merges date (attack mail), password (reset mail), confirmation_code ' +
        '(36 chars, newest SEC correction). Rejects invalid code length before HTTP.',
      inputSchema: submitToHubInputSchema,
    },
    executeSubmitToHub,
  );

  server.registerTool(
    'read_file',
    {
      description:
        'Read a local text file. Large files are returned in chunks — use ' +
        'offset + limit to paginate. Returns { ok, filepath, total_chars, ' +
        'offset, limit, has_more, content }.',
      inputSchema: readFileInputSchema,
    },
    executeReadFile,
  );

  server.registerTool(
    'analyze_image_vision',
    {
      description:
        'Analyze a local image file using a vision model. Pass a filepath and ' +
        'a question/instruction. Returns { ok, analysis: string }. ' +
        'Supported formats: .jpg, .jpeg, .png, .gif, .webp.',
      inputSchema: analyzeImageVisionInputSchema,
    },
    executeAnalyzeImageVision,
  );

  return server;
}

/** @deprecated Prefer `createS02e04McpServer`; same implementation. */
export const createBoilerplateMcpServer = createS02e04McpServer;

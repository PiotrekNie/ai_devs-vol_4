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
        'Make an HTTP GET or POST request. Retries automatically on 429 and 503 ' +
        '(exponential backoff). Returns { ok, status, data }. ' +
        'Use for zmail `help`, `getInbox`, `getThread` — POST JSON to ZMAIL_API_URL.',
      inputSchema: httpRequestInputSchema,
    },
    executeHttpRequest,
  );

  server.registerTool(
    'search_mail',
    {
      description:
        'Search mailbox messages (zmail action: search). Gmail-like operators: ' +
        'from:, to:, subject:, OR, AND, phrases in quotes. Returns metadata only — ' +
        'then call download_mail_content for bodies.',
      inputSchema: searchMailInputSchema,
    },
    executeSearchMail,
  );

  server.registerTool(
    'download_mail_content',
    {
      description:
        'Fetch full message body/bodies from zmail (action: getMessages). Pass rowID, ' +
        'messageID string, or array. Always use this before inferring facts from an email.',
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
        'For mailbox use task_name: mailbox and answer: { password, date, confirmation_code }.',
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

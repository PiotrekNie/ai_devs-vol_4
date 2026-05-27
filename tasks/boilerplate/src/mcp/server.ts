/**
 * MCP server factory — registers the four default boilerplate tools.
 *
 * Usage:
 *   const server = createBoilerplateMcpServer();
 *   const client = await createMcpClient(server);
 *
 * To add episode-specific tools, call `server.registerTool(...)` on the
 * returned server before passing it to createMcpClient.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import {
  httpRequestInputSchema,
  executeHttpRequest,
} from "../tools/mcp/http_request.js";
import {
  submitToHubInputSchema,
  executeSubmitToHub,
} from "../tools/mcp/submit_to_hub.js";
import {
  readFileInputSchema,
  executeReadFile,
} from "../tools/mcp/read_file.js";
import {
  analyzeImageVisionInputSchema,
  executeAnalyzeImageVision,
} from "../tools/mcp/analyze_image_vision.js";

export function createBoilerplateMcpServer(): McpServer {
  const server = new McpServer(
    { name: "boilerplate-server", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    "http_request",
    {
      description:
        "Make an HTTP GET or POST request. Retries automatically on 429 and 503 " +
        "(exponential backoff). Returns { ok, status, data }.",
      inputSchema: httpRequestInputSchema,
    },
    executeHttpRequest,
  );

  server.registerTool(
    "submit_to_hub",
    {
      description:
        "Submit an answer to the AI Devs course verification hub. " +
        "Pass task_name + answer only — apikey is injected from HUB_API_KEY env. " +
        "Returns { ok, status, data, flag? }. Scans the response for a {FLG:...} flag.",
      inputSchema: submitToHubInputSchema,
    },
    executeSubmitToHub,
  );

  server.registerTool(
    "read_file",
    {
      description:
        "Read a local text file. Large files are returned in chunks — use " +
        "offset + limit to paginate. Returns { ok, filepath, total_chars, " +
        "offset, limit, has_more, content }.",
      inputSchema: readFileInputSchema,
    },
    executeReadFile,
  );

  server.registerTool(
    "analyze_image_vision",
    {
      description:
        "Analyze a local image file using a vision model. Pass a filepath and " +
        "a question/instruction. Returns { ok, analysis: string }. " +
        "Supported formats: .jpg, .jpeg, .png, .gif, .webp.",
      inputSchema: analyzeImageVisionInputSchema,
    },
    executeAnalyzeImageVision,
  );

  return server;
}

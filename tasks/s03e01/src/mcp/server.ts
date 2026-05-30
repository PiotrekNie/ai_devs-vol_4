import { createBoilerplateMcpServer } from "@ai-devs/agent-boilerplate";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  scanSensorsInputSchema,
  executeScanSensors,
} from "../tools/mcp/scan_sensors.js";
import {
  classifyOperatorNotesInputSchema,
  executeClassifyOperatorNotes,
} from "../tools/mcp/classify_operator_notes.js";
import {
  buildRecheckInputSchema,
  executeBuildRecheck,
} from "../tools/mcp/build_recheck.js";

export function createS03e01McpServer(): McpServer {
  const server = createBoilerplateMcpServer();

  server.registerTool(
    "scan_sensors",
    {
      description:
        "Deterministic scan of all sensor JSON files. Detects measurement anomalies " +
        "(out-of-range values, inactive fields ≠ 0) and groups files by operator_notes. " +
        "Stores result in session state for later tools. Zero LLM tokens.",
      inputSchema: scanSensorsInputSchema,
    },
    executeScanSensors,
  );

  server.registerTool(
    "classify_operator_notes",
    {
      description:
        "Batch-classify unique operator_notes via LLM (cached). Requires prior scan_sensors. " +
        "Detects whether operator claims OK vs reports problems — used with measurements " +
        "to find note/data mismatches.",
      inputSchema: classifyOperatorNotesInputSchema,
    },
    executeClassifyOperatorNotes,
  );

  server.registerTool(
    "build_recheck",
    {
      description:
        "Merge measurement anomalies + operator-note mismatches into final recheck[] " +
        "for submit_to_hub. Requires scan_sensors and classify_operator_notes.",
      inputSchema: buildRecheckInputSchema,
    },
    executeBuildRecheck,
  );

  return server;
}

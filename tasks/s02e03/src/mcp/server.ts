import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  categorizeDataDescription,
  inputLogRowSchema,
  logEntrySchema,
  mergeCategorizeLabels,
  runCategorizePrompt,
} from "../scripts/categorizeData.js";
import { countTokens } from "../scripts/countTokens.js";
import fetchData from "../scripts/fetchData.js";
import { parseData, removeDuplicateLines } from "../scripts/parseData.js";
import type { DataItem } from "../types/index.js";
import {
  buildListToVerify,
  buildListToVerifyDescription,
  readJsonListFile,
  readJsonListFileDescription,
  updateJsonList,
  updateJsonListDescription,
  writeJsonList,
  writeJsonListDescription,
} from "../scripts/jsonList.js";
import { verifyAnswer } from "../scripts/verifyAnswer.js";

const fetchDataDescription =
  "Downloads failure.log from the task hub. Default dedupe=true parses log lines and returns unique rows (date+status+message)—much smaller than raw. Set dedupe=false for the full raw file (very large). include_raw=true attaches raw text when dedupe=true (very large).";

const verifyAnswerDescription =
  "POST the verification payload to hub (task failure). Sends answer.logs as the given string; requires HUB_API_KEY. Use after build_list_to_verify with the same plaintext, or an equivalent logs string.";

export const createMcpServer = () => {
  const server = new McpServer(
    { name: "s02e03-server", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );
  server.registerTool(
    "categorize_data",
    {
      description: categorizeDataDescription,
      inputSchema: z.object({
        data: z.array(inputLogRowSchema),
      }),
    },
    async ({ data }) => {
      try {
        const labels = await runCategorizePrompt(data);
        const result = mergeCategorizeLabels(data, labels);
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: message,
                data,
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );
  server.registerTool(
    "use_tokenizer",
    {
      description:
        "Use the countTokens function to count the tokens in a message",
      inputSchema: z.object({ text: z.string() }),
    },
    async ({ text }) => ({
      content: [{ type: "text", text: countTokens(text).toString() }],
    }),
  );
  server.registerTool(
    "fetch_data",
    {
      description: fetchDataDescription,
      inputSchema: z.object({
        dedupe: z.boolean().default(true),
        include_raw: z.boolean().default(false),
      }),
    },
    async ({ dedupe, include_raw }) => {
      try {
        const raw = await fetchData();
        const raw_length = raw.length;

        if (!dedupe) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  ok: true,
                  raw_length,
                  raw,
                }),
              },
            ],
          };
        }

        const parsed = await parseData(raw);
        const parsed_count = parsed.length;
        const validRows = parsed.filter((row): row is DataItem => row != null);
        const data = removeDuplicateLines(validRows);
        const unique_count = data.length;

        const payload: Record<string, unknown> = {
          ok: true,
          raw_length,
          parsed_count,
          unique_count,
          data,
        };
        if (include_raw) {
          payload.raw = raw;
        }

        return {
          content: [{ type: "text", text: JSON.stringify(payload) }],
        };
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: message }),
            },
          ],
          isError: true,
        };
      }
    },
  );
  server.registerTool(
    "write_json_list",
    {
      description: writeJsonListDescription,
      inputSchema: z.object({
        path: z.string(),
        items: z.array(logEntrySchema),
      }),
    },
    async ({ path, items }) => {
      try {
        await writeJsonList(path, { data: items });
        return {
          content: [{ type: "text", text: JSON.stringify({ ok: true, path }) }],
        };
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: message,
                path,
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );
  server.registerTool(
    "read_json_list_file",
    {
      description: readJsonListFileDescription,
      inputSchema: z.object({ path: z.string() }),
    },
    async ({ path }) => {
      try {
        const payload = await readJsonListFile(path);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ ok: true, path, data: payload }),
            },
          ],
        };
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: message,
                path,
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );
  server.registerTool(
    "update_json_list",
    {
      description: updateJsonListDescription,
      inputSchema: z.object({
        path: z.string(),
        items: z.array(logEntrySchema),
      }),
    },
    async ({ path, items }) => {
      try {
        await updateJsonList(path, items);
        return {
          content: [{ type: "text", text: JSON.stringify({ ok: true, path }) }],
        };
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: message,
                path,
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );
  server.registerTool(
    "build_list_to_verify",
    {
      description: buildListToVerifyDescription,
      inputSchema: z.object({
        items: z.array(logEntrySchema),
      }),
    },
    async ({ items }) => ({
      content: [{ type: "text", text: buildListToVerify(items) }],
    }),
  );
  server.registerTool(
    "verify_answer",
    {
      description: verifyAnswerDescription,
      inputSchema: z.object({ logs: z.string() }),
    },
    async ({ logs }) => {
      try {
        const result = await verifyAnswer(logs);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result),
            },
          ],
        };
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: message }),
            },
          ],
          isError: true,
        };
      }
    },
  );
  return server;
};

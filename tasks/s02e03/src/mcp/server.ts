import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  categorizeDataDescription,
  categorizedLogRowSchema,
  inputLogRowSchema,
  mergeCategorizeLabels,
  runCategorizePrompt,
  type CategorizedLogRow,
} from "../scripts/categorizeData.js";
import { countTokens } from "../scripts/countTokens.js";
import fetchData from "../scripts/fetchData.js";
import { parseData, removeDuplicateLines } from "../scripts/parseData.js";
import type { DataItem } from "../types/index.js";
import {
  dedupeCategorizedRowsWithMode,
  filterRowsByStatus,
  minifyCategorizedRows,
  sortCategorizedRowsByLogDate,
} from "../scripts/logRowFilters.js";
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

const FETCH_RAW_MAX_CHARS = Math.max(
  10_000,
  Number(process.env.S02E03_FETCH_RAW_MAX_CHARS ?? 400_000),
);

const READ_JSON_DEFAULT_LIMIT = Math.min(
  5000,
  Math.max(1, Number(process.env.S02E03_READ_JSON_LIST_DEFAULT_LIMIT ?? 250)),
);

const READ_JSON_MAX_LIMIT = Math.min(
  10_000,
  Math.max(
    READ_JSON_DEFAULT_LIMIT,
    Number(process.env.S02E03_READ_JSON_LIST_MAX_LIMIT ?? 2000),
  ),
);

function stripRowReasoning(
  row: CategorizedLogRow,
): Pick<CategorizedLogRow, "date" | "status" | "message" | "category"> {
  return {
    date: row.date,
    status: row.status,
    message: row.message,
    category: row.category,
  };
}

const fetchDataDescription =
  "Downloads failure.log from the task hub. Default dedupe=true parses log lines and returns unique rows (date+status+message)—much smaller than raw. Set dedupe=false for the full raw file (rejected if larger than S02E03_FETCH_RAW_MAX_CHARS). include_raw=true attaches raw text when dedupe=true (rejected if raw exceeds the same cap).";

const verifyAnswerDescription =
  "POST the verification payload to hub (task failure). Sends answer.logs as the given string; requires HUB_API_KEY. Use after build_list_to_verify with the same plaintext, or an equivalent logs string.";

const removeDuplicatesDescription = [
  "Remove duplicate log rows. `mode` (default `exact`): `exact` — date + status + message (same key as JsonList merge; later row wins). `same_message` — status + normalized message body (whitespace/case-insensitive; matches minimizeMessage coalescing); collapses repeated alert text at different timestamps; later row wins.",
  "Input: `items` plus optional `mode`. Returns `{ data: [...] }` with duplicates collapsed.",
].join(" ");

const filterByLogStatusDescription = [
  'Keep only rows whose `status` is in the given list (e.g. `["CRIT"]` for critical-only).',
  "Input: `items` plus `statuses` — each of INFO, WARN, CRIT.",
].join(" ");

const filterByLogDateDescription = [
  "Sort rows into chronological order by `date` (ascending). The hub requires `answer.logs` lines in time order; use after remove_duplicates / filter_by_log_status (and power_plant filtering) and before build_list_to_verify.",
  "Input: `items`. Returns `{ data: [...] }` with the same rows reordered.",
].join(" ");

const minifyMessageDescription = [
  "JSON rows only: shortens each row's `message` via the shared `minimizeMessage` helper (same as categorize_data; preserves component IDs). Do not use on the plaintext `logs` string from build_list_to_verify.",
  "Call only after use_tokenizer on the candidate `logs` string shows count > 1500. Then return to the same categorized row set (JsonList workflow): re-read_json_list_file if needed, or pass current `items`.",
  "Input: `items` (batch). One model call per row — slow/costly for large arrays. Concurrency defaults to S02E03_MINIFY_CONCURRENCY (default 4). Returns `{ data: [...] }` with updated messages.",
].join(" ");

const logStatusEnum = z.enum(["INFO", "WARN", "CRIT"]);

const removeDuplicatesModeEnum = z.enum(["exact", "same_message"]);

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
        "Counts tokens in `text` (countTokens). Typical use: run on the candidate `logs` string from build_list_to_verify before verify_answer. If count > 1500, do not shrink that string with minify_message — minify_message applies only to JSON `items`; reload or reuse JsonList rows, call minify_message(items), rebuild with build_list_to_verify, then tokenize again.",
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
        dedupe: z.boolean(),
        include_raw: z.boolean(),
      }),
    },
    async ({ dedupe, include_raw }) => {
      try {
        const raw = await fetchData();
        const raw_length = raw.length;

        if (!dedupe) {
          if (raw_length > FETCH_RAW_MAX_CHARS) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    ok: false,
                    error: `Raw log too large (${raw_length} chars; max ${FETCH_RAW_MAX_CHARS}). Use dedupe=true or raise S02E03_FETCH_RAW_MAX_CHARS.`,
                    raw_length,
                  }),
                },
              ],
              isError: true,
            };
          }
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
          if (raw_length > FETCH_RAW_MAX_CHARS) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    ok: false,
                    error: `include_raw would exceed max (${raw_length} chars; max ${FETCH_RAW_MAX_CHARS}). Omit include_raw or raise S02E03_FETCH_RAW_MAX_CHARS.`,
                    raw_length,
                    parsed_count,
                    unique_count,
                    data,
                  }),
                },
              ],
              isError: true,
            };
          }
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
        items: z.array(categorizedLogRowSchema),
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
      inputSchema: z.object({
        path: z.string(),
        offset: z.number().int().min(0).optional(),
        limit: z.number().int().min(1).max(READ_JSON_MAX_LIMIT).optional(),
        include_reasoning: z.boolean().optional(),
      }),
    },
    async ({ path, offset, limit, include_reasoning }) => {
      try {
        const payload = await readJsonListFile(path);
        if (payload === null) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ ok: true, path, data: null }),
              },
            ],
          };
        }

        const off = offset ?? 0;
        const lim = Math.min(
          limit ?? READ_JSON_DEFAULT_LIMIT,
          READ_JSON_MAX_LIMIT,
        );
        const withReasoning = include_reasoning ?? false;
        const rows = payload.data;
        const total = rows.length;
        const slice = rows.slice(off, off + lim);
        const shaped = withReasoning ? slice : slice.map(stripRowReasoning);

        const body = {
          ok: true as const,
          path,
          inputFingerprint: payload.inputFingerprint,
          total,
          offset: off,
          limit: lim,
          has_more: off + shaped.length < total,
          include_reasoning: withReasoning,
          data: { ...payload, data: shaped },
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(body),
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
        items: z.array(categorizedLogRowSchema),
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
        items: z.array(categorizedLogRowSchema),
      }),
    },
    async ({ items }) => ({
      content: [{ type: "text", text: buildListToVerify(items) }],
    }),
  );
  server.registerTool(
    "remove_duplicates",
    {
      description: removeDuplicatesDescription,
      inputSchema: z.object({
        items: z.array(categorizedLogRowSchema),
        mode: removeDuplicatesModeEnum.optional().default("exact"),
      }),
    },
    async ({ items, mode }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            data: dedupeCategorizedRowsWithMode(items, mode),
          }),
        },
      ],
    }),
  );
  server.registerTool(
    "filter_by_log_status",
    {
      description: filterByLogStatusDescription,
      inputSchema: z.object({
        items: z.array(categorizedLogRowSchema),
        statuses: z.array(logStatusEnum).min(1),
      }),
    },
    async ({ items, statuses }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify({ data: filterRowsByStatus(items, statuses) }),
        },
      ],
    }),
  );
  server.registerTool(
    "filter_by_log_date",
    {
      description: filterByLogDateDescription,
      inputSchema: z.object({
        items: z.array(categorizedLogRowSchema),
      }),
    },
    async ({ items }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify({ data: sortCategorizedRowsByLogDate(items) }),
        },
      ],
    }),
  );
  server.registerTool(
    "minify_message",
    {
      description: minifyMessageDescription,
      inputSchema: z.object({
        items: z.array(categorizedLogRowSchema),
      }),
    },
    async ({ items }) => {
      try {
        const data = await minifyCategorizedRows(items);
        return {
          content: [{ type: "text", text: JSON.stringify({ data }) }],
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

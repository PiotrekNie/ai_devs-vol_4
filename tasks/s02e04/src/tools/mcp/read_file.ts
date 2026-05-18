/**
 * read_file MCP tool — chunked local file reader with path sandboxing.
 *
 * If a file exceeds MAX_FILE_READ_CHARS the tool returns only the requested
 * chunk and includes `has_more: true` so the agent can request subsequent
 * chunks via the `offset` parameter.
 *
 * Security: paths are resolved relative to process.cwd() and must stay within
 * the workspace. Absolute paths outside the workspace are rejected.
 */

import { readFile } from "node:fs/promises";
import { resolve, normalize } from "node:path";
import { z } from "zod";
import { MAX_FILE_READ_CHARS } from "../../../config.js";
import { mcpOk, mcpErr } from "../../types/index.js";
import type { McpToolResponse } from "../../types/index.js";

export const readFileInputSchema = z.object({
  filepath: z
    .string()
    .describe(
      "Path to the file to read. Relative paths are resolved from the " +
        "current working directory.",
    ),
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe(
      "Character offset into the file to start reading from (default 0). " +
        "Used for pagination through large files.",
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe(
      `Maximum number of characters to return (default and max: ${MAX_FILE_READ_CHARS}).`,
    ),
});
export type ReadFileInput = z.infer<typeof readFileInputSchema>;

export async function executeReadFile(
  args: ReadFileInput,
): Promise<McpToolResponse> {
  const { filepath, offset = 0 } = args;
  const limit = Math.min(args.limit ?? MAX_FILE_READ_CHARS, MAX_FILE_READ_CHARS);

  try {
    const resolvedPath = resolve(normalize(filepath));
    const content = await readFile(resolvedPath, "utf8");
    const total = content.length;
    const chunk = content.slice(offset, offset + limit);
    const hasMore = offset + chunk.length < total;

    const result = {
      ok: true,
      filepath: resolvedPath,
      total_chars: total,
      offset,
      limit,
      has_more: hasMore,
      content: chunk,
    };
    return mcpOk(JSON.stringify(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return mcpErr(`read_file failed for "${filepath}": ${message}`);
  }
}

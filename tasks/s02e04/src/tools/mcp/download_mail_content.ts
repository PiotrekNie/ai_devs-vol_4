/**
 * download_mail_content — zmail `action: "getMessages"` for full message bodies.
 */

import { z } from "zod";
import { mcpOk, mcpErr } from "../../types/index.js";
import type { McpToolResponse } from "../../types/index.js";
import { postZmail } from "./zmail_client.js";

const idSchema = z.union([
  z.number().int(),
  z.string().min(1),
]);

export const downloadMailContentInputSchema = z.object({
  ids: z
    .union([idSchema, z.array(idSchema).min(1)])
    .describe(
      "rowID (number), 32-char messageID (string), or non-empty array of those.",
    ),
});
export type DownloadMailContentInput = z.infer<
  typeof downloadMailContentInputSchema
>;

export async function executeDownloadMailContent(
  args: DownloadMailContentInput,
): Promise<McpToolResponse> {
  try {
    const { ids } = downloadMailContentInputSchema.parse(args);
    const result = await postZmail({
      action: "getMessages",
      ids,
    });
    return mcpOk(JSON.stringify(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return mcpErr(message);
  }
}

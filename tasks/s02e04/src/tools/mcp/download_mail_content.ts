/**
 * download_mail_content — zmail `action: "getMessages"` for full message bodies.
 *
 * On an active mailbox, rowID from search is not stable — always use messageID
 * (32-char hex) from the same search hit.
 */

import { z } from "zod";
import { mcpOk, mcpErr } from "../../types/index.js";
import type { McpToolResponse } from "../../types/index.js";
import { postZmail } from "./zmail_client.js";

/** 32-character messageID returned by search_mail / getInbox (hex). */
export const ZMAIL_MESSAGE_ID_PATTERN = /^[a-f0-9]{32}$/i;

export function isZmailMessageId(value: string): boolean {
  return ZMAIL_MESSAGE_ID_PATTERN.test(value.trim());
}

const messageIdSchema = z
  .string()
  .min(32)
  .max(32)
  .refine((s) => isZmailMessageId(s), {
    message:
      "Must be the 32-character messageID from search_mail items — not rowID, not ticket labels like SEC-41248.",
  });

export const downloadMailContentInputSchema = z.object({
  ids: z
    .union([messageIdSchema, z.array(messageIdSchema).min(1)])
    .describe(
      "One messageID or array of messageIDs (32-char hex) copied from search_mail result items. " +
        "Do NOT pass numeric rowID — it may return the wrong message on an active mailbox.",
    ),
});

export type DownloadMailContentInput = z.infer<
  typeof downloadMailContentInputSchema
>;

function formatZodError(err: z.ZodError): string {
  return err.issues
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");
}

export function rejectRowIdDownloadIds(
  raw: unknown,
): McpToolResponse | null {
  const check = (id: unknown): boolean =>
    typeof id === "number" || (typeof id === "string" && /^\d+$/.test(id.trim()));

  if (typeof raw === "number" || (typeof raw === "string" && check(raw))) {
    return mcpErr(
      "Do not use rowID (number) for download_mail_content. " +
        "Copy messageID (32-character hex string) from the matching search_mail item, e.g. " +
        'download_mail_content({ ids: "6624add090a5cb06f5c192653b5a243c" }).',
    );
  }

  if (Array.isArray(raw)) {
    for (const id of raw) {
      if (check(id)) {
        return mcpErr(
          "Do not use rowID in ids array. Use messageID strings from search_mail items only.",
        );
      }
    }
  }

  return null;
}

export async function executeDownloadMailContent(
  args: unknown,
): Promise<McpToolResponse> {
  const rawIds =
    args && typeof args === "object" && "ids" in args
      ? (args as { ids: unknown }).ids
      : undefined;
  const rowIdReject = rejectRowIdDownloadIds(rawIds);
  if (rowIdReject) return rowIdReject;

  const parsed = downloadMailContentInputSchema.safeParse(args);
  if (!parsed.success) {
    return mcpErr(formatZodError(parsed.error));
  }

  try {
    const { ids } = parsed.data;
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

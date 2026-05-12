/**
 * analyze_image_vision MCP tool — lightweight vision analysis via a dedicated model.
 *
 * Reads a local image file, encodes it as base64, and sends it to a vision-capable
 * model (AGENT_VISION_MODEL, default gpt-4o-mini). Returns the model's text
 * description. Use this to offload image analysis to a cheaper model while
 * keeping the main agent context focused on text.
 *
 * Supported formats: .jpg/.jpeg, .png, .gif, .webp
 */

import { readFile } from "node:fs/promises";
import { extname, resolve, normalize } from "node:path";
import { z } from "zod";
import {
  AI_API_KEY,
  EXTRA_API_HEADERS,
  RESPONSES_API_ENDPOINT,
  AGENT_VISION_MODEL,
} from "../../../config.js";
import { mcpOk, mcpErr } from "../../types/index.js";
import { fetchWithRetry } from "../../agent/ai.js";
import type { McpToolResponse } from "../../types/index.js";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export const analyzeImageVisionInputSchema = z.object({
  filepath: z
    .string()
    .describe(
      "Path to a local image file (.jpg, .jpeg, .png, .gif, or .webp). " +
        "Relative paths are resolved from the current working directory.",
    ),
  query: z
    .string()
    .describe(
      "Question or instruction for the vision model. " +
        "E.g. 'Describe what you see.' or 'What text is visible in this image?'",
    ),
});
export type AnalyzeImageVisionInput = z.infer<
  typeof analyzeImageVisionInputSchema
>;

export async function executeAnalyzeImageVision(
  args: AnalyzeImageVisionInput,
): Promise<McpToolResponse> {
  const { filepath, query } = args;

  try {
    const resolvedPath = resolve(normalize(filepath));
    const ext = extname(resolvedPath).toLowerCase();
    const mimeType = MIME_TYPES[ext];

    if (!mimeType) {
      return mcpErr(
        `Unsupported image format: "${ext}". Supported: ${Object.keys(MIME_TYPES).join(", ")}`,
      );
    }

    const imageBuffer = await readFile(resolvedPath);
    const base64 = imageBuffer.toString("base64");
    const imageUrl = `data:${mimeType};base64,${base64}`;

    const body = {
      model: AGENT_VISION_MODEL,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: query },
            { type: "input_image", image_url: imageUrl },
          ],
        },
      ],
    };

    const response = await fetchWithRetry(RESPONSES_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
        ...EXTRA_API_HEADERS,
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    if (!response.ok || data["error"]) {
      const err = data["error"];
      const msg =
        typeof err === "string"
          ? err
          : typeof err === "object" &&
              err !== null &&
              "message" in err &&
              typeof (err as { message?: unknown }).message === "string"
            ? (err as { message: string }).message
            : `Vision API request failed (${response.status})`;
      return mcpErr(msg);
    }

    // Extract text from Responses API output
    let text: string | null = null;
    if (typeof data["output_text"] === "string") {
      text = data["output_text"].trim();
    } else {
      const output = data["output"] as
        | Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>
        | undefined;
      const message = output?.find((o) => o.type === "message");
      const part = message?.content?.find((c) => c.type === "output_text");
      text = part?.text?.trim() ?? null;
    }

    if (!text) {
      return mcpErr("Vision model returned an empty response.");
    }

    return mcpOk(JSON.stringify({ ok: true, analysis: text }));
  } catch (error) {
    return mcpErr(error instanceof Error ? error.message : String(error));
  }
}

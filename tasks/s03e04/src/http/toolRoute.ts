import { z } from "zod";
import type { Context } from "hono";
import { byteLength } from "../tools/formatOutput.js";

const toolRequestSchema = z.object({
  params: z.string(),
});

export function createToolHandler(
  handler: (params: string) => string,
): (c: Context) => Response | Promise<Response> {
  return async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ output: "Podaj opis produktu." });
    }

    const parsed = toolRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ output: "Podaj opis produktu." });
    }

    const output = handler(parsed.data.params);
    console.log(
      `[TOOL] ${c.req.path} params=${JSON.stringify(parsed.data.params)} bytes=${byteLength(output)} output=${JSON.stringify(output)}`,
    );
    return c.json({ output });
  };
}

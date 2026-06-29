import { describe, it, expect, mock, afterEach } from "bun:test";
import { z } from "zod";
import {
  chatStructured,
  StructuredOutputParseError,
  StructuredOutputValidationError,
  StructuredOutputError,
  zodToOpenAiJsonSchema,
} from "./structured.js";

const sampleSchema = z.object({
  value: z.number(),
});

function mockStructuredResponse(payload: unknown, usage?: object) {
  return new Response(
    JSON.stringify({
      output_text: JSON.stringify(payload),
      output: [
        {
          type: "message",
          content: [
            { type: "output_text", text: JSON.stringify(payload) },
          ],
        },
      ],
      ...(usage ? { usage } : {}),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

describe("zodToOpenAiJsonSchema", () => {
  it("produces object schema without $schema key", () => {
    const schema = zodToOpenAiJsonSchema(z.object({ a: z.string() }));
    expect(schema["type"]).toBe("object");
    expect(schema["$schema"]).toBeUndefined();
    expect(schema["additionalProperties"]).toBe(false);
  });
});

describe("chatStructured", () => {
  afterEach(() => {
    globalThis.fetch = global.fetch;
  });

  it("returns parsed data on valid JSON + Zod match", async () => {
    let body = "";
    globalThis.fetch = mock(async (_url, init) => {
      body = String(init?.body ?? "");
      return mockStructuredResponse({ value: 42 }, {
        input_tokens: 3,
        output_tokens: 7,
      });
    }) as unknown as typeof fetch;

    const result = await chatStructured(
      {
        model: "gpt-4o-mini",
        schemaName: "sample",
        schema: sampleSchema,
        input: [{ role: "user", content: "give 42" }],
      },
      { retryDelayBaseMs: 0 },
    );

    expect(result.data).toEqual({ value: 42 });
    expect(result.usage).toEqual({ inputTokens: 3, outputTokens: 7 });
    const parsed = JSON.parse(body) as Record<string, unknown>;
    const text = parsed["text"] as Record<string, unknown>;
    const format = text["format"] as Record<string, unknown>;
    expect(format["type"]).toBe("json_schema");
    expect(format["strict"]).toBe(true);
    expect(parsed["tools"]).toBeUndefined();
  });

  it("throws StructuredOutputParseError on invalid JSON", async () => {
    globalThis.fetch = mock(async () =>
      new Response(
        JSON.stringify({
          output_text: "not-json",
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;

    await expect(
      chatStructured(
        {
          model: "gpt-4o-mini",
          schemaName: "sample",
          schema: sampleSchema,
        },
        { retryDelayBaseMs: 0 },
      ),
    ).rejects.toBeInstanceOf(StructuredOutputParseError);
  });

  it("throws StructuredOutputValidationError when JSON does not match Zod", async () => {
    globalThis.fetch = mock(async () =>
      mockStructuredResponse({ value: "wrong" }),
    ) as unknown as typeof fetch;

    try {
      await chatStructured(
        {
          model: "gpt-4o-mini",
          schemaName: "sample",
          schema: sampleSchema,
        },
        { retryDelayBaseMs: 0, includeRawText: true },
      );
      expect.unreachable("should throw");
    } catch (e) {
      expect(e).toBeInstanceOf(StructuredOutputValidationError);
      const err = e as StructuredOutputValidationError;
      expect(err.parsed).toEqual({ value: "wrong" });
      expect(err.rawText).toBe(JSON.stringify({ value: "wrong" }));
    }
  });

  it("retries on 503 and succeeds on third attempt", async () => {
    let calls = 0;
    globalThis.fetch = mock(async () => {
      calls++;
      if (calls < 3) {
        return new Response("", { status: 503 });
      }
      return mockStructuredResponse({ value: 1 });
    }) as unknown as typeof fetch;

    const result = await chatStructured(
      {
        model: "gpt-4o-mini",
        schemaName: "sample",
        schema: sampleSchema,
      },
      { retryDelayBaseMs: 0 },
    );

    expect(result.data).toEqual({ value: 1 });
    expect(calls).toBe(3);
  });

  it("rejects invalid schemaName before fetch", async () => {
    let calls = 0;
    globalThis.fetch = mock(async () => {
      calls++;
      return mockStructuredResponse({ value: 1 });
    }) as unknown as typeof fetch;

    await expect(
      chatStructured(
        {
          model: "gpt-4o-mini",
          schemaName: "bad name!",
          schema: sampleSchema,
        },
        { retryDelayBaseMs: 0 },
      ),
    ).rejects.toBeInstanceOf(StructuredOutputError);

    expect(calls).toBe(0);
  });

  it("uses jsonSchema override when provided", async () => {
    let body = "";
    globalThis.fetch = mock(async (_url, init) => {
      body = String(init?.body ?? "");
      return mockStructuredResponse({ tag: "ok" });
    }) as unknown as typeof fetch;

    const override = {
      type: "object",
      properties: { tag: { type: "string" } },
      required: ["tag"],
      additionalProperties: false,
    };

    await chatStructured(
      {
        model: "gpt-4o-mini",
        schemaName: "override_test",
        schema: z.object({ tag: z.string() }),
        jsonSchema: override,
      },
      { retryDelayBaseMs: 0 },
    );

    const parsed = JSON.parse(body) as Record<string, unknown>;
    const format = (parsed["text"] as Record<string, unknown>)["format"] as Record<
      string,
      unknown
    >;
    expect(format["schema"]).toEqual(override);
  });
});

describe("createStructuredAIAdapter", () => {
  afterEach(() => {
    globalThis.fetch = global.fetch;
  });

  it("binds model from factory config", async () => {
    globalThis.fetch = mock(async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      expect(body["model"]).toBe("bound-model");
      return mockStructuredResponse({ value: 9 });
    }) as unknown as typeof fetch;

    const { createStructuredAIAdapter } = await import("./structured.js");
    const adapter = createStructuredAIAdapter({ model: "bound-model" });
    const result = await adapter.generateObject(
      {
        schemaName: "sample",
        schema: sampleSchema,
      },
      { retryDelayBaseMs: 0 },
    );

    expect(result.data).toEqual({ value: 9 });
  });
});

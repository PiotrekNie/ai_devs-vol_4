import { describe, it, expect } from "bun:test";
import {
  MessageSchema,
  ToolCallSchema,
  ToolResultSchema,
  ModelResponseSchema,
  McpToolResponseSchema,
  mcpOk,
  mcpErr,
} from "./index.js";

describe("MessageSchema", () => {
  it("accepts a simple text message", () => {
    const result = MessageSchema.safeParse({ role: "user", content: "hello" });
    expect(result.success).toBe(true);
  });

  it("accepts a multimodal message with input_text and input_image", () => {
    const result = MessageSchema.safeParse({
      role: "user",
      content: [
        { type: "input_text", text: "describe this" },
        { type: "input_image", image_url: "data:image/png;base64,abc" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown roles", () => {
    const result = MessageSchema.safeParse({ role: "ghost", content: "boo" });
    expect(result.success).toBe(false);
  });
});

describe("ToolCallSchema", () => {
  it("accepts a valid function_call item", () => {
    const result = ToolCallSchema.safeParse({
      type: "function_call",
      name: "finish_task",
      arguments: '{"final_answer":"42"}',
      call_id: "call_abc123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing call_id", () => {
    const result = ToolCallSchema.safeParse({
      type: "function_call",
      name: "some_tool",
      arguments: "{}",
    });
    expect(result.success).toBe(false);
  });
});

describe("ToolResultSchema", () => {
  it("accepts valid tool output", () => {
    const result = ToolResultSchema.safeParse({
      type: "function_call_output",
      call_id: "call_abc123",
      output: '{"ok":true}',
    });
    expect(result.success).toBe(true);
  });
});

describe("ModelResponseSchema", () => {
  it("accepts a response with tool calls and no content", () => {
    const result = ModelResponseSchema.safeParse({
      content: null,
      toolCalls: [
        {
          type: "function_call",
          name: "http_request",
          arguments: '{"url":"https://example.com","method":"GET"}',
          call_id: "call_1",
        },
      ],
      rawOutputItems: [],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a response with content and no tool calls", () => {
    const result = ModelResponseSchema.safeParse({
      content: "The answer is 42.",
      toolCalls: [],
      rawOutputItems: [{ type: "message", role: "assistant" }],
    });
    expect(result.success).toBe(true);
  });
});

describe("McpToolResponseSchema", () => {
  it("validates mcpOk helper output", () => {
    const response = mcpOk("some result");
    const result = McpToolResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
    expect(response.content[0]?.text).toBe("some result");
  });

  it("validates mcpErr helper output", () => {
    const response = mcpErr("something went wrong");
    const result = McpToolResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
    expect(response.isError).toBe(true);
    expect(response.content[0]?.text).toContain("something went wrong");
  });
});

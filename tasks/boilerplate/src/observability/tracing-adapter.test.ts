import { describe, expect, test } from "bun:test";
import {
  formatAssistantOutput,
  formatResponsesInput,
} from "./format.js";
import { isTracingActive, resetTracingForTests } from "./init.js";
import { withTracingAdapter } from "./tracing-adapter.js";
import type { AIAdapter } from "../agent/ai.js";

describe("formatResponsesInput", () => {
  test("prepends system instructions", () => {
    const out = formatResponsesInput(
      [{ role: "user", content: "hi" }],
      "sys",
    );
    expect(out[0]).toEqual({ role: "system", content: "sys" });
    expect(out[1]).toEqual({ role: "user", content: "hi" });
  });
});

describe("formatAssistantOutput", () => {
  test("returns undefined for empty", () => {
    expect(formatAssistantOutput("", [])).toBeUndefined();
  });
});

describe("withTracingAdapter", () => {
  test("delegates when tracing inactive", async () => {
    resetTracingForTests();
    expect(isTracingActive()).toBe(false);

    const inner: AIAdapter = {
      async generateResponse() {
        return {
          content: "hello",
          toolCalls: [],
          rawOutputItems: [],
        };
      },
    };

    const wrapped = withTracingAdapter(inner, "gpt-4o-mini");
    const res = await wrapped.generateResponse([], [], "inst");
    expect(res.content).toBe("hello");
  });
});

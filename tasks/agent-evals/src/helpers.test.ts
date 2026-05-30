import { describe, expect, test } from "bun:test";
import {
  asArray,
  extractToolNames,
  toCaseInput,
} from "./helpers.js";

describe("helpers", () => {
  test("toCaseInput parses id and message", () => {
    expect(toCaseInput({ id: "a", message: "hi" })).toEqual({
      id: "a",
      message: "hi",
    });
  });

  test("extractToolNames from function_call items", () => {
    const names = extractToolNames([
      { type: "function_call", name: "get_current_time", call_id: "1" },
      { role: "user", content: "x" },
      { type: "function_call", name: "sum_numbers", call_id: "2" },
    ]);
    expect(names).toEqual(["get_current_time", "sum_numbers"]);
  });

  test("asArray wraps non-array", () => {
    expect(asArray(null)).toEqual([]);
    expect(asArray([1])).toEqual([1]);
  });
});

import { describe, expect, it } from "bun:test";
import { fsBatchInputSchema } from "./fs_batch.js";

describe("fsBatchInputSchema", () => {
  it("accepts valid batch actions", () => {
    const parsed = fsBatchInputSchema.parse({
      actions: [
        { action: "createDirectory", path: "/miasta" },
        {
          action: "createFile",
          path: "/miasta/domatowo",
          content: '{"makaron": 60}',
        },
      ],
    });
    expect(parsed.actions).toHaveLength(2);
  });

  it("rejects empty actions array", () => {
    expect(() => fsBatchInputSchema.parse({ actions: [] })).toThrow();
  });

  it("rejects createFile without content", () => {
    expect(() =>
      fsBatchInputSchema.parse({
        actions: [{ action: "createFile", path: "/miasta/x" }],
      }),
    ).toThrow();
  });
});

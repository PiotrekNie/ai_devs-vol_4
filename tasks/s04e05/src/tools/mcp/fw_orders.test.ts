import { describe, expect, it } from "bun:test";
import { fwOrdersSchema } from "./schemas.js";

describe("fwOrdersSchema", () => {
  it("accepts create action", () => {
    const parsed = fwOrdersSchema.parse({
      action: "create",
      title: "Dostawa",
      creatorID: 2,
      destination: 991828,
      signature: "96d66cc4d28484b3c5b9e05e4f79152eb564f6e0",
    });
    expect(parsed.action).toBe("create");
  });

  it("accepts append batch map", () => {
    const parsed = fwOrdersSchema.parse({
      action: "append",
      id: "order-id",
      items: { chleb: 45, woda: 120 },
    });
    expect(parsed.action).toBe("append");
  });

  it("rejects create without signature", () => {
    expect(() =>
      fwOrdersSchema.parse({
        action: "create",
        title: "X",
        creatorID: 2,
        destination: 1,
      }),
    ).toThrow();
  });
});

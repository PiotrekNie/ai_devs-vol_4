import { describe, it, expect } from "bun:test";
import {
  isMailboxConfirmationCode,
  validateMailboxHubAnswer,
} from "./mailbox_answer.js";

const VALID_CODE = "SEC-c1e598764329cc9c377ef1d029be8ceb";

describe("isMailboxConfirmationCode", () => {
  it("accepts SEC- + 32 hex", () => {
    expect(isMailboxConfirmationCode(VALID_CODE)).toBe(true);
  });

  it("rejects short codes from incomplete mails", () => {
    expect(isMailboxConfirmationCode("SEC-c1e598764329cc9c377ef1d029be8ce")).toBe(
      false,
    );
  });
});

describe("validateMailboxHubAnswer", () => {
  it("rejects confirmation_code with wrong length", () => {
    const err = validateMailboxHubAnswer({
      date: "2026-03-23",
      password: "RABARBAR25",
      confirmation_code: "SEC-c1e598764329cc9c377ef1d029be8ce",
    });
    expect(err).toContain("36 characters");
  });

  it("accepts merged mailbox answer", () => {
    expect(
      validateMailboxHubAnswer({
        date: "2026-03-23",
        password: "RABARBAR25",
        confirmation_code: VALID_CODE,
      }),
    ).toBeNull();
  });

  it("rejects invalid date format", () => {
    const err = validateMailboxHubAnswer({
      date: "03/23/2026",
      password: "x",
      confirmation_code: VALID_CODE,
    });
    expect(err).toContain("YYYY-MM-DD");
  });
});

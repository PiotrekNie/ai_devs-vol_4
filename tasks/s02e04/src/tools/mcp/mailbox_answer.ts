/**
 * Client-side validation for mailbox hub answers (before HTTP submit).
 */

export const MAILBOX_CONFIRMATION_CODE_LENGTH = 36;

const MAILBOX_CONFIRMATION_PATTERN = /^SEC-[a-f0-9]{32}$/i;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isMailboxConfirmationCode(value: string): boolean {
  return (
    value.length === MAILBOX_CONFIRMATION_CODE_LENGTH &&
    MAILBOX_CONFIRMATION_PATTERN.test(value)
  );
}

/**
 * Returns a human-readable error for the agent, or null if OK / not applicable.
 */
export function validateMailboxHubAnswer(answer: unknown): string | null {
  if (answer === null || typeof answer !== "object" || Array.isArray(answer)) {
    return "mailbox answer must be a JSON object with date, password, and confirmation_code.";
  }

  const record = answer as Record<string, unknown>;
  const errors: string[] = [];

  if ("date" in record && typeof record.date === "string") {
    const date = record.date.trim();
    if (!ISO_DATE_PATTERN.test(date)) {
      errors.push("date must be YYYY-MM-DD (attack day from security mail body, not mail header date).");
    }
  }

  if ("password" in record && typeof record.password === "string") {
    if (record.password.trim().length === 0) {
      errors.push("password must be a non-empty string from the password-reset email body.");
    }
  }

  if ("confirmation_code" in record && typeof record.confirmation_code === "string") {
    const code = record.confirmation_code.trim();
    if (code.length !== MAILBOX_CONFIRMATION_CODE_LENGTH) {
      errors.push(
        `confirmation_code must be exactly ${MAILBOX_CONFIRMATION_CODE_LENGTH} characters (SEC- + 32 hex); got ${code.length}. ` +
          "Do not mix fields from different emails — use the corrected code from the newest security-thread mail if an older mail has a shorter code.",
      );
    } else if (!MAILBOX_CONFIRMATION_PATTERN.test(code)) {
      errors.push(
        "confirmation_code must be SEC- followed by 32 hexadecimal characters (ticket subject SEC-41248 is not the code).",
      );
    }
  }

  return errors.length > 0 ? errors.join(" ") : null;
}

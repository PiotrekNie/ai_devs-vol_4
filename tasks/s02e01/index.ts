/**
 * Task `categorize` (S02E01): classify 10 items via hub; shared prompt prefix + per-row id/desc.
 *
 * Env (tasks/.env via ../config.js):
 * - HUB_API_KEY — required for CSV + /verify
 * - CATEGORIZE_MAX_PROMPT_TOKENS — default 100 (total prompt per request)
 * - CATEGORIZE_REPAIR — set to 0 to disable prefix self-repair after hub errors
 * - CATEGORIZE_REPAIR_PER_ROW — max repair attempts per row (default 3)
 * - CATEGORIZE_REPAIR_MODEL — OpenRouter model for rewriting rules (default: strong Sonnet-class)
 * - CATEGORIZE_REPAIR_MAX_CHARS — max chars from repair LLM before shortening (default 6000)
 * - CATEGORIZE_OUTER_ATTEMPTS — how many full CSV→verify passes (each failure calls `reset`)
 *
 * Flow: fetch CSV → for each row POST prompt → on soft failure, repairSharedPrefix + retry same row
 * (see plan: auto-naprawa). Special hub codes: `-910` insufficient funds → `reset` + retry same POST;
 * `-890` wrong classification (progress often resets) → repair rules + restart from first CSV row.
 * Other hard errors abort; outer loop calls `reset` between full attempts.
 */
import "../config.js";

import {
  CATEGORIZE_OUTER_ATTEMPTS,
  CATEGORIZE_REPAIR_ENABLED,
  CATEGORIZE_REPAIR_PER_ROW,
  HUB_VERIFY_URL,
  TASK_NAME,
} from "./src/config.ts";
import { parseCategorizeCsv } from "./src/csv.ts";
import {
  extractHubFeedback,
  formatHubFeedbackForRepair,
  hubCategorizeAlreadyDoneThisItem,
  hubCategorizeRowAccepted,
  hubInsufficientFunds,
  hubResultNeedsRepair,
  hubWrongClassification,
  messageHasFlag,
  responseLooksLikeHardError,
  type HubCategorizeResult,
} from "./src/hubFeedback.ts";
import {
  buildSharedPrefix,
  repairSharedPrefix,
  shortenPrefixUntilAllFit,
  truncateForRow,
} from "./src/promptTemplate.ts";

async function postCategorizePrompt(prompt: string): Promise<{
  status: number;
  json: HubCategorizeResult;
  bodyText: string;
}> {
  const key = process.env.HUB_API_KEY?.trim() ?? "";
  if (!key) {
    throw new Error("HUB_API_KEY is not set");
  }

  const response = await fetch(HUB_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: key,
      task: TASK_NAME,
      answer: { prompt },
    }),
  });

  const bodyText = await response.text();
  let json: HubCategorizeResult = {};
  if (bodyText.length > 0) {
    try {
      json = JSON.parse(bodyText) as HubCategorizeResult;
    } catch {
      json = { message: bodyText };
    }
  }

  return { status: response.status, json, bodyText };
}

async function postReset(): Promise<void> {
  await postCategorizePrompt("reset");
}

async function fetchCategorizeCsv(): Promise<string> {
  const key = process.env.HUB_API_KEY?.trim() ?? "";
  if (!key) {
    throw new Error("HUB_API_KEY is not set");
  }
  const url = `https://hub.ag3nts.org/data/${encodeURIComponent(key)}/categorize.csv`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`CSV HTTP ${res.status}`);
  }
  return res.text();
}

/**
 * One full pass: fresh CSV, 10 hub calls, optional per-row prefix repair.
 * Returns `{FLG:...}` fragment when hub reports success; `undefined` on failure.
 */
export async function runSingleAttempt(): Promise<string | undefined> {
  const csvText = await fetchCategorizeCsv();
  const rows = parseCategorizeCsv(csvText);
  if (rows.length === 0) {
    console.error("CSV: no rows parsed");
    return undefined;
  }

  let prefix = buildSharedPrefix(rows);
  prefix = shortenPrefixUntilAllFit(prefix, rows);

  const maxPostsPerRow = 1 + CATEGORIZE_REPAIR_PER_ROW;

  rowsLoop: for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx]!;
    let currentPrefix = prefix;

    for (let postIdx = 0; postIdx < maxPostsPerRow; postIdx++) {
      const prompt = truncateForRow(currentPrefix, row);
      const res = await postCategorizePrompt(prompt);

      const msg = extractHubFeedback(res.json, res.bodyText);
      if (messageHasFlag(msg)) {
        const m = msg.match(/\{FLG:[^}]+\}/);
        return m?.[0] ?? msg;
      }

      if (hubCategorizeRowAccepted(res.json)) {
        console.log(
          `[hub] row ${row.id} classified (code=1 ACCEPTED) \n prompt=${prompt}`,
        );
        prefix = currentPrefix;
        continue rowsLoop;
      }

      if (hubCategorizeAlreadyDoneThisItem(res.json)) {
        console.log(
          `[hub] row ${row.id} already done on hub (-923) — advancing to next row`,
        );
        prefix = currentPrefix;
        continue rowsLoop;
      }

      if (hubInsufficientFunds(res.json)) {
        console.log(
          "[hub] -910 insufficient funds — reset (hub renews balance), retrying same prompt",
        );
        await postReset();
        postIdx--;
        continue;
      }

      if (hubWrongClassification(res.json)) {
        console.error(
          "[hub] wrong classification:",
          JSON.stringify(res.json, null, 2),
          `\nprompt=${prompt}`,
        );
        if (!CATEGORIZE_REPAIR_ENABLED || postIdx === maxPostsPerRow - 1) {
          return undefined;
        }
        console.log(
          `[repair] wrong label — rewriting rules, restarting from row 1 (hub reset progress)`,
        );
        const feedback = formatHubFeedbackForRepair(res.json, res.bodyText);
        currentPrefix = await repairSharedPrefix({
          rows,
          previousPrefix: currentPrefix,
          hubFeedback: feedback,
          rowContext: row,
        });
        currentPrefix = shortenPrefixUntilAllFit(currentPrefix, rows);
        prefix = currentPrefix;
        rowIdx = -1;
        continue rowsLoop;
      }

      if (responseLooksLikeHardError(res.json, res.status)) {
        console.error(
          "[hub] hard error (no repair):",
          JSON.stringify(res.json, null, 2),
        );
        return undefined;
      }

      const needsRepair = hubResultNeedsRepair(
        res.status,
        res.json,
        res.bodyText,
      );
      if (!needsRepair) {
        prefix = currentPrefix;
        continue rowsLoop;
      }

      console.error("[hub] error response:", JSON.stringify(res.json, null, 2));

      if (!CATEGORIZE_REPAIR_ENABLED || postIdx === maxPostsPerRow - 1) {
        return undefined;
      }

      console.log(
        `[repair] row id=${row.id} post ${postIdx + 1}/${maxPostsPerRow}`,
      );

      const feedback = extractHubFeedback(res.json, res.bodyText);
      currentPrefix = await repairSharedPrefix({
        rows,
        previousPrefix: currentPrefix,
        hubFeedback: feedback,
        rowContext: row,
      });
      currentPrefix = shortenPrefixUntilAllFit(currentPrefix, rows);
      prefix = currentPrefix;
    }
  }

  return undefined;
}

async function main(): Promise<void> {
  for (let a = 1; a <= CATEGORIZE_OUTER_ATTEMPTS; a++) {
    console.log(
      `\n--- categorize attempt ${a}/${CATEGORIZE_OUTER_ATTEMPTS} ---`,
    );
    const flag = await runSingleAttempt();
    if (flag) {
      console.log("\nDone:", flag);
      return;
    }
    console.log("Attempt failed — sending reset before retry…");
    await postReset();
  }

  console.error("Exceeded outer attempts without flag.");
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

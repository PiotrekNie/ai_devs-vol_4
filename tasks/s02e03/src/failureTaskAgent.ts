/**
 * Orchestrated failure-task agent: plan → human approval → verify loop (max 10 hub calls).
 */

import { createInterface } from "node:readline/promises";
import path from "node:path";
import { stdin as input, stderr as output } from "node:process";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { resolveModelForProvider } from "../../config.js";
import { compactResponsesApiOutput, createAgent } from "./agent.js";
import { chat, extractText, resolveReasoningForRequest } from "./ai.js";
import { callMcpTool, mcpToolResultToText } from "./mcp/client.js";
import { createMcpToolRuntime } from "./mcpRuntime.js";
import { logScript } from "./log.js";
import {
  parseVerifyBody,
  type ParsedVerifyBody,
} from "./scripts/verifyAnswer.js";

const MAX_VERIFY_ATTEMPTS = 10;
const EXECUTION_MAX_TOOL_ROUNDS = 16;
const MAX_PLAN_CLARIFICATION_ROUNDS = 5;
const MAX_NO_VERIFY_NUDGES = 30;

/** Always-on hub contract for task `failure` (never truncated). */
const FAILURE_HUB_TASK_SPEC = [
  "### Hub task: failure (authoritative)",
  "- Task name: `failure`. Iterate `verify_answer` until the hub response includes flag `{FLG:...}`.",
  "- Deliver one condensed `logs` string for outage/root-cause analysis: only events on the **causal path** (power, cooling, water pumps, control/software, and other mechanisms that matter for the incident chain).",
  "- **categorize_data** labels `power_plant` only for **high-confidence causal** lines; borderline lines should be `non_power_plant` so the final list stays within limits.",
  "- Hard cap: **≤1500 tokens** on the final `logs` string. Call **use_tokenizer immediately before every verify_answer**. Over-limit payloads are rejected; prefer a conservative token count.",
  "- `answer.logs`: a single string; **one physical line = one event**; lines separated by newline characters (\\n); do not merge multiple events into one line.",
  "- Each line: preserve **date** `YYYY-MM-DD`, **time** `HH:MM` or `H:MM`, **severity**, and **subsystem/component id**; shorten or paraphrase message text only if those anchors stay clear.",
  "- Log source URL pattern: `https://hub.ag3nts.org/data/{apikey}/failure.log`. The file **changes at midnight** — re-fetch if work spans midnight.",
  '- Submission: `POST https://hub.ag3nts.org/verify` with `task: "failure"` and `answer: { logs: "..." }` (use the verify_answer tool).',
  "- Prefer paged **read_json_list_file** and categorized rows; avoid loading full raw logs into the model repeatedly. Use **fetch_data(dedupe=false)** only when necessary.",
  "- Pipeline tools (see execution instructions): **remove_duplicates** (use **mode: same_message** to collapse repeated alert text at different timestamps; default **exact** is date+status+message only), **filter_by_log_status** (e.g. CRIT-only), **filter_by_log_date** (sort rows chronologically — required for hub verify). Pass the tool’s returned **data** into **build_list_to_verify**. After **build_list_to_verify**, **use_tokenizer** on the logs string; only if **>1500**, return to JsonList **items** and **minify_message** (JSON rows only), then **filter_by_log_date** and **build_list_to_verify** again — not minification of the plaintext string.",
  "- Read technician feedback in verify responses; add or rephrase lines, re-tokenize, and verify again until complete.",
].join("\n");

/** Last-resort shrink if journal + active window still exceed char limits (Observational Memory handles token budget first). */
function sealExecutionInputIfLarge(
  input: unknown[],
  meta: {
    jsonListPath: string;
    planExcerpt: string;
    verifyAttempts: number;
    lastHubSummary: string;
    lastVerifyFeedback: string;
  },
): unknown[] {
  const max = Math.max(
    20_000,
    Number(process.env.S02E03_MAX_EXECUTION_INPUT_CHARS ?? 100_000),
  );
  const serialized = JSON.stringify(input);
  if (serialized.length <= max) {
    return input;
  }
  logScript("failure agent — sealed execution context (size limit)", {
    beforeChars: serialized.length,
    max,
  });
  const feedback = meta.lastVerifyFeedback.trim();
  const content = [
    "Compressed execution state (earlier Responses items were dropped to stay under the context limit).",
    `JsonList path: ${meta.jsonListPath}`,
    `Approved plan (excerpt): ${meta.planExcerpt.slice(0, 4000)}`,
    `Verify attempts so far: ${meta.verifyAttempts}`,
    `Last hub / state: ${meta.lastHubSummary.slice(0, 3500)}`,
    feedback
      ? `Last verify technician feedback (keep addressing this): ${feedback.slice(0, 2500)}`
      : "",
    "Continue: read_json_list_file (offset/limit, include_reasoning=false), remove_duplicates(mode: same_message), filter_by_log_status, keep only strict causal category power_plant, filter_by_log_date, build_list_to_verify on returned data, use_tokenizer; if over 1500 tokens return to JsonList items, minify_message(items), filter_by_log_date, rebuild build_list_to_verify, use_tokenizer until ≤1500, then verify_answer (write_json_list/update_json_list when persisting minified rows to the file).",
  ]
    .filter(Boolean)
    .join("\n");
  return [{ role: "user", content }];
}

function extractPlanSection(text: string): string {
  const m = text.match(/PLAN:\s*([\s\S]*)/i);
  return (m?.[1] ?? text).trim();
}

function looksLikeQuestions(text: string): boolean {
  return /^\s*QUESTIONS:/im.test(text);
}

async function promptHumanLine(prompt: string): Promise<string> {
  const rl = createInterface({ input, output });
  try {
    return (await rl.question(prompt)).trim();
  } finally {
    rl.close();
  }
}

async function confirmPlanWithHuman(planText: string): Promise<void> {
  logScript("failure agent plan (approve below)", {
    planExcerpt: planText.slice(0, 12000),
  });

  if (!input.isTTY) {
    if (process.env.FAILURE_AGENT_AUTO_APPROVE === "1") {
      logScript(
        "plan auto-approved (FAILURE_AGENT_AUTO_APPROVE=1, non-TTY stdin)",
      );
      return;
    }
    throw new Error(
      "Non-interactive stdin: set FAILURE_AGENT_AUTO_APPROVE=1 to approve the plan, or run in a TTY.",
    );
  }

  const answer = await promptHumanLine(
    "Type yes to approve the plan and start execution: ",
  );
  if (answer.toLowerCase() !== "yes") {
    throw new Error("Plan not approved by user.");
  }
}

export async function runFailureTaskAgent(options: {
  jsonListPath: string;
}): Promise<void> {
  const reasoning = resolveReasoningForRequest();

  const model = resolveModelForProvider(
    process.env.S02E03_AGENT_MODEL?.trim() ??
      process.env.OPENAI_MODEL?.trim() ??
      "gpt-4o",
  );

  logScript("failure task agent — plan phase", { model });

  const planInstructions = [
    FAILURE_HUB_TASK_SPEC,
    "",
    "You are in the **plan** phase for hub task **failure** (hub contract is in the instructions above).",
    "This phase has NO tools — do not mention tool calls.",
    "Either:",
    "1) Start with exactly QUESTIONS: then exactly one short question if something is ambiguous (no bullet list of multiple questions in one message), OR",
    "2) Start with exactly PLAN: then a numbered plan for fetching/filtering/tokenizing/submitting.",
    "If you still need clarification after the human answers, you may send QUESTIONS: again with one new question in a later turn; when ready, emit PLAN:.",
    "If you used QUESTIONS:, wait for human answers in the next message before emitting PLAN:.",
  ].join("\n");

  const userBootstrap = [
    "Authoritative requirements for hub task **failure** are only in the **instructions** for this request (nothing below overrides them).",
    "",
    `JsonList file path (categorized rows on disk): ${options.jsonListPath}`,
    "Use this path with read_json_list_file in the execution phase after approval.",
  ].join("\n");

  let planInput: unknown[] = [{ role: "user", content: userBootstrap }];
  let planResponse = await chat({
    model,
    instructions: planInstructions,
    input: planInput,
    reasoning,
  });

  let replyText = extractText(planResponse) ?? "";
  planInput = [...planInput, ...compactResponsesApiOutput(planResponse.output)];

  for (let c = 0; c < MAX_PLAN_CLARIFICATION_ROUNDS; c++) {
    if (!looksLikeQuestions(replyText)) {
      break;
    }
    logScript("failure agent — model asked clarifying questions", {
      excerpt: replyText.slice(0, 2000),
    });

    let answers: string;
    if (!input.isTTY) {
      answers =
        process.env.FAILURE_AGENT_ANSWERS?.trim() ||
        "Proceed using the JsonList file and task defaults; no extra clarification.";
      logScript("failure agent — using FAILURE_AGENT_ANSWERS (non-TTY)", {
        answers: answers.slice(0, 500),
      });
    } else {
      answers = await promptHumanLine("Answer (one line or short paragraph): ");
    }

    planInput.push({ role: "user", content: `Human answers:\n${answers}` });
    planResponse = await chat({
      model,
      instructions: planInstructions,
      input: planInput,
      reasoning,
    });
    replyText = extractText(planResponse) ?? "";
    planInput = [
      ...planInput,
      ...compactResponsesApiOutput(planResponse.output),
    ];
  }

  const planText = extractPlanSection(replyText);
  if (!planText) {
    throw new Error("Plan phase produced empty plan text.");
  }

  await confirmPlanWithHuman(planText);

  const {
    mcpClient,
    mcpTools,
    openAiTools: tools,
  } = await createMcpToolRuntime();

  let lastHubParse: ParsedVerifyBody | null = null;
  /** Set only after verify_answer MCP call returns (not on throw). */
  let verifyAnswerFinishedThisTurn = false;

  const handlers: Record<
    string,
    {
      label: string;
      execute: (args: Record<string, unknown>) => Promise<unknown>;
    }
  > = Object.fromEntries(
    mcpTools.map((t: Tool) => [
      t.name,
      {
        label: "MCP",
        execute: (args: Record<string, unknown>) =>
          callMcpTool(mcpClient, t.name, args),
      },
    ]),
  );

  handlers.verify_answer = {
    label: "MCP",
    execute: async (args: Record<string, unknown>) => {
      const result = await callMcpTool(mcpClient, "verify_answer", args);
      verifyAnswerFinishedThisTurn = true;
      const text = mcpToolResultToText(result);
      try {
        const outer = JSON.parse(text) as { body?: string };
        const hubBody = typeof outer.body === "string" ? outer.body : text;
        lastHubParse = parseVerifyBody(hubBody);
      } catch {
        lastHubParse = parseVerifyBody(text);
      }
      logScript("verify hub parse", {
        ok: lastHubParse.ok,
        code: lastHubParse.code,
        flag: lastHubParse.flag,
        message: lastHubParse.message?.slice(0, 500),
      });
      return result;
    },
  };

  const executionInstructions = [
    FAILURE_HUB_TASK_SPEC,
    "",
    "### Tools and workflow (order)",
    "Tools: fetch_data, categorize_data, use_tokenizer, read_json_list_file, write_json_list, update_json_list, remove_duplicates, filter_by_log_status, filter_by_log_date, build_list_to_verify, minify_message, verify_answer.",
    "1) read_json_list_file(path, offset, limit) — page with has_more until you have all rows; include_reasoning=false (default) saves context.",
    "2) remove_duplicates(items, mode: same_message) on the combined items array; use the returned data for subsequent steps (collapses repeated alert text at different timestamps). Use mode exact only if you need date-level uniqueness.",
    '3) filter_by_log_status with statuses ["CRIT"] unless the approved plan requires other severities.',
    "4) Keep rows with category power_plant (strict: high-confidence causal path only—power, cooling, pumps, control/software when tied to the incident). If rows are not yet categorized, use categorize_data on the needed slice first, then filter.",
    "5) filter_by_log_date(items) — chronological order is required before hub verify (especially after same_message dedupe).",
    "6) build_list_to_verify(items) → plaintext logs string.",
    "7) use_tokenizer on that logs string. If count > 1500: shrink by dropping lowest-value lines and/or return to the same row set (read_json_list_file if needed), minify_message(items) on JSON rows only, optionally write_json_list/update_json_list, then filter_by_log_date and build_list_to_verify and use_tokenizer again until ≤1500 tokens.",
    "8) verify_answer(logs).",
    "9) If verify fails or returns no {FLG:...}, treat hub message/code as technician feedback — revise selection or minification, re-tokenize, verify again.",
    "Avoid fetch_data(dedupe=false) unless necessary — large raw logs may be rejected by the server.",
    "The human already approved your plan — execute it.",
  ].join("\n");

  const omModel = resolveModelForProvider(
    process.env.S02E03_OM_MODEL?.trim() ?? "gpt-4o-mini",
  );
  const observationJournalPath =
    process.env.S02E03_OBSERVATION_LOG_PATH?.trim() ||
    path.join(
      path.dirname(options.jsonListPath),
      "failure-observation-journal.txt",
    );
  logScript("failure task agent — observational journal", {
    path: observationJournalPath,
    omModel,
  });

  const agent = createAgent({
    model,
    tools,
    instructions: executionInstructions,
    handlers,
    maxToolRounds: EXECUTION_MAX_TOOL_ROUNDS,
    reasoning,
    observationalMemory: {
      journalPath: observationJournalPath,
      omModel,
      reasoning,
    },
  });

  let previousInput: unknown[] = [];
  let userMessage = [
    "Execution phase — approved plan:",
    planText,
    "---",
    `JsonList path: ${options.jsonListPath}`,
    "Call verify_answer when your candidate logs string is within 1500 tokens.",
  ].join("\n");

  let verifyAttempts = 0;
  let nudgeCount = 0;
  let lastVerifyFeedbackForSeal = "";

  while (verifyAttempts < MAX_VERIFY_ATTEMPTS) {
    verifyAnswerFinishedThisTurn = false;
    lastHubParse = null;

    logScript("failure agent — execution turn", {
      verifyAttempts,
      nudgeCount,
    });

    const { text, nextInput } = await agent.processConversationTurn(
      previousInput,
      userMessage,
    );
    const hubForSeal =
      lastHubParse != null
        ? JSON.stringify(lastHubParse)
        : "(no verify_answer result this turn)";
    previousInput = sealExecutionInputIfLarge(nextInput, {
      jsonListPath: options.jsonListPath,
      planExcerpt: planText,
      verifyAttempts,
      lastHubSummary: hubForSeal,
      lastVerifyFeedback: lastVerifyFeedbackForSeal,
    });

    logScript("failure agent — assistant text (excerpt)", {
      excerpt: text.slice(0, 800),
    });

    if (verifyAnswerFinishedThisTurn) {
      const hub = lastHubParse ?? parseVerifyBody("{}");
      verifyAttempts += 1;

      if (hub.ok && hub.flag) {
        logScript("failure task completed", { flag: hub.flag });
        return;
      }

      if (hub.ok && !hub.flag) {
        logScript("failure agent — hub ok but no FLG; continuing", {
          message: hub.message?.slice(0, 400),
        });
      }

      if (verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
        throw new Error(
          `failure agent: reached ${MAX_VERIFY_ATTEMPTS} verify attempts without FLG. Last parse: ${JSON.stringify(hub)}`,
        );
      }

      lastVerifyFeedbackForSeal = (
        hub.message ??
        (typeof hub.raw === "string" ? hub.raw : JSON.stringify(hub.raw))
      ).slice(0, 4000);

      userMessage = [
        `Hub verify result (attempt ${verifyAttempts}/${MAX_VERIFY_ATTEMPTS}):`,
        JSON.stringify(hub),
        "Technician feedback above — treat it as guidance for a revised plan: adjust line selection, remove_duplicates(mode: same_message or exact) / filter_by_log_status / filter_by_log_date / power_plant filter, or minify_message on JsonList items (after tokenizer shows >1500), then filter_by_log_date, build_list_to_verify with the row data, use_tokenizer, and verify_answer again.",
      ].join("\n");
      continue;
    }

    nudgeCount += 1;
    if (nudgeCount >= MAX_NO_VERIFY_NUDGES) {
      throw new Error(
        "failure agent: exceeded nudge limit without calling verify_answer",
      );
    }

    userMessage =
      "You must call verify_answer with your candidate logs string after filter_by_log_date, build_list_to_verify and use_tokenizer (≤1500 tokens). Use remove_duplicates returned data, then filter_by_log_date, as items for build_list_to_verify. If over limit, minify_message on JsonList items only, then filter_by_log_date, rebuild and re-tokenize — do not minify the plaintext logs string.";
  }

  throw new Error("failure agent: verify loop exited unexpectedly");
}

import {
  boardPngUrl,
  electricityAgentModel,
  ELECTRICITY_AGENT_MAX_OUTPUT_TOKENS,
  ELECTRICITY_AGENT_MAX_STEPS,
  ELECTRICITY_MAX_ITERATIONS,
} from "../config.ts";
import { extractFlagFromText } from "../hub.ts";
import {
  assistantMessageToText,
  getFirstChoiceMessage,
  postChatCompletion,
  type ChatCompletionMessageParam,
} from "../openrouter/chat.ts";
import { buildElectricityOpenRouterTools } from "./electricityTools.ts";

function trunc(s: string, max = 400): string {
  const t = s.trim();
  if (t.length <= max) {
    return t;
  }
  return `${t.slice(0, max)}…`;
}

function systemPrompt(target: number[][], boardUrl: string): string {
  const t = JSON.stringify(target);
  return `You orchestrate the "electricity" hub task. The model must NOT decide rotation counts — use tools only.

Target masks (N=1,E=2,S=4,W=8): ${t}
Live board PNG: ${boardUrl}

Workflow (repeat until {FLG:...} or give up):
1) fetch_board (optional reset) if needed.
2) read_board — B/W, grid lines, 9 crops with 12px padding; each cell is classified via structured output into one box-drawing glyph, then converted to NESW masks (preferred).
3) solve_board with current=masks from step 2 and target=${t} (or omit target; it defaults to the context target). Deterministic rotation counts 0–3 per cell; no LLM.
4) If solve_board.ok is false (topology_mismatch), do NOT call apply_rotations. Call reset_board and retry from step 2.
5) If solve_board.ok is true, apply_rotations with the rotations matrix (0–3 per cell). Check for flag in the tool result.
6) If no flag after apply_rotations, vision misread a tile — call reset_board and go back to step 2 (typically 4–6 outer loops).

Rules:
- Do not invent mask grids. Do not call tools that require last_masks unless you have read the board first.
- read_board updates last masks for apply_rotations_for_cell; use apply_rotations for the deterministic batch path instead of many rotate_cell calls.

When done, output the flag on the last line as plain text.`;
}

export async function runElectricityAgent(options: {
  targetMasks: number[][];
}): Promise<{ text: string; flag?: string }> {
  const model = electricityAgentModel();

  let lastMasks: number[][] | null = null;
  const { definitions, execute } = buildElectricityOpenRouterTools({
    getTargetMasks: () => options.targetMasks,
    getLastMasks: () => lastMasks,
    setLastMasks: (m) => {
      lastMasks = m;
    },
  });

  const boardUrl = boardPngUrl();
  let foundFlag: string | undefined;

  console.log(
    `[agent] start | model=${model} | board=${boardUrl} | max_outer=${ELECTRICITY_MAX_ITERATIONS} | max_llm_steps=${ELECTRICITY_AGENT_MAX_STEPS}`,
  );

  for (let iter = 0; iter < ELECTRICITY_MAX_ITERATIONS; iter++) {
    const prompt =
      iter === 0
        ? "Solve the puzzle using read_board → solve_board → apply_rotations. Start by reading the board."
        : `Continue (outer iteration ${iter + 1}/${ELECTRICITY_MAX_ITERATIONS}). If you already have the flag, print it.`;

    console.log(
      `\n[agent] ── Outer ${iter + 1}/${ELECTRICITY_MAX_ITERATIONS} ──`,
    );

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt(options.targetMasks, boardUrl) },
      { role: "user", content: prompt },
    ];

    let lastAssistantText = "";
    let hitMaxLlmSteps = false;

    for (let step = 0; step < ELECTRICITY_AGENT_MAX_STEPS; step++) {
      console.log(
        `[agent] LLM call ${step + 1}/${ELECTRICITY_AGENT_MAX_STEPS} | messages=${messages.length}`,
      );

      const res = await postChatCompletion({
        model,
        messages,
        tools: definitions,
        tool_choice: "auto",
        max_tokens: ELECTRICITY_AGENT_MAX_OUTPUT_TOKENS,
      });

      const msg = getFirstChoiceMessage(res);
      if (!msg) {
        console.warn("[agent] empty choice from OpenRouter; stopping inner loop.");
        break;
      }

      const toolCalls = msg.tool_calls;
      const plainText = assistantMessageToText(msg);

      if (toolCalls && toolCalls.length > 0) {
        const reasoning = plainText ? ` | assistant_note=${trunc(plainText, 200)}` : "";
        console.log(
          `[agent]   model → ${toolCalls.length} tool call(s)${reasoning}`,
        );

        messages.push({
          role: "assistant",
          content: msg.content ?? null,
          tool_calls: toolCalls,
        });

        for (const tc of toolCalls) {
          if (tc.type !== "function") {
            continue;
          }
          const argsPreview = trunc(tc.function.arguments, 280);
          console.log(`[agent]   invoke ${tc.function.name}(${argsPreview})`);

          let out: unknown;
          try {
            out = await execute(tc.function.name, tc.function.arguments);
          } catch (e) {
            out = { error: String(e) };
            console.warn(`[agent]   ${tc.function.name} threw: ${String(e)}`);
          }
          const outStr =
            typeof out === "object" && out !== null
              ? JSON.stringify(out)
              : String(out);
          const f = extractFlagFromText(outStr);
          if (f) {
            foundFlag = f;
            console.log(`[agent]   ${tc.function.name} → flag in tool result: ${f}`);
          } else {
            console.log(`[agent]   ${tc.function.name} → ${trunc(outStr, 500)}`);
          }
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: outStr,
          });
        }
      } else {
        messages.push({
          role: "assistant",
          content: msg.content ?? plainText,
        });
        lastAssistantText = plainText;
        console.log(
          `[agent]   model → final text (no tool calls): ${trunc(lastAssistantText, 600)}`,
        );
        const textFlag = extractFlagFromText(lastAssistantText);
        if (textFlag) {
          foundFlag = textFlag;
          console.log(`[agent]   flag in assistant text: ${textFlag}`);
        }
        break;
      }

      if (step === ELECTRICITY_AGENT_MAX_STEPS - 1) {
        hitMaxLlmSteps = true;
      }
    }

    if (hitMaxLlmSteps && !foundFlag) {
      console.warn(
        `[agent] inner loop hit ELECTRICITY_AGENT_MAX_STEPS (${ELECTRICITY_AGENT_MAX_STEPS}) without a final text-only reply; continuing outer iterations if any.`,
      );
    }

    if (foundFlag) {
      console.log(`[agent] done | flag=${foundFlag}`);
      return { text: lastAssistantText || foundFlag, flag: foundFlag };
    }

    console.log(
      `[agent] outer ${iter + 1} finished without flag; next outer or stop.`,
    );
  }

  console.warn("[agent] stopped: no flag after all outer iterations.");
  return { text: "(no flag in agent run)" };
}

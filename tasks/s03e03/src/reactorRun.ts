import {
  logAction,
  logResponse,
  logResult,
  logSystem,
  logThought,
} from "@ai-devs/agent-boilerplate";
import { HUB_LABEL, REACTOR_MAX_STEPS } from "../config.js";
import { chooseCommand } from "./domain/planner.js";
import { isAtGoal, parseGameState } from "./domain/simulate.js";
import { createReactorClient } from "./hub/reactorClient.js";
import type { ReactorHubResponse } from "./domain/types.js";

function summarizeResponse(data: ReactorHubResponse): Record<string, unknown> {
  return {
    code: data.code,
    message: data.message.slice(0, 120),
    player: data.player,
    reached_goal: data.reached_goal,
  };
}

export async function runReactor(): Promise<string> {
  const client = createReactorClient();
  logSystem("reactor-run-start");

  let response = await client.sendCommand("start");
  logAction(HUB_LABEL, "reactor", { command: "start" });
  logResult(summarizeResponse(response));

  let flag = client.findFlag(response);
  if (flag) {
    logResponse(flag);
    return flag;
  }

  if (response.code < 0) {
    throw new Error(`Hub error on start: ${response.message}`);
  }

  for (let step = 0; step < REACTOR_MAX_STEPS; step++) {
    const state = parseGameState(response);

    if (isAtGoal(state.player, state.goal) || response.reached_goal) {
      flag = client.findFlag(response);
      if (flag) {
        logResponse(flag);
        return flag;
      }
    }

    const choice = chooseCommand(state);
    logThought(`${choice.reason} → ${choice.command}`);

    response = await client.sendCommand(choice.command);
    logAction(HUB_LABEL, "reactor", { command: choice.command });
    logResult(summarizeResponse(response));

    flag = client.findFlag(response);
    if (flag) {
      logResponse(flag);
      logSystem("reactor-run-success", { steps: step + 1 });
      return flag;
    }

    if (response.code < 0) {
      throw new Error(
        `Hub error after ${choice.command}: [${response.code}] ${response.message}`,
      );
    }
  }

  throw new Error(`Reactor solver exceeded REACTOR_MAX_STEPS (${REACTOR_MAX_STEPS})`);
}

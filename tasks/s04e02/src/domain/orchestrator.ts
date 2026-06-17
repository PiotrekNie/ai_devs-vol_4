import {
  logAction,
  logResponse,
  logResult,
  logSystem,
} from "@ai-devs/agent-boilerplate";
import {
  HUB_LABEL,
  POLL_PARALLEL,
  SERVICE_WINDOW_MS,
  STORM_CUTOFF_WIND_MS,
} from "../../config.js";
import { parsePowerDeficitKw } from "./power.js";
import { buildSchedule, normalizeHourSlot } from "./schedule.js";
import type { ForecastEntry, ScheduleSlot } from "./types.js";
import {
  postWindpowerAction,
  scheduleSlotToUnlockKey,
  unlockSlotKey,
} from "./windpower_client.js";

type PollState = {
  weather?: Record<string, unknown>;
  power?: Record<string, unknown>;
  unlockCodes: Map<string, string>;
  slots: Map<string, ScheduleSlot>;
  queuedUnlock: Set<string>;
  stormsQueued: boolean;
  productionQueued: boolean;
};

async function pollBatch() {
  return Promise.all(
    Array.from({ length: POLL_PARALLEL }, () =>
      postWindpowerAction({ action: "getResult" }),
    ),
  );
}

async function queueUnlock(slot: ScheduleSlot, state: PollState) {
  if (state.slots.has(slot.timestamp)) {
    // keep existing storm slot if production shares timestamp (unlikely)
    if (state.slots.get(slot.timestamp)?.turbineMode === "idle") return;
  }
  state.slots.set(slot.timestamp, slot);

  const key = scheduleSlotToUnlockKey(slot);
  if (state.queuedUnlock.has(key)) return;
  state.queuedUnlock.add(key);

  const [startDate, startHour] = slot.timestamp.split(" ");
  await postWindpowerAction({
    action: "unlockCodeGenerator",
    startDate,
    startHour,
    windMs: slot.windMs,
    pitchAngle: slot.pitchAngle,
  });
}

function ingestGetResult(
  data: Record<string, unknown>,
  state: PollState,
): void {
  if (data.sourceFunction === "weather" && !state.weather) {
    state.weather = data;
  }
  if (data.sourceFunction === "powerplantcheck" && !state.power) {
    state.power = data;
  }
  if (data.sourceFunction === "unlockCodeGenerator" && data.unlockCode) {
    const signed = data.signedParams as Record<string, string> | undefined;
    if (!signed) return;
    state.unlockCodes.set(
      unlockSlotKey(
        signed.startDate!,
        signed.startHour!,
        Number(signed.pitchAngle),
      ),
      String(data.unlockCode),
    );
  }
}

async function queueProductionIfReady(state: PollState): Promise<void> {
  if (!state.weather || !state.power || state.productionQueued) return;

  const forecast = state.weather.forecast as ForecastEntry[];
  const deficit = parsePowerDeficitKw(state.power.powerDeficitKw);
  const schedule = buildSchedule(forecast, deficit);
  const production = schedule.find((slot) => slot.turbineMode === "production");
  if (!production) {
    throw new Error("Schedule builder did not produce a production slot");
  }

  await queueUnlock(production, state);
  state.productionQueued = true;
}

function isReady(state: PollState): boolean {
  const slots = [...state.slots.values()];
  const hasProduction = slots.some((slot) => slot.turbineMode === "production");
  return (
    Boolean(state.weather) &&
    Boolean(state.power) &&
    hasProduction &&
    state.unlockCodes.size >= slots.length
  );
}

export async function solveWindpower(): Promise<string> {
  const t0 = Date.now();
  const state: PollState = {
    unlockCodes: new Map(),
    slots: new Map(),
    queuedUnlock: new Set(),
    stormsQueued: false,
    productionQueued: false,
  };

  logSystem("windpower-run-start");

  const start = await postWindpowerAction({ action: "start" });
  logAction(HUB_LABEL, "windpower.start", {
    sessionTimeout: start.data.sessionTimeout,
  });

  await Promise.all([
    postWindpowerAction({ action: "get", param: "weather" }),
    postWindpowerAction({ action: "get", param: "powerplantcheck" }),
  ]);
  logAction(HUB_LABEL, "windpower.queue", { reports: ["weather", "powerplantcheck"] });

  while (Date.now() - t0 < SERVICE_WINDOW_MS) {
    for (const result of await pollBatch()) {
      ingestGetResult(result.data, state);
    }

    if (state.weather && !state.stormsQueued) {
      state.stormsQueued = true;
      const forecast = state.weather.forecast as ForecastEntry[];
      for (const entry of forecast) {
        if (entry.windMs > STORM_CUTOFF_WIND_MS) {
          await queueUnlock(
            {
              timestamp: normalizeHourSlot(entry.timestamp),
              pitchAngle: 90,
              turbineMode: "idle",
              windMs: entry.windMs,
            },
            state,
          );
        }
      }
      logResult({
        phase: "storms-queued",
        count: [...state.slots.values()].filter((s) => s.turbineMode === "idle")
          .length,
        elapsedMs: Date.now() - t0,
      });
    }

    await queueProductionIfReady(state);

    if (isReady(state)) break;
  }

  const slots = [...state.slots.values()];
  if (!isReady(state)) {
    throw new Error(
      `Windpower orchestration timed out after ${Date.now() - t0}ms ` +
        `(unlock ${state.unlockCodes.size}/${slots.length})`,
    );
  }

  logResult({
    phase: "schedule-ready",
    slots: slots.map((slot) => ({
      ts: slot.timestamp,
      mode: slot.turbineMode,
      pitch: slot.pitchAngle,
    })),
    elapsedMs: Date.now() - t0,
  });

  const configs: Record<string, Record<string, unknown>> = {};
  for (const slot of slots) {
    const code = state.unlockCodes.get(scheduleSlotToUnlockKey(slot));
    if (!code) {
      throw new Error(`Missing unlockCode for ${slot.timestamp}`);
    }
    configs[slot.timestamp] = {
      pitchAngle: slot.pitchAngle,
      turbineMode: slot.turbineMode,
      unlockCode: code,
    };
  }

  const configResult = await postWindpowerAction({ action: "config", configs });
  logAction(HUB_LABEL, "windpower.config", {
    storedPoints: configResult.data.storedPoints,
  });

  await postWindpowerAction({ action: "get", param: "turbinecheck" });

  let turbineCheckOk = false;
  while (Date.now() - t0 < SERVICE_WINDOW_MS) {
    const batch = await pollBatch();
    if (batch.some((result) => result.data.sourceFunction === "turbinecheck")) {
      turbineCheckOk = true;
      break;
    }
  }

  if (!turbineCheckOk) {
    throw new Error("turbinecheck result not received before service window ended");
  }

  const done = await postWindpowerAction({ action: "done" });
  const flag = done.flag ?? String(done.data.message ?? "");
  logResponse(flag);
  logSystem("windpower-run-success", { elapsedMs: Date.now() - t0 });

  if (!flag.includes("{FLG:")) {
    throw new Error(`Hub did not return a flag: ${JSON.stringify(done.data)}`);
  }

  return flag;
}

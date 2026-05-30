import type {
  MemoryChatFn,
  MemoryState,
  ObservationalMemoryConfig,
  ReflectorResult,
} from "./types.js";
import {
  estimateTokensCalibrated,
  estimateTokensRaw,
  getCalibration,
  trackUsage,
  withSafetyMargin,
} from "./tokens.js";
import {
  buildReflectorUserPrompt,
  extractTag,
  loadReflectorPrompt,
  REFLECTOR_COMPRESSION_LEVELS,
} from "./utils.js";
import { logMemory } from "../../utils/logger.js";

export async function runReflector(args: {
  state: MemoryState;
  config: ObservationalMemoryConfig;
  observations: string;
  targetTokens: number;
  chatFn: MemoryChatFn;
}): Promise<ReflectorResult> {
  const { state, config, observations, targetTokens, chatFn } = args;
  const cal = state.calibration;

  let bestObservations = observations;
  let bestTokens = estimateTokensCalibrated(
    observations,
    cal,
    config.enableCalibration,
  );
  let bestRaw = observations;
  let bestLevel = -1;
  let totalUsage = { inputTokens: 0, outputTokens: 0 };

  const addUsage = (usage?: { inputTokens: number; outputTokens: number }) => {
    if (!usage) return;
    totalUsage = {
      inputTokens: totalUsage.inputTokens + usage.inputTokens,
      outputTokens: totalUsage.outputTokens + usage.outputTokens,
    };
  };

  logMemory("reflector", {
    fromTokens: bestTokens,
    targetTokens,
  });

  for (let level = 0; level < REFLECTOR_COMPRESSION_LEVELS.length; level += 1) {
    const guidance = REFLECTOR_COMPRESSION_LEVELS[level] ?? "";
    const userPrompt = buildReflectorUserPrompt(observations, guidance);
    const estimatedSafe = withSafetyMargin(
      estimateTokensRaw(userPrompt) + estimateTokensRaw(loadReflectorPrompt()),
    );

    const response = await chatFn({
      model: config.reflectorModel,
      instructions: loadReflectorPrompt(),
      input: [{ role: "user", content: userPrompt }],
      temperature: 0,
      maxOutputTokens: config.reflectorMaxOutputTokens,
    });

    trackUsage(
      response.usage,
      state.calibration,
      estimatedSafe,
      config.enableCalibration,
    );
    addUsage(response.usage);

    const raw = response.content ?? "";
    const compressed = extractTag(raw, "observations") ?? raw.trim();
    if (!compressed) continue;

    const tokens = estimateTokensCalibrated(
      compressed,
      cal,
      config.enableCalibration,
    );
    if (tokens < bestTokens) {
      bestObservations = compressed;
      bestTokens = tokens;
      bestRaw = raw;
      bestLevel = level;
    }

    if (tokens <= targetTokens) {
      logMemory("reflector", {
        toTokens: tokens,
        level,
        ratio: getCalibration(cal).ratio,
      });
      return {
        observations: compressed,
        tokenCount: tokens,
        raw,
        compressionLevel: level,
        usage: totalUsage,
      };
    }
  }

  logMemory("reflector", {
    toTokens: bestTokens,
    level: bestLevel,
    ratio: getCalibration(cal).ratio,
  });

  return {
    observations: bestObservations,
    tokenCount: bestTokens,
    raw: bestRaw,
    compressionLevel: bestLevel,
    usage:
      totalUsage.inputTokens > 0 || totalUsage.outputTokens > 0
        ? totalUsage
        : undefined,
  };
}
